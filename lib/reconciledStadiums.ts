import reconciled from "../data/reconciledStadiumVenues.json";

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
