import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cachePath = resolve(process.cwd(), "data/openFootballCache.json");
const output = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, "utf8"))
  : { schemaVersion: 1, source: "openfootball/england", license: "CC0-1.0", competitions: {}, unavailable: [] };

const competitionFor = (level, start) => {
  if (level === 1) return start < 1992 ? "Football League Division One" : "Premier League";
  if (start < 1992) return `Football League Division ${[null, "One", "Two", "Three", "Four"][level]}`;
  if (start < 2004) return [null, null, "Football League First Division", "Football League Second Division", "Football League Third Division"][level];
  return [null, null, "Championship", "League One", "League Two"][level];
};
const months = new Map(["Jan",0,"Feb",1,"Mar",2,"Apr",3,"May",4,"Jun",5,"Jul",6,"Aug",7,"Sep",8,"Oct",9,"Nov",10,"Dec",11].reduce((a, v, i, all) => i % 2 ? a : [...a, [v, all[i + 1]]], []));

function cleanName(value) {
  return value.replace(/\s+/g, " ").trim();
}

function parseSeason(text, competition, start, season) {
  const fixtures = [];
  let round = null;
  let date = null;
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const roundMatch = line.match(/(?:Matchday|Round)\s+(\d+)/i);
    if (roundMatch) { round = Number(roundMatch[1]); continue; }
    const dateMatch = line.match(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})\b/);
    if (dateMatch) {
      const month = months.get(dateMatch[1]);
      const year = month >= 6 ? start : start + 1;
      date = `${year}-${String(month + 1).padStart(2, "0")}-${dateMatch[2].padStart(2, "0")}`;
      continue;
    }
    const match = line.match(/^(.+?)\s+(\d+)\s*[-–]\s*(\d+)\s+(.+?)(?:\s+\([^)]*\))?$/);
    if (!match || !date) continue;
    const homeName = cleanName(match[1]);
    const awayName = cleanName(match[4]);
    const homeScore = Number(match[2]);
    const awayScore = Number(match[3]);
    const identity = `${competition}:${season}:${date}:${homeName}:${awayName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    fixtures.push({
      id: `openfootball-history:${identity}`,
      date, kickoff: null, round,
      homeId: `openfootball:${homeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      awayId: `openfootball:${awayName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      homeName, awayName, homeScore, awayScore,
      halfTimeHomeScore: null, halfTimeAwayScore: null,
      fullTimeHomeScore: homeScore, fullTimeAwayScore: awayScore,
      status: "STATUS_FULL_TIME", season, competition,
      venue: null, attendance: null, homeScorers: [], awayScorers: [],
    });
  }
  return fixtures;
}

function tableFor(fixtures) {
  const rows = new Map();
  const ensure = (id, name) => {
    if (!rows.has(id)) rows.set(id, { teamId: id, name, played: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 });
    return rows.get(id);
  };
  for (const game of fixtures) {
    const home = ensure(game.homeId, game.homeName); const away = ensure(game.awayId, game.awayName);
    home.played++; away.played++; home.goalsFor += game.homeScore; home.goalsAgainst += game.awayScore; away.goalsFor += game.awayScore; away.goalsAgainst += game.homeScore;
    if (game.homeScore > game.awayScore) { home.win++; home.points += 3; away.loss++; }
    else if (game.homeScore < game.awayScore) { away.win++; away.points += 3; home.loss++; }
    else { home.draw++; away.draw++; home.points++; away.points++; }
  }
  for (const row of rows.values()) row.goalDifference = row.goalsFor - row.goalsAgainst;
  return [...rows.values()].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name));
}

const treeResponse = await fetch("https://api.github.com/repos/openfootball/england/git/trees/master?recursive=1");
if (!treeResponse.ok) throw new Error(`OpenFootball tree unavailable (${treeResponse.status})`);
const tree = (await treeResponse.json()).tree ?? [];
const sourceFiles = tree
  .map((entry) => entry.path)
  .filter((path) => /(^|\/)(\d{4}-\d{2})\/[1-4]-(?:footballleague|premierleague|division[123]|championship|league[12])\.txt$/.test(path))
  .sort();

for (const path of sourceFiles) {
    const seasonShort = path.match(/(\d{4})-(\d{2})/);
    const level = Number(path.split("/").at(-1).slice(0, 1));
    if (!seasonShort || !level) continue;
    const start = Number(seasonShort[1]);
    const season = `${start}-${start + 1}`;
    const competition = competitionFor(level, start);
    // Current/future seasons are maintained by the normal multi-provider sync.
    if (start > 2024) continue;
    const response = await fetch(`https://raw.githubusercontent.com/openfootball/england/master/${path}`);
    if (!response.ok) { output.unavailable ??= []; output.unavailable.push({ competition, season, status: response.status, path }); continue; }
    const fixtures = parseSeason(await response.text(), competition, start, season);
    if (!fixtures.length) { output.unavailable ??= []; output.unavailable.push({ competition, season, status: "unparsed", path }); continue; }
    output.competitions[competition] ??= {};
    output.competitions[competition][season] = { fixtures, table: tableFor(fixtures) };
    console.log(`${season} ${competition}: ${fixtures.length}`);
}

output.generatedAt = new Date().toISOString();
output.historicalSource = "openfootball/england Football.TXT";
output.unavailable = Array.from(new Map((output.unavailable ?? []).map((row) => [`${row.competition}|${row.season}|${row.path ?? ""}`, row])).values());
writeFileSync(cachePath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
