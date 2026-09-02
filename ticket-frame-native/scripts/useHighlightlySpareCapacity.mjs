import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const secretsPath = resolve(root, ".ticket-frame-api-secrets");
const cachePath = resolve(root, "data/highlightlyProviderCache.json");
const reserve = Number(process.env.HIGHLIGHTLY_SPARE_RESERVE ?? 35);
const maxCalls = Number(process.env.HIGHLIGHTLY_SPARE_MAX_CALLS ?? 70);
const refreshFaRounds = process.argv.includes("--refresh-fa-rounds");

const secrets = Object.fromEntries(
  readFileSync(secretsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const split = line.indexOf("=");
      return [line.slice(0, split), line.slice(split + 1)];
    }),
);
if (!secrets.HIGHLIGHTLY_API_KEY) throw new Error("HIGHLIGHTLY_API_KEY missing");

const output = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, "utf8"))
  : { schemaVersion: 1, source: "highlightly", plan: "BASIC", competitions: {} };
output.backfillState ??= {};

const cupDefinitions = [
  ["FA Cup", 39079, [2019, 2020, 2021, 2022, 2023, 2024, 2025]],
  ["League Cup", 41632, [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]],
  ["EFL Trophy", 39930, [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]],
  ["FA Trophy", 40781, [2020, 2021, 2022, 2023, 2024, 2025, 2026]],
  ["Community Shield", 450112, [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]],
  ["National League Cup", 984540, [2024, 2025, 2026]],
  ["Scottish Cup", 154815, [2019, 2020, 2021, 2022, 2023, 2024, 2025]],
  ["Scottish League Cup", 158219, [2020, 2021, 2022, 2023, 2024, 2025, 2026]],
  ["Scottish Challenge Cup", 155666, [2021, 2022, 2023, 2024, 2025, 2026]],
];
const taskKey = ([competition, leagueId, start]) => `${competition}|${leagueId}|${start}`;
const primaryCupTasks = [
  ["FA Cup", 39079, 2025],
  ["League Cup", 41632, 2026],
];
const historicalCupTasks = [];
for (const start of [2025, 2024, 2023, 2022, 2021, 2020, 2019]) {
  for (const [competition, leagueId, seasons] of cupDefinitions) {
    if (seasons.includes(start)) historicalCupTasks.push([competition, leagueId, start]);
  }
}
const currentCupTasks = cupDefinitions
  .filter(([, , seasons]) => seasons.includes(2026))
  .map(([competition, leagueId]) => [competition, leagueId, 2026]);
const seenCupTasks = new Set();
const cupTasks = [...primaryCupTasks, ...historicalCupTasks, ...currentCupTasks]
  .filter((task) => {
    const key = taskKey(task);
    if (seenCupTasks.has(key)) return false;
    seenCupTasks.add(key);
    return true;
  });
const leagueDefinitions = [
  ["Championship", 34824],
  ["League One", 35675],
  ["League Two", 36526],
  ["National League", 37377],
  ["Scottish Premiership", 153113],
  ["Scottish Championship", 153964],
  ["Scottish League One", 156517],
  ["Scottish League Two", 157368],
  // Premier League history never outranks lower-league or Scottish history.
  ["Premier League", 33973],
];

const seasonLabel = (start) => `${start}-${start + 1}`;
const normalStatus = (value) => String(value ?? "SCHEDULED")
  .replace(/[^a-z0-9]+/gi, "_").toUpperCase();
const parseScore = (value) => {
  const match = String(value ?? "").match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  return match ? [Number(match[1]), Number(match[2])] : [null, null];
};

function mapFixture(match, competition, start) {
  const [homeScore, awayScore] = parseScore(match.state?.score?.current);
  const finished = normalStatus(match.state?.description) === "FINISHED";
  return {
    id: `highlightly:${match.id}`,
    providerId: String(match.id),
    date: match.date?.slice(0, 10) ?? null,
    kickoff: match.date ?? null,
    round: match.round ?? null,
    homeId: String(match.homeTeam?.id ?? ""),
    awayId: String(match.awayTeam?.id ?? ""),
    homeName: match.homeTeam?.name ?? "",
    awayName: match.awayTeam?.name ?? "",
    homeScore,
    awayScore,
    halfTimeHomeScore: null,
    halfTimeAwayScore: null,
    fullTimeHomeScore: finished ? homeScore : null,
    fullTimeAwayScore: finished ? awayScore : null,
    status: normalStatus(match.state?.description),
    season: seasonLabel(start),
    competition,
    venue: null,
    attendance: null,
    homeScorers: [],
    awayScorers: [],
  };
}

function save() {
  output.generatedAt = new Date().toISOString();
  if (remaining != null) {
    output.rateLimitRemaining = remaining;
    output.rateLimitObservedAt = new Date().toISOString();
  }
  writeFileSync(cachePath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

let calls = 0;
let remaining = null;
async function request(path, params = {}) {
  if (calls >= maxCalls) return null;
  const url = new URL(`https://soccer.highlightly.net${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  calls += 1;
  const response = await fetch(url, {
    headers: { Accept: "application/json", "x-rapidapi-key": secrets.HIGHLIGHTLY_API_KEY },
  });
  const body = await response.json().catch(() => null);
  remaining = Number(response.headers.get("x-ratelimit-requests-remaining"));
  if (!response.ok) throw new Error(`Highlightly ${path} failed (${response.status})`);
  if (body?.plan?.tier && body.plan.tier !== "BASIC") throw new Error("Highlightly plan changed");
  return body;
}

const mayContinue = () => calls < maxCalls && (remaining == null || remaining > reserve);

async function backfillList(competition, leagueId, start, category) {
  const key = `${category}:${leagueId}:${start}`;
  const state = output.backfillState[key] ?? { nextOffset: 0, totalCount: null, complete: false };
  if (state.complete) return;
  const label = seasonLabel(start);
  output.competitions[competition] ??= {};
  const bundle = output.competitions[competition][label] ??= { fixtures: [], table: [] };

  while (mayContinue() && !state.complete) {
    const body = await request("/matches", {
      leagueId,
      season: start,
      limit: 100,
      offset: state.nextOffset,
      timezone: "Europe/London",
    });
    if (!body) break;
    const page = body.data ?? [];
    const byId = new Map(bundle.fixtures.map((row) => [String(row.providerId), row]));
    for (const row of page) byId.set(String(row.id), mapFixture(row, competition, start));
    bundle.fixtures = [...byId.values()];
    state.totalCount = Number(body.pagination?.totalCount ?? bundle.fixtures.length);
    state.nextOffset += page.length;
    state.complete = page.length === 0 || state.nextOffset >= state.totalCount;
    if (
      state.complete &&
      (competition === "FA Cup" || competition === "Scottish Cup")
    ) {
      bundle.fixtures = bundle.fixtures.filter((fixture) => {
        const round = String(fixture.round ?? "");
        return !/qualif|prelim/i.test(round);
      });
    }
    output.backfillState[key] = state;
    save();
    console.log(`${competition} ${label}: ${bundle.fixtures.length}/${state.totalCount}`);
  }
}

if (refreshFaRounds) {
  delete output.backfillState["cup:39079:2025"];
}

for (const [competition, leagueId, start] of cupTasks) {
  if (mayContinue()) {
    await backfillList(competition, leagueId, start, "cup");
  }
}

// Match detail supplies timestamped goal events. Use it only after cup pages,
// and only for finished 2026/27 matches still missing a half-time breakdown.
async function enrichCurrentScoreBreakdowns() {
  const candidates = [];
  for (const seasons of Object.values(output.competitions ?? {})) {
    const bundle = seasons?.["2026-2027"];
    for (const fixture of bundle?.fixtures ?? []) {
      if (
        fixture.status === "FINISHED" &&
        fixture.halfTimeHomeScore == null &&
        fixture.providerId
      ) candidates.push(fixture);
    }
  }

  for (const fixture of candidates) {
    if (!mayContinue()) break;
    const body = await request(`/matches/${fixture.providerId}`);
    const detail = Array.isArray(body) ? body[0] : body;
    const firstHalf = (detail?.events ?? []).filter((event) => {
      const minute = Number.parseInt(String(event.time ?? ""), 10);
      return Number.isFinite(minute) && minute <= 45;
    });
    const ambiguousOwnGoal = firstHalf.some((event) => /own goal/i.test(event.type ?? ""));
    if (!ambiguousOwnGoal) {
      let home = 0;
      let away = 0;
      for (const event of firstHalf) {
        if (!/^goal$|penalty goal/i.test(event.type ?? "")) continue;
        if (String(event.team?.id ?? "") === String(fixture.homeId)) home += 1;
        if (String(event.team?.id ?? "") === String(fixture.awayId)) away += 1;
      }
      fixture.halfTimeHomeScore = home;
      fixture.halfTimeAwayScore = away;
    }
    fixture.observedAt = new Date().toISOString();
    save();
  }
}

if (mayContinue()) await enrichCurrentScoreBreakdowns();

// Once cup work is complete, use future spare calls for league history newest first.
for (const start of [2025, 2024, 2023, 2022, 2021, 2020, 2019]) {
  for (const [competition, leagueId] of leagueDefinitions) {
    if (mayContinue()) await backfillList(competition, leagueId, start, "league");
  }
}

save();
console.log(`Highlightly spare-capacity pass: ${calls} calls; ${remaining ?? "unknown"} remaining; reserve ${reserve}`);
