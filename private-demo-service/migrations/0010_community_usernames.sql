-- Unique public usernames for Community accounts.
-- Existing accounts remain valid until they choose a username.

CREATE TABLE community_usernames (
  account_id TEXT PRIMARY KEY
    REFERENCES community_accounts(id) ON DELETE CASCADE,

  username TEXT NOT NULL COLLATE NOCASE UNIQUE,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  CHECK(length(username) BETWEEN 3 AND 20),
  CHECK(username NOT GLOB '*[^A-Za-z0-9_]*')
);

CREATE UNIQUE INDEX community_usernames_unique
ON community_usernames(username COLLATE NOCASE);
