import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const values = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".ticket-frame-api-secrets"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const split = line.indexOf("=");
      return [line.slice(0, split).trim(), line.slice(split + 1).trim()];
    }),
);

async function footballDataSeason(season) {
  const response = await fetch(
    `https://api.football-data.org/v4/competitions/PL/matches?season=${season}`,
    { headers: { "X-Auth-Token": values.FOOTBALL_DATA_ORG_KEY } },
  );
  const body = await response.json();
  const matches = Array.isArray(body.matches) ? body.matches : [];
  const leeds = matches.filter((match) =>
    [match.homeTeam?.name, match.awayTeam?.name].some((name) => /leeds/i.test(name ?? "")),
  );
  return {
    status: response.status,
    totalMatches: matches.length,
    leedsMatches: leeds.length,
    error: body.message ?? null,
  };
}

async function apiFootball(path) {
  const response = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: { "x-apisports-key": values.API_FOOTBALL_KEY },
  });
  const body = await response.json();
  return {
    status: response.status,
    results: Number(body.results ?? 0),
    errors: body.errors ?? null,
    response: Array.isArray(body.response) ? body.response : [],
  };
}

const apiFootballOnly = process.argv.includes("--api-football-only");
const fd2025 = apiFootballOnly ? null : await footballDataSeason(2025);
const fd2026 = apiFootballOnly ? null : await footballDataSeason(2026);
const teams = await apiFootball("/teams?search=Leeds");
const leedsUnited = teams.response.find((row) => /leeds united/i.test(row.team?.name ?? ""));
const teamId = leedsUnited?.team?.id;

const af2025 = teamId
  ? await apiFootball(`/fixtures?team=${teamId}&league=39&season=2025`)
  : { status: teams.status, results: 0, errors: teams.errors };
const af2026 = teamId
  ? await apiFootball(`/fixtures?team=${teamId}&league=39&season=2026`)
  : { status: teams.status, results: 0, errors: teams.errors };

console.log(JSON.stringify({
  footballData: { season2025: fd2025, season2026: fd2026 },
  apiFootball: {
    teamSearch: { status: teams.status, results: teams.results, leedsUnitedFound: Boolean(teamId) },
    season2025: { status: af2025.status, results: af2025.results, errors: af2025.errors },
    season2026: { status: af2026.status, results: af2026.results, errors: af2026.errors },
  },
}, null, 2));
