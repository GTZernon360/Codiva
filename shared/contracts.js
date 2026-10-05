/**
 * API model contracts used by the UI and server.
 *
 * UserProfile:
 * { clerkUserId, email, displayName, difficulty, xp, level, xpIntoLevel,
 *   xpForNextLevel, streakDays, lessonsCompleted,
 *   lastActivityDate, createdAt }
 *
 * DashboardData:
 * { profile: UserProfile, nextLesson: LessonSummary|null, courses: CourseProgress[],
 *   recentActivity: ActivityItem[], activityWeek: ActivityDay[],
 *   achievements: Achievement[], reviewCount }
 *
 * CourseProgress:
 * { slug, title, description, importance, orderIndex, status, completedLessons,
 *   lessonCount, lessons: LessonSummary[] }
 *
 * Lesson:
 * { slug, title, courseTitle, moduleTitle, orderIndex, estimatedMinutes, xpReward,
 *   difficulty, learning: LearningContent, exercises: Exercise[] }
 *
 * LearningContent:
 * { context, what, purpose, whereUsed, whyCreated, importance, analogy, alternatives,
 *   benefits, limitations, technical, example: { code, explanation } }
 *
 * Exercise:
 * { id, inputType, prompt, options: { id, label }[]|null, starterCode, hints,
 *   orderIndex }
 */
export const DIFFICULTIES = ["easy", "medium", "hard"];
