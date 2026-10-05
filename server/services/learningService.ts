import { query } from "../db.ts";
import { clerkClient } from "@clerk/express";

export async function ensureUser(userId) {
  const result = await query(
    `INSERT INTO app_users (clerk_user_id)
     VALUES ($1)
     ON CONFLICT (clerk_user_id) DO UPDATE SET updated_at = NOW()
    RETURNING clerk_user_id, email, display_name, difficulty, xp, streak_days,
       last_activity_date, created_at`,
    [userId],
  );
  return result.rows[0];
}

export function serializeProfile(row, stats = {}) {
  const xp = Number(row.xp ?? 0);
  return {
    clerkUserId: row.clerk_user_id,
    email: row.email ?? null,
    displayName: row.display_name,
    difficulty: row.difficulty,
    xp,
    level: Math.floor(xp / 100) + 1,
    xpIntoLevel: xp % 100,
    xpForNextLevel: 100,
    streakDays: Number(row.streak_days ?? 0),
    lastActivityDate: row.last_activity_date,
    lessonsCompleted: Number(stats.lessonsCompleted ?? 0),
    correctExercises: Number(stats.correctExercises ?? 0),
    createdAt: row.created_at,
  };
}

export async function syncClerkIdentity(userId) {
  const user = await clerkClient.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const providerName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null;
  await query(
    `UPDATE app_users
     SET email = $2,
         display_name = CASE
           WHEN display_name = 'Aprendiz' THEN COALESCE($3, display_name)
           ELSE display_name
         END,
         updated_at = NOW()
     WHERE clerk_user_id = $1`,
    [userId, email, providerName],
  );
}

export async function getUserStats(userId) {
  const result = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM lesson_progress
        WHERE clerk_user_id = $1 AND status = 'completed') AS lessons_completed,
       (SELECT COUNT(DISTINCT exercise_id)::int FROM exercise_attempts
        WHERE clerk_user_id = $1 AND is_correct) AS correct_exercises`,
    [userId],
  );
  return {
    lessonsCompleted: result.rows[0]?.lessons_completed ?? 0,
    correctExercises: result.rows[0]?.correct_exercises ?? 0,
  };
}

export async function getProfile(userId) {
  const [user, stats, review] = await Promise.all([
    query(
      `SELECT clerk_user_id, email, display_name, difficulty, xp,
        CASE WHEN last_activity_date >= CURRENT_DATE - 1 THEN streak_days ELSE 0 END AS streak_days,
        last_activity_date, created_at
       FROM app_users WHERE clerk_user_id = $1`,
      [userId],
    ),
    getUserStats(userId),
    query(
      `SELECT COUNT(*)::int AS count FROM review_items
       WHERE clerk_user_id = $1 AND next_review_at <= CURRENT_DATE`,
      [userId],
    ),
  ]);
  return {
    profile: serializeProfile(user.rows[0], stats),
    reviewCount: review.rows[0]?.count ?? 0,
  };
}

export async function getCurriculum(userId) {
  const result = await query(
    `SELECT
       c.slug, c.title, c.description, c.importance, c.order_index, c.color, c.icon,
       COUNT(DISTINCT l.slug)::int AS lesson_count,
       COUNT(DISTINCT l.slug) FILTER (WHERE lp.status = 'completed')::int AS completed_lessons,
       COALESCE(
         jsonb_agg(
           jsonb_build_object(
             'slug', l.slug,
             'title', l.title,
             'summary', l.summary,
             'orderIndex', l.order_index,
             'estimatedMinutes', l.estimated_minutes,
             'xpReward', l.xp_reward,
             'moduleSlug', m.slug,
             'moduleTitle', m.title,
             'status', COALESCE(lp.status, 'not_started'),
             'score', COALESCE(lp.score, 0)
           ) ORDER BY m.order_index, l.order_index
         ) FILTER (WHERE l.slug IS NOT NULL),
         '[]'::jsonb
       ) AS lessons
     FROM courses c
     LEFT JOIN modules m ON m.course_slug = c.slug
     LEFT JOIN lessons l ON l.module_slug = m.slug
     LEFT JOIN lesson_progress lp
       ON lp.lesson_slug = l.slug AND lp.clerk_user_id = $1
     GROUP BY c.slug
     ORDER BY c.order_index`,
    [userId],
  );

  let priorCoursesCompleted = true;
  const courses = result.rows.map((course) => {
    const courseUnlocked = priorCoursesCompleted;
    const lessons = course.lessons.map((lesson, index, allLessons) => {
      const completed = lesson.status === "completed";
      const previousLessonsCompleted = allLessons
        .slice(0, index)
        .every((previous) => previous.status === "completed");
      return {
        ...lesson,
        completed,
        status: completed
          ? "completed"
          : courseUnlocked && previousLessonsCompleted
            ? "available"
            : "locked",
      };
    });
    const lessonCount = Number(course.lesson_count);
    const completedLessons = Number(course.completed_lessons);
    const courseCompleted = lessonCount > 0 && completedLessons === lessonCount;
    const status = lessonCount === 0
      ? "planned"
      : courseCompleted
        ? "completed"
        : courseUnlocked
          ? "active"
          : "locked";
    priorCoursesCompleted = courseUnlocked && courseCompleted;
    return {
      slug: course.slug,
      title: course.title,
      description: course.description,
      importance: course.importance,
      orderIndex: course.order_index,
      color: course.color,
      icon: course.icon,
      lessonCount,
      completedLessons,
      progressPercent: lessonCount ? Math.round((completedLessons / lessonCount) * 100) : 0,
      status,
      lessons,
    };
  });

  return courses;
}

export async function getDashboard(userId) {
  const [userResult, stats, courses, activityResult, activityWeekResult, achievementResult, reviewResult] =
    await Promise.all([
      query(
        `SELECT clerk_user_id, email, display_name, difficulty, xp,
          CASE WHEN last_activity_date >= CURRENT_DATE - 1 THEN streak_days ELSE 0 END AS streak_days,
          last_activity_date, created_at
         FROM app_users WHERE clerk_user_id = $1`,
        [userId],
      ),
      getUserStats(userId),
      getCurriculum(userId),
      query(
        `SELECT activity_date, xp_earned, exercises_answered, lessons_completed
         FROM daily_activity
         WHERE clerk_user_id = $1
         ORDER BY activity_date DESC
         LIMIT 7`,
        [userId],
      ),
      query(
        `SELECT
           to_char(week_day.day, 'YYYY-MM-DD') AS activity_date,
           (week_day.day::date = CURRENT_DATE) AS is_today,
           (activity.activity_date IS NOT NULL) AS active
         FROM generate_series(
           date_trunc('week', CURRENT_DATE)::timestamp,
           date_trunc('week', CURRENT_DATE)::timestamp + INTERVAL '6 days',
           INTERVAL '1 day'
         ) AS week_day(day)
         LEFT JOIN daily_activity activity
           ON activity.clerk_user_id = $1
          AND activity.activity_date = week_day.day::date
         ORDER BY week_day.day`,
        [userId],
      ),
      query(
        `SELECT a.slug, a.title, a.description, a.icon,
          (ua.unlocked_at IS NOT NULL) AS earned, ua.unlocked_at
         FROM achievements a
         LEFT JOIN user_achievements ua
           ON ua.achievement_slug = a.slug AND ua.clerk_user_id = $1
         ORDER BY a.slug`,
        [userId],
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM review_items
         WHERE clerk_user_id = $1 AND next_review_at <= CURRENT_DATE`,
        [userId],
      ),
    ]);

  const profile = serializeProfile(userResult.rows[0], stats);
  let nextLesson = null;
  for (const course of courses) {
    const lesson = course.lessons.find((item) => item.status === "available");
    if (lesson) {
      nextLesson = {
        ...lesson,
        courseTitle: course.title,
      };
      break;
    }
  }

  const recentActivity = activityResult.rows.map((item) => {
    const date = String(item.activity_date).slice(0, 10);
    const utcDate = new Date(`${date}T00:00:00Z`);
    return {
    id: String(item.activity_date),
    title: Number(item.lessons_completed)
      ? `${item.lessons_completed} ${Number(item.lessons_completed) === 1 ? "lição concluída" : "lições concluídas"}`
      : `${item.exercises_answered} ${Number(item.exercises_answered) === 1 ? "exercício respondido" : "exercícios respondidos"}`,
    courseTitle: `${item.xp_earned} XP · ${utcDate.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "numeric", month: "short" })}`,
    type: Number(item.lessons_completed) ? "lesson" : "exercise",
    };
  });
  const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const activityWeek = activityWeekResult.rows.map((item) => {
    const utcDate = new Date(`${item.activity_date}T00:00:00Z`);
    return {
      date: item.activity_date,
      label: weekdayLabels[utcDate.getUTCDay()],
      isToday: item.is_today,
      active: item.active,
    };
  });

  return {
    profile,
    nextLesson,
    courses,
    recentActivity,
    activityWeek,
    achievements: achievementResult.rows.map((item) => ({
      id: item.slug,
      slug: item.slug,
      title: item.title,
      description: item.description,
      icon: item.icon,
      earned: item.earned,
      unlockedAt: item.unlocked_at,
    })),
    reviewCount: reviewResult.rows[0]?.count ?? 0,
  };
}
