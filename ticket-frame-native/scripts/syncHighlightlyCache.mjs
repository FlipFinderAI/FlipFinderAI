import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const secretsPath = resolve(root, ".ticket-frame-api-secrets");
const outputPath = resolve(root, "data/highlightlyProviderCache.json");
const standingsOnly = process.argv.includes("--standings-only");
const seasonStart = Number(process.env.TFD_SEASON_START ?? 2026);
const season = `${seasonStart}-${seasonStart + 1}`;
const requestCeiling = Number(process.env.HIGHLIGHTLY_REQUEST_CEILING ?? 70);

const targets = [
  { competition: "Championship", leagueId: 34824 },
  { competition: "League One", leagueId: 35675 },
  { competition: "League Two", leagueId: 36526 },
  { competition: "National League", leagueId: 37377 },
  { competition: "Scottish Premiership", leagueId: 153113 },
  { competition: "Scottish Championship", leagueId: 153964 },
  { competition: "Scottish League One", leagueId: 156517 },
  { competition: "Scottish League Two", leagueId: 157368 },
  // Premier League is deliberately last: lower leagues and Scotland come first.
  { competition: "Premier League", leagueId: 33973 },
];

const previous = existsSync(outputPath)
  ? JSON.parse(readFileSync(outputPath, "utf8"))
  : { competitions: {} };

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
        const split = line.indexOf("=");
        return [line.slice(0, split).trim(), line.slice(split + 1).trim()];
      }),
  );
}

const secrets = readSecrets();
if (!secrets.HIGHLIGHTLY_API_KEY) {
  throw new Error("HIGHLIGHTLY_API_KEY is missing from .ticket-frame-api-secrets");
}

let requestsMade = 0;
let providerRemaining = null;
let receivedBasicConfirmation = false;

async function request(path, params) {
  if (requestsMade >= requestCeiling) {
    throw new Error(`Highlightly request ceiling ${requestCeiling} reached`);
  }

  const url = new URL(`https://soccer.highlightly.net${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  requestsMade += 1;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-rapidapi-key": secrets.HIGHLIGHTLY_API_KEY,
    },
  });
  const body = await response.json().catch(() => null);
  providerRemaining = response.headers.get("x-ratelimit-requests-remaining");

  if (!response.ok) {
    throw new Error(
      `Highlightly ${path} failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }

  const tier = body?.plan?.tier;
  if (tier && tier !== "BASIC") {
    throw new Error(`Expected Highlightly BASIC response, received ${tier}`);
  }
  if (tier === "BASIC") receivedBasicConfirmation = true;
  return body;
}

function status(description) {
  return String(description ?? "SCHEDULED")
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .toUpperCase();
}

function score(value) {
  const match = String(value ?? "").match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  return match ? [Number(match[1]), Number(match[2])] : [null, null];
}

function fixture(match, competition) {
  const [homeScore, awayScore] = score(match.state?.score?.current);
  const finished = status(match.state?.description) === "FINISHED";
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
    status: status(match.state?.description),
    season,
    competition,
    venue: null,
    attendance: null,
    homeScorers: [],
    awayScorers: [],
  };
}

function tableRow(entry) {
  const total = entry.total ?? {};
  const goalsFor = total.scoredGoals ?? 0;
  const goalsAgainst = total.receivedGoals ?? 0;
  return {
    teamId: String(entry.team?.id ?? ""),
    name: entry.team?.name ?? "",
    played: total.games ?? 0,
    win: total.wins ?? 0,
    draw: total.draws ?? 0,
    loss: total.loses ?? 0,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: entry.points ?? 0,
  };
}

async function fetchMatches(target) {
  const rows = [];
  const limit = 100;
  let offset = 0;
  let totalCount = Infinity;

  while (offset < totalCount) {
    const body = await request("/matches", {
      leagueId: target.leagueId,
      season: seasonStart,
      limit,
      offset,
      timezone: "Europe/London",
    });
    const page = body?.data ?? [];
    if (!Array.isArray(page)) throw new Error("Invalid Highlightly matches data");
    rows.push(...page);
    totalCount = Number(body?.pagination?.totalCount ?? rows.length);
    if (page.length === 0) break;
    offset += page.length;
  }

  return rows.map((row) => fixture(row, target.competition));
}

async function fetchTable(target) {
  const body = await request("/standings", {
    leagueId: target.leagueId,
    season: seasonStart,
  });
  const groups = body?.groups ?? [];
  const rows = groups.flatMap((group) => group?.standings ?? []);
  if (!rows.length) {
    throw new Error(`No standings returned for ${target.competition}`);
  }
  return rows.map(tableRow).sort((a, b) => b.points - a.points);
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "highlightly",
  plan: "BASIC",
  mode: standingsOnly ? "standings-only" : "full",
  rateLimitRemaining: providerRemaining,
  rateLimitObservedAt: new Date().toISOString(),
  competitions: {},
};

for (const target of targets) {
  const oldBundle = previous.competitions?.[target.competition]?.[season];
  const fixtures = standingsOnly
    ? oldBundle?.fixtures ?? []
    : await fetchMatches(target);
  const table = await fetchTable(target);

  if (!standingsOnly && !fixtures.length) {
    throw new Error(`No matches returned for ${target.competition}`);
  }

  output.competitions[target.competition] = {
    [season]: { fixtures, table },
  };
  console.log(
    `${target.competition}: ${fixtures.length} fixtures, ${table.length} table rows`,
  );
}

if (
  !receivedBasicConfirmation &&
  !(standingsOnly && previous.plan === "BASIC")
) {
  throw new Error("Highlightly responses did not confirm the BASIC plan");
}

output.rateLimitRemaining = providerRemaining;
output.rateLimitObservedAt = new Date().toISOString();

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(
  `Highlightly BASIC sync complete: ${requestsMade} requests; provider remaining ${providerRemaining ?? "unknown"}`,
);
