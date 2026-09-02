import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const cachePath = resolve(root, "data/highlightlyProviderCache.json");
const dateParts = Object.fromEntries(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map((part) => [part.type, part.value]),
);
const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
const current = JSON.parse(readFileSync(cachePath, "utf8"));
if (current.maintenanceDate === today) {
  console.log(`Highlightly daily maintenance already completed for ${today}`);
  process.exit(0);
}

const run = (script, args = [], env = {}) => new Promise((resolvePromise, reject) => {
  const child = spawn(process.execPath, [script, ...args], {
    cwd: root, stdio: "inherit", env: { ...process.env, ...env },
  });
  child.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`${script} failed (${code})`)));
});

// Nine current tables: eight protected lower/Scottish leagues, Premier League last.
await run("scripts/syncHighlightlyCache.mjs", ["--standings-only"]);
await run("scripts/backfillStoredScoreBreakdowns.mjs");
// Only surplus above the protected 35-call reserve is available to backfill.
await run("scripts/useHighlightlySpareCapacity.mjs", [], { HIGHLIGHTLY_SPARE_RESERVE: "35" });
await run("scripts/buildMatchDatabase.mjs");
await run("scripts/publishTfdToGitHub.mjs");

const updated = JSON.parse(readFileSync(cachePath, "utf8"));
updated.maintenanceDate = today;
writeFileSync(cachePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
console.log(`Highlightly daily maintenance completed for ${today}`);
