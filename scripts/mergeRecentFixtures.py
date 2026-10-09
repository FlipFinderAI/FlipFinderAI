#!/usr/bin/env python3
import json
import shutil
from pathlib import Path

ROOT = Path.home() / "FlipFinderAI/ticket-frame-native"
DATA = ROOT / "data"

runtime_path = DATA / "runtimeMatchDatabase.json"
full_path = DATA / "matchDatabase.json"
pack_path = DATA / "history-packs/2024-2026.tfdpack"

backup = Path.home() / "FlipFinderAI/ticket-frame-integration-backup-20261009"
backup.mkdir(parents=True, exist_ok=True)

def load(path):
    with path.open() as f:
        return json.load(f)

runtime = load(runtime_path)
full = load(full_path)
pack = load(pack_path)

if len(pack["fixtures"]) != 2274:
    raise SystemExit("STOP: Unexpected missing-fixture count")

if runtime.get("schemaVersion") != 2:
    raise SystemExit("STOP: Unexpected runtime schema")

# Find authoritative competition and season for every fixture.
locations = {}

for competition, seasons in full["competitions"].items():
    for season, bundle in seasons.items():
        for fixture in bundle.get("fixtures", []):
            locations[fixture["id"]] = (competition, season)

existing = set()

for seasons in runtime["competitions"].values():
    for bundle in seasons.values():
        for fixture in bundle.get("fixtures", []):
            existing.add(fixture["id"])

added = 0

for fixture in pack["fixtures"]:
    fid = fixture["id"]

    if fid in existing:
        continue

    if fid not in locations:
        raise SystemExit(f"STOP: Unknown fixture {fid}")

    competition, season = locations[fid]

    # Preserve existing competition and season metadata.
    seasons = runtime["competitions"].setdefault(competition, {})
    bundle = seasons.setdefault(season, {"fixtures": []})

    if not isinstance(bundle.get("fixtures"), list):
        raise SystemExit(f"STOP: Unexpected season structure: {season}")

    bundle["fixtures"].append(fixture)
    existing.add(fid)
    added += 1

if added != 2274:
    raise SystemExit(f"STOP: Expected 2274 additions, got {added}")

backup_path = backup / "runtimeMatchDatabase.before-recent-merge.json"

if not backup_path.exists():
    shutil.copy2(runtime_path, backup_path)

temporary = runtime_path.with_suffix(".json.next")

with temporary.open("w") as f:
    json.dump(runtime, f, separators=(",", ":"), ensure_ascii=False)

temporary.replace(runtime_path)

print("PASS: Added", added, "recent fixtures")
print("PASS: Original runtime database backed up")
print("PASS: Existing fixture IDs preserved")
print("PASS: New runtime fixture count:", len(existing))
