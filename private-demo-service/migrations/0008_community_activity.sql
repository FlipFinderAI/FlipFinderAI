-- Community activity is deliberately separate from authentication sessions,
-- matchday presence and location sharing.
--
-- Only a coarse "active now" boolean is exposed, and only to accepted friends.
-- The raw timestamp remains private server state.

CREATE TABLE community_activity (
  member_id TEXT PRIMARY KEY
    REFERENCES community_members(id) ON DELETE CASCADE,
  last_active_at INTEGER NOT NULL
);

CREATE INDEX community_activity_recent
ON community_activity(last_active_at);
