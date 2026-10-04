import type { AttendanceRecord } from "./attendanceHistory";
import { footballGroundForName } from "./clubGroundMatching";
import { distanceMiles } from "./geoDistance";
import { FOOTBALL_GROUNDS, type FootballGround } from "./grounds";

import { TFD_CURRENT_GROUNDS } from "./tfdCurrentGrounds.generated";
import { VERIFIED_ADDITIONAL_GROUNDS } from "./verifiedAdditionalGrounds";
export const TRACKER_CURRENT_GROUNDS: FootballGround[] = Array.from(
  [
    ...FOOTBALL_GROUNDS.filter(
      (ground) => ground.league !== "Historical",
    ),
    ...TFD_CURRENT_GROUNDS,
    ...VERIFIED_ADDITIONAL_GROUNDS,
  ].reduce((grounds, ground) => {
    const key = [
      ground.stadium.trim().toLowerCase(),
      ground.latitude.toFixed(5),
      ground.longitude.toFixed(5),
    ].join("|");

    if (!grounds.has(key)) {
      grounds.set(key, ground);
    }

    return grounds;
  }, new Map<string, FootballGround>()).values(),
);


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
  const withDistance = TRACKER_CURRENT_GROUNDS.map((ground) => ({
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
