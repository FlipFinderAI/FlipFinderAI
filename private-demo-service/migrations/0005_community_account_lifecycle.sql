-- Single-use account verification and password-reset tokens.
-- Raw tokens are never stored in D1.

PRAGMA foreign_keys = ON;

CREATE TABLE community_account_tokens (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL
    REFERENCES community_accounts(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL
    CHECK(purpose IN ('verify-email','password-reset')),
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE INDEX community_account_tokens_account
ON community_account_tokens(account_id, purpose, expires_at);

CREATE TABLE community_auth_action_limits (
  action_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL
);
