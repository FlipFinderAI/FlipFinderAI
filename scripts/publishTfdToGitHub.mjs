import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = process.cwd();
const remote = "https://github.com/FlipFinderAI/FlipFinderAI.git";
const branch = "tfd-live";
const generated = resolve(root, "dist/tfd/snapshot-v1.json");
let temporary = mkdtempSync(resolve(tmpdir(), "ticket-frame-tfd-publish-"));

const run = (command, args, options = {}) =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      stdio: options.quiet ? "ignore" : "inherit",
    });
    child.on("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`${command} ${args.join(" ")} failed (${code})`)),
    );
  });

try {
  await run(process.execPath, ["scripts/generatePublicTfdSnapshot.mjs"]);
  let existingBranch = true;
  try {
    await run("git", ["clone", "--depth", "1", "--branch", branch, remote, temporary], { quiet: true });
  } catch {
    existingBranch = false;
    rmSync(temporary, { recursive: true, force: true });
    const replacement = mkdtempSync(resolve(tmpdir(), "ticket-frame-tfd-publish-"));
    await run("git", ["clone", "--depth", "1", remote, replacement], { quiet: true });
    temporary = replacement;
    await run("git", ["checkout", "--orphan", branch], { cwd: temporary });
    await run("git", ["rm", "-rf", "."], { cwd: temporary, quiet: true });
  }

  const destination = resolve(temporary, "snapshot-v1.json");
  const next = JSON.parse(readFileSync(generated, "utf8"));
  let shouldPublish = true;
  if (existingBranch && existsSync(destination)) {
    const previous = JSON.parse(readFileSync(destination, "utf8"));
    if (previous.contentHash === next.contentHash) {
      console.log("Public TFD snapshot unchanged; publish skipped");
      shouldPublish = false;
    } else {
      copyFileSync(generated, destination);
    }
  } else {
    copyFileSync(generated, destination);
  }

  if (shouldPublish) {
    writeFileSync(
      resolve(temporary, "README.md"),
      "# Ticket Frame Data live feed\n\nGenerated automatically from Ticket Frame Data. No provider keys or internal provenance are published.\n",
    );
    await run("git", ["add", "snapshot-v1.json", "README.md"], { cwd: temporary });
    const changed = await new Promise((resolvePromise) => {
      const child = spawn("git", ["diff", "--cached", "--quiet"], { cwd: temporary });
      child.on("exit", (code) => resolvePromise(code !== 0));
    });
    if (changed) {
      await run("git", ["-c", "user.name=Ticket Frame Data", "-c", "user.email=tfd@ticketframe.invalid", "commit", "-m", `TFD ${next.generatedAt}`], { cwd: temporary });
      await run("git", ["push", "origin", `HEAD:${branch}`], { cwd: temporary });
      console.log(`Published TFD ${next.generatedAt} to ${branch}`);
    }
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
