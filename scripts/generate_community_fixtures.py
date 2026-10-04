import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

RUNNER = Path(
    os.environ.get(
        "TICKET_FRAME_TFD_RUNNER",
        str(Path.home() / "FlipFinderAI/ticket-frame-tfd-runner"),
    )
)

RUNTIME = ROOT / "data/runtimeMatchDatabase.json"
MAP_FILE = RUNNER / "data/fixtureStadiumMap.json"
REGISTRY_FILE = RUNNER / "data/stadiumRegistry.json"
OUTPUT = ROOT / "community-fixture-service/src/fixtures.generated.ts"

QUALIFIED_KICKOFF = re.compile(
    r"T.*(?:Z|[+-]\d{2}:\d{2})$"
)

TRUSTED_COORDINATE_STATUSES = {
    "WIKIDATA_COORDINATES_VERIFIED",
}

TRUSTED_COORDINATE_VERIFICATIONS = {
    "TARGETED_EXTERNAL_IDENTITY_VERIFIED",
}


def fail(message):
    raise SystemExit(f"FAIL — {message}")


def finite_number(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
    )


for required in (RUNTIME, MAP_FILE, REGISTRY_FILE):
    if not required.exists():
        fail(f"missing {required}")


runtime = json.loads(RUNTIME.read_text())
map_doc = json.loads(MAP_FILE.read_text())
registry_doc = json.loads(REGISTRY_FILE.read_text())

stadiums = registry_doc.get("stadiums", {})

if not isinstance(stadiums, dict):
    fail("stadium registry shape invalid")


map_by_fixture = {}

for record in map_doc.get("resolvedFixtures", []):
    if not isinstance(record, dict):
        continue

    fixture_id = record.get("fixtureId")

    if isinstance(fixture_id, str) and fixture_id:
        map_by_fixture[fixture_id] = record


trusted_stadiums = {}

for stadium_id, stadium in stadiums.items():
    if not isinstance(stadium, dict):
        continue

    coords = stadium.get("coordinates")

    if not isinstance(coords, dict):
        continue

    lat = coords.get("latitude")
    lon = coords.get("longitude")

    if not finite_number(lat) or not finite_number(lon):
        continue

    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        continue

    status = str(stadium.get("status", ""))
    verification = str(
        stadium.get("coordinateVerification", "")
    )

    coordinate_trusted = (
        status in TRUSTED_COORDINATE_STATUSES
        or verification in TRUSTED_COORDINATE_VERIFICATIONS
    )

    if not coordinate_trusted:
        continue

    name = stadium.get("canonicalName")

    if not isinstance(name, str) or not name.strip():
        continue

    trusted_stadiums[stadium_id] = {
        "stadium": name.strip(),
        "latitude": float(lat),
        "longitude": float(lon),
    }


fixtures = []
seen = set()

stats = {
    "runtimeFixtures": 0,
    "qualifiedKickoffs": 0,
    "exactFixtureMappings": 0,
    "trustedCoordinateFixtures": 0,
    "rejectedUnresolvedFixtureMappings": 0,
}


for competition_key, seasons in runtime.get(
    "competitions", {}
).items():
    if not isinstance(seasons, dict):
        continue

    for season_key, season_data in seasons.items():
        if not isinstance(season_data, dict):
            continue

        season_fixtures = season_data.get("fixtures", [])

        if not isinstance(season_fixtures, list):
            continue

        for fixture in season_fixtures:
            if not isinstance(fixture, dict):
                continue

            stats["runtimeFixtures"] += 1

            fixture_id = fixture.get("id")
            kickoff = fixture.get("kickoff")
            home = fixture.get("homeClubId")
            away = fixture.get("awayClubId")

            if (
                not isinstance(fixture_id, str)
                or not fixture_id
                or not isinstance(kickoff, str)
                or not QUALIFIED_KICKOFF.search(kickoff)
                or not isinstance(home, str)
                or not home
                or not isinstance(away, str)
                or not away
            ):
                continue

            stats["qualifiedKickoffs"] += 1

            mapping = map_by_fixture.get(fixture_id)

            if not isinstance(mapping, dict):
                continue

            stats["exactFixtureMappings"] += 1

            if str(
                mapping.get("validationStatus", "")
            ) == "UNRESOLVED":
                stats[
                    "rejectedUnresolvedFixtureMappings"
                ] += 1
                continue

            stadium_ref = mapping.get("stadium")

            if not isinstance(stadium_ref, dict):
                continue

            stadium_id = stadium_ref.get("stadiumId")

            if (
                not isinstance(stadium_id, str)
                or stadium_id not in trusted_stadiums
            ):
                continue

            trusted = trusted_stadiums[stadium_id]

            club_ids = []

            for club_id in (home, away):
                if club_id not in club_ids:
                    club_ids.append(club_id)

            competition = fixture.get("competition")

            if not isinstance(competition, str) or not competition:
                competition = str(competition_key)

            item = {
                "id": fixture_id,
                "clubIds": club_ids,
                "kickoff": kickoff,
                "stadium": trusted["stadium"],
                "latitude": trusted["latitude"],
                "longitude": trusted["longitude"],
                "homeClubId": home,
                "awayClubId": away,
                "competition": competition,
            }

            if fixture_id in seen:
                fail(f"duplicate fixture id {fixture_id}")

            seen.add(fixture_id)
            fixtures.append(item)
            stats["trustedCoordinateFixtures"] += 1


fixtures.sort(
    key=lambda f: (
        f["kickoff"],
        f["id"],
    )
)


if not fixtures:
    fail("generator produced zero trusted fixtures")


elland = [
    f for f in fixtures
    if f["stadium"] == "Elland Road"
]

if not elland:
    fail("no trusted Elland Road fixtures generated")


bad = [
    f for f in fixtures
    if f["stadium"] in {
        "The Valley",
        "Memorial Stadium",
        "Hillsborough",
        "Stade Vélodrome",
    }
]

if bad:
    fail(
        "known unsafe stadium coordinates entered "
        "Community fixture output: "
        + ", ".join(sorted({f["stadium"] for f in bad}))
    )


header = """\
export type CommunityVerifiedFixture = {
  id: string;
  clubIds: string[];
  kickoff: string;
  stadium: string;
  latitude: number;
  longitude: number;
  homeClubId?: string;
  awayClubId?: string;
  competition?: string;
};

"""

payload = json.dumps(
    fixtures,
    ensure_ascii=False,
    indent=2,
    sort_keys=True,
)

OUTPUT.write_text(
    header
    + "export const FIXTURES: CommunityVerifiedFixture[] = "
    + payload
    + ";\n"
)

print("COMMUNITY FIXTURE GENERATION: PASS")
print("TRUSTED STADIUMS:", len(trusted_stadiums))

for key, value in stats.items():
    print(f"{key}: {value}")

print("GENERATED FIXTURES:", len(fixtures))
print("ELLAND ROAD FIXTURES:", len(elland))
print("OUTPUT:", OUTPUT)
