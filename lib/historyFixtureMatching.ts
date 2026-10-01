import type { AttendanceRecord } from "./attendanceHistory";
import type { CachedFixture } from "./fixtureCache";
import { getBundledClubFixtures } from "./fixtures";
import { clubNamesMatch, normaliseFixtureText } from "./ticketText";

export function normaliseHistorySeasonKey(
  value: string | null | undefined,
) {
  const season = String(value ?? "").trim();
  const slash = season.match(/^(\d{4})\/(?:\d{2}|\d{4})$/);
  if (slash) return `${slash[1]}-${Number(slash[1]) + 1}`;
  return season;
}

export function fixtureForAttendance(
  record: AttendanceRecord,
  historyFixtures: CachedFixture[],
  options?: { allowBundledFallback?: boolean },
): CachedFixture | undefined {
  const targetSeason = normaliseHistorySeasonKey(record.season);
  const matchesRecord = (fixture: CachedFixture) =>
    fixture.date === record.matchDate &&
    normaliseHistorySeasonKey(fixture.season) === targetSeason &&
    clubNamesMatch(fixture.opponent, record.opponent);

  // First use the already hydrated History fixture collection.
  let candidates = historyFixtures.filter(matchesRecord);

  // If History has not hydrated this cup fixture, consult bundled TFD
  // directly. TFD contains league, domestic cup and European competitions.
  if (
    options?.allowBundledFallback !== false &&
    !candidates.length &&
    record.club &&
    targetSeason
  ) {
    candidates = getBundledClubFixtures(record.club, "", targetSeason)
      .filter(
        (fixture) =>
          fixture.date === record.matchDate &&
          (clubNamesMatch(fixture.homeName, record.opponent) ||
            clubNamesMatch(fixture.awayName, record.opponent)),
      )
      .map((fixture) => {
        const clubIsHome = clubNamesMatch(fixture.homeName, record.club);
        return {
          opponent: clubIsHome ? fixture.awayName : fixture.homeName,
          homeAway: clubIsHome ? ("home" as const) : ("away" as const),
          date: fixture.date ?? "",
          kickoff: fixture.kickoff,
          competition: fixture.competition ?? "",
          season: record.season,
          venue: fixture.venue ?? null,
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
          attendance: fixture.attendance ?? null,
          homeScorers: fixture.homeScorers ?? [],
          awayScorers: fixture.awayScorers ?? [],
          homeShootoutScore: fixture.homeShootoutScore ?? null,
          awayShootoutScore: fixture.awayShootoutScore ?? null,
          shootoutWinner: fixture.shootoutWinner ?? null,
          homePenaltyScorers: fixture.homePenaltyScorers ?? [],
          awayPenaltyScorers: fixture.awayPenaltyScorers ?? [],
        } satisfies CachedFixture;
      });
  }

  if (!candidates.length) return undefined;

  const competition = normaliseFixtureText(record.competition ?? "");
  return (
    candidates.find(
      (fixture) =>
        !competition ||
        normaliseFixtureText(fixture.competition) === competition,
    ) ?? candidates[0]
  );
}
