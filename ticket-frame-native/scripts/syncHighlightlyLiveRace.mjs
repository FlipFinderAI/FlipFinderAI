import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const cachePath = resolve(root, "data/highlightlyProviderCache.json");
const secrets = Object.fromEntries(
  readFileSync(resolve(root, ".ticket-frame-api-secrets"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const split = line.indexOf("=");
      return [line.slice(0, split), line.slice(split + 1)];
    }),
);
if (!secrets.HIGHLIGHTLY_API_KEY) throw new Error("HIGHLIGHTLY_API_KEY missing");

const cache = JSON.parse(readFileSync(cachePath, "utf8"));
const londonDateParts = Object.fromEntries(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date()).map((part) => [part.type, part.value]),
);
const date = `${londonDateParts.year}-${londonDateParts.month}-${londonDateParts.day}`;
const observedDate = String(cache.rateLimitObservedAt ?? "").slice(0, 10);
const estimatedRemaining = !observedDate
  ? 0
  : observedDate === date
    ? Number(cache.rateLimitRemaining ?? 0)
    : 100;
const protectedReserve = Number(
  process.env.HIGHLIGHTLY_LOWER_LEAGUE_RESERVE ?? 10,
);
const lastRaceAt = Date.parse(cache.lastLiveRaceAt ?? "");
const raceIntervalMs = Number(
  process.env.HIGHLIGHTLY_RACE_INTERVAL_MS ?? 5 * 60 * 1000,
);

if (
  estimatedRemaining < protectedReserve + 2 ||
  (Number.isFinite(lastRaceAt) && Date.now() - lastRaceAt < raceIntervalMs)
) {
  console.log(
    `Highlightly live race skipped: estimated remaining ${estimatedRemaining}; protected reserve ${protectedReserve}`,
  );
  process.exit(75);
}

const competitionName = (match) => {
  const country = match.country?.code;
  const name = match.league?.name ?? "Unknown competition";
  if (country === "GB-SCT") {
    if (name === "Premiership") return "Scottish Premiership";
    if (name === "Championship") return "Scottish Championship";
    if (name === "League One") return "Scottish League One";
    if (name === "League Two") return "Scottish League Two";
    if (name === "League Cup") return "Scottish League Cup";
    if (name === "Challenge Cup") return "Scottish Challenge Cup";
    if (name === "FA Cup") return "Scottish Cup";
  }
  return name;
};

const parseScore = (value) => {
  const match = String(value ?? "").match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  return match ? [Number(match[1]), Number(match[2])] : [null, null];
};
const status = (value) => String(value ?? "SCHEDULED")
  .replace(/[^a-z0-9]+/gi, "_").toUpperCase();

let calls = 0;
let remaining = null;
for (const countryCode of ["GB-ENG", "GB-SCT"]) {
  const url = new URL("https://soccer.highlightly.net/matches");
  for (const [key, value] of Object.entries({ countryCode, date, limit: 100, offset: 0, timezone: "Europe/London" })) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { Accept: "application/json", "x-rapidapi-key": secrets.HIGHLIGHTLY_API_KEY },
  });
  const body = await response.json().catch(() => null);
  calls += 1;
  remaining = response.headers.get("x-ratelimit-requests-remaining");
  if (!response.ok) throw new Error(`Highlightly live race failed (${response.status})`);
  if (body?.plan?.tier !== "BASIC") throw new Error("Highlightly BASIC not confirmed");

  for (const match of body.data ?? []) {
    if (!match.id || !match.date || !match.homeTeam?.name || !match.awayTeam?.name) continue;
    const competition = competitionName(match);
    const start = Number(match.league?.season);
    if (!Number.isFinite(start)) continue;
    const season = `${start}-${start + 1}`;
    const [homeScore, awayScore] = parseScore(match.state?.score?.current);
    const matchStatus = status(match.state?.description);
    const finished = matchStatus === "FINISHED";
    cache.competitions[competition] ??= {};
    const bundle = cache.competitions[competition][season] ??= { fixtures: [], table: [] };
    const providerId = String(match.id);
    const existing = bundle.fixtures.find((row) => String(row.providerId) === providerId);
    const mapped = {
      ...(existing ?? {}),
      id: `highlightly:${providerId}`,
      providerId,
      date: match.date.slice(0, 10),
      kickoff: match.date,
      round: match.round ?? existing?.round ?? null,
      homeId: String(match.homeTeam.id ?? ""),
      awayId: String(match.awayTeam.id ?? ""),
      homeName: match.homeTeam.name,
      awayName: match.awayTeam.name,
      homeScore,
      awayScore,
      fullTimeHomeScore: finished ? homeScore : existing?.fullTimeHomeScore ?? null,
      fullTimeAwayScore: finished ? awayScore : existing?.fullTimeAwayScore ?? null,
      status: matchStatus,
      season,
      competition,
      observedAt: new Date().toISOString(),
      venue: existing?.venue ?? null,
      attendance: existing?.attendance ?? null,
      homeScorers: existing?.homeScorers ?? [],
      awayScorers: existing?.awayScorers ?? [],
    };
    if (existing) Object.assign(existing, mapped);
    else bundle.fixtures.push(mapped);
  }
}

cache.generatedAt = new Date().toISOString();
cache.lastLiveRaceAt = new Date().toISOString();
cache.rateLimitRemaining = remaining;
cache.rateLimitObservedAt = new Date().toISOString();
writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
console.log(`Highlightly live race: ${calls} calls for ${date}; ${remaining ?? "unknown"} remaining`);
