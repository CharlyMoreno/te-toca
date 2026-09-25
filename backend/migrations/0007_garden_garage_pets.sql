-- Keep legacy room kinds and foreign keys intact; room_type is the visible type.
-- This avoids rebuilding parent tables referenced by existing tasks and history.
ALTER TABLE rooms ADD COLUMN room_type TEXT NOT NULL DEFAULT 'living'
  CHECK (room_type IN ('kitchen','bathroom','bedroom','living','garage','garden'));
UPDATE rooms SET room_type=kind;

CREATE TABLE pets (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 24),
  kind TEXT NOT NULL CHECK (kind IN ('dog','cat')),
  color TEXT NOT NULL CHECK (color IN ('#b78354','#e6d2ad','#55545a','#ede8df','#c77540','#8d8580')),
  created_at INTEGER NOT NULL
) STRICT;
CREATE INDEX pets_home_idx ON pets(home_id);
ALTER TABLE tasks ADD COLUMN pet_id TEXT REFERENCES pets(id);
CREATE INDEX tasks_pet_idx ON tasks(pet_id);
CREATE TRIGGER task_pet_insert BEFORE INSERT ON tasks
WHEN NEW.pet_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pets WHERE id=NEW.pet_id AND home_id=NEW.home_id)
BEGIN SELECT RAISE(ABORT,'Invalid task pet'); END;
CREATE TRIGGER task_pet_update BEFORE UPDATE OF pet_id,home_id ON tasks
WHEN NEW.pet_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pets WHERE id=NEW.pet_id AND home_id=NEW.home_id)
BEGIN SELECT RAISE(ABORT,'Invalid task pet'); END;
