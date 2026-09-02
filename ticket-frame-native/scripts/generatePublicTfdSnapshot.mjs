import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = resolve(root, "data/matchDatabase.json");
const outputPath = resolve(
  root,
  process.argv[2] ?? "dist/tfd/snapshot-v1.json",
);
const database = JSON.parse(readFileSync(inputPath, "utf8"));

const fixtureFields = [
  "id", "date", "kickoff", "homeId", "awayId", "homeName", "awayName",
  "homeScore", "awayScore", "status", "season", "competition", "round",
  "venue", "attendance", "homeScorers", "awayScorers",
  "homeShootoutScore", "awayShootoutScore", "shootoutWinner",
  "homePenaltyScorers", "awayPenaltyScorers",
];

const competitions = {};
for (const [competition, seasons] of Object.entries(database.competitions ?? {})) {
  competitions[competition] = {};
  for (const [season, bundle] of Object.entries(seasons)) {
    competitions[competition][season] = {
      fixtures: (bundle.fixtures ?? []).map((fixture) =>
        Object.fromEntries(
          fixtureFields
            .filter((field) => fixture[field] !== undefined)
            .map((field) => [field, fixture[field]]),
        ),
      ),
      table: bundle.table ?? [],
    };
  }
}

const contentHash = createHash("sha256")
  .update(JSON.stringify(competitions))
  .digest("hex");
const snapshot = {
  schemaVersion: 1,
  generatedAt: database.generatedAt,
  contentHash,
  competitions,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(snapshot)}\n`, "utf8");
console.log(
  `Public TFD snapshot: ${(Buffer.byteLength(JSON.stringify(snapshot)) / 1048576).toFixed(2)} MiB · ${contentHash.slice(0, 12)}`,
);
