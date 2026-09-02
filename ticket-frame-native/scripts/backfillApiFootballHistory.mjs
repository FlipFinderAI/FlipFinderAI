import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();

const secretsPath = resolve(root, ".ticket-frame-api-secrets");
const tfdPath = resolve(root, "data/matchDatabase.json");
const cachePath = resolve(root, "data/apiFootballHistoricalCache.json");

const DAILY_LIMIT = 100;
const SAFETY_RESERVE = 5;
const MAX_CALLS = 90; // conservative cap for today

/*
 * API-Football league IDs:
 * 39 Premier League
 * 40 Championship
 * 41 League One
 * 42 League Two
 *
 * API-Football season is the starting year:
 * 2024 = 2024/25
 * 2023 = 2023/24
 * 2022 = 2022/23
 */
const supplementalTargets = [
  // English leagues
  { season: 2024, label: "2024-2025", leagueId: 39, competition: "Premier League" },
  { season: 2024, label: "2024-2025", leagueId: 40, competition: "Championship" },
  { season: 2024, label: "2024-2025", leagueId: 41, competition: "League One" },
  { season: 2024, label: "2024-2025", leagueId: 42, competition: "League Two" },

  { season: 2023, label: "2023-2024", leagueId: 39, competition: "Premier League" },
  { season: 2023, label: "2023-2024", leagueId: 40, competition: "Championship" },
  { season: 2023, label: "2023-2024", leagueId: 41, competition: "League One" },
  { season: 2023, label: "2023-2024", leagueId: 42, competition: "League Two" },

  { season: 2022, label: "2022-2023", leagueId: 39, competition: "Premier League" },
  { season: 2022, label: "2022-2023", leagueId: 40, competition: "Championship" },
  { season: 2022, label: "2022-2023", leagueId: 41, competition: "League One" },
  { season: 2022, label: "2022-2023", leagueId: 42, competition: "League Two" },

  // English domestic cups
  { season: 2025, label: "2025-2026", leagueId: 45, competition: "FA Cup" },
  { season: 2025, label: "2025-2026", leagueId: 48, competition: "League Cup" },
  { season: 2025, label: "2025-2026", leagueId: 46, competition: "EFL Trophy" },
  { season: 2025, label: "2025-2026", leagueId: 528, competition: "Community Shield" },

  { season: 2024, label: "2024-2025", leagueId: 45, competition: "FA Cup" },
  { season: 2024, label: "2024-2025", leagueId: 48, competition: "League Cup" },
  { season: 2024, label: "2024-2025", leagueId: 46, competition: "EFL Trophy" },
  { season: 2024, label: "2024-2025", leagueId: 528, competition: "Community Shield" },

  // UEFA cups
  { season: 2025, label: "2025-2026", leagueId: 2, competition: "UEFA Champions League" },
  { season: 2025, label: "2025-2026", leagueId: 3, competition: "UEFA Europa League" },
  { season: 2025, label: "2025-2026", leagueId: 848, competition: "UEFA Conference League" },
  { season: 2025, label: "2025-2026", leagueId: 531, competition: "UEFA Super Cup" },

  { season: 2024, label: "2024-2025", leagueId: 2, competition: "UEFA Champions League" },
  { season: 2024, label: "2024-2025", leagueId: 3, competition: "UEFA Europa League" },
  { season: 2024, label: "2024-2025", leagueId: 848, competition: "UEFA Conference League" },
  { season: 2024, label: "2024-2025", leagueId: 531, competition: "UEFA Super Cup" },

  // Scottish domestic cups
  { season: 2025, label: "2025-2026", leagueId: 181, competition: "Scottish Cup" },
  { season: 2025, label: "2025-2026", leagueId: 185, competition: "Scottish League Cup" },
  { season: 2025, label: "2025-2026", leagueId: 182, competition: "Scottish Challenge Cup" },

  { season: 2024, label: "2024-2025", leagueId: 181, competition: "Scottish Cup" },
  { season: 2024, label: "2024-2025", leagueId: 185, competition: "Scottish League Cup" },
  { season: 2024, label: "2024-2025", leagueId: 182, competition: "Scottish Challenge Cup" },
];

// Generic senior-league history coverage. Newest seasons are attempted first;
// the cache and daily quota stop make this safely resumable across days.
const seniorLeagues = [
  { leagueId: 39, competition: "Premier League" },
  { leagueId: 40, competition: "Championship" },
  { leagueId: 41, competition: "League One" },
  { leagueId: 42, competition: "League Two" },
];
const leagueHistoryTargets = Array.from(
  { length: 2025 - 1999 + 1 },
  (_, index) => 2025 - index,
).flatMap((season) =>
  seniorLeagues.map((league) => ({
    season,
    label: `${season}-${season + 1}`,
    ...league,
  })),
);
const targets = [
  ...leagueHistoryTargets,
  ...supplementalTargets.filter(
    (target) => !seniorLeagues.some((league) => league.leagueId === target.leagueId),
  ),
];

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function saveJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalise(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^(afc|fc)\s+/i, "")
    .replace(/\s+(afc|fc|football club)$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^milton keynes dons$/, "mk dons");
}

function readSecrets() {
  if (!existsSync(secretsPath)) {
    throw new Error("Missing .ticket-frame-api-secrets");
  }

  return Object.fromEntries(
    readFileSync(secretsPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      }),
  );
}

function tfdMatches(tfd, competition, season) {
  return tfd.competitions?.[competition]?.[season]?.fixtures ?? [];
}

function matchTfdFixture(tfd, target, apiRow) {
  const date = String(apiRow.fixture?.date ?? "").slice(0, 10);
  const home = normalise(apiRow.teams?.home?.name);
  const away = normalise(apiRow.teams?.away?.name);

  return tfdMatches(tfd, target.competition, target.label).find((m) =>
    String(m.date ?? m.kickoff ?? "").slice(0, 10) === date &&
    normalise(m.homeName) === home &&
    normalise(m.awayName) === away
  );
}

function scorerArrays(events, homeTeamId, awayTeamId) {
  const homeScorers = [];
  const awayScorers = [];

  for (const event of events ?? []) {
    if (event.type !== "Goal") continue;

    const name = event.player?.name;
    if (!name) continue;

    const minute =
      event.time?.elapsed == null
        ? null
        : event.time.extra
          ? `${event.time.elapsed}+${event.time.extra}`
          : String(event.time.elapsed);

    const scorer = {
      name,
      minute,
      detail: event.detail ?? null,
    };

    if (event.team?.id === homeTeamId) homeScorers.push(scorer);
    if (event.team?.id === awayTeamId) awayScorers.push(scorer);
  }

  return { homeScorers, awayScorers };
}

function mapFixture(row, target, events = null) {
  const homeTeamId = row.teams?.home?.id ?? null;
  const awayTeamId = row.teams?.away?.id ?? null;

  const scorers =
    events == null
      ? { homeScorers: [], awayScorers: [] }
      : scorerArrays(events, homeTeamId, awayTeamId);

  const finishedStatuses = new Set([
    "FT", "AET", "PEN",
  ]);

  const statusShort = row.fixture?.status?.short ?? null;

  return {
    id: `api-football:${row.fixture?.id}`,
    providerId: String(row.fixture?.id ?? ""),
    date: String(row.fixture?.date ?? "").slice(0, 10) || null,
    kickoff: row.fixture?.date ?? null,

    homeId:
      homeTeamId == null ? null : `api-football:${homeTeamId}`,
    awayId:
      awayTeamId == null ? null : `api-football:${awayTeamId}`,

    homeName: row.teams?.home?.name ?? null,
    awayName: row.teams?.away?.name ?? null,

    homeScore:
      finishedStatuses.has(statusShort)
        ? row.goals?.home ?? null
        : null,

    awayScore:
      finishedStatuses.has(statusShort)
        ? row.goals?.away ?? null
        : null,

    halfTimeHomeScore: row.score?.halftime?.home ?? null,
    halfTimeAwayScore: row.score?.halftime?.away ?? null,
    fullTimeHomeScore:
      finishedStatuses.has(statusShort)
        ? row.score?.fulltime?.home ?? row.goals?.home ?? null
        : null,
    fullTimeAwayScore:
      finishedStatuses.has(statusShort)
        ? row.score?.fulltime?.away ?? row.goals?.away ?? null
        : null,

    status:
      finishedStatuses.has(statusShort)
        ? "FINISHED"
        : statusShort ?? null,

    season: target.label,
    competition: target.competition,

    venue: row.fixture?.venue?.name ?? null,
    attendance: null,

    homeScorers: scorers.homeScorers,
    awayScorers: scorers.awayScorers,
  };
}

async function api(path, key) {
  const response = await fetch(
    `https://v3.football.api-sports.io${path}`,
    {
      headers: {
        "x-apisports-key": key,
      },
    },
  );

  const body = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    body,
    remaining:
      response.headers.get("x-ratelimit-requests-remaining") ??
      response.headers.get("x-ratelimit-remaining"),
  };
}

const planOnly = process.argv.includes("--plan-only");

const tfd = loadJson(tfdPath, { competitions: {} });

const cache = loadJson(cachePath, {
  schemaVersion: 1,
  provider: "api-football/api-sports",
  generatedAt: null,
  accessPolicy:
    "Free-plan historical enrichment only for provider-authorised seasons. Cached data is reused and completed work is not repeatedly fetched.",
  seasons: {},
  requests: {
    totalRecorded: 0,
    lastRun: null,
  },
});

console.log("===== API-FOOTBALL HISTORICAL BACKFILL =====");
console.log("Daily limit:", DAILY_LIMIT);
console.log("Safety reserve:", SAFETY_RESERVE);
console.log("Maximum calls this run:", MAX_CALLS);

let estimatedSeasonCalls = 0;
let estimatedEventCandidates = 0;

for (const target of targets) {
  const key = `${target.leagueId}:${target.season}`;

  const alreadySynced =
    cache.seasons?.[key]?.fixtureListComplete === true;

  const existingTfd = tfdMatches(
    tfd,
    target.competition,
    target.label,
  );

  const scorerGaps = existingTfd.filter(
    (m) =>
      m.homeScore != null &&
      m.awayScore != null &&
      !(m.homeScorers?.length || m.awayScorers?.length),
  ).length;

  if (!alreadySynced) estimatedSeasonCalls++;
  estimatedEventCandidates += scorerGaps;

  console.log(
    [
      target.label,
      target.competition,
      alreadySynced ? "league cached" : "needs league fetch",
      `${existingTfd.length} TFD matches`,
      `${scorerGaps} scorer gaps`,
    ].join(" | "),
  );
}

console.log("\nEstimated league-list calls still required:", estimatedSeasonCalls);
console.log("Potential scorer gaps:", estimatedEventCandidates);

if (planOnly) {
  console.log("\nPLAN ONLY — API-Football was NOT contacted.");
  process.exit(0);
}

const secrets = readSecrets();

if (!secrets.API_FOOTBALL_KEY) {
  throw new Error("API_FOOTBALL_KEY missing");
}

let callsUsed = 0;

/*
 * Stage 1:
 * Fetch each league-season exactly once.
 * Once cached, later daily runs skip it.
 */
for (const target of targets) {
  if (callsUsed >= MAX_CALLS) break;

  const key = `${target.leagueId}:${target.season}`;

  cache.seasons[key] ??= {
    competition: target.competition,
    season: target.label,
    leagueId: target.leagueId,
    apiSeason: target.season,
    fixtureListComplete: false,
    fixtures: {},
  };

  const seasonCache = cache.seasons[key];

  if (seasonCache.fixtureListComplete) continue;

  console.log(
    `Fetching ${target.label} ${target.competition}...`,
  );

  const result = await api(
    `/fixtures?league=${target.leagueId}&season=${target.season}`,
    secrets.API_FOOTBALL_KEY,
  );

  callsUsed++;

  if (result.remaining != null && Number(result.remaining) <= SAFETY_RESERVE) {
    console.log(`Provider quota safety stop: ${result.remaining} request(s) remaining.`);
    break;
  }

  if (!result.ok || Object.keys(result.body.errors ?? {}).length) {
    console.log(
      `Unavailable: ${target.competition} ${target.label}`,
      result.body.errors ?? result.status,
    );

    seasonCache.lastError =
      result.body.errors ?? `HTTP ${result.status}`;

    continue;
  }

  for (const row of result.body.response ?? []) {
    const providerId = String(row.fixture?.id ?? "");

    if (!providerId) continue;

    seasonCache.fixtures[providerId] ??= {
      rawFixture: row,
      eventsFetched: false,
      events: [],
    };

    seasonCache.fixtures[providerId].rawFixture = row;
  }

  seasonCache.fixtureListComplete = true;
  seasonCache.lastFetchedAt = new Date().toISOString();

  console.log(
    `Cached ${Object.keys(seasonCache.fixtures).length} fixtures.`,
  );
}

/*
 * Stage 2:
 * Spend remaining calls only on event/scorer details
 * that TFD does not already possess.
 *
 * Newest season first, PL -> Championship -> L1 -> L2.
 */
outer:
for (const target of targets) {
  const key = `${target.leagueId}:${target.season}`;
  const seasonCache = cache.seasons[key];

  if (!seasonCache?.fixtureListComplete) continue;

  for (const [providerId, record] of Object.entries(
    seasonCache.fixtures ?? {},
  )) {
    if (callsUsed >= MAX_CALLS) break outer;

    const row = record.rawFixture;
    if (!row) continue;

    const status = row.fixture?.status?.short;

    if (!["FT", "AET", "PEN"].includes(status)) continue;

    const existingTfd = matchTfdFixture(
      tfd,
      target,
      row,
    );

    const alreadyHasScorers =
      existingTfd &&
      (
        existingTfd.homeScorers?.length ||
        existingTfd.awayScorers?.length
      );

    if (alreadyHasScorers) continue;
    if (record.eventsFetched) continue;

    const result = await api(
      `/fixtures/events?fixture=${providerId}`,
      secrets.API_FOOTBALL_KEY,
    );

    callsUsed++;

    if (result.remaining != null && Number(result.remaining) <= SAFETY_RESERVE) {
      console.log(`Provider quota safety stop: ${result.remaining} request(s) remaining.`);
      break outer;
    }

    if (!result.ok || Object.keys(result.body.errors ?? {}).length) {
      record.eventsError =
        result.body.errors ?? `HTTP ${result.status}`;
      continue;
    }

    record.events = result.body.response ?? [];
    record.eventsFetched = true;
    record.eventsFetchedAt = new Date().toISOString();
  }
}

/*
 * Build normalized provider cache for TFD.
 */
const providerOutput = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "api-football/api-sports",
  accessPolicy:
    "Only provider-authorised free-plan historical data is included. Existing cached results are reused.",
  competitions: {},
};

for (const target of targets) {
  const key = `${target.leagueId}:${target.season}`;
  const seasonCache = cache.seasons[key];

  if (!seasonCache?.fixtureListComplete) continue;

  const fixtures = [];

  for (const record of Object.values(
    seasonCache.fixtures ?? {},
  )) {
    if (!record.rawFixture) continue;

    fixtures.push(
      mapFixture(
        record.rawFixture,
        target,
        record.eventsFetched ? record.events : null,
      ),
    );
  }

  providerOutput.competitions[target.competition] ??= {};
  providerOutput.competitions[target.competition][target.label] = {
    fixtures,
    table: [],
  };
}

cache.generatedAt = new Date().toISOString();
cache.requests.totalRecorded =
  (cache.requests.totalRecorded ?? 0) + callsUsed;

cache.requests.lastRun = {
  at: new Date().toISOString(),
  callsUsed,
};

saveJson(cachePath, cache);

saveJson(
  resolve(root, "data/apiFootballProviderCache.json"),
  providerOutput,
);

console.log("\n===== BACKFILL COMPLETE =====");
console.log("API calls used this run:", callsUsed);
console.log("Daily safety reserve retained:", SAFETY_RESERVE);
console.log(
  "Remaining work will automatically continue on the next run.",
);
