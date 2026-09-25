CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 80),
  room TEXT NOT NULL CHECK (room IN ('kitchen','bathroom','bedroom','living')),
  icon TEXT NOT NULL CHECK (icon IN ('dishes','trash','clean','laundry')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly')),
  first_date TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at INTEGER NOT NULL
) STRICT;
CREATE INDEX tasks_home_idx ON tasks(home_id);
CREATE TABLE task_participants (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  position INTEGER NOT NULL,
  PRIMARY KEY (task_id, user_id),
  UNIQUE (task_id, position)
) STRICT;
CREATE TABLE task_occurrences (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  due_date TEXT NOT NULL,
  original_assignee TEXT NOT NULL REFERENCES users(id),
  assignee TEXT NOT NULL REFERENCES users(id),
  completed_at INTEGER,
  completed_by TEXT REFERENCES users(id),
  action_key TEXT,
  UNIQUE (task_id, due_date)
) STRICT;
CREATE INDEX occurrences_task_date ON task_occurrences(task_id, due_date);
CREATE TABLE activity_events (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id),
  occurrence_id TEXT NOT NULL REFERENCES task_occurrences(id),
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('completed','undone','swapped')),
  created_at INTEGER NOT NULL
) STRICT;
CREATE INDEX activity_home_date ON activity_events(home_id, created_at);
