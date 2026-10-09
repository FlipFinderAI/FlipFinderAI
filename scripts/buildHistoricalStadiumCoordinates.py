import json
import math
from pathlib import Path
from collections import Counter

root = Path.home() / "FlipFinderAI"
source = root / "ticket-frame-tfd-runner/data"
output = Path("data/historicalFixtureStadiumCoordinates.json")

fixture_data = json.loads(
    (source / "fixtureStadiumMap.json").read_text()
)
registry_data = json.loads(
    (source / "stadiumRegistry.json").read_text()
)

fixtures = fixture_data["resolvedFixtures"]
stadiums = registry_data["stadiums"]

result = {}
conflicting_ids = set()
counts = Counter()
statuses = Counter()
methods = Counter()

blocked_terms = (
    "UNRESOLVED",
    "CONFLICT",
    "INSUFFICIENT",
    "REJECTED",
    "DISPUTED",
    "WRONG",
    "HOLD",
)

for fixture in fixtures:
    counts["total"] += 1

    fixture_id = fixture.get("fixtureId")
    date = fixture.get("date")

    if not fixture_id:
        counts["missing_fixture_id"] += 1
        continue

    # Explicit dates outside the requested period are excluded.
    # Null dates are not treated as proof of being post-2000.
    if not isinstance(date, str) or len(date) < 10:
        counts["unknown_date"] += 1
        continue

    if date[:10] < "2000-01-01" or date[:10] > "2026-10-09":
        counts["outside_period"] += 1
        continue

    status = str(fixture.get("validationStatus") or "")
    method = str(fixture.get("resolutionMethod") or "")

    statuses[status] += 1
    methods[method] += 1

    if any(term in status.upper() for term in blocked_terms):
        counts["blocked_status"] += 1
        continue

    if any(term in method.upper() for term in blocked_terms):
        counts["blocked_method"] += 1
        continue

    stadium = fixture.get("stadium") or {}

    if isinstance(stadium, dict):
        stadium_id = stadium.get("stadiumId")
        stadium_name = stadium.get("stadiumName")
    elif isinstance(stadium, str):
        stadium_id = stadium
        stadium_name = None
    else:
        stadium_id = None
        stadium_name = None

    if not stadium_id:
        counts["missing_stadium_id"] += 1
        continue

    registry_entry = stadiums.get(stadium_id)

    if not isinstance(registry_entry, dict):
        counts["missing_registry_entry"] += 1
        continue

    coords = registry_entry.get("coordinates") or {}

    latitude = coords.get("latitude")
    longitude = coords.get("longitude")

    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        counts["missing_coordinates"] += 1
        continue

    if not (
        math.isfinite(latitude)
        and math.isfinite(longitude)
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
    ):
        counts["invalid_coordinates"] += 1
        continue

    record = {
        "stadiumId": stadium_id,
        "latitude": latitude,
        "longitude": longitude,
        "stadiumName": registry_entry.get("canonicalName")
            or stadium_name,
        "validationStatus": status,
        "resolutionMethod": method,
    }

    if fixture_id in conflicting_ids:
        continue

    if fixture_id in result and result[fixture_id] != record:
        counts["duplicate_conflict"] += 1
        conflicting_ids.add(fixture_id)
        del result[fixture_id]
        continue

    result[fixture_id] = record

output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(
    json.dumps(result, ensure_ascii=False, separators=(",", ":"))
)

print("\n=== HISTORICAL STADIUM EXPORT ===")
print("Source fixtures:", len(fixtures))
print("Exported mappings:", len(result))
print("Unique stadium IDs:", len({
    value["stadiumId"] for value in result.values()
}))
print("Output:", output)
print("File size MB:", round(output.stat().st_size / 1048576, 2))

print("\n=== EXCLUSIONS ===")
for name, count in counts.most_common():
    print(f"{name}: {count:,}")

print("\n=== INCLUDED VALIDATION STATUSES ===")
for name, count in statuses.most_common():
    print(f"{name}: {count:,}")

print("\n=== INCLUDED RESOLUTION METHODS ===")
for name, count in methods.most_common():
    print(f"{name}: {count:,}")
