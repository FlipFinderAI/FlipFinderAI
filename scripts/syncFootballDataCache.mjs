import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const secrets = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".ticket-frame-api-secrets"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const split = line.indexOf("=");
      return [line.slice(0, split).trim(), line.slice(split + 1).trim()];
    }),
);

if (!secrets.FOOTBALL_DATA_ORG_KEY) {
  throw new Error("FOOTBALL_DATA_ORG_KEY is missing from .ticket-frame-api-secrets");
}

async function request(path) {
  const response = await fetch(`https://api.football-data.org/v4${path}`, {
    headers: { "X-Auth-Token": secrets.FOOTBALL_DATA_ORG_KEY },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Football-Data.org request failed (${response.status}): ${body.message ?? "unknown error"}`);
  return body;
}

function scorers(match, side) {
  const teamId = side === "home" ? match.homeTeam?.id : match.awayTeam?.id;
  return Array.from(new Set(
    (match.goals ?? [])
      .filter((goal) => goal.team?.id === teamId)
      .map((goal) => goal.scorer?.name)
      .filter(Boolean),
  ));
}

function fixture(match, season) {
  const isFinished = ["FINISHED", "AWARDED"].includes(match.status);
  return {
    id: `football-data:${match.id}`,
    providerId: String(match.id),
    date: match.utcDate?.slice(0, 10) ?? null,
    kickoff: match.utcDate ?? null,
    homeId: String(match.homeTeam?.id ?? ""),
    awayId: String(match.awayTeam?.id ?? ""),
    homeName: match.homeTeam?.name ?? "",
    awayName: match.awayTeam?.name ?? "",
    homeScore: match.score?.fullTime?.home ?? null,
    awayScore: match.score?.fullTime?.away ?? null,
    halfTimeHomeScore: match.score?.halfTime?.home ?? null,
    halfTimeAwayScore: match.score?.halfTime?.away ?? null,
    fullTimeHomeScore: isFinished ? match.score?.fullTime?.home ?? null : null,
    fullTimeAwayScore: isFinished ? match.score?.fullTime?.away ?? null : null,
    status: match.status ?? "SCHEDULED",
    season,
    competition: match.competition?.name ?? "Premier League",
    venue: null,
    attendance: match.attendance ?? null,
    homeScorers: scorers(match, "home"),
    awayScorers: scorers(match, "away"),
  };
}

function tableRow(entry) {
  return {
    teamId: String(entry.team?.id ?? ""),
    name: entry.team?.name ?? "",
    played: entry.playedGames ?? 0,
    win: entry.won ?? 0,
    draw: entry.draw ?? 0,
    loss: entry.lost ?? 0,
    goalsFor: entry.goalsFor ?? 0,
    goalsAgainst: entry.goalsAgainst ?? 0,
    goalDifference: entry.goalDifference ?? 0,
    points: entry.points ?? 0,
  };
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "football-data.org",
  competitions: {
    "Premier League": {},
    Championship: {},
    "UEFA Champions League": {},
  },
};

for (const { competition, code, seasons, hasTable } of [
  { competition: "Premier League", code: "PL", seasons: [2025, 2026], hasTable: true },
  { competition: "Championship", code: "ELC", seasons: [2025, 2026], hasTable: true },
  // Football-Data.org has published 2025/26 CL data; 2026/27 currently 404s.
  { competition: "UEFA Champions League", code: "CL", seasons: [2025], hasTable: false },
]) {
  for (const startYear of seasons) {
    const season = `${startYear}-${startYear + 1}`;
    const matches = await request(`/competitions/${code}/matches?season=${startYear}`);
    const standings = hasTable
      ? await request(`/competitions/${code}/standings?season=${startYear}`)
      : { standings: [] };
    const total = (standings.standings ?? []).find((item) => item.type === "TOTAL");
    output.competitions[competition][season] = {
      fixtures: (matches.matches ?? []).map((match) => fixture(match, season)),
      table: (total?.table ?? []).map(tableRow),
    };
  }
}

const outputPath = resolve(process.cwd(), "data/footballDataCache.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

for (const [competition, seasons] of Object.entries(output.competitions)) {
  for (const [season, data] of Object.entries(seasons)) {
    const leeds = data.fixtures.filter((row) => /leeds/i.test(row.homeName) || /leeds/i.test(row.awayName));
    console.log(`${season}: cached ${data.fixtures.length} ${competition} matches (${leeds.length} Leeds), table rows ${data.table.length}`);
  }
}
