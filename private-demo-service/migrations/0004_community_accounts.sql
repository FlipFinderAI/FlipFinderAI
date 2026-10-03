-- Community authentication is separate from the main Ticket Frame app.
-- Passwords are never stored. Only salted password hashes are retained.
-- New accounts are NOT automatically Community-eligible.

PRAGMA foreign_keys = ON;

CREATE TABLE community_accounts (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0
    CHECK(email_verified IN (0,1)),
  community_eligible INTEGER NOT NULL DEFAULT 0
    CHECK(community_eligible IN (0,1)),
  is_child INTEGER
    CHECK(is_child IS NULL OR is_child IN (0,1)),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active','disabled','deleted')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE community_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL
    REFERENCES community_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX community_sessions_account
ON community_sessions(account_id, expires_at);

CREATE TABLE community_auth_limits (
  email_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL
);
