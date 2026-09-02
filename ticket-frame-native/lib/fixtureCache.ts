import AsyncStorage from "@react-native-async-storage/async-storage";
import { findBundledLeagueForClub, getBundledClubFixtures, localKickoff, type FixtureRow } from "./fixtures";
import { clubNamesMatch, normaliseFixtureText } from "./ticketText";
import { getHistoricalClubFixtures } from "./historicalMatchStore";

export type CachedFixture = {
  fixtureId?: string;
  opponent: string;
  homeAway: "home" | "away";
  date: string;
  dateStatus?: "licensed-source" | "user-confirmed-photo-gps" | "user-confirmed-photo" | "manual-entry" | "unknown";
  dateConfidence?: string | null;
  played?: boolean;
  attendanceEligible?: boolean;
  kickoff?: string | null;
  competition: string;
  season: string;
  round?: string | null;
  venue?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  attendance?: number | null;
  homeScorers?: string[];
  awayScorers?: string[];
  homeShootoutScore?: number | null;
  awayShootoutScore?: number | null;
  shootoutWinner?: "home" | "away" | null;
  homePenaltyScorers?: string[];
  awayPenaltyScorers?: string[];
};

// V10 contains only fixtures rebuilt from the approved bundled providers.
// Retired-provider cache generations are removed without touching saved tickets.
const FIXTURE_CACHE_KEY = "ticket-frame.fixture-cache.v10";

const HISTORICAL_FIXTURE_DATE_CACHE_KEY =
  "ticket-frame.historical-fixture-date-cache.v1";

type HistoricalFixtureDateResolution = {
  date: string;
  provenance:
    | "manual-entry"
    | "user-confirmed-photo"
    | "user-confirmed-photo-gps";
  confirmedAt: number;
};

type HistoricalFixtureDateCache =
  Record<string, HistoricalFixtureDateResolution>;

async function readHistoricalFixtureDateCache(): Promise<HistoricalFixtureDateCache> {
  try {
    const raw = await AsyncStorage.getItem(
      HISTORICAL_FIXTURE_DATE_CACHE_KEY,
    );
    return raw ? (JSON.parse(raw) as HistoricalFixtureDateCache) : {};
  } catch {
    return {};
  }
}

export async function saveManualHistoryFixtureDateResolution(
  fixtureId: string,
  date: string,
  provenance: HistoricalFixtureDateResolution["provenance"] = "manual-entry",
): Promise<void> {
  if (!fixtureId.startsWith("tfmatch:")) {
    throw new Error("Historical fixture requires a TFD fixture id");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Historical fixture requires an ISO date");
  }

  const cache = await readHistoricalFixtureDateCache();

  cache[fixtureId] = {
    date,
    provenance,
    confirmedAt: Date.now(),
  };

  await AsyncStorage.setItem(
    HISTORICAL_FIXTURE_DATE_CACHE_KEY,
    JSON.stringify(cache),
  );
}
const RETIRED_FIXTURE_CACHE_KEYS = [
  "ticket-frame.fixture-cache.v4",
  "ticket-frame.fixture-cache.v5",
  "ticket-frame.fixture-cache.v6",
  "ticket-frame.fixture-cache.v7",
  "ticket-frame.fixture-cache.v8",
  "ticket-frame.fixture-cache.v9",
];
let retiredCachesCleared = false;
type FixtureCacheEntry = { fetchedAt: number; fixtures: CachedFixture[] };
type FixtureCacheShape = Record<string, FixtureCacheEntry>;

function cacheKey(club: string, season: string) {
  return `${normaliseFixtureText(club)}|${season}`;
}

async function readFixtureCache(): Promise<FixtureCacheShape> {
  try {
    if (!retiredCachesCleared) {
      await AsyncStorage.multiRemove(RETIRED_FIXTURE_CACHE_KEYS);
      retiredCachesCleared = true;
    }
    const raw = await AsyncStorage.getItem(FIXTURE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as FixtureCacheShape) : {};
  } catch {
    return {};
  }
}

export async function loadCacheEntry(
  club: string,
  season: string,
): Promise<FixtureCacheEntry | null> {
  return (await readFixtureCache())[cacheKey(club, season)] ?? null;
}

export async function loadCachedFixtures(
  club: string,
  season: string,
): Promise<CachedFixture[]> {
  return (await loadCacheEntry(club, season))?.fixtures ?? [];
}

function historicalSeasonStart(season: string): number | null {
  const match = String(season ?? "").trim().match(/^(\d{4})[\/-]/);
  return match ? Number(match[1]) : null;
}

/**
 * Pre-2000 manual-history helper.
 *
 * Normal Ticket Frame fixture caching deliberately continues to require
 * an authoritative date. This helper is the ONLY path that additionally
 * exposes TFD fixtures whose season/teams/result are known but whose exact
 * match date is still unknown.
 */
export async function loadManualHistoryFixtureSuggestions(
  club: string,
  season: string,
): Promise<CachedFixture[]> {
  const startYear = historicalSeasonStart(season);

  // 2007/08 onward stays in the lightweight startup database.
  if (startYear == null || startYear >= 2007) {
    return loadCachedFixtures(club, season);
  }

  // Older seasons live in the persistent historical store. If the relevant
  // background batch is not ready yet it is imported on demand.
  const bundledSeason = apiSeason(season);
  const rows = await getHistoricalClubFixtures(club, bundledSeason);
  const resolvedDates = await readHistoricalFixtureDateCache();

  const fixtures = rows
    .filter((row) => {
      if (row.date) return true;

      const historical = row as FixtureRow & {
        dateStatus?: string;
        played?: boolean;
        attendanceEligible?: boolean;
      };

      return (
        historical.dateStatus === "unknown" &&
        historical.played !== false &&
        historical.attendanceEligible !== false
      );
    })
    .map((row) => {
      const home = clubNamesMatch(row.homeName, club);
      const historical = row as FixtureRow & {
        dateStatus?: CachedFixture["dateStatus"];
        dateConfidence?: string | null;
        played?: boolean;
        attendanceEligible?: boolean;
      };

      const userResolution = resolvedDates[row.id];
      const effectiveDate = row.date ?? userResolution?.date ?? "";

      const effectiveDateStatus: CachedFixture["dateStatus"] =
        row.date
          ? (historical.dateStatus ?? "licensed-source")
          : (userResolution?.provenance ?? "unknown");

      return {
        fixtureId: row.id,
        opponent: home ? row.awayName : row.homeName,
        homeAway: home ? ("home" as const) : ("away" as const),
        date: effectiveDate,
        dateStatus: effectiveDateStatus,
        dateConfidence: row.date
          ? (historical.dateConfidence ?? null)
          : userResolution
            ? "user-confirmed"
            : "unknown",
        played: historical.played,
        attendanceEligible: historical.attendanceEligible,
        kickoff: localKickoff(row.kickoff),
        competition: row.competition ?? "",
        season,
        round: row.round ?? null,
        venue:
          row.venue ||
          (
            normaliseFixtureText(row.competition ?? "") === "fa cup" &&
            (
              normaliseFixtureText(row.round ?? "") === "semi finals" ||
              normaliseFixtureText(row.round ?? "") === "semi final" ||
              normaliseFixtureText(row.round ?? "") === "final"
            )
              ? "Wembley Stadium"
              : null
          ),
        homeScore: row.homeScore,
        awayScore: row.awayScore,
        attendance: row.attendance ?? null,
        homeScorers: row.homeScorers ?? [],
        awayScorers: row.awayScorers ?? [],
      } satisfies CachedFixture;
    });

  return fixtures.sort((a, b) => {
    // Known dates first. Undated historical fixtures sort by opponent.
    if (Boolean(a.date) !== Boolean(b.date)) return a.date ? -1 : 1;
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return a.opponent.localeCompare(b.opponent);
  });
}

export async function saveCachedFixtures(
  club: string,
  season: string,
  fixtures: CachedFixture[],
): Promise<void> {
  const cache = await readFixtureCache();
  cache[cacheKey(club, season)] = { fetchedAt: Date.now(), fixtures };
  await AsyncStorage.setItem(FIXTURE_CACHE_KEY, JSON.stringify(cache));
}

export function compareFixturesForPicker(a: CachedFixture, b: CachedFixture): number {
  const iso = new Date().toISOString().slice(0, 10);
  const aUpcoming = a.date >= iso;
  const bUpcoming = b.date >= iso;
  if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
  return aUpcoming ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
}

function apiSeason(season: string): string {
  const match = season.trim().match(/^(\d{4})[\/-](\d{2}|\d{4})$/);
  if (!match) return season;
  return `${match[1]}-${Number(match[1]) + 1}`;
}

export async function fetchAndCacheFixtures(
  club: string,
  season: string,
  opts?: { league?: string; forceRefresh?: boolean },
): Promise<CachedFixture[]> {
  const bundledSeason = apiSeason(season);
  const startYear = historicalSeasonStart(season);
  const useHistoricalStore =
    startYear != null && startYear < 2007;

  const resolvedLeague = useHistoricalStore
    ? "historical-store"
    : (
        opts?.league ??
        findBundledLeagueForClub(club, bundledSeason)
      );

  if (!resolvedLeague) {
    return loadCachedFixtures(club, season);
  }

  const rows = useHistoricalStore
    ? await getHistoricalClubFixtures(club, bundledSeason)
    : getBundledClubFixtures(
        club,
        resolvedLeague,
        bundledSeason,
      );
  const fixtures = rows.filter((row) => row.date).map((row) => {
    const home = clubNamesMatch(row.homeName, club);
    return {
      opponent: home ? row.awayName : row.homeName,
      homeAway: home ? "home" as const : "away" as const,
      date: row.date ?? "",
      kickoff: localKickoff(row.kickoff),
      competition: row.competition ?? "",
      season,
      round: row.round ?? null,
      venue:
        row.venue ||
        (
          normaliseFixtureText(row.competition ?? "") === "fa cup" &&
          (
            normaliseFixtureText(row.round ?? "") === "semi finals" ||
            normaliseFixtureText(row.round ?? "") === "semi final" ||
            normaliseFixtureText(row.round ?? "") === "final"
          )
            ? "Wembley Stadium"
            : null
        ),
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      attendance: row.attendance ?? null,
      homeScorers: row.homeScorers ?? [],
      awayScorers: row.awayScorers ?? [],
    } satisfies CachedFixture;
  });
  if (fixtures.length) {
    await saveCachedFixtures(club, season, fixtures);
    return fixtures;
  }

  // A forced refresh is authoritative: if TFD has no matching rows,
  // never resurrect an older cache created under another club/league.
  if (opts?.forceRefresh) {
    await saveCachedFixtures(club, season, []);
    return [];
  }

  return loadCachedFixtures(club, season);
}

export type FixtureCacheState = "fresh" | "stale" | "empty";

export async function getFixtureCacheState(
  club: string,
  season: string,
): Promise<{ state: FixtureCacheState; fetchedAt: number | null; count: number }> {
  const entry = await loadCacheEntry(club, season);
  const count = entry?.fixtures.length ?? 0;
  return { state: count ? "fresh" : "empty", fetchedAt: entry?.fetchedAt ?? null, count };
}

export function matchFixtureForText(
  text: string,
  club: string,
  fixtures: CachedFixture[],
): CachedFixture | null {
  const words = new Set(
    normaliseFixtureText(text).split(" ").filter((word) => word.length >= 4),
  );
  let best: CachedFixture | null = null;
  let bestScore = 0;
  for (const fixture of fixtures) {
    if (clubNamesMatch(fixture.opponent, club)) continue;
    const score = normaliseFixtureText(fixture.opponent)
      .split(" ")
      .filter((word) => word.length >= 4 && words.has(word)).length;
    if (score > bestScore) {
      best = fixture;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}
