#!/usr/bin/env python3
import json
import hashlib
import re
import shutil
from pathlib import Path
from collections import Counter

APP = Path.home() / "FlipFinderAI/ticket-frame-native"
RUNNER = Path.home() / "FlipFinderAI/ticket-frame-tfd-runner"

DATA = APP / "data"
PACKS = DATA / "history-packs"
LIB = APP / "lib"

FULL = DATA / "matchDatabase.json"
RUNTIME = DATA / "runtimeMatchDatabase.json"
MAP = RUNNER / "data/fixtureStadiumMap.json"
REGISTRY = RUNNER / "data/stadiumRegistry.json"

STORE = LIB / "historicalMatchStore.ts"
FIXTURES = LIB / "fixtures.ts"

BACKUP = APP / "integration-backup-20261009"
BACKUP.mkdir(exist_ok=True)

def load(path):
    with path.open() as f:
        return json.load(f)

def save(path, obj):
    temporary = path.with_suffix(path.suffix + ".next")
    with temporary.open("w") as f:
        json.dump(obj, f, separators=(",", ":"), ensure_ascii=False)
    temporary.replace(path)

def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def backup(path):
    destination = BACKUP / path.relative_to(APP)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        shutil.copy2(path, destination)

print("=== VERIFY SOURCE ===")

if sha(FULL) != sha(RUNNER / "data/matchDatabase.json"):
    raise SystemExit("STOP: Authoritative fixture databases differ")

full = load(FULL)
runtime = load(RUNTIME)
mapping = load(MAP)
registry = load(REGISTRY)

if full.get("schemaVersion") != 2:
    raise SystemExit("STOP: Unexpected database schema")

fixtures = {}
fixture_seasons = {}

for competition, seasons in full["competitions"].items():
    for season, bundle in seasons.items():
        for fixture in bundle.get("fixtures", []):
            fid = fixture["id"]
            if fid in fixtures:
                raise SystemExit(f"STOP: Duplicate fixture {fid}")
            fixtures[fid] = fixture
            fixture_seasons[fid] = season

if len(fixtures) != 217305:
    raise SystemExit("STOP: Unexpected fixture count")

print("Authoritative fixtures:", len(fixtures))

# Preserve all existing historical packs.
packed = set()
for path in PACKS.glob("*.tfdpack"):
    pack = load(path)
    for fixture in pack["fixtures"]:
        packed.add(fixture["id"])

if not packed <= fixtures.keys():
    raise SystemExit("STOP: Historical pack contains unknown fixture IDs")

# Preserve runtime data, including any newer live information.
runtime_ids = set()
for seasons in runtime["competitions"].values():
    for bundle in seasons.values():
        for fixture in bundle.get("fixtures", []):
            runtime_ids.add(fixture["id"])

missing = set(fixtures) - packed - runtime_ids

print("Historical pack fixtures:", len(packed))
print("Runtime fixture IDs:", len(runtime_ids))
print("Missing fixture IDs:", len(missing))

# Add missing recent fixtures to a separate pack.
# Do not overwrite the existing runtime or historical packs.
recent = []

for fid in sorted(missing):
    season = fixture_seasons[fid]
    year = re.match(r"^(\d{4})", season)
    if not year or int(year.group(1)) < 2024:
        raise SystemExit(f"STOP: Unexpected missing historical fixture {fid}")
    recent.append(fixtures[fid])

# Build a separate stadium lookup, retaining validation status.
stadiums = registry.get("stadiums", {})
if not isinstance(stadiums, dict):
    raise SystemExit("STOP: Invalid stadium registry")

# These statuses represent explicitly reviewed or independently
# supported venue assignments, rather than generic assumptions.
ACCEPTED = {
    "VERIFIED",
    "VERIFIED_EXTERNAL",
    "VERIFIED_HISTORICAL_HOME_GROUND",
    "VERIFIED_FIXTURE_VENUE",
    "VERIFIED_MATCH_VENUE",
    "EXTERNAL_EXACT",
    "REVIEWED_OCCUPANCY",
    "MATCH_VENUE_NAME_MATCH",
    "EVIDENCE_BACKED_CORRECTION",
}

assignments = {}
conflicts = set()

for row in mapping.get("resolvedFixtures", []):
    fid = row.get("fixtureId")
    if fid not in fixtures:
        continue

    status = row.get("validationStatus")
    if status not in ACCEPTED:
        continue

    stadium = row.get("stadium")
    if not isinstance(stadium, dict):
        continue

    sid = stadium.get("stadiumId")
    if sid not in stadiums:
        continue

    previous = assignments.get(fid)
    if previous and previous["stadiumId"] != sid:
        conflicts.add(fid)
        continue

    assignments[fid] = {
        "stadiumId": sid,
        "status": status,
    }

for fid in conflicts:
    assignments.pop(fid, None)

def stadium_name(stadium):
    if not isinstance(stadium, dict):
        return None
    for key in ("canonicalName", "name", "displayName", "stadiumName"):
        value = stadium.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None

venues = {}

for fid, assignment in assignments.items():
    sid = assignment["stadiumId"]
    name = stadium_name(stadiums[sid])
    if name:
        venues[fid] = name

print("Evidence-backed venue names:", len(venues))
print("Conflicting fixture mappings held:", len(conflicts))

# Version is content-addressed so existing SQLite packs can be
# invalidated when the reconciled data changes.
version = hashlib.sha256(
    (sha(FULL) + sha(MAP) + sha(REGISTRY)).encode()
).hexdigest()[:20]

# Stage new data first.
recent_pack = {
    "schemaVersion": 1,
    "sourceVersion": version,
    "packId": "2024-2026",
    "firstSeasonStart": 2024,
    "lastSeasonStart": 2026,
    "fixtures": recent,
}

stadium_lookup = {
    "schemaVersion": 1,
    "sourceVersion": version,
    "venues": venues,
}

recent_path = PACKS / "2024-2026.tfdpack"
stadium_path = DATA / "reconciledStadiumVenues.json"

# Existing files are left untouched until source and coverage checks pass.
covered = (packed | runtime_ids | missing) & set(fixtures)
if covered != set(fixtures):
    raise SystemExit("STOP: Incomplete authoritative fixture coverage")

print("Coverage validated: 217,305 / 217,305")

# Only generate the data package in this first stage.
# Wiring the loader requires a corresponding TypeScript update.
save(recent_path, recent_pack)
save(stadium_path, stadium_lookup)

print()
print("=== GENERATED ===")
print(recent_path)
print(stadium_path)
print("Recent pack fixtures:", len(recent))
print("Stadium venue mappings:", len(venues))
print("Source version:", version)
print()
print("Existing runtime and historical packs unchanged.")
print("Next step: connect these generated files to the app.")
