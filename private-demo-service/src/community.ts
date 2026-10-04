import {
  eligible,
  validCoordinates,
  type VerifiedFixture,
} from "../../lib/community/eligibility";
import { AVATARS } from "../../lib/community/model";
import { verifyCommunitySession } from "./auth";

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

const EUROPEAN_COMPETITION =
  /champions league|european cup|europa league|uefa cup|conference league|cup winners|fairs cup|intertoto/i;

function trustedExperienceFixture(
  fixture: VerifiedFixture | undefined,
  clubId: string,
) {
  return !!(
    fixture &&
    Array.isArray(fixture.clubIds) &&
    fixture.clubIds.includes(clubId) &&
    typeof fixture.kickoff === "string" &&
    /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(fixture.kickoff) &&
    fixture.stadium &&
    validCoordinates(fixture.latitude, fixture.longitude) &&
    Number.isFinite(Date.parse(fixture.kickoff))
  );
}

function experienceReminderAllowed(
  fixture: VerifiedFixture,
  clubId: string,
  supporter: string,
  hours: number,
) {
  if ([1, 2, 4, 8].includes(hours)) return true;

  if (![24, 48, 60].includes(hours)) return false;

  // Long reminders are fail-closed. The user's Home/Away selection
  // alone is never sufficient: trusted fixture data must independently
  // prove that their club is away in a recognised European competition.
  return (
    supporter === "away" &&
    fixture.awayClubId === clubId &&
    typeof fixture.competition === "string" &&
    EUROPEAN_COMPETITION.test(fixture.competition)
  );
}
function experienceExpiry(
  fixture: VerifiedFixture,
  clubId: string,
  now: number,
) {
  if (
    !fixture ||
    !Array.isArray(fixture.clubIds) ||
    !fixture.clubIds.includes(clubId) ||
    typeof fixture.kickoff !== "string" ||
    !fixture.stadium ||
    !validCoordinates(fixture.latitude, fixture.longitude)
  ) {
    return null;
  }

  const match = fixture.kickoff.match(
    /^(\d{4})-(\d{2})-(\d{2})T.*(Z|([+-])(\d{2}):(\d{2}))$/,
  );
  if (!match) return null;

  const kickoff = Date.parse(fixture.kickoff);
  if (!Number.isFinite(kickoff)) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  let offsetMinutes = 0;
  if (match[4] !== "Z") {
    const sign = match[5] === "-" ? -1 : 1;
    const hours = Number(match[6]);
    const minutes = Number(match[7]);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours > 23 ||
      minutes > 59
    ) {
      return null;
    }

    offsetMinutes = sign * (hours * 60 + minutes);
  }

  // 00:00 in the fixture's own offset, expressed as UTC milliseconds.
  const opensAt =
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) -
    offsetMinutes * 60000;

  // Preserve the original Ticket Frame initial lifecycle:
  // first close prompt kickoff +3h, automatic stop eight hours later.
  const expiresAt = kickoff + 11 * 60 * 60 * 1000;

  if (now < opensAt || now >= expiresAt) return null;

  return expiresAt;
}
function validExperienceLocation(data: {
  latitude?: unknown;
  longitude?: unknown;
  accuracy?: unknown;
}) {
  return (
    typeof data.latitude === "number" &&
    typeof data.longitude === "number" &&
    typeof data.accuracy === "number" &&
    validCoordinates(data.latitude, data.longitude) &&
    Number.isFinite(data.accuracy) &&
    data.accuracy >= 0 &&
    data.accuracy <= 500
  );
}

export async function communityFetch(request: Request, env: CommunityEnv): Promise<Response> {
 try {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in required." }, 401);

  let identity: {
    subject?: string;
    communityEligible?: boolean;
    isChild?: boolean;
  } | null = null;

  if (env.COMMUNITY_AUTH) {
    const session = await env.COMMUNITY_AUTH.fetch(
      new Request("https:" + "//session.internal/verify", {
        headers: { authorization },
      }),
    );

    if (session.ok) {
      identity = await session.json() as {
        subject?: string;
        communityEligible?: boolean;
        isChild?: boolean;
      };
    }
  } else {
    identity = await verifyCommunitySession(request, env);
  }

  if (!identity) return json({ error: "Sign in required." }, 401);

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

  // Community activity is separate from authentication sessions,
  // stadium presence and location sharing. Only accepted friends
  // receive the coarse activeNow boolean.
  const ACTIVE_NOW_MS = 5 * 60 * 1000;

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
      sql("DELETE FROM community_matchday_experience_sessions WHERE member_id = ?", id),
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
      // Location privacy and Community membership are separate:
      // - location off: keep Experience, erase its optional GPS snapshot
      // - Community off: remove the server-side Community Experience
      sql(
        `UPDATE community_matchday_experience_sessions
         SET latitude=CASE WHEN ?=0 THEN NULL ELSE latitude END,
             longitude=CASE WHEN ?=0 THEN NULL ELSE longitude END,
             accuracy=CASE WHEN ?=0 THEN NULL ELSE accuracy END,
             updated_at=?
         WHERE member_id=?`,
        +locationVisible,
        +locationVisible,
        +locationVisible,
        now,
        me.id,
      ),
      sql(
        `DELETE FROM community_matchday_experience_sessions
         WHERE member_id=? AND ?=0`,
        me.id,
        +enabled,
      ),


    ]);

    me = await sql("SELECT * FROM community_members WHERE id=?", me.id).first<Member>();
    return json(state());
  }
  if (path === "/presence" && request.method === "DELETE") {
    await sql("DELETE FROM community_presence WHERE member_id=?", me.id).run();
    return json({ ok: true });
  }
  if (!me.enabled) fail("Enable Community first.", 403);

  if (path === "/activity" && request.method === "POST") {
    await sql(
      `INSERT INTO community_activity(member_id,last_active_at)
       VALUES(?,?)
       ON CONFLICT(member_id) DO UPDATE SET
         last_active_at=excluded.last_active_at`,
      me.id,
      now,
    ).run();

    // Never return the private activity timestamp.
    return json({ ok: true });
  }

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
  if (path === "/experience" && request.method === "GET") {
    const experience = await sql(
      `SELECT fixture_id,stadium,supporter,latitude,longitude,accuracy,
              started_at,updated_at,expires_at
       FROM community_matchday_experience_sessions
       WHERE member_id=? AND expires_at>?`,
      me.id,
      now,
    ).first<{
      fixture_id: string;
      stadium: string;
      supporter: "home" | "away";
      latitude: number | null;
      longitude: number | null;
      accuracy: number | null;
      started_at: number;
      updated_at: number;
      expires_at: number;
    }>();

    return json({
      experience: experience
        ? {
            fixtureId: experience.fixture_id,
            stadium: experience.stadium,
            supporter: experience.supporter,
            latitude: experience.latitude,
            longitude: experience.longitude,
            accuracy: experience.accuracy,
            startedAt: experience.started_at,
            updatedAt: experience.updated_at,
            expiresAt: experience.expires_at,
          }
        : null,
      serverNow: now,
    });
  }

  if (path === "/experience" && request.method === "POST") {
    if (
      typeof data.fixtureId !== "string" ||
      !data.fixtureId
    ) {
      fail("Choose a verified fixture.");
    }

    if (
      data.supporter !== undefined &&
      data.supporter !== "home" &&
      data.supporter !== "away"
    ) {
      fail("Choose Home or Away.");
    }

    const supporter: "home" | "away" =
      data.supporter === "away" ? "away" : "home";

    // Starting Matchday Experience is not a location-sharing action.
    // A location snapshot is optional and is only accepted when the
    // supporter has separately enabled Community location visibility.
    const suppliedLocation =
      data.latitude !== undefined ||
      data.longitude !== undefined ||
      data.accuracy !== undefined;

    if (suppliedLocation && !me.location_visible) {
      fail("Enable matchday visibility before sharing location.", 403);
    }

    if (suppliedLocation && !validExperienceLocation(data)) {
      fail("Share a valid location.");
    }

    const fixture = (await fixtures()).find(
      f => f.id === data.fixtureId,
    );

    const expiresAt = fixture
      ? experienceExpiry(fixture, me.club_id, now)
      : null;

    if (!fixture || !expiresAt) {
      await sql(
        "DELETE FROM community_matchday_experience_sessions WHERE member_id=?",
        me.id,
      ).run();

      fail(
        "Matchday Experience is only available on the verified fixture calendar day.",
        403,
      );
    }

    await sql(
      `INSERT INTO community_matchday_experience_sessions(
         member_id,fixture_id,stadium,supporter,latitude,longitude,accuracy,
         started_at,updated_at,expires_at
       )
       VALUES(?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(member_id) DO UPDATE SET
         fixture_id=excluded.fixture_id,
         stadium=excluded.stadium,
         supporter=excluded.supporter,
         latitude=excluded.latitude,
         longitude=excluded.longitude,
         accuracy=excluded.accuracy,
         started_at=excluded.started_at,
         updated_at=excluded.updated_at,
         expires_at=excluded.expires_at`,
      me.id,
      fixture.id,
      fixture.stadium,
      supporter,
      suppliedLocation ? data.latitude : null,
      suppliedLocation ? data.longitude : null,
      suppliedLocation ? data.accuracy : null,
      now,
      now,
      expiresAt,
    ).run();

    return json({
      experience: {
        fixtureId: fixture.id,
        stadium: fixture.stadium,
        supporter,
        latitude: suppliedLocation ? data.latitude : null,
        longitude: suppliedLocation ? data.longitude : null,
        accuracy: suppliedLocation ? data.accuracy : null,
        startedAt: now,
        updatedAt: now,
        expiresAt,
      },
      serverNow: now,
    });
  }

  if (
    path === "/experience/location" &&
    request.method === "POST"
  ) {
    if (!me.location_visible) {
      fail("Enable matchday visibility first.", 403);
    }

    if (!validExperienceLocation(data)) {
      fail("Share a valid location.");
    }

    const current = await sql(
      `SELECT fixture_id,supporter,expires_at
       FROM community_matchday_experience_sessions
       WHERE member_id=? AND expires_at>?`,
      me.id,
      now,
    ).first<{
      fixture_id: string;
      supporter: "home" | "away";
      expires_at: number;
    }>();

    if (!current) {
      fail("Start Matchday Experience first.", 409);
    }

    const fixture = (await fixtures()).find(
      f => f.id === current.fixture_id,
    );

    if (!trustedExperienceFixture(fixture, me.club_id)) {
      await sql(
        "DELETE FROM community_matchday_experience_sessions WHERE member_id=?",
        me.id,
      ).run();

      fail("This Matchday Experience is no longer verified.", 403);
    }

    // trustedExperienceFixture() above fails closed for missing fixtures.
    // Keep an explicit narrowed reference for TypeScript.
    const verifiedFixture = fixture!;

    // Updating the optional map snapshot must NEVER shorten a
    // reminder-extended Matchday Experience.
    await sql(
      `UPDATE community_matchday_experience_sessions
       SET latitude=?,longitude=?,accuracy=?,updated_at=?
       WHERE member_id=? AND fixture_id=?`,
      data.latitude,
      data.longitude,
      data.accuracy,
      now,
      me.id,
      verifiedFixture.id,
    ).run();

    return json({
      experience: {
        fixtureId: verifiedFixture.id,
        stadium: verifiedFixture.stadium,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        updatedAt: now,
        expiresAt: current.expires_at,
      },
      serverNow: now,
    });
  }

  if (
    path === "/experience/reminder" &&
    request.method === "POST"
  ) {
    if (
      typeof data.hours !== "number" ||
      !Number.isInteger(data.hours)
    ) {
      fail("Choose a valid reminder.");
    }

    const current = await sql(
      `SELECT fixture_id,supporter,expires_at
       FROM community_matchday_experience_sessions
       WHERE member_id=? AND expires_at>?`,
      me.id,
      now,
    ).first<{
      fixture_id: string;
      supporter: "home" | "away";
      expires_at: number;
    }>();

    if (!current) {
      fail("Start Matchday Experience first.", 409);
    }

    const fixture = (await fixtures()).find(
      f => f.id === current.fixture_id,
    );

    if (!trustedExperienceFixture(fixture, me.club_id)) {
      await sql(
        "DELETE FROM community_matchday_experience_sessions WHERE member_id=?",
        me.id,
      ).run();

      fail("This Matchday Experience is no longer verified.", 403);
    }

    if (
      !experienceReminderAllowed(
        fixture!,
        me.club_id,
        current.supporter,
        data.hours,
      )
    ) {
      fail("That reminder is not available for this fixture.", 403);
    }

    // Canonical Ticket Frame behaviour:
    // reminder = now + selected delay
    // automatic stop = reminder + 8 hours.
    const requestedAt =
      now + data.hours * 60 * 60 * 1000;

    const expiresAt =
      requestedAt + 8 * 60 * 60 * 1000;

    await sql(
      `UPDATE community_matchday_experience_sessions
       SET updated_at=?,expires_at=?
       WHERE member_id=? AND fixture_id=?`,
      now,
      expiresAt,
      me.id,
      fixture!.id,
    ).run();

    return json({
      experience: {
        fixtureId: fixture!.id,
        supporter: current.supporter,
        reminderHours: data.hours,
        reminderAt: requestedAt,
        expiresAt,
      },
      serverNow: now,
    });
  }

  if (path === "/experience" && request.method === "DELETE") {
    await sql(
      "DELETE FROM community_matchday_experience_sessions WHERE member_id=?",
      me.id,
    ).run();

    return json({ ok: true });
  }

  // Social discovery during Matchday Experience is deliberately
  // separate from location discovery. An active shared Experience
  // is enough; neither supporter has to share GPS or join a map.
  if (
    path === "/experience/supporters" &&
    request.method === "GET"
  ) {
    const rows = (
      await sql(
        `SELECT m.*
         FROM community_matchday_experience_sessions own
         JOIN community_matchday_experience_sessions peer
           ON peer.fixture_id=own.fixture_id
         JOIN community_members m
           ON m.id=peer.member_id
         WHERE own.member_id=?
         AND own.expires_at>?
         AND peer.expires_at>?
         AND peer.member_id<>?
         AND m.club_id=?
         AND m.enabled=1
         AND NOT EXISTS (
           SELECT 1 FROM community_blocks b
           WHERE
             (b.blocker=? AND b.blocked=m.id)
             OR
             (b.blocked=? AND b.blocker=m.id)
         )
         AND NOT EXISTS (
           SELECT 1 FROM community_relationships r
           WHERE
             (r.sender=? AND r.recipient=m.id)
             OR
             (r.recipient=? AND r.sender=m.id)
         )
         ORDER BY m.display_name COLLATE NOCASE
         LIMIT 100`,
        me.id,
        now,
        now,
        me.id,
        me.club_id,
        me.id,
        me.id,
        me.id,
        me.id,
      ).all<Member>()
    ).results;

    return json({
      people: rows.map(row => ({
        profile: publicProfile(row),
      })),
      serverNow: now,
    });
  }

  if (
    path === "/experience/discover" &&
    request.method === "GET"
  ) {
    if (!me.location_visible) {
      fail("Enable matchday visibility first.", 403);
    }

    const rows = (
      await sql(
        `SELECT m.*, peer.fixture_id,peer.stadium,
                peer.latitude,peer.longitude,
                peer.updated_at,peer.expires_at
         FROM community_matchday_experience_sessions own
         JOIN community_matchday_experience_sessions peer
           ON peer.fixture_id=own.fixture_id
         JOIN community_members m
           ON m.id=peer.member_id
         WHERE own.member_id=?
         AND own.expires_at>?
         AND peer.expires_at>?
         -- Experience membership does not imply location sharing.
         -- Both sides must have explicitly supplied a location snapshot
         -- before the Experience location-discovery view is available.
         AND own.latitude IS NOT NULL
         AND own.longitude IS NOT NULL
         AND peer.latitude IS NOT NULL
         AND peer.longitude IS NOT NULL
         AND peer.member_id<>?
         AND m.club_id=?
         AND m.enabled=1
         AND m.location_visible=1
         AND NOT EXISTS (
           SELECT 1 FROM community_blocks b
           WHERE
             (b.blocker=? AND b.blocked=m.id)
             OR
             (b.blocked=? AND b.blocker=m.id)
         )
         LIMIT 100`,
        me.id,
        now,
        now,
        me.id,
        me.club_id,
        me.id,
        me.id,
      ).all<
        Member & {
          fixture_id: string;
          stadium: string;
          latitude: number;
          longitude: number;
          updated_at: number;
          expires_at: number;
        }
      >()
    ).results;

    return json({
      people: rows.map(row => ({
        profile: publicProfile(row),
        fixtureId: row.fixture_id,
        stadium: row.stadium,
        latitude: row.latitude,
        longitude: row.longitude,
        updatedAt: row.updated_at,
        expiresAt: row.expires_at,
      })),
      serverNow: now,
    });
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
  async function visibleMembers(
    mapOnly = false,
    excludeRelationships = false,
  ) {
    return (await sql(`SELECT m.*, p.stadium, p.stadium_lat, p.stadium_lon, p.expires_at FROM community_members m
      JOIN community_presence p ON p.member_id=m.id
      JOIN community_presence own ON own.member_id=? AND own.fixture_id=p.fixture_id
      WHERE m.id<>? AND m.club_id=? AND m.enabled=1 AND m.location_visible=1
      AND p.expires_at>? AND own.expires_at>? AND (?=0 OR p.on_map=1)
      AND NOT EXISTS (
        SELECT 1 FROM community_blocks b
        WHERE
          (b.blocker=? AND b.blocked=m.id)
          OR
          (b.blocked=? AND b.blocker=m.id)
      )
      AND (?=0 OR NOT EXISTS (
        SELECT 1 FROM community_relationships r
        WHERE
          (r.sender=? AND r.recipient=m.id)
          OR
          (r.recipient=? AND r.sender=m.id)
      ))
      LIMIT 100`,
      me!.id,
      me!.id,
      me!.club_id,
      now,
      now,
      +mapOnly,
      me!.id,
      me!.id,
      +excludeRelationships,
      me!.id,
      me!.id,
    ).all<Member & {
      stadium: string;
      stadium_lat: number;
      stadium_lon: number;
      expires_at: number;
    }>()).results;
  }

  if (
    (path === "/map" || path === "/discover") &&
    request.method === "GET"
  ) {
    if (!me.location_visible) {
      fail("Enable matchday visibility first.", 403);
    }

    const mapRequest = path === "/map";

    const rows = await visibleMembers(
      mapRequest,
      !mapRequest,
    );

    // Nearby Supporters is social discovery. It needs only the
    // public supporter profile; stadium coordinates belong to
    // the separately opted-in map surface.
    if (!mapRequest) {
      return json({
        people: rows.map(row => ({
          profile: publicProfile(row),
        })),
        serverNow: now,
      });
    }

    return json({
      people: rows.map(row => ({
        profile: publicProfile(row),
        stadium: row.stadium,
        latitude: row.stadium_lat,
        longitude: row.stadium_lon,
        expiresAt: row.expires_at,
      })),
      serverNow: now,
    });
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
    let result = await sql(`INSERT OR IGNORE INTO community_relationships
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
      result = await sql(
        `INSERT OR IGNORE INTO community_relationships
           (id,sender,recipient,status,friend_type)
         SELECT ?,?,m.id,'pending',?
         FROM community_members m
         WHERE m.id=?
         AND ${peerGuard}
         AND EXISTS (
           SELECT 1
           FROM community_matchday_experience_sessions own
           JOIN community_matchday_experience_sessions peer
             ON peer.fixture_id=own.fixture_id
           WHERE own.member_id=?
           AND peer.member_id=m.id
           AND own.expires_at>?
           AND peer.expires_at>?
         )`,
        relationshipId,
        me.id,
        data.friendType,
        data.target,
        me.club_id,
        me.id,
        me.id,
        me.id,
        now,
        now,
      ).run();
    }

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

     if (live) return true;

    const experience = await sql(
      `SELECT 1 ok
       FROM community_matchday_experience_sessions own
       JOIN community_matchday_experience_sessions peer
         ON peer.fixture_id=own.fixture_id
       WHERE own.member_id=?
       AND peer.member_id=?
       AND own.expires_at>?
       AND peer.expires_at>?
       LIMIT 1`,
      me!.id,
      friend.id,
      now,
      now,
    ).first();

    return Boolean(experience);
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
      (SELECT activity.last_active_at
       FROM community_activity activity
       WHERE activity.member_id=m.id) last_active_at,
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
       last_active_at: number | null;
     }>()).results;

     const conversations = await Promise.all(rows.map(async row => ({
       friend: publicProfile(row),
       unread: Number(row.unread || 0),
       friendType: row.friend_type,
       canMessage: await canMessageFriend(row),
      activeNow:
        typeof row.last_active_at === "number" &&
        row.last_active_at >= now - ACTIVE_NOW_MS,
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
