import matchDatabaseJson from "../data/matchDatabase.json";
import { seasonForDate } from "./seasons";
import { clubNamesMatch, normaliseFixtureText } from "./ticketText";

function apiSeasonForDate(date: Date): string {
  const season = seasonForDate(date) ?? "";
  const [start, end] = season.split("/");
  return start && end ? `${start}-${Number(start) + 1}` : "";
}

export const CURRENT_SEASON = apiSeasonForDate(new Date());
const currentStartYear = Number(CURRENT_SEASON.split("-")[0]);
export const PRIOR_SEASON = `${currentStartYear - 1}-${currentStartYear}`;

export type FixtureRow = {
  id: string;
  date: string | null;
  dateStatus?: "licensed-source" | "user-confirmed-photo-gps" | "user-confirmed-photo" | "manual-entry" | "unknown";
  dateConfidence?: string | null;
  played?: boolean;
  attendanceEligible?: boolean;
  kickoff: string | null;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  season: string;
  competition: string | null;
  round?: string | null;
  venue: string | null;
  attendance?: number | null;
  homeScorers?: string[];
  awayScorers?: string[];
  homeShootoutScore?: number | null;
  awayShootoutScore?: number | null;
  shootoutWinner?: "home" | "away" | null;
  homePenaltyScorers?: string[];
  awayPenaltyScorers?: string[];
};

export type TableRow = {
  teamId: string;
  name: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type BundledSeason = { fixtures: FixtureRow[]; table: TableRow[] };
export type FootballDataCache = {
  schemaVersion?: number;
  generatedAt: string;
  competitions: Record<string, Record<string, BundledSeason>>;
};
let matchDatabase = matchDatabaseJson as unknown as FootballDataCache;

export function getMatchDatabaseGeneratedAt() {
  return matchDatabase.generatedAt;
}

export function applyHostedMatchDatabase(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FootballDataCache>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.generatedAt !== "string" ||
    !candidate.competitions ||
    typeof candidate.competitions !== "object" ||
    !Number.isFinite(Date.parse(candidate.generatedAt))
  ) return false;
  for (const seasons of Object.values(candidate.competitions)) {
    if (!seasons || typeof seasons !== "object") return false;
    for (const bundle of Object.values(seasons)) {
      if (!Array.isArray(bundle?.fixtures) || !Array.isArray(bundle?.table))
        return false;
    }
  }
  if (Date.parse(candidate.generatedAt) <= Date.parse(matchDatabase.generatedAt))
    return false;
  matchDatabase = candidate as FootballDataCache;
  return true;
}
function namesMatch(a: string, b: string): boolean {
  return clubNamesMatch(a, b);
}

function sortFixtures(rows: FixtureRow[]): FixtureRow[] {
  return [...rows].sort((a, b) =>
    (a.kickoff ?? a.date ?? "9999").localeCompare(b.kickoff ?? b.date ?? "9999"),
  );
}

function footballSeason(leagueLabel: string, season: string): BundledSeason | null {
  return matchDatabase.competitions[leagueLabel]?.[season] ?? null;
}

export function getBundledCompetitionNamesForSeason(
  season: string,
): string[] {
  return Object.entries(matchDatabase.competitions ?? {})
    .filter(([, seasons]) => (seasons[season]?.fixtures ?? []).length > 0)
    .map(([competitionName]) => competitionName)
    .sort((a, b) => a.localeCompare(b));
}

export function getBundledCompetitionFixtures(
  competitionName: string,
  season: string,
): FixtureRow[] {
  return sortFixtures(
    footballSeason(competitionName, season)?.fixtures ?? [],
  );
}

export function getBundledClubFixtures(
  clubName: string,
  _leagueLabel: string,
  season: string,
): FixtureRow[] {
  // TFD is the single source of truth. Search every competition available
  // for this season so league, domestic cup and European fixtures are all
  // discovered automatically.
  const rows = Object.values(matchDatabase.competitions ?? {}).flatMap(
    (seasons) =>
      (seasons[season]?.fixtures ?? []).filter(
        (row) =>
          namesMatch(row.homeName, clubName) ||
          namesMatch(row.awayName, clubName),
      ),
  );

  return sortFixtures(
    Array.from(new Map(rows.map((row) => [row.id, row])).values()),
  );
}

export function getAllBundledClubFixtures(clubName: string): FixtureRow[] {
  const rows = Object.values(matchDatabase.competitions ?? {}).flatMap(
    (seasons) =>
      Object.values(seasons).flatMap((bundle) =>
        (bundle.fixtures ?? []).filter(
          (row) =>
            namesMatch(row.homeName, clubName) ||
            namesMatch(row.awayName, clubName),
        ),
      ),
  );
  return sortFixtures(
    Array.from(new Map(rows.map((row) => [row.id, row])).values()),
  );
}

export function findBundledLeagueForClub(
  clubName: string,
  season?: string,
): string | null {
  const preferredSeason = season ?? CURRENT_SEASON;

  // First prefer a league containing this club in the requested season.
  for (const [competitionName, seasons] of Object.entries(
    matchDatabase.competitions ?? {},
  )) {
    const bundle = seasons[preferredSeason];
    if (!bundle) continue;

    if (
      bundle.fixtures.some(
        (row) =>
          namesMatch(row.homeName, clubName) ||
          namesMatch(row.awayName, clubName),
      )
    ) {
      return competitionName;
    }
  }

  // If the requested season is absent, search every cached season.
  for (const [competitionName, seasons] of Object.entries(
    matchDatabase.competitions ?? {},
  )) {
    for (const bundle of Object.values(seasons)) {
      if (
        bundle.fixtures.some(
          (row) =>
            namesMatch(row.homeName, clubName) ||
            namesMatch(row.awayName, clubName),
        )
      ) {
        return competitionName;
      }
    }
  }

  return null;
}

export async function resolveTeamId(
  teamName: string,
  leagueLabel?: string,
): Promise<string | null> {
  const preferred = leagueLabel ? [matchDatabase.competitions[leagueLabel] ?? {}] : [];
  const competitions = preferred.length ? preferred : Object.values(matchDatabase.competitions);
  for (const competition of competitions) {
    for (const season of Object.values(competition)) {
      for (const row of season.fixtures) {
        if (namesMatch(row.homeName, teamName)) return row.homeId;
        if (namesMatch(row.awayName, teamName)) return row.awayId;
      }
    }
  }
  return null;
}

export type FixturesResult = { source: "league" | "none"; fixtures: FixtureRow[] };

export async function fetchTeamFixturesWithHistory(
  _teamId: string,
  leagueLabel: string,
  opts?: { force?: boolean; teamName?: string; season?: string },
): Promise<FixturesResult> {
  const rows = getBundledClubFixtures(
    opts?.teamName ?? "",
    leagueLabel,
    opts?.season ?? CURRENT_SEASON,
  );
  return rows.length ? { source: "league", fixtures: rows } : { source: "none", fixtures: [] };
}

export async function fetchTeamFixtures(
  teamId: string,
  leagueLabel: string,
  opts?: { force?: boolean; teamName?: string },
): Promise<FixturesResult> {
  return fetchTeamFixturesWithHistory(teamId, leagueLabel, { ...opts, season: CURRENT_SEASON });
}

export async function loadCachedClubFixtures(
  leagueLabel: string,
  teamName: string,
  _fallbackTeamId: string,
): Promise<FixtureRow[]> {
  return getBundledClubFixtures(teamName, leagueLabel, CURRENT_SEASON);
}

export type ClubFixtureSummary = {
  opponent: string;
  homeAway: "home" | "away";
  date: string;
  kickoff?: string | null;
  competition: string;
  season: string;
};

export function localKickoff(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export async function getClubFixtureSummaries(
  clubName: string,
  leagueLabel: string,
  season: string = CURRENT_SEASON,
): Promise<ClubFixtureSummary[]> {
  return getBundledClubFixtures(clubName, leagueLabel, season).map((row) => {
    const home = namesMatch(row.homeName, clubName);
    return {
      opponent: home ? row.awayName : row.homeName,
      homeAway: home ? "home" : "away",
      date: row.date ?? "",
      kickoff: localKickoff(row.kickoff),
      competition: row.competition ?? "",
      season,
    };
  });
}

export type TableResult = { rows: TableRow[]; season: string };

export async function fetchLeagueTable(
  leagueLabel: string,
  season: string = CURRENT_SEASON,
): Promise<TableResult> {
  return { rows: footballSeason(leagueLabel, season)?.table ?? [], season };
}

export async function fetchLeagueTableWithFallback(
  leagueLabel: string,
): Promise<TableResult> {
  const current = await fetchLeagueTable(leagueLabel, CURRENT_SEASON);
  return current.rows.length ? current : fetchLeagueTable(leagueLabel, PRIOR_SEASON);
}

export function isFixturePlayed(row: FixtureRow): boolean {
  return row.homeScore != null && row.awayScore != null;
}
