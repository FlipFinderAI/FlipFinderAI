-- Additive, off by default; existing accounts and eligibility remain untouched.
ALTER TABLE community_members ADD COLUMN share_ticket INTEGER NOT NULL DEFAULT 0;
ALTER TABLE community_members ADD COLUMN always_location INTEGER NOT NULL DEFAULT 0;
CREATE TABLE community_map_locations (
 member_id TEXT PRIMARY KEY REFERENCES community_members(id) ON DELETE CASCADE,
 latitude REAL NOT NULL, longitude REAL NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('always','matchday')),
 fixture_id TEXT, expires_at INTEGER NOT NULL
);
