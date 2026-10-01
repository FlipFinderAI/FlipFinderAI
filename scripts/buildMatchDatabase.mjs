import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canonicalClub,
  canonicalCompetition,
  clubsCompatible,
} from "./tfdIdentity.mjs";
import {
  buildTfdClubRegistry,
} from "./tfdClubRegistry.mjs";

const providerConfigs = [
  {
    name: "football-data.org",
    file: "data/footballDataCache.json",
    defaultPriority: 100,
    fieldPriority: {
      date: 120,
      kickoff: 120,
      homeId: 120,
      awayId: 120,
      homeName: 120,
      awayName: 120,
      homeScore: 120,
      awayScore: 120,
      halfTimeHomeScore: 120,
      halfTimeAwayScore: 120,
      fullTimeHomeScore: 120,
      fullTimeAwayScore: 120,
      status: 120,
      season: 120,
      competition: 120,
      venue: 100,
      attendance: 100,
      homeScorers: 90,
      awayScorers: 90,
    },
  },
  {
    name: "openfootball/football.json",
    file: "data/openFootballCache.json",
    defaultPriority: 50,
    fieldPriority: {
      date: 70,
      kickoff: 60,
      homeId: 50,
      awayId: 50,
      homeName: 70,
      awayName: 70,
      homeScore: 90,
      awayScore: 90,
      halfTimeHomeScore: 80,
      halfTimeAwayScore: 80,
      fullTimeHomeScore: 90,
      fullTimeAwayScore: 90,
      status: 80,
      season: 70,
      competition: 70,
      venue: 70,
      attendance: 70,
      homeScorers: 80,
      awayScorers: 80,
    },
  },

  {
    name: "api-football/api-sports",
    file: "data/apiFootballProviderCache.json",
    defaultPriority: 85,
    fieldPriority: {
      date: 110,
      kickoff: 110,
      homeId: 90,
      awayId: 90,
      homeName: 105,
      awayName: 105,
      // API-Football is the current/live authority.
      homeScore: 140,
      awayScore: 140,
      halfTimeHomeScore: 140,
      halfTimeAwayScore: 140,
      fullTimeHomeScore: 140,
      fullTimeAwayScore: 140,
      status: 140,
      season: 105,
      competition: 105,
      venue: 120,
      attendance: 125,
      homeScorers: 130,
      awayScorers: 130,
      table: 135,
    },
  },

  {
    name: "highlightly",
    file: "data/highlightlyProviderCache.json",
    defaultPriority: 90,
    fieldPriority: {
      date: 115,
      kickoff: 115,
      homeId: 95,
      awayId: 95,
      homeName: 110,
      awayName: 110,
      // API-Football remains live authority; Highlightly supplements it.
      homeScore: 130,
      awayScore: 130,
      halfTimeHomeScore: 130,
      halfTimeAwayScore: 130,
      fullTimeHomeScore: 130,
      fullTimeAwayScore: 130,
      status: 130,
      season: 110,
      competition: 110,
      venue: 90,
      attendance: 0,
      homeScorers: 100,
      awayScorers: 100,
      // Highlightly is the fast standings authority for target lower leagues.
      table: 145,
    },
  },

];

const outputPath = resolve(process.cwd(), "data/matchDatabase.json");


const newMatchId = (
  row,
  homeClubId,
  awayClubId,
) =>
  [
    "tfmatch",
    row.season,
    canonicalCompetition(row.competition),
    homeClubId ?? canonicalClub(row.homeName),
    awayClubId ?? canonicalClub(row.awayName),
    row.date ?? "date-tbc",
  ].join(":");

const sourceKey = (provider, providerId) =>
  `${provider}|${providerId}`;

const isMissing = (value) =>
  value == null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

const fieldPriority = (config, field) =>
  config.fieldPriority?.[field] ??
  config.defaultPriority ??
  0;

/*
 * Preserve permanent Ticket Frame match IDs.
 *
 * If a provider changes a kickoff/date because a match is postponed,
 * its provider ID still points to the same permanent TFD match.
 */
const previousIds = new Map();
let previousDatabase = null;

if (existsSync(outputPath)) {
  previousDatabase = JSON.parse(
    readFileSync(outputPath, "utf8"),
  );

  for (const seasons of Object.values(
    previousDatabase.competitions ?? {},
  )) {
    for (const bundle of Object.values(seasons ?? {})) {
      for (const match of bundle.fixtures ?? []) {
        for (const source of match.sources ?? []) {
          previousIds.set(
            sourceKey(
              source.provider,
              source.providerId,
            ),
            match.id,
          );
        }
      }
    }
  }
}

const providerEntries = [];
const leagueScopes = new Set();
const providerTables = new Map();
const simpleRoundRobinScopes = new Set();
const leagueBundleNames = new Map();

const identityScope = (competition, season) =>
  `${canonicalCompetition(competition)}|${String(
    season ?? "",
  )}`;

const dateOnly = (value) =>
  String(value ?? "").slice(0, 10);

for (const config of providerConfigs) {
  const cachePath = resolve(process.cwd(), config.file);

  if (!existsSync(cachePath)) {
    console.warn(
      `TFD provider cache missing: ${config.name} (${config.file})`,
    );
    continue;
  }

  const cache = JSON.parse(
    readFileSync(cachePath, "utf8"),
  );

  for (const [competition, seasons] of Object.entries(
    cache.competitions ?? {},
  )) {
    for (const [season, bundle] of Object.entries(
      seasons ?? {},
    )) {
      const scope = identityScope(
        competition,
        season,
      );

      if (bundle.table?.length) {
        leagueScopes.add(scope);

        const tablePriority = fieldPriority(config, "table");
        const retainedTable = providerTables.get(scope);
        if (!retainedTable || tablePriority > retainedTable.priority) {
          providerTables.set(scope, {
            rows: bundle.table,
            priority: tablePriority,
            source: config.name,
          });
        }

        if (!leagueBundleNames.has(scope)) {
          leagueBundleNames.set(scope, {
            competition,
            season,
          });
        }

        const teamCount = bundle.table.length;
        const expectedDoubleRoundRobin =
          teamCount * (teamCount - 1);

        /*
         * A normal double-round-robin league has one
         * home fixture for every ordered pair of clubs.
         *
         * We only permit cross-date pair reconciliation
         * where the provider schedule structurally fits
         * that model. This avoids corrupting split-phase
         * leagues where clubs can meet more than twice.
         */
        if (
          teamCount >= 4 &&
          Math.abs(
            (bundle.fixtures?.length ?? 0) -
              expectedDoubleRoundRobin,
          ) <= 2
        ) {
          simpleRoundRobinScopes.add(scope);
        }
      }

      for (const sourceRow of bundle.fixtures ?? []) {
        const row = {
          ...sourceRow,
          competition:
            sourceRow.competition ?? competition,
          season:
            sourceRow.season ?? season,
        };

        providerEntries.push({
          provider: config.name,
          config,
          row,
        });
      }
    }
  }
}

const previousMatches = [];

for (const seasons of Object.values(
  previousDatabase?.competitions ?? {},
)) {
  for (const bundle of Object.values(seasons ?? {})) {
    for (const match of bundle.fixtures ?? []) {
      previousMatches.push(match);
    }
  }
}

const {
  clubs: tfdClubs,
  providerFixtures: resolvedEntries,
} = buildTfdClubRegistry(
  providerEntries,
  previousDatabase?.clubs ?? {},
  previousMatches,
);

const matches = new Map();
const matchIdentityIndex = new Map();

const resolvedFixtureKey = (competition, season, homeClubId, awayClubId, date) => {
  const scope = identityScope(competition, season);
  return [
    scope,
    homeClubId,
    awayClubId,
    simpleRoundRobinScopes.has(scope) ? "round-robin" : dateOnly(date),
  ].join("|");
};

const sameResolvedFixture = (match, entry) => {
  const row = entry.row;

  if (
    String(match.season ?? "") !==
    String(row.season ?? "")
  ) {
    return false;
  }

  if (
    canonicalCompetition(match.competition) !==
    canonicalCompetition(row.competition)
  ) {
    return false;
  }

  if (
    match.homeClubId !== entry.homeClubId ||
    match.awayClubId !== entry.awayClubId
  ) {
    return false;
  }

  const scope = identityScope(
    row.competition,
    row.season,
  );

  if (simpleRoundRobinScopes.has(scope)) {
    return true;
  }

  return (
    dateOnly(match.date ?? match.kickoff) ===
    dateOnly(row.date ?? row.kickoff)
  );
};

/*
 * Some providers reverse home/away for the same
 * neutral or one-off fixture.
 *
 * Reversed orientation is only considered compatible
 * on the same date. We deliberately do NOT apply the
 * round-robin cross-date rule here because the return
 * league fixture has the clubs genuinely reversed.
 */
const sameResolvedFixtureReversed = (match, entry) => {
  const row = entry.row;

  if (
    String(match.season ?? "") !==
    String(row.season ?? "")
  ) {
    return false;
  }

  if (
    canonicalCompetition(match.competition) !==
    canonicalCompetition(row.competition)
  ) {
    return false;
  }

  if (
    match.homeClubId !== entry.awayClubId ||
    match.awayClubId !== entry.homeClubId
  ) {
    return false;
  }

  return (
    dateOnly(match.date ?? match.kickoff) ===
    dateOnly(row.date ?? row.kickoff)
  );
};

/*
 * Put a reversed provider record into permanent TFD
 * orientation before field-by-field merging.
 *
 * Swap paired top-level home/away fields, plus fields
 * using a *Home/*Away suffix such as penaltyHome.
 */
const transposeFixtureRow = (sourceRow) => {
  const row = { ...sourceRow };
  const original = { ...sourceRow };
  const swapped = new Set();

  for (const key of Object.keys(original)) {
    if (!key.startsWith("home")) continue;

    const counterpart =
      `away${key.slice("home".length)}`;

    if (!(counterpart in original)) continue;

    row[key] = original[counterpart];
    row[counterpart] = original[key];

    swapped.add(key);
    swapped.add(counterpart);
  }

  for (const key of Object.keys(original)) {
    if (
      swapped.has(key) ||
      !key.endsWith("Home")
    ) {
      continue;
    }

    const counterpart =
      `${key.slice(0, -"Home".length)}Away`;

    if (!(counterpart in original)) continue;

    row[key] = original[counterpart];
    row[counterpart] = original[key];
  }

  return row;
};

for (const entry of resolvedEntries) {
  const { config, row } = entry;

  const providerId = String(
    row.providerId ?? row.id,
  );

  const previousPermanentId =
    previousIds.get(
      sourceKey(config.name, providerId),
    );

  const directKey = resolvedFixtureKey(
    row.competition, row.season, entry.homeClubId, entry.awayClubId, row.date ?? row.kickoff,
  );
  const reversedKey = resolvedFixtureKey(
    row.competition, row.season, entry.awayClubId, entry.homeClubId, row.date ?? row.kickoff,
  );
  const candidateIds = new Set([
    ...(matchIdentityIndex.get(directKey) ?? []),
    ...(matchIdentityIndex.get(reversedKey) ?? []),
  ]);
  const compatibleExisting =
    [...candidateIds]
      .map((id) => matches.get(id))
      .filter(Boolean)
      .filter(
      (match) =>
        sameResolvedFixture(match, entry) ||
        sameResolvedFixtureReversed(match, entry),
    );

  let permanentId = previousPermanentId ?? null;

  /*
   * If a real fixture already exists under another
   * historic permanent ID, collapse onto the existing
   * reconciled match. Its combined provider references
   * make that chosen ID permanent on future rebuilds.
   */
  if (compatibleExisting.length === 1) {
    permanentId = compatibleExisting[0].id;
  }

  if (!permanentId) {
    permanentId = newMatchId(
      row,
      entry.homeClubId,
      entry.awayClubId,
    );
  }

  const source = {
    provider: config.name,
    providerId,
  };

  let existing = matches.get(permanentId);

  if (!existing) {
    existing = {
      id: permanentId,
      homeClubId: entry.homeClubId,
      awayClubId: entry.awayClubId,
      sources: [],
      fieldSource: {},
      fieldPriority: {},
    };

    matches.set(permanentId, existing);
  }

  let mergeRow = row;
  let mergeHomeClubId = entry.homeClubId;
  let mergeAwayClubId = entry.awayClubId;

  const incomingIsReversed =
    existing.homeClubId &&
    existing.awayClubId &&
    existing.homeClubId === entry.awayClubId &&
    existing.awayClubId === entry.homeClubId &&
    dateOnly(existing.date ?? existing.kickoff) ===
      dateOnly(row.date ?? row.kickoff);

  if (incomingIsReversed) {
    mergeRow = transposeFixtureRow(row);
    mergeHomeClubId = entry.awayClubId;
    mergeAwayClubId = entry.homeClubId;
  }

  if (
    existing.homeClubId &&
    existing.homeClubId !== mergeHomeClubId
  ) {
    throw new Error(
      `TFD identity conflict for ${permanentId}: home club`,
    );
  }

  if (
    existing.awayClubId &&
    existing.awayClubId !== mergeAwayClubId
  ) {
    throw new Error(
      `TFD identity conflict for ${permanentId}: away club`,
    );
  }

  existing.homeClubId = mergeHomeClubId;
  existing.awayClubId = mergeAwayClubId;

  existing.fieldSource.homeClubId = "tfd-identity";
  existing.fieldSource.awayClubId = "tfd-identity";

  if (
    !existing.sources.some(
      (item) =>
        item.provider === source.provider &&
        item.providerId === source.providerId,
    )
  ) {
    existing.sources.push(source);
  }

  for (const [field, value] of Object.entries(mergeRow)) {
    if (
      field === "id" ||
      field === "providerId" ||
      value == null
    ) {
      continue;
    }

    const candidatePriority =
      fieldPriority(config, field);

    const currentValue = existing[field];
    const currentPriority =
      existing.fieldPriority[field] ?? -1;

    if (
      isMissing(currentValue) ||
      candidatePriority > currentPriority
    ) {
      existing[field] = value;
      existing.fieldSource[field] = config.name;
      existing.fieldPriority[field] =
        candidatePriority;
    }
  }

  const finalKey = resolvedFixtureKey(
    existing.competition ?? row.competition,
    existing.season ?? row.season,
    existing.homeClubId,
    existing.awayClubId,
    existing.date ?? existing.kickoff ?? row.date ?? row.kickoff,
  );
  const indexed = matchIdentityIndex.get(finalKey) ?? new Set();
  indexed.add(existing.id);
  matchIdentityIndex.set(finalKey, indexed);
}

// TFD is permanent. A standings-only provider refresh may intentionally carry
// only current fixtures; it must never erase older matches already reconciled
// into TFD simply because they were absent from today's provider payload.
for (const seasons of Object.values(previousDatabase?.competitions ?? {})) {
  for (const bundle of Object.values(seasons ?? {})) {
    for (const previous of bundle.fixtures ?? []) {
      if (!matches.has(previous.id)) matches.set(previous.id, previous);
    }
  }
}

const database = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),

  sourcePolicy:
    "TFD canonical identity + field-by-field merge: approved provider club identities are reconciled to permanent TFD club IDs using provider references and conservative fixture evidence; conflicting provider values are selected by per-field priority; permanent TFD match IDs are preserved through provider references; league tables are generated from reconciled TFD fixture results.",

  providers: providerConfigs.map((config) => ({
    name: config.name,
    file: config.file,
  })),

  clubs: tfdClubs,

  competitions: {},
};

for (const row of matches.values()) {
  /*
   * fieldPriority is internal merge bookkeeping.
   * fieldSource is retained permanently so TFD can explain
   * where each displayed value came from.
   */
  delete row.fieldPriority;

  const competition =
    row.competition || "Unknown competition";

  database.competitions[competition] ??= {};

  database.competitions[competition][row.season] ??= {
    fixtures: [],
    table: [],
    tableSource: null,
  };

  database.competitions[competition][
    row.season
  ].fixtures.push(row);
}

const LIVE_STATUSES = new Set([
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "INT",
  "LIVE",
  "IN_PLAY",
  "PAUSED",
]);

const NOT_FINISHED_STATUSES = new Set([
  "TIMED",
  "SCHEDULED",
  "NS",
  "TBD",
  "PST",
  "POSTPONED",
  "CANC",
  "CANCELLED",
]);

const scoreNumber = (value) => {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const fixtureIsFinished = (fixture) => {
  const home = scoreNumber(
    fixture.fullTimeHomeScore ??
      fixture.homeScore,
  );

  const away = scoreNumber(
    fixture.fullTimeAwayScore ??
      fixture.awayScore,
  );

  if (home == null || away == null) {
    return false;
  }

  const status = String(
    fixture.status ?? "",
  ).toUpperCase();

  if (LIVE_STATUSES.has(status)) {
    return false;
  }

  if (NOT_FINISHED_STATUSES.has(status)) {
    return false;
  }

  return true;
};

const calculateTfdTable = (fixtures) => {
  const rows = new Map();

  const ensure = (clubId, fallbackName) => {
    if (!clubId) return null;

    if (!rows.has(clubId)) {
      rows.set(clubId, {
        teamId: clubId,
        name:
          tfdClubs[clubId]?.displayName ??
          fallbackName ??
          clubId,
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

    return rows.get(clubId);
  };

  /*
   * Seed every club appearing in this league so teams
   * with zero completed matches still appear.
   */
  for (const fixture of fixtures) {
    ensure(
      fixture.homeClubId,
      fixture.homeName,
    );

    ensure(
      fixture.awayClubId,
      fixture.awayName,
    );
  }

  for (const fixture of fixtures) {
    if (!fixtureIsFinished(fixture)) {
      continue;
    }

    const homeScore = scoreNumber(
      fixture.fullTimeHomeScore ??
        fixture.homeScore,
    );

    const awayScore = scoreNumber(
      fixture.fullTimeAwayScore ??
        fixture.awayScore,
    );

    const home = ensure(
      fixture.homeClubId,
      fixture.homeName,
    );

    const away = ensure(
      fixture.awayClubId,
      fixture.awayName,
    );

    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;

    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.win += 1;
      away.loss += 1;
      home.points += 3;
    } else if (homeScore < awayScore) {
      away.win += 1;
      home.loss += 1;
      away.points += 3;
    } else {
      home.draw += 1;
      away.draw += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of rows.values()) {
    row.goalDifference =
      row.goalsFor - row.goalsAgainst;
  }

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (
      b.goalDifference !== a.goalDifference
    ) {
      return (
        b.goalDifference - a.goalDifference
      );
    }

    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    return a.name.localeCompare(b.name);
  });
};

for (const scope of leagueScopes) {
  const split = scope.lastIndexOf("|");
  const competitionKey = scope.slice(0, split);
  const season = scope.slice(split + 1);

  let targetCompetition = null;

  for (const competition of Object.keys(
    database.competitions,
  )) {
    if (
      canonicalCompetition(competition) ===
      competitionKey
    ) {
      targetCompetition = competition;
      break;
    }
  }

  if (!targetCompetition) {
    const fallback = leagueBundleNames.get(scope);

    if (!fallback) continue;

    targetCompetition = fallback.competition;

    database.competitions[targetCompetition] ??= {};
    database.competitions[targetCompetition][season] ??= {
      fixtures: [],
      table: [],
      tableSource: null,
    };
  }

  const bundle =
    database.competitions[targetCompetition]?.[
      season
    ];

  if (!bundle) continue;

  const calculatedTable = calculateTfdTable(
    bundle.fixtures ?? [],
  );
  const providerTable = providerTables.get(scope);
  const calculatedPlayed = calculatedTable.reduce(
    (total, row) => total + (Number(row.played) || 0),
    0,
  );
  const providerPlayed = (providerTable?.rows ?? []).reduce(
    (total, row) => total + (Number(row.played) || 0),
    0,
  );

  if (providerTable && providerPlayed > calculatedPlayed) {
    // Keep TFD's permanent club identity where a provider table uses a
    // provider-specific team ID or shortened display name.
    bundle.table = providerTable.rows.map((row) => {
      const tfdRow = calculatedTable.find(
        (candidate) => clubsCompatible(candidate.name, row.name),
      );
      return {
        ...row,
        teamId: tfdRow?.teamId ?? row.teamId,
        name: tfdRow?.name ?? row.name,
      };
    });
    bundle.tableSource = providerTable.source;
  } else {
    bundle.table = calculatedTable;
    bundle.tableSource = "tfd-reconciled-fixtures";
  }
}

for (const seasons of Object.values(
  database.competitions,
)) {
  for (const bundle of Object.values(seasons)) {
    bundle.fixtures.sort((a, b) =>
      (a.kickoff ?? a.date ?? "9999").localeCompare(
        b.kickoff ?? b.date ?? "9999",
      ),
    );
  }
}

writeFileSync(
  outputPath,
  `${JSON.stringify(database, null, 2)}\n`,
  "utf8",
);

console.log(
  `Ticket Frame Data: ${matches.size} unique matches from ${providerConfigs.length} approved providers`,
);

console.log(
  "TFD policy: field-by-field provider merge with permanent match IDs",
);
