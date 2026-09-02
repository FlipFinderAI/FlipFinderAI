import type { AttendanceRecord, AttendanceResult } from "./attendanceHistory";

export const HISTORY_SOURCE_LABEL: Record<AttendanceRecord["source"], string> = {
  ticket: "FROM TICKET",
  "season-ticket": "SEASON TICKET",
  manual: "MANUAL ENTRY",
  "imported-history": "IMPORTED HISTORY",
  "photo-discovery": "PHOTO DISCOVERY",
};

export function newestConfirmedHistory(records: AttendanceRecord[]) {
  return [...records]
    .filter((record) => record.confirmed)
    .sort(
      (a, b) =>
        (b.matchDate ?? "").localeCompare(a.matchDate ?? "") ||
        b.createdAt - a.createdAt,
    );
}

export function historyCompetitionOptions(records: AttendanceRecord[]) {
  return [
    "All Competitions",
    "Home Games",
    "Away Games",
    ...Array.from(
      new Set(
        records
          .map((record) => record.competition)
          .filter(
            (competition): competition is string =>
              Boolean(competition && competition.trim()),
          ),
      ),
    ).sort((a, b) => a.localeCompare(b)),
  ];
}

export function filteredHistoryMatches(
  newestFirst: AttendanceRecord[],
  competitionFilter: string,
  sortOrder: "newest" | "oldest",
) {
  const filtered = newestFirst.filter((record) => {
    if (competitionFilter === "All Competitions") return true;
    if (competitionFilter === "Home Games") return record.homeAway === "home";
    if (competitionFilter === "Away Games") return record.homeAway === "away";
    return record.competition === competitionFilter;
  });
  return sortOrder === "newest" ? filtered : [...filtered].reverse();
}

export function attendanceResultCounts(
  records: AttendanceRecord[],
  resultForRecord: (record: AttendanceRecord) => AttendanceResult | null,
) {
  return records.reduce(
    (counts, record) => {
      const result = resultForRecord(record);
      if (result) counts[result] += 1;
      return counts;
    },
    { win: 0, draw: 0, loss: 0 },
  );
}
