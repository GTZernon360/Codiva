CREATE TABLE IF NOT EXISTS app_users (
  clerk_user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Aprendiz',
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('essential', 'useful', 'contextual', 'optional', 'legacy')),
  order_index INTEGER NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#7057e8',
  icon TEXT NOT NULL DEFAULT 'code',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
  slug TEXT PRIMARY KEY,
  course_slug TEXT NOT NULL REFERENCES courses(slug),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  UNIQUE (course_slug, order_index)
);

CREATE TABLE IF NOT EXISTS lessons (
  slug TEXT PRIMARY KEY,
  module_slug TEXT NOT NULL REFERENCES modules(slug),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 8,
  xp_reward INTEGER NOT NULL DEFAULT 20 CHECK (xp_reward >= 0),
  learning_content JSONB NOT NULL,
  example_code TEXT NOT NULL DEFAULT '',
  example_explanation TEXT NOT NULL DEFAULT '',
  UNIQUE (module_slug, order_index)
);

CREATE TABLE IF NOT EXISTS exercises (
  id BIGSERIAL PRIMARY KEY,
  lesson_slug TEXT NOT NULL REFERENCES lessons(slug),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  input_type TEXT NOT NULL CHECK (input_type IN ('choice', 'short', 'code')),
  prompt TEXT NOT NULL,
  options JSONB,
  starter_code TEXT,
  accepted_answers JSONB NOT NULL,
  explanation TEXT NOT NULL,
  corrected_example TEXT,
  hints JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL,
  UNIQUE (lesson_slug, difficulty, order_index)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL REFERENCES lessons(slug) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed')),
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clerk_user_id, lesson_slug)
);

CREATE TABLE IF NOT EXISTS exercise_attempts (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_activity (
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  exercises_answered INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (clerk_user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS review_items (
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL REFERENCES lessons(slug) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'missed_exercise',
  next_review_at DATE NOT NULL DEFAULT CURRENT_DATE,
  error_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clerk_user_id, lesson_slug)
);

CREATE TABLE IF NOT EXISTS achievements (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement TEXT NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_achievements (
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  achievement_slug TEXT NOT NULL REFERENCES achievements(slug) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clerk_user_id, achievement_slug)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON lessons(module_slug, order_index);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson_difficulty ON exercises(lesson_slug, difficulty, order_index);
CREATE INDEX IF NOT EXISTS idx_attempts_user_date ON exercise_attempts(clerk_user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_due ON review_items(clerk_user_id, next_review_at);
