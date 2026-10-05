ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS courses_importance_check;

ALTER TABLE courses
  ADD CONSTRAINT courses_importance_check
  CHECK (importance IN ('essential', 'useful', 'contextual', 'optional', 'legacy'));
