import reconciled from "../data/reconciledStadiumVenues.json";

const venues = reconciled.venues as Record<string, string>;

export function reconciledVenueForFixture(
  fixtureId: string,
): string | null {
  return venues[fixtureId] ?? null;
}
