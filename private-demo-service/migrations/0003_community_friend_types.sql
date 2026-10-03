ALTER TABLE community_members ADD COLUMN friend_id TEXT;

UPDATE community_members
SET friend_id = 'TF-F-' || upper(hex(randomblob(6)))
WHERE friend_id IS NULL;

CREATE UNIQUE INDEX community_friend_id
ON community_members(friend_id)
WHERE friend_id IS NOT NULL;

ALTER TABLE community_relationships
ADD COLUMN friend_type TEXT NOT NULL DEFAULT 'matchday'
CHECK(friend_type IN ('matchday','full_time'));
