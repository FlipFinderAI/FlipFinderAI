import type { AttendanceRecord } from "./attendanceHistory";
import { FOOTBALL_GROUNDS } from "./grounds";
import { normaliseFixtureText } from "./ticketText";

export function historyStadiumRows(records: AttendanceRecord[]) {
  const stadiumMap = new Map<
    string,
    { name: string; visits: number; clubs: Map<string, number> }
  >();

  for (const record of records) {
    if (!record.confirmed || !record.ground?.trim()) continue;
    const key = normaliseFixtureText(record.ground);
    const entry = stadiumMap.get(key) ?? {
      name: record.ground.trim(),
      visits: 0,
      clubs: new Map<string, number>(),
    };
    entry.visits += 1;
    entry.clubs.set(record.club, (entry.clubs.get(record.club) ?? 0) + 1);
    stadiumMap.set(key, entry);
  }

  return Array.from(stadiumMap.values())
    .map((entry) => {
      const groundKey = normaliseFixtureText(entry.name);
      const club =
        groundKey === normaliseFixtureText("Wembley Stadium")
          ? "Home of World Cup 1966 Champions"
          : (FOOTBALL_GROUNDS.find(
              (ground) => normaliseFixtureText(ground.stadium) === groundKey,
            )?.club ?? "Club not listed");
      return { name: entry.name, visits: entry.visits, club };
    })
    .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
}

export function uniqueHistoryStadiumCount(records: AttendanceRecord[]) {
  return new Set(
    records
      .map((record) => record.ground?.trim())
      .filter((ground): ground is string => Boolean(ground))
      .map((ground) => normaliseFixtureText(ground)),
  ).size;
}
