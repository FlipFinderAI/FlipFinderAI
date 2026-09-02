import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cachePath = resolve(process.cwd(), "data/openFootballCache.json");
const output = JSON.parse(readFileSync(cachePath, "utf8"));
const repositories = [
  ["austria", "Austria"], ["belgium", "Belgium"], ["deutschland", "Germany"],
  ["espana", "Spain"], ["italy", "Italy"], ["europe", null],
  ["south-america", null], ["world", null], ["champions-league", null],
  ["club-worldcup", null], ["copa-america", null], ["north-america-gold-cup", null],
];
const monthNumber = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const titleCase = (v) => v.split(/[-_]/).map((x) => x ? x[0].toUpperCase() + x.slice(1) : x).join(" ");
const countryKey = (value) => ({ Austria:"AUT", Belgium:"BEL", Germany:"GER", Spain:"ESP", Italy:"ITA", England:"ENG", Scotland:"SCO", France:"FRA", Portugal:"POR", Netherlands:"NED", Brazil:"BRA", Argentina:"ARG", Mexico:"MEX", "United States":"USA" }[value] ?? String(value ?? "UNK").toUpperCase().replace(/[^A-Z]/g, ""));
const cleanTeam = (value) => {
  const match = value.trim().match(/^(.*?)\s+\(([A-Z]{3})\)$/);
  return { name: (match?.[1] ?? value).replace(/\s+/g, " ").trim(), countryCode: match?.[2] ?? null };
};
const slug = (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function seasonFromPath(path) {
  const match = path.match(/(?:^|[/_])(\d{4})(?:-(\d{2}))?(?:--|[/_]|\b)/);
  if (!match) return null;
  const start = Number(match[1]);
  return { start, label: match[2] ? `${start}-${start + 1}` : String(start) };
}

function parse(text, repository, path, fallbackCountry) {
  const season = seasonFromPath(path);
  if (!season) return null;
  const lines = text.replace(/\r/g, "").split("\n");
  const rawTitle = lines.find((line) => line.trim().startsWith("="))?.replace(/^\s*=+\s*/, "").replace(/\s+\d{4}(?:[/–-]\d{2,4})?\s*$/, "").trim();
  if (!rawTitle) return null;
  const umbrella = ["europe", "south-america", "world"].includes(repository);
  const firstPath = path.split("/")[0];
  const country = fallbackCountry ?? (umbrella && !/^\d/.test(firstPath) ? titleCase(firstPath) : null);
  const isInternational = /champions|europa|conference|libertadores|sudamericana|world cup|copa|gold cup|nations|international/i.test(`${path} ${rawTitle}`);
  const competition = country && !isInternational ? `${country} · ${rawTitle}` : rawTitle;
  const fixtures = []; let date = null; let round = null;
  for (const raw of lines) {
    const line = raw.trim();
    const roundMatch = line.match(/(?:Matchday|Round)\s+(\d+)/i); if (roundMatch) round = Number(roundMatch[1]);
    const dateMatch = line.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?/);
    if (dateMatch) { const month = monthNumber[dateMatch[1]]; const year = Number(dateMatch[3] ?? (month >= 6 ? season.start : season.start + 1)); date = `${year}-${String(month + 1).padStart(2,"0")}-${dateMatch[2].padStart(2,"0")}`; }
    if (!date) continue;
    const withoutTime = line.replace(/^\d{1,2}:\d{2}\s+/, "");
    let match = withoutTime.match(/^(.+?)\s+v\s+(.+?)\s+(\d+)\s*[-–]\s*(\d+)(?:\s+\([^)]*\))?(?:\s+.*)?$/);
    let home; let away; let homeScore; let awayScore;
    if (match) { [, home, away] = match; homeScore = Number(match[3]); awayScore = Number(match[4]); }
    else { match = withoutTime.match(/^(.+?)\s+(\d+)\s*[-–]\s*(\d+)(?:\s+\([^)]*\))?\s+(.+?)$/); if (!match) continue; home = match[1]; away = match[4]; homeScore = Number(match[2]); awayScore = Number(match[3]); }
    const h = cleanTeam(home); const a = cleanTeam(away); if (!h.name || !a.name) continue;
    const homeCountryKey = h.countryCode ?? countryKey(country);
    const awayCountryKey = a.countryCode ?? countryKey(country);
    const idPart = slug(`${repository}-${competition}-${season.label}-${date}-${h.name}-${a.name}`);
    fixtures.push({ id: `openfootball-world:${idPart}`, date, kickoff: null, round, homeId: `openfootball:${homeCountryKey}:${slug(h.name)}`, awayId: `openfootball:${awayCountryKey}:${slug(a.name)}`, homeName: h.name, awayName: a.name, homeCountryCode: homeCountryKey, awayCountryCode: awayCountryKey, homeScore, awayScore, halfTimeHomeScore: null, halfTimeAwayScore: null, fullTimeHomeScore: homeScore, fullTimeAwayScore: awayScore, status: "STATUS_FULL_TIME", season: season.label, competition, country, venue: null, attendance: null, homeScorers: [], awayScorers: [] });
  }
  return fixtures.length ? { competition, season: season.label, fixtures } : null;
}

function tableFor(fixtures) {
  const rows = new Map(); const ensure = (id,name) => { if(!rows.has(id)) rows.set(id,{teamId:id,name,played:0,win:0,draw:0,loss:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0}); return rows.get(id); };
  for(const g of fixtures){const h=ensure(g.homeId,g.homeName),a=ensure(g.awayId,g.awayName);h.played++;a.played++;h.goalsFor+=g.homeScore;h.goalsAgainst+=g.awayScore;a.goalsFor+=g.awayScore;a.goalsAgainst+=g.homeScore;if(g.homeScore>g.awayScore){h.win++;h.points+=3;a.loss++;}else if(g.homeScore<g.awayScore){a.win++;a.points+=3;h.loss++;}else{h.draw++;a.draw++;h.points++;a.points++;}}
  for(const r of rows.values())r.goalDifference=r.goalsFor-r.goalsAgainst; return [...rows.values()];
}

let files = 0, imported = 0, matches = 0;
for (const [repository, country] of repositories) {
  const treeResponse = await fetch(`https://api.github.com/repos/openfootball/${repository}/git/trees/master?recursive=1`);
  if (!treeResponse.ok) continue;
  const paths = ((await treeResponse.json()).tree ?? []).map((x) => x.path).filter((p) => /\.txt$/.test(p) && /\d{4}/.test(p) && !/(?:^|\/)(?:squads?|clubs?|players?|stadiums?|teams?)(?:\/|\.)/i.test(p) && !/-full\.txt$/i.test(p));
  for (const path of paths) {
    files++;
    const response = await fetch(`https://raw.githubusercontent.com/openfootball/${repository}/master/${path}`); if (!response.ok) continue;
    const parsed = parse(await response.text(), repository, path, country); if (!parsed) continue;
    output.competitions[parsed.competition] ??= {};
    const current = output.competitions[parsed.competition][parsed.season]?.fixtures ?? [];
    const byId = new Map(current.map((row) => [row.id, row])); for (const row of parsed.fixtures) byId.set(row.id, row);
    const combined = [...byId.values()]; output.competitions[parsed.competition][parsed.season] = { fixtures: combined, table: tableFor(combined) };
    imported++; matches += parsed.fixtures.length;
  }
  console.log(`${repository}: worldwide cache updated`);
}
output.generatedAt = new Date().toISOString(); output.worldwideSource = "OpenFootball public-domain repositories";
writeFileSync(cachePath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Worldwide OpenFootball: ${matches} parsed matches from ${imported}/${files} files`);
