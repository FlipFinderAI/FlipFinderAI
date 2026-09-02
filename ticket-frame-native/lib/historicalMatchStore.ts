import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

import type { FixtureRow } from "./fixtures";
import { clubNamesMatch } from "./ticketText";

const HISTORICAL_SOURCE_VERSION = "5754d9178399564e66d7";

export const HISTORICAL_PACK_ORDER = [
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

const PACK_ASSETS: Record<HistoricalPackId, number> = {
  "2000-2006": require("../data/history-packs/2000-2006.tfdpack"),
  "1990-1999": require("../data/history-packs/1990-1999.tfdpack"),
  "1980-1989": require("../data/history-packs/1980-1989.tfdpack"),
  "1970-1979": require("../data/history-packs/1970-1979.tfdpack"),
  "1960-1969": require("../data/history-packs/1960-1969.tfdpack"),
  "1948-1959": require("../data/history-packs/1948-1959.tfdpack"),
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let primePromise: Promise<void> | null = null;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function seasonStart(season: string): number | null {
  const match = String(season ?? "").match(/^(\d{4})[\/-]/);
  return match ? Number(match[1]) : null;
}

function packForSeason(season: string): HistoricalPackId | null {
  const year = seasonStart(season);

  if (year == null || year >= 2007) return null;
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
      "ticket-frame-tfd-history-v1.db",
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

  return row?.source_version === HISTORICAL_SOURCE_VERSION;
}

async function readPack(
  packId: HistoricalPackId,
): Promise<HistoricalPack> {
  const asset = Asset.fromModule(PACK_ASSETS[packId]);

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
    pack.sourceVersion !== HISTORICAL_SOURCE_VERSION ||
    !Array.isArray(pack.fixtures)
  ) {
    throw new Error(`Invalid historical pack ${packId}`);
  }

  return pack;
}

export async function importHistoricalPack(
  packId: HistoricalPackId,
): Promise<void> {
  if (await packIsCurrent(packId)) return;

  const pack = await readPack(packId);
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM historical_fixtures WHERE pack_id = ?`,
      packId,
    );

    const statement = await db.prepareAsync(`
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

    await db.runAsync(
      `INSERT OR REPLACE INTO historical_packs (
         pack_id,
         source_version,
         imported_at
       ) VALUES (?, ?, ?)`,
      packId,
      HISTORICAL_SOURCE_VERSION,
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

  await importHistoricalPack(packId);

  const db = await getDb();
  const rows = await db.getAllAsync<{ payload: string }>(
    `SELECT payload
       FROM historical_fixtures
      WHERE season = ?`,
    season,
  );

  return rows
    .map((row) => JSON.parse(row.payload) as FixtureRow)
    .sort((a, b) =>
      (a.kickoff ?? a.date ?? "9999").localeCompare(
        b.kickoff ?? b.date ?? "9999",
      ),
    );
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
    .map((row) => JSON.parse(row.payload) as FixtureRow)
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
