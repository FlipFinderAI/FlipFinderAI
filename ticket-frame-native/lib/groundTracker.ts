import type { AttendanceRecord } from "./attendanceHistory";
import { footballGroundForName } from "./clubGroundMatching";
import { distanceMiles } from "./geoDistance";
import { FOOTBALL_GROUNDS } from "./grounds";

export function confirmedGroundVisitCounts(records: AttendanceRecord[]) {
  return records.reduce<Record<string, number>>((counts, record) => {
    if (!record.confirmed || !record.ground) return counts;
    const matchedGround = footballGroundForName(record.ground);
    if (matchedGround) {
      counts[matchedGround.id] = (counts[matchedGround.id] ?? 0) + 1;
    }
    return counts;
  }, {});
}

export function groundTrackerRows({
  league,
  searchText,
  coordinates,
}: {
  league: string;
  searchText: string;
  coordinates: { latitude: number; longitude: number } | null;
}) {
  const withDistance = FOOTBALL_GROUNDS.filter(
    (ground) => ground.league !== "Historical",
  ).map((ground) => ({
    ...ground,
    distance: coordinates
      ? distanceMiles(
          coordinates.latitude,
          coordinates.longitude,
          ground.latitude,
          ground.longitude,
        )
      : null,
  }));
  const byDistance = (
    a: (typeof withDistance)[number],
    b: (typeof withDistance)[number],
  ) => {
    if (a.distance != null && b.distance != null) return a.distance - b.distance;
    if (a.distance != null) return -1;
    if (b.distance != null) return 1;
    return a.club.localeCompare(b.club);
  };
  const search = searchText.trim().toLowerCase();
  const matched = withDistance
    .filter(
      (ground) =>
        !search ||
        ground.stadium.toLowerCase().includes(search) ||
        ground.club.toLowerCase().includes(search) ||
        ground.address.toLowerCase().includes(search),
    )
    .sort(byDistance);

  return {
    search,
    myLeagueGrounds: withDistance
      .filter((ground) => ground.league === league)
      .sort(byDistance)
      .slice(0, 5),
    allGrounds: search ? matched : matched.slice(0, 5),
  };
}

export type GroundTrackerRow = ReturnType<
  typeof groundTrackerRows
>["allGrounds"][number];
