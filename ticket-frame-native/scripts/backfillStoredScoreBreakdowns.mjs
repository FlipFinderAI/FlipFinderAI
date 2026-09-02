import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const providerPath = resolve(root, "data/apiFootballProviderCache.json");
const provider = JSON.parse(readFileSync(providerPath, "utf8"));
const rawById = new Map();

function collect(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (value.fixture?.id != null && value.score) {
    rawById.set(String(value.fixture.id), value);
  }
  for (const child of Object.values(value)) collect(child, seen);
}

for (const file of ["data/apiFootballCache.json", "data/apiFootballHistoricalCache.json"]) {
  collect(JSON.parse(readFileSync(resolve(root, file), "utf8")));
}

let enriched = 0;
for (const seasons of Object.values(provider.competitions ?? {})) {
  for (const bundle of Object.values(seasons ?? {})) {
    for (const fixture of bundle.fixtures ?? []) {
      const raw = rawById.get(String(fixture.providerId ?? ""));
      if (!raw) continue;
      const final = ["FT", "AET", "PEN"].includes(raw.fixture?.status?.short);
      fixture.halfTimeHomeScore = raw.score?.halftime?.home ?? null;
      fixture.halfTimeAwayScore = raw.score?.halftime?.away ?? null;
      fixture.fullTimeHomeScore = final
        ? raw.score?.fulltime?.home ?? raw.goals?.home ?? null
        : null;
      fixture.fullTimeAwayScore = final
        ? raw.score?.fulltime?.away ?? raw.goals?.away ?? null
        : null;
      if (fixture.halfTimeHomeScore != null && fixture.halfTimeAwayScore != null) {
        enriched += 1;
      }
    }
  }
}

provider.generatedAt = new Date().toISOString();
writeFileSync(providerPath, `${JSON.stringify(provider, null, 2)}\n`, "utf8");
console.log(`Stored API-Football score breakdowns added to ${enriched} fixtures`);
