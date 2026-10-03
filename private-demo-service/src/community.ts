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
  // Feature routes are added in independently checkpointed stages.
  return json({ error: "Community route not found." }, 404);
 } catch (error) {
  const known = error as Error & { status?: number };
  return json({ error: known.status ? known.message : "Community is unavailable. Please try again." }, known.status || 500);
 }
}
