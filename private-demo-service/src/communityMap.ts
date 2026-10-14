import type { CommunityEnv } from "./community";
import { validCoordinates } from "../../lib/community/eligibility";

type Member = { id: string; club_id: string; always_location: number; location_visible: number };
const json = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { "cache-control": "no-store" },
});
/** All reads use current consent, friendship, block state and server expiry. */
export async function communityMap(request: Request, env: CommunityEnv, me: Member, data: any, now: number) {
  const sql = (query: string, ...values: unknown[]) => env.DB.prepare(query).bind(...values);
  const path = new URL(request.url).pathname;
  if (path.endsWith("/location") && request.method === "DELETE") {
    await sql("DELETE FROM community_map_locations WHERE member_id=?", me.id).run();
    return json({ ok: true });
  }
  if (path.endsWith("/location") && request.method === "POST") {
    if (!validCoordinates(data.latitude, data.longitude) || !Number.isFinite(data.accuracy) || data.accuracy < 0 || data.accuracy > 2000)
      return json({ error: "A recent usable device location is required." }, 400);
    let expiresAt = now + 120000;
    let fixtureId: string | null = null;
    if (data.mode === "always") {
      if (!me.always_location) return json({ error: "Always Show My Location is off." }, 403);
    } else if (data.mode === "matchday") {
      if (!me.location_visible || data.accepted !== true)
        return json({ error: "Accept location sharing for this Matchday session first." }, 403);
      const session = await sql(`SELECT fixture_id, expires_at FROM community_matchday_experience_sessions
        WHERE member_id=? AND expires_at>?`, me.id, now).first<{ fixture_id: string; expires_at: number }>();
      if (!session) return json({ error: "Activate Matchday Mode first." }, 403);
      fixtureId = session.fixture_id;
      expiresAt = Math.min(expiresAt, session.expires_at);
    } else return json({ error: "Choose a location sharing mode." }, 400);
    // Quantize before storage: exact GPS never enters the public map table.
    const latitude = Math.round(data.latitude * 100) / 100;
    const longitude = Math.round(data.longitude * 100) / 100;
    await sql(`INSERT INTO community_map_locations(member_id,latitude,longitude,mode,fixture_id,expires_at)
      VALUES(?,?,?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET latitude=excluded.latitude,
      longitude=excluded.longitude,mode=excluded.mode,fixture_id=excluded.fixture_id,expires_at=excluded.expires_at`,
      me.id, latitude, longitude, data.mode, fixtureId, expiresAt).run();
    return json({ latitude, longitude, expiresAt, serverNow: now });
  }
  if (path.endsWith("/community-map") && request.method === "GET") {
    const rows = (await sql(`SELECT m.id,m.friend_id,m.display_name,m.avatar,m.club_id,
      l.latitude,l.longitude,l.expires_at,m.share_ticket,e.fixture_id,e.stadium
      FROM community_members m JOIN community_map_locations l ON l.member_id=m.id
      LEFT JOIN community_matchday_experience_sessions e ON e.member_id=m.id AND e.expires_at>?
      WHERE m.enabled=1 AND m.club_id=? AND l.expires_at>?
      AND ((l.mode='always' AND m.always_location=1) OR
        (l.mode='matchday' AND m.location_visible=1 AND e.fixture_id=l.fixture_id))
      AND (m.id=? OR EXISTS (SELECT 1 FROM community_relationships r WHERE r.status='accepted'
        AND ((r.sender=? AND r.recipient=m.id) OR (r.recipient=? AND r.sender=m.id))))
      AND NOT EXISTS (SELECT 1 FROM community_blocks b WHERE
        (b.blocker=? AND b.blocked=m.id) OR (b.blocked=? AND b.blocker=m.id)) LIMIT 200`,
      now, me.club_id, now, me.id, me.id, me.id, me.id, me.id).all<any>()).results;
    return json({ people: rows.map(row => ({
      profile: { id: row.id, friendId: row.friend_id, displayName: row.display_name, avatar: row.avatar, clubId: row.club_id },
      latitude: row.latitude, longitude: row.longitude, expiresAt: row.expires_at,
      approximate: true, self: row.id === me.id,
      // Explicit projection: never images, barcodes, QR codes, seats or ticket credentials.
      matchdayTicket: row.share_ticket && row.fixture_id ? { fixtureId: row.fixture_id, stadium: row.stadium } : null,
    })), serverNow: now });
  }
  return json({ error: "Not found." }, 404);
}
