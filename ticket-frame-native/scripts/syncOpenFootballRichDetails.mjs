import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cachePath = resolve(process.cwd(), "data/openFootballCache.json");
const cache = JSON.parse(readFileSync(cachePath, "utf8"));
const url = "https://raw.githubusercontent.com/openfootball/england/master/2025-26/1-premierleague-full.txt";
const response = await fetch(url);
if (!response.ok) throw new Error(`Rich OpenFootball file unavailable (${response.status})`);
const lines = (await response.text()).replace(/\r/g, "").split("\n");
const month = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
const normal = (v) => String(v).toLowerCase().replace(/&/g," and ").replace(/\b(?:afc|fc)\b/g,"").replace(/[^a-z0-9]+/g," ").trim();
const scorers = (text) => Array.from(new Set([...text.matchAll(/([A-Za-zÀ-ž][A-Za-zÀ-ž .'-]*?)\s+\d{1,3}(?:\+\d+)?'(?:\(p\))?/g)].map((m) => m[1].trim())));
const fixtures = cache.competitions?.["Premier League"]?.["2025-2026"]?.fixtures ?? [];
let date = null; let venue = null; let attendance = null; let enriched = 0;
for (let i=0;i<lines.length;i++) {
  const heading = lines[i].trim().match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2}).*?@\s*(.*?)(?:,\s*Att:\s*(\d+))?$/);
  if (heading) { const year = month[heading[1]] >= 7 ? 2025 : 2026; date=`${year}-${String(month[heading[1]]).padStart(2,"0")}-${heading[2].padStart(2,"0")}`; venue=heading[3].replace(/,\s*Att:\s*\d+$/i,"").trim(); attendance=heading[4]?Number(heading[4]):Number(lines[i].match(/Att:\s*(\d+)/)?.[1]??0)||null; continue; }
  const game = lines[i].trim().match(/^(.+?)\s+v\s+(.+?)\s+(\d+)-(\d+)\s+\((\d+)-(\d+)\)$/);
  if (!game || !date) continue;
  const fixture = fixtures.find((row) => row.date===date && normal(row.homeName)===normal(game[1]) && normal(row.awayName)===normal(game[2]));
  if (!fixture) continue;
  let detail=""; for(let j=i+1;j<Math.min(i+5,lines.length);j++){const value=lines[j].trim();if(!value.startsWith("(")&&!detail)continue;detail+=` ${value}`;if(value.endsWith(")"))break;}
  const inner=detail.replace(/^\s*\(/,"").replace(/\)\s*$/,""); const split=inner.split(";");
  Object.assign(fixture,{halfTimeHomeScore:Number(game[5]),halfTimeAwayScore:Number(game[6]),venue,attendance,homeScorers:scorers(split[0]??""),awayScorers:scorers(split.slice(1).join(";")),richDetailsSource:"openfootball/england full"}); enriched++;
}
cache.generatedAt=new Date().toISOString();
writeFileSync(cachePath,`${JSON.stringify(cache,null,2)}\n`);
console.log(`OpenFootball rich details: ${enriched} Premier League matches enriched`);
