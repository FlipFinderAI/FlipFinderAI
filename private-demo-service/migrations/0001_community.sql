-- Additive Community tables. Existing demo and football tables are untouched.
PRAGMA foreign_keys = ON;
CREATE TABLE community_members (
 id TEXT PRIMARY KEY, subject TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL, avatar TEXT NOT NULL, club_id TEXT NOT NULL,
 games_attended INTEGER NOT NULL DEFAULT 0 CHECK(games_attended >= 0),
 grounds_json TEXT NOT NULL DEFAULT '[]', enabled INTEGER NOT NULL DEFAULT 0,
 location_visible INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE community_presence (
 member_id TEXT PRIMARY KEY REFERENCES community_members(id) ON DELETE CASCADE,
 fixture_id TEXT NOT NULL, stadium TEXT NOT NULL,
 stadium_lat REAL NOT NULL, stadium_lon REAL NOT NULL,
 expires_at INTEGER NOT NULL, on_map INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE community_relationships (
 id TEXT PRIMARY KEY, sender TEXT NOT NULL REFERENCES community_members(id),
 recipient TEXT NOT NULL REFERENCES community_members(id),
 status TEXT NOT NULL CHECK(status IN ('pending','accepted')),
 CHECK(sender <> recipient)
);
CREATE UNIQUE INDEX community_pair ON community_relationships(min(sender,recipient),max(sender,recipient));
CREATE TABLE community_blocks (
 blocker TEXT NOT NULL REFERENCES community_members(id), blocked TEXT NOT NULL REFERENCES community_members(id),
 PRIMARY KEY(blocker,blocked), CHECK(blocker <> blocked)
);
CREATE TABLE community_reports (
 id TEXT PRIMARY KEY, reporter TEXT NOT NULL REFERENCES community_members(id),
 reported TEXT NOT NULL REFERENCES community_members(id), reason TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE TABLE community_messages (
 id TEXT PRIMARY KEY, sender TEXT NOT NULL REFERENCES community_members(id),
 recipient TEXT NOT NULL REFERENCES community_members(id), body TEXT NOT NULL,
 created_at INTEGER NOT NULL, read_at INTEGER
);
CREATE INDEX community_inbox ON community_messages(recipient,sender,created_at);
