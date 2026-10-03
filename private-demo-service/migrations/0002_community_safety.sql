ALTER TABLE community_members ADD COLUMN safety_id TEXT;
ALTER TABLE community_members ADD COLUMN share_games INTEGER NOT NULL DEFAULT 0;
ALTER TABLE community_members ADD COLUMN share_grounds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE community_members ADD COLUMN photo_sharing INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX community_safety_id
ON community_members(safety_id)
WHERE safety_id IS NOT NULL;

ALTER TABLE community_reports ADD COLUMN context TEXT;
