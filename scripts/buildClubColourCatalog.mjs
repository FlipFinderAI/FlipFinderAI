import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const inputs = [
  "data/apiFootballHistoricalCache.json",
  "data/apiFootballCache.json",
];
const outputPath = resolve(root, "data/clubColours.json");
const matchDatabase = JSON.parse(
  readFileSync(resolve(root, "data/matchDatabase.json"), "utf8"),
);
const normalise = (value) =>
  String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const selectableClubNames = new Set();
for (const seasons of Object.values(matchDatabase.competitions ?? {})) {
  for (const bundle of Object.values(seasons ?? {})) {
    for (const row of bundle.table ?? []) {
      selectableClubNames.add(normalise(row.name));
      const identity = matchDatabase.clubs?.[row.teamId];
      if (identity?.displayName) selectableClubNames.add(normalise(identity.displayName));
      for (const alias of identity?.aliases ?? []) selectableClubNames.add(normalise(alias));
    }
  }
}

const teams = new Map();
const visit = (value) => {
  if (!value || typeof value !== "object") return;
  if (
    typeof value.name === "string" &&
    typeof value.logo === "string" &&
    /^https:\/\//.test(value.logo)
  )
    selectableClubNames.has(normalise(value.name)) &&
    teams.set(value.name.trim(), value.logo);
  if (Array.isArray(value)) value.forEach(visit);
  else Object.values(value).forEach(visit);
};

for (const relative of inputs) {
  const path = resolve(root, relative);
  if (existsSync(path)) visit(JSON.parse(readFileSync(path, "utf8")));
}

const hex = (r, g, b) =>
  `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
const distance = (a, b) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

async function paletteFor(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .resize(64, 64, { fit: "contain" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const buckets = new Map();
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];
    if (a < 180) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max > 242 && min > 230) continue;
    const key = [r, g, b].map((part) => Math.round(part / 24) * 24).join(",");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const ranked = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key.split(",").map((part) => Math.min(255, Number(part))));
  const primary = ranked[0] ?? [23, 74, 145];
  const secondary = ranked.find((colour) => distance(primary, colour) >= 115) ??
    (0.299 * primary[0] + 0.587 * primary[1] + 0.114 * primary[2] > 150
      ? [16, 38, 28]
      : [255, 255, 255]);
  return [hex(...primary), hex(...secondary)];
}

const previous = existsSync(outputPath)
  ? JSON.parse(readFileSync(outputPath, "utf8"))
  : { clubs: {} };
const clubs = { ...(previous.clubs ?? {}) };
let completed = 0;
for (const [name, logo] of [...teams.entries()].sort()) {
  if (clubs[name]?.logo === logo) continue;
  try {
    const [primary, secondary] = await paletteFor(logo);
    clubs[name] = { primary, secondary, logo, source: "api-football team crest" };
    completed += 1;
    if (completed % 20 === 0) console.log(`Processed ${completed}/${teams.size} crest palettes…`);
  } catch (error) {
    console.warn(`Colour skipped: ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), clubs }, null, 2)}\n`,
);
console.log(`Club colours: ${Object.keys(clubs).length} total, ${completed} updated.`);
