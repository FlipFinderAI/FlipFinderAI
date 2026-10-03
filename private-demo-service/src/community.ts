import { eligible, type VerifiedFixture } from "../../lib/community/eligibility";
import { AVATARS } from "../../lib/community/model";

type Statement = {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
};
export type CommunityEnv = {
  DB: { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown> };
  // Trusted internal service binding, never a client-supplied identity header.
  COMMUNITY_FIXTURES?: { fetch(request: Request): Promise<Response> };
  COMMUNITY_AUTH?: { fetch(request: Request): Promise<Response> };
};
type Member = {
 id: string; subject: string; safety_id: string | null; friend_id: string | null;
 display_name: string; avatar: string; club_id: string;
 games_attended: number; grounds_json: string;
 enabled: number; location_visible: number;
 share_games: number; share_grounds: number; photo_sharing: number;
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
 status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});
function publicProfile(m: Member) {
 return {
  id: m.id,
  friendId: m.friend_id || "",
  displayName: m.display_name,
  avatar: m.avatar,
  clubId: m.club_id,
  gamesAttended: m.share_games ? m.games_attended : 0,
  groundsVisited: m.share_grounds ? JSON.parse(m.grounds_json) : [],
 };
}
function fail(message: string, status = 400): never { throw Object.assign(new Error(message), { status }); }
export async function communityFetch(request: Request, env: CommunityEnv): Promise<Response> {
 try {
  if (!env.COMMUNITY_AUTH) return json({ error: "Community authentication is not configured." }, 503);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in required." }, 401);
  const session = await env.COMMUNITY_AUTH.fetch(new Request("https://session.internal/verify", { headers: { authorization } }));
  if (!session.ok) return json({ error: "Sign in required." }, 401);
  const identity = await session.json() as {
   subject?: string;
   communityEligible?: boolean;
   isChild?: boolean;
  };

  if (!identity.subject || typeof identity.subject !== "string") {
   return json({ error: "Sign in required." }, 401);
  }

  if (identity.communityEligible !== true || identity.isChild !== false) {
   return json({ error: "Community is not available for this account." }, 403);
  }

  const sql = (query: string, ...args: unknown[]) => env.DB.prepare(query).bind(...args);
  let me = await sql("SELECT * FROM community_members WHERE subject = ?", identity.subject).first<Member>();

  if (me && !me.safety_id) {
   const safetyId = `TF-C-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
   await sql(
    "UPDATE community_members SET safety_id=? WHERE id=? AND safety_id IS NULL",
    safetyId,
    me.id
   ).run();
   me = await sql("SELECT * FROM community_members WHERE id=?", me.id).first<Member>();
  }
  const path = new URL(request.url).pathname.replace("/api/community", "");
  const now = Date.now();
  const state = () => ({
   profile: me ? publicProfile(me) : null,
   preferences: {
    enabled: Boolean(me?.enabled),
    locationVisible: Boolean(me?.location_visible),
    shareGames: Boolean(me?.share_games),
    shareGrounds: Boolean(me?.share_grounds),
    photoSharing: Boolean(me?.photo_sharing),
   },
   safetyId: me?.safety_id || null,
   serverNow: now,
  });
  if (path === "/me" && request.method === "GET") return json(state());
  const raw = request.method === "GET" ? "{}" : await request.text();
  if (raw.length > 24000) return json({ error: "Request is too large." }, 413);
  const data = JSON.parse(raw || "{}");
  if (path === "/profile" && request.method === "POST") {
    if (typeof data.displayName !== "string" || !data.displayName.trim() || data.displayName.length > 40 ||
        !AVATARS.includes(data.avatar) || typeof data.clubId !== "string" || !data.clubId || data.clubId.length > 120 ||
        !Number.isInteger(data.gamesAttended) || data.gamesAttended < 0 || data.gamesAttended > 100000 ||
        !Array.isArray(data.groundsVisited) || data.groundsVisited.length > 2000 ||
        data.groundsVisited.some((g: unknown) => typeof g !== "string" || g.length > 160)) fail("Check your public profile.");
    const id = me?.id || crypto.randomUUID();
    const safetyId = me?.safety_id ||
     `TF-C-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const friendId = me?.friend_id ||
     `TF-F-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    await env.DB.batch([
      sql(`INSERT INTO community_members(
       id,subject,safety_id,friend_id,display_name,avatar,club_id,games_attended,grounds_json
      )
      VALUES(?,?,?,?,?,?,?,?,?)
      ON CONFLICT(subject) DO UPDATE SET
       safety_id=COALESCE(community_members.safety_id,excluded.safety_id),
       friend_id=COALESCE(community_members.friend_id,excluded.friend_id),
       display_name=excluded.display_name,
       avatar=excluded.avatar,
       club_id=excluded.club_id,
       games_attended=excluded.games_attended,
       grounds_json=excluded.grounds_json`,
      id, identity.subject, safetyId, friendId, data.displayName.trim(), data.avatar,
      data.clubId, data.gamesAttended, JSON.stringify([...new Set(data.groundsVisited)])),
      sql("DELETE FROM community_presence WHERE member_id = ?", id),
    ]);
    me = await sql("SELECT * FROM community_members WHERE id = ?", id).first<Member>();
    return json(state());
  }
  if (!me) fail("Save your Community profile first.", 409);
  if (path === "/preferences" && request.method === "POST") {
    if (
     typeof data.enabled !== "boolean" ||
     typeof data.locationVisible !== "boolean" ||
     typeof data.shareGames !== "boolean" ||
     typeof data.shareGrounds !== "boolean" ||
     typeof data.photoSharing !== "boolean"
    ) fail("Invalid privacy options.");

    const enabled = data.enabled;
    const locationVisible = enabled && data.locationVisible;
    const shareGames = enabled && data.shareGames;
    const shareGrounds = enabled && data.shareGrounds;

    // Consent only. A future photo endpoint must ALSO require
    // an active Matchday Experience session server-side.
    const photoSharing = enabled && data.photoSharing;

    await env.DB.batch([
      sql(`UPDATE community_members
       SET enabled=?,location_visible=?,share_games=?,share_grounds=?,photo_sharing=?
       WHERE id=?`,
       +enabled, +locationVisible, +shareGames, +shareGrounds, +photoSharing, me.id),
      sql("DELETE FROM community_presence WHERE member_id=?", me.id),
    ]);

    me = await sql("SELECT * FROM community_members WHERE id=?", me.id).first<Member>();
    return json(state());
  }
  if (path === "/presence" && request.method === "DELETE") {
    await sql("DELETE FROM community_presence WHERE member_id=?", me.id).run();
    return json({ ok: true });
  }
  if (!me.enabled) fail("Enable Community first.", 403);
  async function fixtures() {
    if (!env.COMMUNITY_FIXTURES) fail("Verified football data service is not configured.", 503);
    const response = await env.COMMUNITY_FIXTURES.fetch(new Request(`https://football.internal/community-fixtures?clubId=${encodeURIComponent(me!.club_id)}`));
    if (!response.ok) fail("Verified fixture data is unavailable.", 503);
    const body = await response.json() as { fixtures: VerifiedFixture[] };
    if (!Array.isArray(body.fixtures)) fail("Verified fixture data is unavailable.", 503);
    return body.fixtures;
  }
  if (path === "/fixtures" && request.method === "GET") {
    if (!me.location_visible) fail("Enable matchday visibility first.", 403);
    return json({ fixtures: await fixtures(), serverNow: now });
  }
  if (path === "/presence" && request.method === "POST") {
    if (!me.location_visible) fail("Enable matchday visibility first.", 403);
    const fixture = (await fixtures()).find(f => f.id === data.fixtureId);
    if (!fixture || !eligible(fixture, me.club_id, now, data)) {
      await sql("DELETE FROM community_presence WHERE member_id=?", me.id).run();
      fail("You are not eligible for discovery at this fixture.", 403);
    }
    const expiresAt = Math.min(now + 120000, Date.parse(fixture.kickoff) + 4 * 3600000);
    await sql(`INSERT INTO community_presence(member_id,fixture_id,stadium,stadium_lat,stadium_lon,expires_at,on_map)
      VALUES(?,?,?,?,?,?,0) ON CONFLICT(member_id) DO UPDATE SET fixture_id=excluded.fixture_id,
      stadium=excluded.stadium,stadium_lat=excluded.stadium_lat,stadium_lon=excluded.stadium_lon,
      expires_at=excluded.expires_at,on_map=0`, me.id, fixture.id, fixture.stadium, fixture.latitude, fixture.longitude, expiresAt).run();
    return json({ presence: { fixtureId: fixture.id, stadium: fixture.stadium, latitude: fixture.latitude,
      longitude: fixture.longitude, expiresAt, onMap: false }, serverNow: now });
  }
  if (path === "/map" && request.method === "DELETE") {
    await sql("UPDATE community_presence SET on_map=0 WHERE member_id=?", me.id).run();
    return json({ ok: true });
  }
  if (path === "/map" && request.method === "POST") {
    if (!me.location_visible) fail("Enable matchday visibility first.", 403);
    const present = await sql("SELECT member_id FROM community_presence WHERE member_id=? AND expires_at>?", me.id, now).first();
    if (!present) fail("Check matchday eligibility again before joining the map.", 403);
    await sql("UPDATE community_presence SET on_map=1 WHERE member_id=? AND expires_at>?", me.id, now).run();
    return json({ ok: true });
  }
  async function visibleMembers(mapOnly = false) {
    return (await sql(`SELECT m.*, p.stadium, p.stadium_lat, p.stadium_lon, p.expires_at FROM community_members m
      JOIN community_presence p ON p.member_id=m.id
      JOIN community_presence own ON own.member_id=? AND own.fixture_id=p.fixture_id
      WHERE m.id<>? AND m.club_id=? AND m.enabled=1 AND m.location_visible=1
      AND p.expires_at>? AND own.expires_at>? AND (?=0 OR p.on_map=1)
      AND NOT EXISTS (SELECT 1 FROM community_blocks b WHERE (b.blocker=? AND b.blocked=m.id) OR (b.blocked=? AND b.blocker=m.id))
      LIMIT 100`, me!.id, me!.id, me!.club_id, now, now, +mapOnly, me!.id, me!.id)
      .all<Member & { stadium: string; stadium_lat: number; stadium_lon: number; expires_at: number }>()).results;
  }
  if ((path === "/map" || path === "/discover") && request.method === "GET") {
    if (!me.location_visible) fail("Enable matchday visibility first.", 403);
    const rows = await visibleMembers(path === "/map");
    return json({ people: rows.map(m => ({ profile: publicProfile(m), stadium: m.stadium,
      latitude: m.stadium_lat, longitude: m.stadium_lon, expiresAt: m.expires_at })), serverNow: now });
  }
  const peerGuard = `m.enabled=1 AND m.club_id=? AND NOT EXISTS
    (SELECT 1 FROM community_blocks b WHERE (b.blocker=? AND b.blocked=m.id) OR (b.blocked=? AND b.blocker=m.id))`;
  if (path === "/friends" && request.method === "GET") {
    const rows = (await sql(`SELECT m.*, r.id relationship_id, r.sender, r.status, r.friend_type FROM community_relationships r
      JOIN community_members m ON m.id=CASE WHEN r.sender=? THEN r.recipient ELSE r.sender END
      WHERE (r.sender=? OR r.recipient=?) AND ${peerGuard} LIMIT 200`, me.id, me.id, me.id, me.club_id, me.id, me.id)
      .all<Member & {
        relationship_id: string;
        sender: string;
        status: string;
        friend_type: "matchday" | "full_time";
      }>()).results;
    return json({ relationships: rows.map(row => ({
      id: row.relationship_id,
      status: row.status,
      friendType: row.friend_type,
      incoming: row.sender !== me!.id,
      profile: publicProfile(row)
    })) });
  }
  if (path === "/friend-search" && request.method === "GET") {
    if (!me.enabled) fail("Join Community before finding supporters.", 403);

    const query = (new URL(request.url).searchParams.get("q") || "").trim();

    if (query.length < 2 || query.length > 80) {
      fail("Enter an exact supporter name or Friend ID.");
    }

    const rows = (await sql(`SELECT m.* FROM community_members m
      WHERE m.id<>?
      AND ${peerGuard}
      AND (
        upper(m.friend_id)=upper(?)
        OR lower(m.display_name)=lower(?)
      )
      ORDER BY m.display_name COLLATE NOCASE
      LIMIT 20`,
      me.id,
      me.club_id,
      me.id,
      me.id,
      query,
      query
    ).all<Member>()).results;

    return json({ people: rows.map(publicProfile) });
  }

  if (path === "/friend-request" && request.method === "POST") {
    if (
      typeof data.target !== "string" ||
      data.target === me.id ||
      !["matchday", "full_time"].includes(data.friendType)
    ) {
      fail("Choose a supporter and friendship type.");
    }

    const relationshipId = crypto.randomUUID();

    // Known-supporter route. Exact Friend ID or exact display name is required.
    if (typeof data.lookup === "string" && data.lookup.trim()) {
      const lookup = data.lookup.trim();

      const result = await sql(`INSERT OR IGNORE INTO community_relationships
        (id,sender,recipient,status,friend_type)
        SELECT ?,?,m.id,'pending',? FROM community_members m
        WHERE m.id=?
        AND ${peerGuard}
        AND (
          upper(m.friend_id)=upper(?)
          OR lower(m.display_name)=lower(?)
        )`,
        relationshipId,
        me.id,
        data.friendType,
        data.target,
        me.club_id,
        me.id,
        me.id,
        lookup,
        lookup
      ).run();

      if (!result.meta.changes) {
        fail("This supporter is unavailable or a request already exists.", 409);
      }

      return json({ ok: true });
    }

    // Normal Matchday route. Both supporters must still have live presence
    // for the same verified fixture when the request is created.
    const result = await sql(`INSERT OR IGNORE INTO community_relationships
      (id,sender,recipient,status,friend_type)
      SELECT ?,?,m.id,'pending',? FROM community_members m
      JOIN community_presence p ON p.member_id=m.id
      JOIN community_presence own
        ON own.member_id=? AND own.fixture_id=p.fixture_id
      JOIN community_members self ON self.id=own.member_id
      WHERE m.id=?
      AND ${peerGuard}
      AND self.enabled=1
      AND self.location_visible=1
      AND self.club_id=m.club_id
      AND m.location_visible=1
      AND own.expires_at>?
      AND p.expires_at>?`,
      relationshipId,
      me.id,
      data.friendType,
      me.id,
      data.target,
      me.club_id,
      me.id,
      me.id,
      now,
      now
    ).run();

    if (!result.meta.changes) {
      fail("This supporter is unavailable or a request already exists.", 409);
    }

    return json({ ok: true });
  }

  if (path === "/relationship" && request.method === "POST") {
    if (typeof data.id !== "string" || !["accept", "decline", "unfriend"].includes(data.action)) fail("Invalid friendship action.");
    if (data.action === "accept") {
      const result = await sql(`UPDATE community_relationships SET status='accepted' WHERE id=? AND recipient=? AND status='pending'
        AND EXISTS (SELECT 1 FROM community_members m WHERE m.id=sender AND ${peerGuard})`, data.id, me.id, me.club_id, me.id, me.id).run();
      if (!result.meta.changes) fail("This request is no longer available.", 409);
    } else {
      await sql("DELETE FROM community_relationships WHERE id=? AND (sender=? OR recipient=?) AND status=?", data.id, me.id, me.id, data.action === "decline" ? "pending" : "accepted").run();
    }
    return json({ ok: true });
  }
  if (path === "/block" && request.method === "POST") {
    if (typeof data.target !== "string" || data.target === me.id) fail("Choose a supporter to block.");
    const target = await sql("SELECT id FROM community_members WHERE id=?", data.target).first();
    if (!target) fail("Supporter unavailable.", 404);
    await env.DB.batch([
      sql("INSERT OR IGNORE INTO community_blocks(blocker,blocked) VALUES(?,?)", me.id, data.target),
      sql("DELETE FROM community_relationships WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)", me.id, data.target, data.target, me.id),
    ]);
    return json({ ok: true });
  }
  if (path === "/report" && request.method === "POST") {
    if (typeof data.target !== "string" || typeof data.reason !== "string" || !data.reason.trim() || data.reason.length>1000 || data.target===me.id) fail("Enter a report reason of 1–1000 characters.");
    let target = await sql(
     "SELECT id,safety_id FROM community_members WHERE id=?",
     data.target
    ).first<{ id: string; safety_id: string | null }>();

    if (!target) fail("Supporter unavailable.", 404);

    if (!target.safety_id) {
     const safetyId = `TF-C-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
     await sql(
      "UPDATE community_members SET safety_id=? WHERE id=? AND safety_id IS NULL",
      safetyId,
      data.target
     ).run();

     target = await sql(
      "SELECT id,safety_id FROM community_members WHERE id=?",
      data.target
     ).first<{ id: string; safety_id: string | null }>();
    }

    if (!target) fail("Supporter unavailable.", 404);

    const recent = await sql(
     "SELECT id FROM community_reports WHERE reporter=? AND reported=? AND created_at>?",
     me.id, data.target, now - 3600000
    ).first();

    if (recent) fail("Your report has already been received.", 429);

    const reportId = crypto.randomUUID();
    const context =
     typeof data.context === "string" ? data.context.trim().slice(0, 500) : "";

    await sql(
     `INSERT INTO community_reports(id,reporter,reported,reason,created_at,context)
      VALUES(?,?,?,?,?,?)`,
     reportId, me.id, data.target, data.reason.trim(), now, context
    ).run();

    return json({
     ok: true,
     reportId,
     reportedSafetyId: target.safety_id,
     contact: "info@handytize.co.uk",
    });
  }
  // Feature routes are added in independently checkpointed stages.

   async function acceptedFriend(target: unknown) {
     if (typeof target !== "string" || target === me!.id) {
       fail("Choose a friend.");
     }

     return sql(`SELECT m.*, r.friend_type FROM community_members m
       JOIN community_relationships r
         ON ((r.sender=? AND r.recipient=m.id)
         OR (r.recipient=? AND r.sender=m.id))
       WHERE m.id=? AND r.status='accepted'
       AND ${peerGuard}
       LIMIT 1`,
       me!.id,
       me!.id,
       target,
       me!.club_id,
       me!.id,
       me!.id
     ).first<Member & { friend_type: "matchday" | "full_time" }>();
   }

   async function canMessageFriend(
     friend: Member & { friend_type: "matchday" | "full_time" }
   ) {
     if (friend.friend_type === "full_time") return true;

     const live = await sql(`SELECT 1 ok
       FROM community_presence own
       JOIN community_presence peer
         ON peer.fixture_id=own.fixture_id
       WHERE own.member_id=?
       AND peer.member_id=?
       AND own.expires_at>?
       AND peer.expires_at>?
       LIMIT 1`,
       me!.id,
       friend.id,
       now,
       now
     ).first();

     return Boolean(live);
   }

   function containsPhoneNumber(value: string) {
     const candidates = value.match(/\+?\d[\d\s().-]{5,}\d/g) || [];

     return candidates.some(candidate => {
       const digits = candidate.replace(/\D/g, "");
       return digits.length >= 9 && digits.length <= 15;
     });
   }

   if (path === "/conversations" && request.method === "GET") {
     const rows = (await sql(`SELECT m.*, r.friend_type,
       (SELECT count(*) FROM community_messages msg
        WHERE msg.sender=m.id
        AND msg.recipient=?
        AND msg.read_at IS NULL) unread
       FROM community_relationships r
       JOIN community_members m
         ON m.id=CASE
           WHEN r.sender=? THEN r.recipient
           ELSE r.sender
         END
       WHERE (r.sender=? OR r.recipient=?)
       AND r.status='accepted'
       AND ${peerGuard}
       ORDER BY m.display_name COLLATE NOCASE
       LIMIT 200`,
       me.id,
       me.id,
       me.id,
       me.id,
       me.club_id,
       me.id,
       me.id
     ).all<Member & {
       unread: number;
       friend_type: "matchday" | "full_time";
     }>()).results;

     const conversations = await Promise.all(rows.map(async row => ({
       friend: publicProfile(row),
       unread: Number(row.unread || 0),
       friendType: row.friend_type,
       canMessage: await canMessageFriend(row),
     })));

     return json({ conversations });
   }

   if (path === "/messages" && request.method === "GET") {
     const target = new URL(request.url).searchParams.get("friend");
     const friend = await acceptedFriend(target);

     if (!friend) {
       fail("This conversation is unavailable.", 403);
     }

     if (!(await canMessageFriend(friend))) {
       fail(
         "Matchday Friend messaging is only available during an eligible matchday.",
         403
       );
     }

     await sql(`UPDATE community_messages
       SET read_at=?
       WHERE sender=?
       AND recipient=?
       AND read_at IS NULL`,
       now,
       friend.id,
       me.id
     ).run();

     const rows = (await sql(`SELECT id,sender,body,created_at
       FROM community_messages
       WHERE (sender=? AND recipient=?)
       OR (sender=? AND recipient=?)
       ORDER BY created_at ASC, id ASC
       LIMIT 500`,
       me.id,
       friend.id,
       friend.id,
       me.id
     ).all<{
       id: string;
       sender: string;
       body: string;
       created_at: number;
     }>()).results;

     return json({
       messages: rows.map(row => ({
         id: row.id,
         sender: row.sender,
         body: row.body,
         createdAt: row.created_at,
       }))
     });
   }

   if (path === "/message" && request.method === "POST") {
     if (
       typeof data.body !== "string" ||
       !data.body.trim() ||
       data.body.length > 1000
     ) {
       fail("Enter a message of 1–1000 characters.");
     }

     if (containsPhoneNumber(data.body)) {
       fail("Phone numbers cannot be shared in Community messages.");
     }

     const friend = await acceptedFriend(data.target);

     if (!friend) {
       fail(
         "You can only message an accepted same-club friend.",
         403
       );
     }

     if (!(await canMessageFriend(friend))) {
       fail(
         "Matchday Friend messaging is only available during an eligible matchday.",
         403
       );
     }

     await sql(`INSERT INTO community_messages
       (id,sender,recipient,body,created_at,read_at)
       VALUES(?,?,?,?,?,NULL)`,
       crypto.randomUUID(),
       me.id,
       friend.id,
       data.body.trim(),
       now
     ).run();

     return json({ ok: true });
   }

   return json({ error: "Community route not found." }, 404);
 } catch (error) {
  const known = error as Error & { status?: number };
  return json({ error: known.status ? known.message : "Community is unavailable. Please try again." }, known.status || 500);
 }
}
