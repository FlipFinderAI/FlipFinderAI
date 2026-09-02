import { spawn } from "node:child_process";

const jobs = [
  ["Highlightly", ["scripts/syncHighlightlyLiveRace.mjs"]],
  ["API-Football", ["scripts/syncApiFootballCache.mjs"]],
];
let buildQueue = Promise.resolve();

function run(name, args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { cwd: process.cwd(), stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 75) {
        console.log(`${name} race entry skipped to protect its reserved capacity`);
        resolve({ name, ok: false, skipped: true });
        return;
      }
      if (code !== 0) {
        console.warn(`${name} race entry failed with code ${code}; fallbacks remain active`);
        resolve({ name, ok: false });
        return;
      }
      buildQueue = buildQueue.then(() => new Promise((buildResolve, buildReject) => {
        const build = spawn(process.execPath, ["scripts/buildMatchDatabase.mjs"], {
          cwd: process.cwd(), stdio: "inherit",
        });
        build.on("exit", (buildCode) => buildCode === 0 ? buildResolve() : buildReject(new Error("TFD build failed")));
      }));
      buildQueue.then(() => resolve({ name, ok: true })).catch(() => resolve({ name, ok: false }));
    });
  });
}

const results = await Promise.all(jobs.map(([name, args]) => run(name, args)));
await buildQueue;
const winners = results.filter((result) => result.ok).map((result) => result.name);
if (!winners.length) throw new Error("No current football provider completed successfully");
await new Promise((resolve) => {
  const publisher = spawn(process.execPath, ["scripts/publishTfdToGitHub.mjs"], {
    cwd: process.cwd(), stdio: "inherit",
  });
  publisher.on("exit", (code) => {
    if (code !== 0)
      console.warn(`TFD app-feed publish failed (${code}); the app will retain its last good cache`);
    resolve();
  });
});
console.log(`Provider race complete: ${winners.join(", ")}`);
