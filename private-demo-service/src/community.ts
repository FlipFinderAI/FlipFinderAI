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
 id: string; subject: string; display_name: string; avatar: string; club_id: string;
 games_attended: number; grounds_json: string; enabled: number; location_visible: number;
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
 status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});
function publicProfile(m: Member) {
 return { id: m.id, displayName: m.display_name, avatar: m.avatar, clubId: m.club_id,
 gamesAttended: m.games_attended, groundsVisited: JSON.parse(m.grounds_json) };
}
function fail(message: string, status = 400): never { throw Object.assign(new Error(message), { status }); }
export async function communityFetch(request: Request, env: CommunityEnv): Promise<Response> {
 try {
  if (!env.COMMUNITY_AUTH) return json({ error: "Community authentication is not configured." }, 503);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in required." }, 401);
  const session = await env.COMMUNITY_AUTH.fetch(new Request("https://session.internal/verify", { headers: { authorization } }));
  if (!session.ok) return json({ error: "Sign in required." }, 401);
  const identity = await session.json() as { subject?: string };
  if (!identity.subject || typeof identity.subject !== "string") return json({ error: "Sign in required." }, 401);
  const sql = (query: string, ...args: unknown[]) => env.DB.prepare(query).bind(...args);
  let me = await sql("SELECT * FROM community_members WHERE subject = ?", identity.subject).first<Member>();
  const path = new URL(request.url).pathname.replace("/api/community", "");
  const now = Date.now();
  const state = () => ({ profile: me ? publicProfile(me) : null, preferences: {
    enabled: Boolean(me?.enabled), locationVisible: Boolean(me?.location_visible) }, serverNow: now });
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
    await env.DB.batch([
      sql(`INSERT INTO community_members(id,subject,display_name,avatar,club_id,games_attended,grounds_json)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(subject) DO UPDATE SET display_name=excluded.display_name,
      avatar=excluded.avatar,club_id=excluded.club_id,games_attended=excluded.games_attended,grounds_json=excluded.grounds_json`,
      id, identity.subject, data.displayName.trim(), data.avatar, data.clubId, data.gamesAttended, JSON.stringify([...new Set(data.groundsVisited)])),
      sql("DELETE FROM community_presence WHERE member_id = ?", id),
    ]);
    me = await sql("SELECT * FROM community_members WHERE id = ?", id).first<Member>();
    return json(state());
  }
  if (!me) fail("Save your Community profile first.", 409);
  if (path === "/preferences" && request.method === "POST") {
    if (typeof data.enabled !== "boolean" || typeof data.locationVisible !== "boolean") fail("Invalid privacy options.");
    await env.DB.batch([
      sql("UPDATE community_members SET enabled=?,location_visible=? WHERE id=?", +data.enabled, +(data.enabled && data.locationVisible), me.id),
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
  // Feature routes are added in independently checkpointed stages.
  return json({ error: "Community route not found." }, 404);
 } catch (error) {
  const known = error as Error & { status?: number };
  return json({ error: known.status ? known.message : "Community is unavailable. Please try again." }, known.status || 500);
 }
}
