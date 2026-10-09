import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

import type { FixtureRow } from "./fixtures";
import { venueForFixture } from "./clubGroundMatching";
import { reconciledVenueForFixture, isVenueEvidenceConflicted } from "./reconciledStadiums";
import { clubNamesMatch } from "./ticketText";

const HISTORICAL_SOURCE_VERSION = "fe14b8e3027c953271e9";
const MODERN_HISTORICAL_SOURCE_VERSION = "fe14b8e3027c953271e9";

export const HISTORICAL_PACK_ORDER = [
    "2024-2026",
    "2015-2023",
  "2007-2014",
"2000-2006",
  "1990-1999",
  "1980-1989",
  "1970-1979",
  "1960-1969",
  "1948-1959",
] as const;

type HistoricalPackId = (typeof HISTORICAL_PACK_ORDER)[number];

type HistoricalPack = {
  schemaVersion: 1;
  sourceVersion: string;
  packId: HistoricalPackId;
  firstSeasonStart: number;
  lastSeasonStart: number;
  fixtures: FixtureRow[];
};

const PACK_ASSET_PATHS: Record<HistoricalPackId, string> = {
  "2024-2026": "../data/history-packs/2024-2026.tfdpack",
  "2015-2023": "../data/history-packs/2015-2023.tfdpack",
  "2007-2014": "../data/history-packs/2007-2014.tfdpack",
  "2000-2006": "../data/history-packs/2000-2006.tfdpack",
  "1990-1999": "../data/history-packs/1990-1999.tfdpack",
  "1980-1989": "../data/history-packs/1980-1989.tfdpack",
  "1970-1979": "../data/history-packs/1970-1979.tfdpack",
  "1960-1969": "../data/history-packs/1960-1969.tfdpack",
  "1948-1959": "../data/history-packs/1948-1959.tfdpack",
};


let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let primePromise: Promise<void> | null = null;

// V4.0.86 — fast Manual Add history lookup.
// Keep only specifically requested seasons in memory so Manual Add does not
// need to import an entire decade pack into SQLite before showing fixtures.
const historicalSeasonMemoryCache = new Map<string, FixtureRow[]>();
const historicalPackReadPromises = new Map<
  HistoricalPackId,
  Promise<HistoricalPack>
>();

function withResolvedVenue(fixture: FixtureRow): FixtureRow {
  const venue =
    reconciledVenueForFixture(fixture.id) ??
    (isVenueEvidenceConflicted(fixture.id) ? null : venueForFixture(fixture));
  return venue === fixture.venue ? fixture : { ...fixture, venue };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function seasonStart(season: string): number | null {
  const match = String(season ?? "").match(/^(\d{4})[\/-]/);
  return match ? Number(match[1]) : null;
}

function packForSeason(season: string): HistoricalPackId | null {
  const year = seasonStart(season);

  if (year == null || year >= 2027) return null;
  if (year >= 2024) return "2024-2026";
  if (year >= 2015) return "2015-2023";
  if (year >= 2007) return "2007-2014";
  if (year >= 2000) return "2000-2006";
  if (year >= 1990) return "1990-1999";
  if (year >= 1980) return "1980-1989";
  if (year >= 1970) return "1970-1979";
  if (year >= 1960) return "1960-1969";
  if (year >= 1948) return "1948-1959";

  return null;
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(
      "ticket-frame-tfd-history-v2.db",
    ).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS historical_fixtures (
          id TEXT PRIMARY KEY NOT NULL,
          pack_id TEXT NOT NULL,
          season TEXT NOT NULL,
          home_name TEXT NOT NULL,
          away_name TEXT NOT NULL,
          payload TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS
          idx_historical_fixtures_season
        ON historical_fixtures(season);

        CREATE TABLE IF NOT EXISTS historical_packs (
          pack_id TEXT PRIMARY KEY NOT NULL,
          source_version TEXT NOT NULL,
          imported_at INTEGER NOT NULL
        );
      `);

      return db;
    });
  }

  return dbPromise;
}

function sourceVersionForPack(
  packId: HistoricalPackId,
): string {
  if (packId === "2024-2026") return "6fe396250a26deb1dad8";
  return packId === "2007-2014" || packId === "2015-2023"
    ? MODERN_HISTORICAL_SOURCE_VERSION
    : HISTORICAL_SOURCE_VERSION;
}

async function packIsCurrent(
  packId: HistoricalPackId,
): Promise<boolean> {
  const db = await getDb();

  const row = await db.getFirstAsync<{
    source_version: string;
  }>(
    `SELECT source_version
       FROM historical_packs
      WHERE pack_id = ?`,
    packId,
  );

  return row?.source_version === sourceVersionForPack(packId);
}

async function readPack(
  packId: HistoricalPackId,
): Promise<HistoricalPack> {
  const existing = historicalPackReadPromises.get(packId);
  if (existing) return existing;

  const promise = (async () => {
    const assetModule = (() => {
      switch (packId) {
          case "2024-2026":
            return require("../data/history-packs/2024-2026.tfdpack");

        case "2015-2023":
          return require("../data/history-packs/2015-2023.tfdpack");
        case "2007-2014":
          return require("../data/history-packs/2007-2014.tfdpack");
        case "2000-2006":
          return require("../data/history-packs/2000-2006.tfdpack");
        case "1990-1999":
          return require("../data/history-packs/1990-1999.tfdpack");
        case "1980-1989":
          return require("../data/history-packs/1980-1989.tfdpack");
        case "1970-1979":
          return require("../data/history-packs/1970-1979.tfdpack");
        case "1960-1969":
          return require("../data/history-packs/1960-1969.tfdpack");
        case "1948-1959":
          return require("../data/history-packs/1948-1959.tfdpack");
      }
    })();

    const asset = Asset.fromModule(assetModule);

    await asset.downloadAsync();

    const uri = asset.localUri ?? asset.uri;

    if (!uri) {
      throw new Error(`No local URI for historical pack ${packId}`);
    }

    const raw = await FileSystem.readAsStringAsync(uri);
    const pack = JSON.parse(raw) as HistoricalPack;

    if (
      pack.schemaVersion !== 1 ||
      pack.packId !== packId ||
      pack.sourceVersion !== sourceVersionForPack(packId) ||
      !Array.isArray(pack.fixtures)
    ) {
      throw new Error(`Invalid historical pack ${packId}`);
    }

    return pack;
  })();

  historicalPackReadPromises.set(packId, promise);

  try {
    return await promise;
  } catch (error) {
    historicalPackReadPromises.delete(packId);
    throw error;
  }
}

export async function importHistoricalPack(
  packId: HistoricalPackId,
): Promise<void> {
  if (await packIsCurrent(packId)) return;

  const pack = await readPack(packId);
  const db = await getDb();

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `DELETE FROM historical_fixtures WHERE pack_id = ?`,
      packId,
    );

    const statement = await tx.prepareAsync(`
      INSERT OR REPLACE INTO historical_fixtures (
        id,
        pack_id,
        season,
        home_name,
        away_name,
        payload
      )
      VALUES (
        $id,
        $packId,
        $season,
        $homeName,
        $awayName,
        $payload
      )
    `);

    try {
      for (const fixture of pack.fixtures) {
        await statement.executeAsync({
          $id: fixture.id,
          $packId: packId,
          $season: fixture.season,
          $homeName: fixture.homeName,
          $awayName: fixture.awayName,
          $payload: JSON.stringify(fixture),
        });
      }
    } finally {
      await statement.finalizeAsync();
    }

    await tx.runAsync(
      `INSERT OR REPLACE INTO historical_packs (
         pack_id,
         source_version,
         imported_at
       ) VALUES (?, ?, ?)`,
      packId,
      sourceVersionForPack(packId),
      Date.now(),
    );
  });

  console.log(
    `[historical-tfd] imported ${packId} · ${pack.fixtures.length} fixtures`,
  );
}

export async function ensureHistoricalSeasonLoaded(
  season: string,
): Promise<void> {
  const packId = packForSeason(season);
  if (!packId) return;

  await importHistoricalPack(packId);
}

export async function getHistoricalSeasonFixtures(
  season: string,
): Promise<FixtureRow[]> {
  const packId = packForSeason(season);

  if (!packId) return [];

  const cached = historicalSeasonMemoryCache.get(season);
  if (cached) return cached;

  // Fast path for Manual Add:
  // read only the relevant historical pack and return the requested season
  // immediately. Do not block the picker on importing every fixture from the
  // whole decade into SQLite.
  const pack = await readPack(packId);

  const fixtures = pack.fixtures
    .filter((fixture) => fixture.season === season)
    .map(withResolvedVenue)
    .sort((a, b) =>
      (a.kickoff ?? a.date ?? "9999").localeCompare(
        b.kickoff ?? b.date ?? "9999",
      ),
    );

  historicalSeasonMemoryCache.set(season, fixtures);

  return fixtures;
}

export async function getHistoricalClubFixtures(
  club: string,
  season: string,
): Promise<FixtureRow[]> {
  const packId = packForSeason(season);

  if (!packId) return [];

  await importHistoricalPack(packId);

  const db = await getDb();

  const rows = await db.getAllAsync<{
    payload: string;
  }>(
    `SELECT payload
       FROM historical_fixtures
      WHERE season = ?`,
    season,
  );

  return rows
    .map((row) => withResolvedVenue(JSON.parse(row.payload) as FixtureRow))
    .filter(
      (fixture) =>
        clubNamesMatch(fixture.homeName, club) ||
        clubNamesMatch(fixture.awayName, club),
    )
    .sort((a, b) =>
      (a.kickoff ?? a.date ?? "9999").localeCompare(
        b.kickoff ?? b.date ?? "9999",
      ),
    );
}

/**
 * Called only AFTER Ticket Frame's photo/media startup work.
 *
 * Each completed pack is persisted in SQLite. On future launches a current
 * pack is skipped completely, so the expensive JSON parsing/import is a
 * first-run/update task rather than a cold-start task.
 */
export function primeHistoricalPacksInOrder(): Promise<void> {
  if (primePromise) return primePromise;

  primePromise = (async () => {
    for (const packId of HISTORICAL_PACK_ORDER) {
      try {
        if (!(await packIsCurrent(packId))) {
          await importHistoricalPack(packId);

          // Yield between batches so History preparation never dominates UI.
          await sleep(1500);
        }
      } catch (error) {
        console.warn(
          `[historical-tfd] background import stopped at ${packId}`,
          error,
        );

        // Stop here. The next launch resumes at the first incomplete pack.
        break;
      }
    }
  })().finally(() => {
    primePromise = null;
  });

  return primePromise;
}
