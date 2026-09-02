CREATE TABLE IF NOT EXISTS demos (
  token_hash TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  redeemed_at TEXT,
  session_hash TEXT
);

CREATE INDEX IF NOT EXISTS demos_expires_at ON demos(expires_at);
