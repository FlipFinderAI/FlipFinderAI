import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const base = "https://raw.githubusercontent.com/openfootball/football.json/master";
const leagues = [
  ["Premier League", "en.1.json"],
  ["Championship", "en.2.json"],
  ["League One", "en.3.json"],
  ["League Two", "en.4.json"],

  // Existing OpenFootball provider also supplies domestic cups where
  // published. Missing season files are skipped safely with a 404.
  ["FA Cup", "facup.json"],
  ["League Cup", "eflcup.json"],
];
const seasons = ["2025-2026", "2026-2027"];

function folderForSeason(season) {
  const [start, end] = season.split("-");
  return `${start}-${end.slice(-2)}`;
}

function cleanTeamName(name) {
  return String(name ?? "")
    .replace(/\s+(?:AFC|FC)$/i, "")
    .replace(/^Queens Park Rangers$/, "Queens Park Rangers")
    .trim();
}

function fullTimeScore(score) {
  const value = Array.isArray(score) ? score : score?.ft;
  return Array.isArray(value) && value.length >= 2 ? value : null;
}

function mapFixture(match, league, season, index) {
  const score = fullTimeScore(match.score);
  const homeName = cleanTeamName(match.team1);
  const awayName = cleanTeamName(match.team2);
  return {
    id: `openfootball:${league}:${season}:${index}`,
    date: match.date ?? null,
    kickoff: match.date && match.time ? `${match.date}T${match.time}:00` : null,
    homeId: `openfootball:${homeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    awayId: `openfootball:${awayName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    homeName,
    awayName,
    homeScore: score?.[0] ?? null,
    awayScore: score?.[1] ?? null,
    halfTimeHomeScore: null,
    halfTimeAwayScore: null,
    fullTimeHomeScore: score?.[0] ?? null,
    fullTimeAwayScore: score?.[1] ?? null,
    status: score ? "STATUS_FULL_TIME" : "STATUS_SCHEDULED",
    season,
    competition: league,
    venue: null,
    attendance: null,
    homeScorers: [],
    awayScorers: [],
  };
}

function calculateTable(fixtures) {
  const rows = new Map();
  const ensure = (id, name) => {
    if (!rows.has(id)) rows.set(id, {
      teamId: id, name, played: 0, win: 0, draw: 0, loss: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    });
    return rows.get(id);
  };
  for (const fixture of fixtures) {
    if (fixture.homeScore == null || fixture.awayScore == null) continue;
    const home = ensure(fixture.homeId, fixture.homeName);
    const away = ensure(fixture.awayId, fixture.awayName);
    home.played++; away.played++;
    home.goalsFor += fixture.homeScore; home.goalsAgainst += fixture.awayScore;
    away.goalsFor += fixture.awayScore; away.goalsAgainst += fixture.homeScore;
    if (fixture.homeScore > fixture.awayScore) {
      home.win++; home.points += 3; away.loss++;
    } else if (fixture.homeScore < fixture.awayScore) {
      away.win++; away.points += 3; home.loss++;
    } else {
      home.draw++; away.draw++; home.points++; away.points++;
    }
  }
  for (const row of rows.values()) row.goalDifference = row.goalsFor - row.goalsAgainst;
  return [...rows.values()].sort((a, b) =>
    b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name),
  );
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "openfootball/football.json",
  license: "CC0-1.0",
  competitions: {},
  unavailable: [],
};

for (const season of seasons) {
  for (const [league, file] of leagues) {
    const url = `${base}/${folderForSeason(season)}/${file}`;
    const response = await fetch(url);
    if (!response.ok) {
      output.unavailable.push({ league, season, status: response.status });
      console.log(`${season} ${league}: unavailable (${response.status})`);
      continue;
    }
    const body = await response.json();
    const fixtures = (body.matches ?? []).map((match, index) => mapFixture(match, league, season, index));
    output.competitions[league] ??= {};
    output.competitions[league][season] = { fixtures, table: calculateTable(fixtures) };
    console.log(`${season} ${league}: ${fixtures.length} fixtures, ${fixtures.filter((row) => row.homeScore != null).length} results`);
  }
}

const outputPath = resolve(process.cwd(), "data/openFootballCache.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
