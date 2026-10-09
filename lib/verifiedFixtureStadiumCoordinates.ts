import coordinates from "../data/verifiedFixtureStadiumCoordinates.json";

type StadiumCoordinates = {
  stadiumId: string;
  latitude: number;
  longitude: number;
};

const fixtureCoordinates = coordinates as Record<string, StadiumCoordinates>;

/**
 * Return verified physical stadium coordinates for a fixture.
 *
 * Historical stadium names are deliberately excluded from this lookup.
 * Stadium identity, rather than naming rights, determines the location.
 */
export function verifiedCoordinatesForFixture(
  fixtureId: string | null | undefined,
): StadiumCoordinates | null {
  if (!fixtureId) return null;

  const location = fixtureCoordinates[fixtureId];
  if (!location) return null;

  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    Math.abs(location.latitude) > 90 ||
    Math.abs(location.longitude) > 180
  ) {
    return null;
  }

  return location;
}
