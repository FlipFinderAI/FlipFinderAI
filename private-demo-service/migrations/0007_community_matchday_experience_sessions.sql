-- Canonical Matchday Experience session.
-- The Experience lifecycle is independent of location sharing.
-- Location remains optional and is only stored after an explicit privacy opt-in.

CREATE TABLE community_matchday_experience_sessions (
  member_id TEXT PRIMARY KEY
    REFERENCES community_members(id) ON DELETE CASCADE,
  fixture_id TEXT NOT NULL,
  stadium TEXT NOT NULL,
  supporter TEXT NOT NULL DEFAULT 'home'
    CHECK(supporter IN ('home','away')),
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX community_matchday_experience_session_fixture
ON community_matchday_experience_sessions(fixture_id, expires_at);
