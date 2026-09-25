CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (length(display_name) BETWEEN 2 AND 40)
) STRICT;

CREATE TABLE access_keys (
  key_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
) STRICT;
CREATE INDEX access_keys_user_idx ON access_keys(user_id);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  CHECK (expires_at > created_at)
) STRICT;
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE auth_rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL CHECK (hits >= 0)
) STRICT;

CREATE TABLE homes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 60),
  timezone TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
) STRICT;

CREATE TABLE home_members (
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (home_id, user_id)
) STRICT;
CREATE INDEX home_members_home_idx ON home_members(home_id);

CREATE TABLE home_invites (
  code_hash TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  CHECK (expires_at > created_at)
) STRICT;
CREATE INDEX home_invites_home_idx ON home_invites(home_id, revoked_at);
