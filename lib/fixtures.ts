import { reconciledVenueForFixture } from "./reconciledStadiums";
import matchDatabaseJson from "../data/runtimeMatchDatabase.json";
import { seasonForDate } from "./seasons";
import { clubNamesMatch, normaliseFixtureText } from "./ticketText";
import { venueForFixture } from "./clubGroundMatching";

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
  stage?: "qualifying" | "league" | "playoff" | "knockout" | null;
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
const bundledMatchDatabase =
  matchDatabaseJson as unknown as FootballDataCache;

let matchDatabase = bundledMatchDatabase;

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
  /*
   * A locally bundled database can have a newer build timestamp while its
   * current-season results are older than the hosted TFD feed. This happens
   * when the app database is rebuilt for unrelated data work (for example,
   * historical/competition enrichment) after the live results snapshot was
   * generated.
   *
   * Do not reject that hosted snapshot purely because of generatedAt when it
   * contains completed fixture scores that the current in-memory database
   * does not yet have.
   */
  const hostedAddsCompletedScores = Object.entries(
    candidate.competitions,
  ).some(([competitionName, hostedSeasons]) => {
    const existingSeasons =
      matchDatabase.competitions[competitionName] ?? {};

    return Object.entries(hostedSeasons).some(
      ([season, hostedBundle]) => {
        const existingFixtures =
          existingSeasons[season]?.fixtures ?? [];

        const existingById = new Map(
          existingFixtures.map((fixture) => [fixture.id, fixture]),
        );

        const existingByIdentity = new Map(
          existingFixtures.map((fixture) => [
            [
              season,
              fixture.date ?? "",
              normaliseFixtureText(fixture.homeName),
              normaliseFixtureText(fixture.awayName),
            ].join("|"),
            fixture,
          ]),
        );

        return (hostedBundle.fixtures ?? []).some((hostedFixture) => {
          if (
            hostedFixture.homeScore == null ||
            hostedFixture.awayScore == null
          ) {
            return false;
          }

          const identity = [
            season,
            hostedFixture.date ?? "",
            normaliseFixtureText(hostedFixture.homeName),
            normaliseFixtureText(hostedFixture.awayName),
          ].join("|");

          const existingFixture =
            existingById.get(hostedFixture.id) ??
            existingByIdentity.get(identity);

          return (
            !existingFixture ||
            existingFixture.homeScore == null ||
            existingFixture.awayScore == null
          );
        });
      },
    );
  });

  if (
    Date.parse(candidate.generatedAt) <=
      Date.parse(matchDatabase.generatedAt) &&
    !hostedAddsCompletedScores
  ) {
    return false;
  }

  // V4.0.86 — hosted TFD updates must never erase valid bundled history.
  // The bundled database is the complete base. A newer hosted snapshot may
  // replace competitions/seasons it actually supplies, while seasons absent
  // from that snapshot remain available from the bundled database.
  const hosted = candidate as FootballDataCache;
  // Always merge hosted TFD data onto the original bundled database.
  // Never use the already-hydrated runtime database as the base, otherwise
  // an older phone-side hosted snapshot can become the effective source
  // and hide newly bundled competitions such as domestic cups/european data.
  const mergedCompetitions: FootballDataCache["competitions"] = {
    ...bundledMatchDatabase.competitions,
  };

  for (const [competitionName, hostedSeasons] of Object.entries(
    hosted.competitions,
  )) {
    const existingSeasons =
      bundledMatchDatabase.competitions[competitionName] ?? {};
    const mergedSeasons: Record<string, BundledSeason> = {
      ...existingSeasons,
    };

    for (const [season, hostedBundle] of Object.entries(hostedSeasons)) {
      const existingBundle = existingSeasons[season];
      if (!existingBundle) {
        mergedSeasons[season] = hostedBundle;
        continue;
      }

      const fixturesById = new Map(
        (existingBundle.fixtures ?? []).map((fixture) => [fixture.id, fixture]),
      );

      // Hosted TFD and the bundled database can identify the same real-world
      // fixture with different IDs. Exact IDs remain the first choice, but
      // for the same competition/season/date/home/away we must treat the
      // records as one fixture rather than creating a duplicate.
      const fixtureIdentity = (fixture: FixtureRow) =>
        [
          season,
          fixture.date ?? "",
          normaliseFixtureText(fixture.homeName),
          normaliseFixtureText(fixture.awayName),
        ].join("|");

      const fixtureKeyToId = new Map(
        (existingBundle.fixtures ?? []).map((fixture) => [
          fixtureIdentity(fixture),
          fixture.id,
        ]),
      );

      for (const hostedFixture of hostedBundle.fixtures ?? []) {
        const exactExistingId = fixturesById.has(hostedFixture.id)
          ? hostedFixture.id
          : undefined;

        const identityExistingId =
          exactExistingId ??
          fixtureKeyToId.get(fixtureIdentity(hostedFixture));

        const existingFixture = identityExistingId
          ? fixturesById.get(identityExistingId)
          : undefined;

        if (!existingFixture) {
          fixturesById.set(hostedFixture.id, hostedFixture);
          fixtureKeyToId.set(
            fixtureIdentity(hostedFixture),
            hostedFixture.id,
          );
          continue;
        }

        const existingFinal =
          existingFixture.homeScore != null &&
          existingFixture.awayScore != null;
        const hostedFinal =
          hostedFixture.homeScore != null &&
          hostedFixture.awayScore != null;

        const mergedFixture = {
          ...existingFixture,
          ...hostedFixture,
          // Keep the stable bundled identity when this is a cross-ID match.
          id: existingFixture.id,
        };

        if (existingFinal && !hostedFinal) {
          mergedFixture.homeScore = existingFixture.homeScore;
          mergedFixture.awayScore = existingFixture.awayScore;
          mergedFixture.status = existingFixture.status;
          mergedFixture.played = existingFixture.played;
        }

        fixturesById.set(existingFixture.id, mergedFixture);
        fixtureKeyToId.set(
          fixtureIdentity(mergedFixture),
          existingFixture.id,
        );
      }

      mergedSeasons[season] = {
        fixtures: sortFixtures(Array.from(fixturesById.values())),
        table:
          hostedBundle.table?.length
            ? hostedBundle.table
            : existingBundle.table ?? [],
      };
    }

    mergedCompetitions[competitionName] = mergedSeasons;
  }
matchDatabase = {
    ...hosted,
    competitions: mergedCompetitions,
  };

  return true;
}
function namesMatch(a: string, b: string): boolean {
  return clubNamesMatch(a, b);
}

/*
 * Champions League table identity matching.
 *
 * Historical/provider fixture names can use different official forms for
 * the same club. Keep these rules local to the Champions League table so
 * the global clubNamesMatch() behaviour remains unchanged elsewhere.
 */
function championsLeagueTableClubName(value: string): string {
  return normaliseFixtureText(value)
    .replace(/^(?:fc|fk|ac|as|sk|nk|gnk)\s+/i, "")
    .replace(/\s+(?:fc|fk|cf|ac|sk|nk|kv|bc|sc)$/i, "")
    .replace(/^club\s+atletico\s+de\s+madrid$/i, "atletico madrid")
    .replace(/^fc\s+internazionale\s+milano$/i, "inter")
    .replace(/^feyenoord\s+rotterdam$/i, "feyenoord")
    .replace(/^psv\s+eindhoven$/i, "psv")
    .replace(/^bayer\s+04\s+leverkusen$/i, "bayer leverkusen")
    .replace(/^real\s+madrid\s+cf$/i, "real madrid")
    .replace(/^sport\s+lisboa\s+e\s+benfica$/i, "benfica")
    .replace(/^ac\s+sparta\s+praha$/i, "sparta praha")
    .trim();
}

export function championsLeagueTableClubMatch(a: string, b: string): boolean {
  if (namesMatch(a, b)) return true;

  const left = championsLeagueTableClubName(a);
  const right = championsLeagueTableClubName(b);

  if (!left || !right) return false;
  if (left === right) return true;

  const aliases: Record<string, string> = {
    "internazionale milano": "inter",
    "club atl tico de madrid": "atletico madrid",
  };

  return (aliases[left] ?? left) === (aliases[right] ?? right);
}

function sortFixtures(rows: FixtureRow[]): FixtureRow[] {
  return [...rows].sort((a, b) =>
    (a.kickoff ?? a.date ?? "9999").localeCompare(b.kickoff ?? b.date ?? "9999"),
  );
}

function withResolvedVenue(row: FixtureRow): FixtureRow {
  const venue =
    reconciledVenueForFixture(row.id) ??
    venueForFixture(row);
  return venue === row.venue ? row : { ...row, venue };
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
    (footballSeason(competitionName, season)?.fixtures ?? []).map(
      withResolvedVenue,
    ),
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

  const result = sortFixtures(
    Array.from(new Map(rows.map((row) => [row.id, withResolvedVenue(row)])).values()),
  );

  return result;
}

/**
 * Full bundled history is intentionally NOT part of the normal runtime path.
 *
 * Startup, History and the normal current-season fixture path should use
 * getBundledClubFixtures(). Deep historical access belongs to Add Match and
 * the historicalMatchStore packs.
 */
export function getRecentBundledClubFixtures(
  clubName: string,
  seasons: string[],
): FixtureRow[] {
  const wanted = new Set(seasons);

  const rows = Object.values(matchDatabase.competitions ?? {}).flatMap(
    (competitionSeasons) =>
      Object.entries(competitionSeasons)
        .filter(([season]) => wanted.has(season))
        .flatMap(([, bundle]) =>
          (bundle.fixtures ?? []).filter(
            (row) =>
              namesMatch(row.homeName, clubName) ||
              namesMatch(row.awayName, clubName),
          ),
        ),
  );

  return sortFixtures(
    Array.from(new Map(rows.map((row) => [row.id, withResolvedVenue(row)])).values()),
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
    Array.from(new Map(rows.map((row) => [row.id, withResolvedVenue(row)])).values()),
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

function calculatedTeamRow(
  fixtures: FixtureRow[],
  target: TableRow,
): TableRow | null {
  const row: TableRow = {
    teamId: target.teamId,
    name: target.name,
    played: 0,
    win: 0,
    draw: 0,
    loss: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };

  for (const fixture of fixtures) {
    const isHome =
      (target.teamId && fixture.homeId === target.teamId) ||
      championsLeagueTableClubMatch(fixture.homeName, target.name);
    const isAway =
      (target.teamId && fixture.awayId === target.teamId) ||
      championsLeagueTableClubMatch(fixture.awayName, target.name);

    if (!isHome && !isAway) continue;
    if (fixture.homeScore == null || fixture.awayScore == null) continue;

    const homeScore = Number(fixture.homeScore);
    const awayScore = Number(fixture.awayScore);

    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue;

    const goalsFor = isHome ? homeScore : awayScore;
    const goalsAgainst = isHome ? awayScore : homeScore;

    row.played += 1;
    row.goalsFor += goalsFor;
    row.goalsAgainst += goalsAgainst;

    if (goalsFor > goalsAgainst) {
      row.win += 1;
      row.points += 3;
    } else if (goalsFor < goalsAgainst) {
      row.loss += 1;
    } else {
      row.draw += 1;
      row.points += 1;
    }
  }

  if (!row.played) return null;

  row.goalDifference = row.goalsFor - row.goalsAgainst;
  return row;
}

function sameTableStats(a: TableRow, b: TableRow): boolean {
  return (
    a.played === b.played &&
    a.win === b.win &&
    a.draw === b.draw &&
    a.loss === b.loss &&
    a.goalsFor === b.goalsFor &&
    a.goalsAgainst === b.goalsAgainst &&
    a.goalDifference === b.goalDifference &&
    a.points === b.points
  );
}

function reconcileDuplicateTableRows(
  rows: TableRow[],
  fixtures: FixtureRow[],
): TableRow[] {
  const result: TableRow[] = [];
  const handled = new Set<number>();

  for (let index = 0; index < rows.length; index += 1) {
    if (handled.has(index)) continue;

    const groupIndexes = rows
      .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
      .filter(
        ({ candidate }) =>
          (rows[index].teamId &&
            candidate.teamId &&
            rows[index].teamId === candidate.teamId) ||
          namesMatch(rows[index].name, candidate.name),
      )
      .map(({ candidateIndex }) => candidateIndex);

    groupIndexes.forEach((candidateIndex) => handled.add(candidateIndex));

    if (groupIndexes.length === 1) {
      result.push(rows[index]);
      continue;
    }

    const calculated = calculatedTeamRow(fixtures, rows[index]);
    const matchingStoredRow = calculated
      ? groupIndexes
          .map((candidateIndex) => rows[candidateIndex])
          .find((candidate) => sameTableStats(candidate, calculated))
      : null;

    result.push(matchingStoredRow ?? calculated ?? rows[index]);
  }

  return result.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name),
  );
}

export async function fetchLeagueTable(
  leagueLabel: string,
  season: string = CURRENT_SEASON,
): Promise<TableResult> {
  const bundle = footballSeason(leagueLabel, season);
  if (!bundle) return { rows: [], season };

  // League tables are generated entirely from the reconciled TFD results.
  // Provider standings are not required: the fixture list itself defines
  // the participating teams and completed scores define every table stat.
  //
  // From 2024/25 the Champions League uses a 36-team league phase. Qualifying,
  // knockout play-offs and knockout rounds remain part of the fixture bundle
  // for Ticket Frame history/recognition, but must never affect the league table.
  const seasonStartYear = Number(season.split("-")[0]);
  const isModernEuropeanLeaguePhase =
    [
      "uefa champions league",
      "uefa europa league",
      "uefa conference league",
    ].includes(leagueLabel.trim().toLowerCase()) &&
    Number.isFinite(seasonStartYear) &&
    seasonStartYear >= 2024;

  const tableFixtures = isModernEuropeanLeaguePhase
    ? (bundle.fixtures ?? []).filter((fixture) => fixture.stage === "league")
    : (bundle.fixtures ?? []);

  const teams = new Map<string, TableRow>();

  /*
   * A club can appear with different provider/legacy IDs or naming
   * variants. The table must treat those records as one real club.
   */
  for (const fixture of tableFixtures) {
    for (const side of [
      { teamId: fixture.homeId, name: fixture.homeName },
      { teamId: fixture.awayId, name: fixture.awayName },
    ]) {
      if (!side.name?.trim()) continue;

      const existingEntry = [...teams.entries()].find(
        ([, existing]) =>
          (side.teamId?.trim() &&
            existing.teamId?.trim() &&
            existing.teamId === side.teamId) ||
          championsLeagueTableClubMatch(existing.name, side.name),
      );

      if (existingEntry) continue;

      const key = side.teamId?.trim()
        ? `id:${side.teamId}`
        : `name:${side.name.trim().toLowerCase()}`;

      teams.set(key, {
        teamId: side.teamId ?? "",
        name: side.name,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }
  }

  const rows = Array.from(teams.values())
    .map((team) => calculatedTeamRow(tableFixtures, team) ?? team)
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name),
    );

  const reconciledRows = reconcileDuplicateTableRows(rows, tableFixtures);

  return { rows: reconciledRows, season };
}

export async function fetchLeagueTableWithFallback(
  leagueLabel: string,
): Promise<TableResult> {
  const current = await fetchLeagueTable(leagueLabel, CURRENT_SEASON);
  if (current.rows.length) return current;

  const prior = await fetchLeagueTable(leagueLabel, PRIOR_SEASON);
  if (prior.rows.length) return prior;

  /*
   * European tables are present-day only. Historical European fixtures
   * remain available for match history, recognition and stadium matching,
   * but must not cause an old European table to appear for the current club.
   */
  if (/^UEFA\s/i.test(leagueLabel)) {
    return current;
  }

  return prior;
}

export function isFixturePlayed(row: FixtureRow): boolean {
  return row.homeScore != null && row.awayScore != null;
}
