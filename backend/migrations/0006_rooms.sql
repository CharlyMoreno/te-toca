CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 32),
  kind TEXT NOT NULL CHECK (kind IN ('kitchen','bathroom','bedroom','living')),
  slot INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 11),
  created_at INTEGER NOT NULL,
  UNIQUE (home_id,slot)
) STRICT;
INSERT INTO rooms (id,home_id,name,kind,slot,created_at)
SELECT h.id||':'||r.kind,h.id,r.name,r.kind,r.slot,h.created_at FROM homes h
CROSS JOIN (
 SELECT 'kitchen' kind,'Cocina' name,0 slot UNION ALL
 SELECT 'bathroom','Baño',1 UNION ALL
 SELECT 'bedroom','Dormitorio',2 UNION ALL
 SELECT 'living','Living',3
) r;
ALTER TABLE tasks ADD COLUMN room_id TEXT REFERENCES rooms(id);
UPDATE tasks SET room_id=home_id||':'||room;
CREATE INDEX tasks_room_idx ON tasks(room_id);
CREATE TRIGGER task_room_insert BEFORE INSERT ON tasks
WHEN NEW.room_id IS NULL OR NOT EXISTS (SELECT 1 FROM rooms WHERE id=NEW.room_id AND home_id=NEW.home_id AND kind=NEW.room)
BEGIN SELECT RAISE(ABORT,'Invalid task room'); END;
CREATE TRIGGER task_room_update BEFORE UPDATE OF room_id,home_id,room ON tasks
WHEN NEW.room_id IS NULL OR NOT EXISTS (SELECT 1 FROM rooms WHERE id=NEW.room_id AND home_id=NEW.home_id AND kind=NEW.room)
BEGIN SELECT RAISE(ABORT,'Invalid task room'); END;
