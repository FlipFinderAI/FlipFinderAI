CREATE TABLE community_matchday_experiences (
  member_id TEXT PRIMARY KEY
    REFERENCES community_members(id) ON DELETE CASCADE,
  fixture_id TEXT NOT NULL,
  stadium TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL NOT NULL,
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX community_matchday_experience_fixture
ON community_matchday_experiences(fixture_id, expires_at);
