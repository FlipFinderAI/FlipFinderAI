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
const now = new Date();

const londonDateParts = Object.fromEntries(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).map((part) => [part.type, part.value]),
);

const date =
  `${londonDateParts.year}-${londonDateParts.month}-${londonDateParts.day}`;

const londonHour = Number(londonDateParts.hour ?? 0);

const previousDate = (() => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
})();

const observedDate = String(cache.rateLimitObservedAt ?? "").slice(0, 10);

const estimatedRemaining = !observedDate
  ? 100
  : observedDate === date
    ? Number(cache.rateLimitRemaining ?? 0)
    : 100;

const protectedReserve = Number(
  process.env.HIGHLIGHTLY_LOWER_LEAGUE_RESERVE ?? 10,
);

const lastRaceAt = Date.parse(cache.lastLiveRaceAt ?? "");

const raceIntervalMs = Number(
  process.env.HIGHLIGHTLY_RACE_INTERVAL_MS ?? 30 * 60 * 1000,
);

if (
  Number.isFinite(lastRaceAt) &&
  Date.now() - lastRaceAt < raceIntervalMs
) {
  console.log(
    `Highlightly live race skipped: 30-minute race interval has not elapsed`,
  );
  process.exit(75);
}

const scheduleDatabase = JSON.parse(
  readFileSync("data/matchDatabase.json", "utf8"),
);

const targets = [
  {
    key: "GB-ENG",
    label: "England",
    params: { countryCode: "GB-ENG" },
    competitions: [
      "Premier League",
      "Championship",
      "League One",
      "League Two",
      "FA Cup",
      "EFL Cup",
      "EFL Trophy",
      "National League",
    ],
  },
  {
    key: "GB-SCT",
    label: "Scotland",
    params: { countryCode: "GB-SCT" },
    competitions: [
      "Scottish Premiership",
      "Scottish Championship",
      "Scottish League One",
      "Scottish League Two",
      "Scottish League Cup",
      "Scottish Challenge Cup",
      "Scottish Cup",
    ],
  },
  {
    key: "UEFA-CL",
    label: "UEFA Champions League",
    params: { leagueName: "UEFA Champions League" },
    competitions: ["UEFA Champions League"],
  },
  {
    key: "UEFA-EL",
    label: "UEFA Europa League",
    params: { leagueName: "UEFA Europa League" },
    competitions: ["UEFA Europa League"],
  },
  {
    key: "UEFA-ECL",
    label: "UEFA Conference League",
    params: { leagueName: "UEFA Conference League" },
    competitions: [
      "UEFA Conference League",
      "UEFA Europa Conference League",
    ],
  },
];

const fixturesForTargetDate = (target, targetDate) => {
  const fixtures = [];

  for (const competition of target.competitions) {
    const seasons =
      scheduleDatabase.competitions?.[competition] ?? {};

    for (const bundle of Object.values(seasons)) {
      for (const fixture of bundle?.fixtures ?? []) {
        if (String(fixture?.date ?? "").slice(0, 10) === targetDate) {
          fixtures.push(fixture);
        }
      }
    }
  }

  return fixtures;
};

const targetIsActiveToday = (target) => {
  const fixtures = fixturesForTargetDate(target, date);
  if (!fixtures.length) return false;

  const kickoffTimes = fixtures
    .map((fixture) =>
      Date.parse(
        fixture?.kickoff ??
        `${String(fixture?.date ?? "").slice(0, 10)}T19:45:00Z`,
      ),
    )
    .filter(Number.isFinite);

  if (!kickoffTimes.length) {
    return londonHour >= 11 && londonHour <= 23;
  }

  const earliest = Math.min(...kickoffTimes);
  const latest = Math.max(...kickoffTimes);

  return (
    Date.now() >= earliest - 2 * 60 * 60 * 1000 &&
    Date.now() <= latest + 4 * 60 * 60 * 1000
  );
};

const yesterdayRecoveryDue =
  String(cache.lastYesterdayRecoveryDate ?? "") !== date;

const queryPlan = [];

for (const target of targets) {
  if (targetIsActiveToday(target)) {
    queryPlan.push({
      ...target,
      queryDate: date,
      reason: "live",
    });
  }

  if (
    yesterdayRecoveryDue &&
    fixturesForTargetDate(target, previousDate).length
  ) {
    queryPlan.push({
      ...target,
      queryDate: previousDate,
      reason: "yesterday",
    });
  }
}

const dedupedPlan = [
  ...new Map(
    queryPlan.map((item) => [
      `${item.key}|${item.queryDate}`,
      item,
    ]),
  ).values(),
];

if (!dedupedPlan.length) {
  cache.lastLiveRaceAt = new Date().toISOString();

  if (yesterdayRecoveryDue) {
    cache.lastYesterdayRecoveryDate = date;
  }

  writeFileSync(
    cachePath,
    `${JSON.stringify(cache, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Highlightly live race skipped: no target fixtures active for ${date} or recoverable for ${previousDate}`,
  );

  process.exit(75);
}

if (
  estimatedRemaining <
  protectedReserve + dedupedPlan.length
) {
  console.log(
    `Highlightly live race skipped: estimated remaining ${estimatedRemaining}; planned calls ${dedupedPlan.length}; protected reserve ${protectedReserve}`,
  );

  process.exit(75);
}

if (process.env.HIGHLIGHTLY_DRY_RUN === "1") {
  console.log(
    "Highlightly dry-run plan:",
    dedupedPlan.map((item) => ({
      label: item.label,
      date: item.queryDate,
      reason: item.reason,
    })),
  );

  console.log(
    `Estimated remaining ${estimatedRemaining}; protected reserve ${protectedReserve}`,
  );

  process.exit(75);
}

const competitionName = (match) => {
  const country = match.country?.code;
  const name = match.league?.name ?? "Unknown competition";
  const normalized = String(name).trim().toLowerCase();

  if (
    normalized === "uefa champions league" ||
    normalized === "champions league"
  ) {
    return "UEFA Champions League";
  }

  if (
    normalized === "uefa europa league" ||
    normalized === "europa league"
  ) {
    return "UEFA Europa League";
  }

  if (
    normalized === "uefa conference league" ||
    normalized === "conference league" ||
    normalized === "uefa europa conference league" ||
    normalized === "europa conference league"
  ) {
    return "UEFA Conference League";
  }

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
for (const target of dedupedPlan) {
  const url = new URL("https://soccer.highlightly.net/matches");

  const params = {
    ...target.params,
    date: target.queryDate,
    limit: 100,
    offset: 0,
    timezone: "Europe/London",
  };

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-rapidapi-key": secrets.HIGHLIGHTLY_API_KEY,
    },
  });

  const body = await response.json().catch(() => null);

  calls += 1;

  remaining =
    response.headers.get(
      "x-ratelimit-requests-remaining",
    );

  if (!response.ok) {
    throw new Error(
      `Highlightly live race failed (${response.status}) for ${target.label} ${target.queryDate}`,
    );
  }

  if (body?.plan?.tier !== "BASIC") {
    throw new Error("Highlightly BASIC not confirmed");
  }

  for (const match of body.data ?? []) {
    if (
      !match.id ||
      !match.date ||
      !match.homeTeam?.name ||
      !match.awayTeam?.name
    ) {
      continue;
    }

    const competition = competitionName(match);
    const start = Number(match.league?.season);

    if (!Number.isFinite(start)) continue;

    const season = `${start}-${start + 1}`;
    const [homeScore, awayScore] =
      parseScore(match.state?.score?.current);

    const matchStatus =
      status(match.state?.description);

    const finished =
      matchStatus === "FINISHED";

    cache.competitions[competition] ??= {};

    const bundle =
      cache.competitions[competition][season] ??=
        { fixtures: [], table: [] };

    const providerId = String(match.id);

    const existing =
      bundle.fixtures.find(
        (row) =>
          String(row.providerId) === providerId,
      );

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
      fullTimeHomeScore:
        finished
          ? homeScore
          : existing?.fullTimeHomeScore ?? null,
      fullTimeAwayScore:
        finished
          ? awayScore
          : existing?.fullTimeAwayScore ?? null,
      status: matchStatus,
      season,
      competition,
      observedAt: new Date().toISOString(),
      venue: existing?.venue ?? null,
      attendance: existing?.attendance ?? null,
      homeScorers: existing?.homeScorers ?? [],
      awayScorers: existing?.awayScorers ?? [],
    };

    if (existing) {
      Object.assign(existing, mapped);
    } else {
      bundle.fixtures.push(mapped);
    }
  }
}

if (yesterdayRecoveryDue) {
  cache.lastYesterdayRecoveryDate = date;
}

cache.generatedAt = new Date().toISOString();
cache.lastLiveRaceAt = new Date().toISOString();
cache.rateLimitRemaining = remaining;
cache.rateLimitObservedAt = new Date().toISOString();
writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
console.log(
  `Highlightly live race: ${calls} calls; ${dedupedPlan.map((item) => `${item.label}:${item.queryDate}:${item.reason}`).join(", ")}; ${remaining ?? "unknown"} remaining`,
);
