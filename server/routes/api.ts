import { Router } from "express";
import { z } from "zod";
import { pool, query } from "../db.ts";
import { requireUser } from "../auth.ts";
import { answerMatches } from "../answer-utils.ts";
import {
  ensureUser,
  getCurriculum,
  getDashboard,
  getProfile,
  getUserStats,
  serializeProfile,
  syncClerkIdentity,
} from "../services/learningService.ts";

const router = Router();
const difficulties = ["easy", "medium", "hard"];
const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(40).optional(),
  difficulty: z.enum(difficulties).optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "Informe ao menos uma preferência para atualizar.",
});
const attemptSchema = z.object({
  exerciseId: z.number().int().positive(),
  answer: z.string().max(6000),
}).strict();

const attemptBuckets = new Map();

function limitExerciseAttempts(req, res, next) {
  const now = Date.now();
  const userId = req.userId;
  const previous = attemptBuckets.get(userId) ?? [];
  const recent = previous.filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= 45) {
    return res.status(429).json({ error: "Você está praticando em ritmo muito rápido. Aguarde um minuto e tente novamente." });
  }
  recent.push(now);
  attemptBuckets.set(userId, recent);
  if (attemptBuckets.size > 5_000) {
    for (const [key, timestamps] of attemptBuckets) {
      if (!timestamps.some((timestamp) => now - timestamp < 60_000)) attemptBuckets.delete(key);
    }
  }
  next();
}

async function requireLessonAccess(userId, lessonSlug) {
  const result = await query(
    `SELECT l.slug, l.title, l.summary, l.order_index, l.estimated_minutes,
       l.xp_reward, l.learning_content, l.example_code, l.example_explanation,
       m.slug AS module_slug, m.title AS module_title, c.title AS course_title,
       lp.status AS progress_status, lp.score, lp.attempts, lp.errors,
       u.difficulty
     FROM lessons l
     JOIN modules m ON m.slug = l.module_slug
     JOIN courses c ON c.slug = m.course_slug
     JOIN app_users u ON u.clerk_user_id = $1
     LEFT JOIN lesson_progress lp
       ON lp.lesson_slug = l.slug AND lp.clerk_user_id = u.clerk_user_id
     WHERE l.slug = $2`,
    [userId, lessonSlug],
  );
  if (!result.rowCount) return { error: "Esta lição não foi encontrada.", status: 404 };
  const lesson = result.rows[0];
  if (lesson.progress_status !== "completed") {
    const incompleteCourse = await query(
      `SELECT prior_course.slug
       FROM courses current_course
       JOIN courses prior_course
         ON prior_course.order_index < current_course.order_index
       LEFT JOIN modules prior_module ON prior_module.course_slug = prior_course.slug
       LEFT JOIN lessons prior_lesson ON prior_lesson.module_slug = prior_module.slug
       LEFT JOIN lesson_progress prior_progress
         ON prior_progress.lesson_slug = prior_lesson.slug
        AND prior_progress.clerk_user_id = $1
       WHERE current_course.slug = (
         SELECT module.course_slug FROM modules module
         JOIN lessons lesson ON lesson.module_slug = module.slug
         WHERE lesson.slug = $2
       )
       GROUP BY prior_course.slug
       HAVING COUNT(prior_lesson.slug) = 0
         OR COUNT(prior_lesson.slug) FILTER (
           WHERE prior_progress.status = 'completed'
         ) < COUNT(prior_lesson.slug)
       LIMIT 1`,
      [userId, lessonSlug],
    );
    if (incompleteCourse.rowCount) {
      return { error: "Conclua as etapas anteriores da trilha antes de avançar.", status: 423 };
    }

    const previous = await query(
      `SELECT prior.slug
       FROM lessons current
       JOIN modules current_module ON current_module.slug = current.module_slug
       JOIN modules prior_module
         ON prior_module.course_slug = current_module.course_slug
       JOIN lessons prior ON prior.module_slug = prior_module.slug
       LEFT JOIN lesson_progress progress
         ON progress.lesson_slug = prior.slug
        AND progress.clerk_user_id = $1
       WHERE current.slug = $2
         AND (
           prior_module.order_index < current_module.order_index
           OR (
             prior_module.order_index = current_module.order_index
             AND prior.order_index < current.order_index
           )
         )
         AND COALESCE(progress.status, 'not_started') <> 'completed'
       ORDER BY prior_module.order_index, prior.order_index
       LIMIT 1`,
      [userId, lessonSlug],
    );
    if (previous.rowCount) {
      return { error: "Conclua a lição anterior antes de abrir esta etapa.", status: 423 };
    }
  }
  return { lesson };
}

async function evaluateAchievements(client, userId) {
  const [catalog, measures] = await Promise.all([
    client.query(
      `SELECT slug, title, description, icon, requirement, threshold
       FROM achievements`,
    ),
    client.query(
      `SELECT
         u.xp,
         u.streak_days,
         (SELECT COUNT(*)::int FROM lesson_progress p
          WHERE p.clerk_user_id = u.clerk_user_id AND p.status = 'completed') AS lessons_completed,
         (SELECT COUNT(DISTINCT a.exercise_id)::int FROM exercise_attempts a
          WHERE a.clerk_user_id = u.clerk_user_id AND a.is_correct) AS correct_exercises,
         (SELECT COUNT(*)::int
          FROM lesson_progress p
          JOIN lessons l ON l.slug = p.lesson_slug
          JOIN modules m ON m.slug = l.module_slug
          WHERE p.clerk_user_id = u.clerk_user_id
            AND p.status = 'completed'
            AND m.course_slug = 'logica-programacao') AS logic_lessons
       FROM app_users u WHERE u.clerk_user_id = $1`,
      [userId],
    ),
  ]);
  const values = measures.rows[0] ?? {};
  const newlyEarned = [];

  for (const achievement of catalog.rows) {
    const actual = Number(values[achievement.requirement] ?? 0);
    if (actual < Number(achievement.threshold)) continue;
    const inserted = await client.query(
      `INSERT INTO user_achievements (clerk_user_id, achievement_slug)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING achievement_slug`,
      [userId, achievement.slug],
    );
    if (inserted.rowCount) {
      newlyEarned.push({
        slug: achievement.slug,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
      });
    }
  }
  return newlyEarned;
}

router.use(requireUser);

router.get("/me", async (req, res) => {
  await ensureUser(req.userId);
  await syncClerkIdentity(req.userId);
  res.json(await getProfile(req.userId));
});

router.get("/dashboard", async (req, res) => {
  await ensureUser(req.userId);
  res.json(await getDashboard(req.userId));
});

router.get("/curriculum", async (req, res) => {
  await ensureUser(req.userId);
  res.json({ courses: await getCurriculum(req.userId) });
});

router.patch("/profile", async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Confira os campos informados.",
      details: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
  }

  await ensureUser(req.userId);
  const { displayName, difficulty } = parsed.data;
  await query(
    `UPDATE app_users
     SET display_name = COALESCE($2, display_name),
         difficulty = COALESCE($3, difficulty),
         updated_at = NOW()
     WHERE clerk_user_id = $1`,
    [req.userId, displayName ?? null, difficulty ?? null],
  );
  const data = await getProfile(req.userId);
  res.json({ profile: data.profile });
});

router.get("/lessons/:lessonSlug", async (req, res) => {
  await ensureUser(req.userId);
  const { lessonSlug } = req.params;
  if (!/^[a-z0-9-]{2,80}$/.test(lessonSlug)) {
    return res.status(400).json({ error: "O identificador da lição é inválido." });
  }

  const access = await requireLessonAccess(req.userId, lessonSlug);
  if (access.error) return res.status(access.status).json({ error: access.error });
  const lesson = access.lesson;

  const exercises = await query(
    `SELECT id, input_type, prompt, options, starter_code, hints, order_index
     FROM exercises
     WHERE lesson_slug = $1 AND difficulty = $2
     ORDER BY order_index`,
    [lessonSlug, lesson.difficulty],
  );

  res.json({
    lesson: {
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      courseTitle: lesson.course_title,
      moduleTitle: lesson.module_title,
      orderIndex: lesson.order_index,
      estimatedMinutes: lesson.estimated_minutes,
      xpReward: lesson.xp_reward,
      difficulty: lesson.difficulty,
      learning: lesson.learning_content?.[lesson.difficulty] ?? {},
      exampleCode: lesson.example_code,
      exampleExplanation: lesson.example_explanation,
      progress: {
        status: lesson.progress_status ?? "not_started",
        score: Number(lesson.score ?? 0),
        attempts: Number(lesson.attempts ?? 0),
        errors: Number(lesson.errors ?? 0),
      },
      exercises: exercises.rows.map((exercise) => ({
        id: Number(exercise.id),
        inputType: exercise.input_type,
        prompt: exercise.prompt,
        options: exercise.options,
        starterCode: exercise.starter_code,
        hints: exercise.hints,
        orderIndex: exercise.order_index,
      })),
    },
  });
});

router.post("/lessons/:lessonSlug/attempt", limitExerciseAttempts, async (req, res) => {
  const parsed = attemptSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "A resposta não está em um formato válido.",
      details: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
  }

  await ensureUser(req.userId);
  const { lessonSlug } = req.params;
  if (!/^[a-z0-9-]{2,80}$/.test(lessonSlug)) {
    return res.status(400).json({ error: "O identificador da lição é inválido." });
  }
  const access = await requireLessonAccess(req.userId, lessonSlug);
  if (access.error) return res.status(access.status).json({ error: access.error });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: exerciseRows } = await client.query(
      `SELECT e.id, e.input_type, e.accepted_answers, e.explanation,
         e.corrected_example, e.lesson_slug, e.difficulty,
         l.xp_reward, lp.status AS previous_status
       FROM exercises e
       JOIN lessons l ON l.slug = e.lesson_slug
       LEFT JOIN lesson_progress lp
         ON lp.lesson_slug = l.slug AND lp.clerk_user_id = $1
       WHERE e.id = $2 AND e.lesson_slug = $3 AND e.difficulty = $4`,
      [req.userId, parsed.data.exerciseId, lessonSlug, access.lesson.difficulty],
    );
    const exercise = exerciseRows[0];
    if (!exercise) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Este exercício não pertence à etapa atual." });
    }

    const isCorrect = answerMatches(
      exercise.input_type,
      parsed.data.answer,
      exercise.accepted_answers,
    );
    const previousCorrect = await client.query(
      `SELECT 1 FROM exercise_attempts
       WHERE clerk_user_id = $1 AND exercise_id = $2 AND is_correct
       LIMIT 1`,
      [req.userId, exercise.id],
    );
    const firstCorrectAnswer = isCorrect && !previousCorrect.rowCount;

    const savedAttempt = await client.query(
      `INSERT INTO exercise_attempts
         (clerk_user_id, exercise_id, answer, is_correct, difficulty)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [req.userId, exercise.id, parsed.data.answer.trim(), isCorrect, exercise.difficulty],
    );

    const [totals, correctTotals] = await Promise.all([
      client.query(
        `SELECT COUNT(*)::int AS count FROM exercises
         WHERE lesson_slug = $1 AND difficulty = $2`,
        [lessonSlug, exercise.difficulty],
      ),
      client.query(
        `SELECT COUNT(DISTINCT a.exercise_id)::int AS count
         FROM exercise_attempts a
         JOIN exercises e ON e.id = a.exercise_id
         WHERE a.clerk_user_id = $1 AND a.is_correct
           AND e.lesson_slug = $2 AND e.difficulty = $3`,
        [req.userId, lessonSlug, exercise.difficulty],
      ),
    ]);
    const totalExercises = Number(totals.rows[0]?.count ?? 0);
    const correctExercises = Number(correctTotals.rows[0]?.count ?? 0);
    const lessonCompleted = totalExercises > 0 && correctExercises >= totalExercises;
    const wasCompleted = exercise.previous_status === "completed";
    const newLessonCompletion = lessonCompleted && !wasCompleted;
    const lessonBonus = newLessonCompletion ? Number(exercise.xp_reward) : 0;
    const xpAwarded = (firstCorrectAnswer ? 5 : 0) + lessonBonus;
    if (xpAwarded > 0) {
      await client.query(
        `UPDATE exercise_attempts
         SET xp_awarded = $2
         WHERE clerk_user_id = $1 AND id = $3`,
        [req.userId, xpAwarded, savedAttempt.rows[0].id],
      );
    }

    await client.query(
      `INSERT INTO lesson_progress
         (clerk_user_id, lesson_slug, status, difficulty, score, attempts, errors, completed_at)
       VALUES ($1, $2, $3, $4, $5, 1, $6, CASE WHEN $3 = 'completed' THEN NOW() ELSE NULL END)
       ON CONFLICT (clerk_user_id, lesson_slug) DO UPDATE SET
         status = CASE
           WHEN lesson_progress.status = 'completed' THEN 'completed'
           ELSE EXCLUDED.status
         END,
         difficulty = EXCLUDED.difficulty,
         score = GREATEST(lesson_progress.score, EXCLUDED.score),
         attempts = lesson_progress.attempts + 1,
         errors = lesson_progress.errors + EXCLUDED.errors,
         completed_at = CASE
           WHEN EXCLUDED.status = 'completed' THEN COALESCE(lesson_progress.completed_at, NOW())
           ELSE lesson_progress.completed_at
         END,
         updated_at = NOW()`,
      [
        req.userId,
        lessonSlug,
        lessonCompleted ? "completed" : "started",
        exercise.difficulty,
        correctExercises,
        isCorrect ? 0 : 1,
      ],
    );

    if (!isCorrect) {
      await client.query(
        `INSERT INTO review_items (clerk_user_id, lesson_slug, reason, next_review_at, error_count)
         VALUES ($1, $2, 'missed_exercise', CURRENT_DATE, 1)
         ON CONFLICT (clerk_user_id, lesson_slug) DO UPDATE SET
           next_review_at = CURRENT_DATE,
           error_count = review_items.error_count + 1`,
        [req.userId, lessonSlug],
      );
    }

    const updatedUser = await client.query(
      `UPDATE app_users
       SET xp = xp + $2,
           streak_days = CASE
             WHEN last_activity_date = CURRENT_DATE THEN streak_days
             WHEN last_activity_date = CURRENT_DATE - 1 THEN streak_days + 1
             ELSE 1
           END,
           last_activity_date = CURRENT_DATE,
           updated_at = NOW()
       WHERE clerk_user_id = $1
       RETURNING clerk_user_id, display_name, difficulty, xp, streak_days,
         last_activity_date, created_at`,
      [req.userId, xpAwarded],
    );
    await client.query(
      `INSERT INTO daily_activity
         (clerk_user_id, activity_date, xp_earned, exercises_answered, lessons_completed)
       VALUES ($1, CURRENT_DATE, $2, 1, $3)
       ON CONFLICT (clerk_user_id, activity_date) DO UPDATE SET
         xp_earned = daily_activity.xp_earned + EXCLUDED.xp_earned,
         exercises_answered = daily_activity.exercises_answered + 1,
         lessons_completed = daily_activity.lessons_completed + EXCLUDED.lessons_completed`,
      [req.userId, xpAwarded, newLessonCompletion ? 1 : 0],
    );

    const earnedAchievements = await evaluateAchievements(client, req.userId);
    await client.query("COMMIT");

    const userStats = await getUserStats(req.userId);
    const latestProgress = await query(
      `SELECT status, score, attempts, errors, completed_at
       FROM lesson_progress WHERE clerk_user_id = $1 AND lesson_slug = $2`,
      [req.userId, lessonSlug],
    );
    const feedback = isCorrect
      ? newLessonCompletion
        ? "Lição concluída. Você entendeu a ideia e praticou cada etapa."
        : "Correto. A resposta mostra que você entendeu este passo."
      : exercise.difficulty === "hard"
        ? `${exercise.explanation} Use uma pista para investigar a regra sem receber a solução completa.`
        : `${exercise.explanation}${exercise.corrected_example ? ` Exemplo correto: ${exercise.corrected_example}` : ""}`;

    res.json({
      isCorrect,
      feedback,
      xpAwarded,
      lessonCompleted: newLessonCompletion,
      progress: {
        status: latestProgress.rows[0]?.status ?? "started",
        score: Number(latestProgress.rows[0]?.score ?? 0),
        attempts: Number(latestProgress.rows[0]?.attempts ?? 0),
        errors: Number(latestProgress.rows[0]?.errors ?? 0),
        completedAt: latestProgress.rows[0]?.completed_at ?? null,
      },
      profile: serializeProfile(updatedUser.rows[0], userStats),
      earnedAchievements,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
});

router.get("/review", async (req, res) => {
  await ensureUser(req.userId);
  const result = await query(
    `SELECT r.lesson_slug, r.reason, r.next_review_at, r.error_count,
       l.title, l.summary, c.title AS course_title
     FROM review_items r
     JOIN lessons l ON l.slug = r.lesson_slug
     JOIN modules m ON m.slug = l.module_slug
     JOIN courses c ON c.slug = m.course_slug
     WHERE r.clerk_user_id = $1 AND r.next_review_at <= CURRENT_DATE
     ORDER BY r.error_count DESC, r.created_at`,
    [req.userId],
  );
  res.json({
    items: result.rows.map((item) => ({
      lessonSlug: item.lesson_slug,
      title: item.title,
      summary: item.summary,
      courseTitle: item.course_title,
      reason: item.reason,
      errorCount: Number(item.error_count),
      nextReviewAt: item.next_review_at,
    })),
  });
});

router.post("/review/:lessonSlug/complete", async (req, res) => {
  await ensureUser(req.userId);
  const lessonSlug = req.params.lessonSlug;
  if (!/^[a-z0-9-]{2,80}$/.test(lessonSlug)) {
    return res.status(400).json({ error: "O identificador da lição é inválido." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `SELECT difficulty FROM app_users WHERE clerk_user_id = $1`,
      [req.userId],
    );
    const reviewResult = await client.query(
      `SELECT 1 FROM review_items
       WHERE clerk_user_id = $1 AND lesson_slug = $2
       FOR UPDATE`,
      [req.userId, lessonSlug],
    );
    if (!reviewResult.rowCount) {
      await client.query("COMMIT");
      return res.json({ ok: true, reviewCompleted: false });
    }

    const proof = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM exercises
          WHERE lesson_slug = $1 AND difficulty = $2) AS total,
         (SELECT COUNT(DISTINCT a.exercise_id)::int
          FROM exercise_attempts a
          JOIN exercises e ON e.id = a.exercise_id
          WHERE a.clerk_user_id = $3 AND a.is_correct
            AND e.lesson_slug = $1 AND e.difficulty = $2
            AND a.attempted_at >= NOW() - INTERVAL '1 day') AS correct`,
      [lessonSlug, userResult.rows[0]?.difficulty ?? "easy", req.userId],
    );
    const total = Number(proof.rows[0]?.total ?? 0);
    const correct = Number(proof.rows[0]?.correct ?? 0);
    if (!total || correct < total) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Para concluir uma revisão, responda corretamente aos exercícios recentes desta lição.",
      });
    }

    await client.query(
      `DELETE FROM review_items WHERE clerk_user_id = $1 AND lesson_slug = $2`,
      [req.userId, lessonSlug],
    );
    const user = await client.query(
      `UPDATE app_users
       SET xp = xp + 5,
           streak_days = CASE
             WHEN last_activity_date = CURRENT_DATE THEN streak_days
             WHEN last_activity_date = CURRENT_DATE - 1 THEN streak_days + 1
             ELSE 1
           END,
           last_activity_date = CURRENT_DATE,
           updated_at = NOW()
       WHERE clerk_user_id = $1
       RETURNING clerk_user_id, display_name, difficulty, xp, streak_days,
         last_activity_date, created_at`,
      [req.userId],
    );
    await client.query(
      `INSERT INTO daily_activity
         (clerk_user_id, activity_date, xp_earned, exercises_answered, lessons_completed)
       VALUES ($1, CURRENT_DATE, 5, 0, 0)
       ON CONFLICT (clerk_user_id, activity_date) DO UPDATE SET
         xp_earned = daily_activity.xp_earned + 5`,
      [req.userId],
    );
    const earnedAchievements = await evaluateAchievements(client, req.userId);
    await client.query("COMMIT");
    res.json({ ok: true, reviewCompleted: true, xpAwarded: 5, profile: user.rows[0], earnedAchievements });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
});

export default router;
