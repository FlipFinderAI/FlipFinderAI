#!/usr/bin/env python3
import json
import shutil
from pathlib import Path

APP = Path.home() / "FlipFinderAI/ticket-frame-native"
RUNNER = Path.home() / "FlipFinderAI/ticket-frame-tfd-runner"

lookup_path = APP / "data/reconciledStadiumVenues.json"
map_path = RUNNER / "data/fixtureStadiumMap.json"
module_path = APP / "lib/reconciledStadiums.ts"

backup_dir = Path.home() / "FlipFinderAI/ticket-frame-integration-backup-20261009"
backup_dir.mkdir(exist_ok=True)

with lookup_path.open() as f:
    lookup = json.load(f)

with map_path.open() as f:
    mapping = json.load(f)

venues = lookup["venues"]
original_count = len(venues)

# These statuses establish a specific match venue rather than
# a generic assumption about the home club.
EXACT = {
    "VERIFIED_FIXTURE_VENUE",
    "VERIFIED_MATCH_VENUE",
    "VERIFIED_EXTERNAL",
    "EXTERNAL_EXACT",
}

# A conflict must never be replaced by home-ground inference.
blocked = set()
added = 0
conflicts = 0

for row in mapping["resolvedFixtures"]:
    fid = row.get("fixtureId")
    status = row.get("validationStatus")

    if not fid:
        continue

    if status == "CONFLICTING_VENUE_EVIDENCE":
        blocked.add(fid)
        conflicts += 1
        continue

    if status not in EXACT:
        continue

    stadium = row.get("stadium")
    if not isinstance(stadium, dict):
        continue

    name = stadium.get("stadiumName")

    if not isinstance(name, str) or not name.strip():
        continue

    name = name.strip()

    # Preserve existing mappings rather than silently replacing them.
    if fid not in venues:
        venues[fid] = name
        added += 1

for fid in blocked:
    venues.pop(fid, None)

lookup["blockedFixtureIds"] = sorted(blocked)

# Back up the original lookup before replacing it.
backup_lookup = backup_dir / "reconciledStadiumVenues.before-neutral-fix.json"
if not backup_lookup.exists():
    shutil.copy2(lookup_path, backup_lookup)

temporary = lookup_path.with_suffix(".json.next")
with temporary.open("w") as f:
    json.dump(lookup, f, separators=(",", ":"), ensure_ascii=False)
temporary.replace(lookup_path)

# Update the existing TypeScript helper.
module = '''import reconciled from "../data/reconciledStadiumVenues.json";

const venues = reconciled.venues as Record<string, string>;
const blocked = new Set<string>(reconciled.blockedFixtureIds);

export function reconciledVenueForFixture(
  fixtureId: string,
): string | null {
  return venues[fixtureId] ?? null;
}

export function isVenueEvidenceConflicted(
  fixtureId: string,
): boolean {
  return blocked.has(fixtureId);
}
'''

backup_module = backup_dir / "reconciledStadiums.before-neutral-fix.ts"
if not backup_module.exists():
    shutil.copy2(module_path, backup_module)

module_path.write_text(module)

# Protect unresolved conflicts in both fixture resolution paths.
for filename, variable in [
    ("lib/fixtures.ts", "row"),
    ("lib/historicalMatchStore.ts", "fixture"),
]:
    path = APP / filename
    source = path.read_text()

    old_import = (
        'import { reconciledVenueForFixture } '
        'from "./reconciledStadiums";'
    )

    new_import = (
        'import { reconciledVenueForFixture, '
        'isVenueEvidenceConflicted } '
        'from "./reconciledStadiums";'
    )

    if old_import not in source:
        raise SystemExit(f"STOP: Expected import missing in {filename}")

    source = source.replace(old_import, new_import, 1)

    old = f"    venueForFixture({variable});"
    new = (
        f"    (isVenueEvidenceConflicted({variable}.id)"
        f" ? null : venueForFixture({variable}));"
    )

    if old not in source:
        raise SystemExit(f"STOP: Expected resolver missing in {filename}")

    source = source.replace(old, new, 1)

    backup_source = backup_dir / (path.name + ".before-neutral-fix")
    if not backup_source.exists():
        shutil.copy2(path, backup_source)

    path.write_text(source)

print("Previous stadium mappings:", original_count)
print("Additional explicitly verified venue names:", added)
print("Conflicting fixtures protected:", conflicts)
print("Total stadium mappings:", len(venues))
print("PASS: Stadium integration updated")
