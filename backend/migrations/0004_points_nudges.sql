ALTER TABLE tasks ADD COLUMN points INTEGER NOT NULL DEFAULT 10 CHECK (points BETWEEN 5 AND 100);
ALTER TABLE task_occurrences ADD COLUMN points INTEGER NOT NULL DEFAULT 10 CHECK (points BETWEEN 5 AND 100);
CREATE INDEX occurrences_completed_by ON task_occurrences(completed_by, completed_at);
CREATE TABLE task_nudges (
  occurrence_id TEXT PRIMARY KEY REFERENCES task_occurrences(id) ON DELETE CASCADE,
  id TEXT NOT NULL UNIQUE,
  actor_id TEXT NOT NULL REFERENCES users(id),
  target_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
) STRICT;
