// V3.8 — Storage versioning & safe migration foundation.
//
// PRESERVATION CONTRACT
// The user's football collection is the most valuable data in the app.
// This module never deletes, resets, or rewrites user data unless a
// registered migration explicitly transforms it — and every transformation:
//   1. snapshots + persists a local backup FIRST,
//   2. logs [STORAGE-MIGRATION] before and [STORAGE-MIGRATION-COMPLETE]
//      after,
//   3. verifies counts, ticket IDs and image references afterwards,
//   4. restores the backup and fails safely if verification fails.
//
// Future features (Attendance History, Memories, Statistics, Ground
// Challenge) must be added as NEW keys/namespaces alongside existing ones.
// `ticket-frame.saved-frame.v1` remains THE ticket store — never renamed.

import AsyncStorage from "@react-native-async-storage/async-storage";

/** Version stamp key. Absent = pre-V3.8 install ⇒ stamped to v1 (no transform). */
export const STORAGE_VERSION_KEY = "ticket-frame.storage-version.v1";

export const STORAGE_VERSION = {
  currentVersion: 2,

  /** Human-readable history. Append entries when registering migrations. */
  history: [
    {
      version: 1 as const,
      introducedIn: "V3.8",
      description:
        "Baseline: saved-frame.v1 (tickets/frameStyle/favouriteClub/activeSeason), ground-visits.v1, ticket-style.v1, onboarding flag and rebuildable fixture caches.",
    },
    {
      version: 2 as const,
      introducedIn: "V3.9",
      description:
        "Additive only: introduces ticket-frame.attendance-history.v1 beside the ticket store. saved-frame.v1, SeasonTicket, ground visits and favourite club are verified byte-identical.",
    },
  ],
} as const;

export type CoreStorageKeys = typeof CORE_KEYS;

export const CORE_KEYS = {
  /** THE ticket store. Do not rename. */
  savedFrame: "ticket-frame.saved-frame.v1",
  groundVisits: "ticket-frame.ground-visits.v1",
  ticketStyle: "ticket-frame.ticket-style.v1",
  onboardingComplete: "ticket-frame.onboarding-complete.v1",
} as const;

/** Cache/derived keys — rebuildable, still backed up before migrations. */
export const CACHE_KEYS = {
  fixtureCache: "ticket-frame.fixture-cache.v10",
} as const;

export type StorageSnapshot = Record<string, string | null>;

export type StorageCounts = {
  ticketCount: number;
  seasonCount: number;
  groundVisitCount: number;
};

type SavedFrameShape = {
  tickets?: Array<{ id?: string; uri?: string; seasonKey?: string }>;
};

function parseSavedFrame(raw: string | null): SavedFrameShape | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedFrameShape;
  } catch {
    return null;
  }
}

export function countsFromSnapshot(snapshot: StorageSnapshot): StorageCounts {
  const frame = parseSavedFrame(snapshot[CORE_KEYS.savedFrame] ?? null);
  const tickets = Array.isArray(frame?.tickets) ? frame!.tickets! : [];
  const seasons = new Set(
    tickets.map((t) => t.seasonKey).filter((s): s is string => Boolean(s)),
  );
  let groundVisits = 0;
  try {
    const raw = snapshot[CORE_KEYS.groundVisits];
    if (raw) groundVisits = Object.keys(JSON.parse(raw) as object).length;
  } catch {
    groundVisits = 0;
  }
  return {
    ticketCount: tickets.length,
    seasonCount: seasons.size,
    groundVisitCount: groundVisits,
  };
}

async function readCoreSnapshot(): Promise<StorageSnapshot> {
  const allKeys = await AsyncStorage.getAllKeys();
  const relevant = allKeys.filter(
    (key) =>
      key === CORE_KEYS.savedFrame ||
      key === CORE_KEYS.groundVisits ||
      key === CORE_KEYS.ticketStyle ||
      key === CORE_KEYS.onboardingComplete ||
      key === CACHE_KEYS.fixtureCache,
  );
  const pairs = await AsyncStorage.multiGet(relevant);
  return Object.fromEntries(pairs);
}

function backupKeyFor(from: number, to: number): string {
  return `ticket-frame.backup.pre-migration.v${from}-to-v${to}.${Date.now()}`;
}

async function persistBackup(
  snapshot: StorageSnapshot,
  from: number,
  to: number,
): Promise<string> {
  const key = backupKeyFor(from, to);
  await AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), snapshot }));
  return key;
}

async function restoreBackup(snapshot: StorageSnapshot): Promise<void> {
  const pairs: Array<[string, string | null]> = Object.entries(snapshot).map(
    ([key, value]) => [key, value ?? null],
  );
  await AsyncStorage.multiSet(pairs as Array<[string, string]>);
}

/* ------------------------------------------------------------------ */
/* Migrations                                                          */
/*                                                                     */
/* Example of the shape a future v1→v2 migration takes:                */
/*                                                                     */
/*   {                                                                 */
/*     fromVersion: 1,                                                 */
/*     toVersion: 2,                                                   */
/*     description: "Add attendanceHistory namespace beside tickets", */
/*     apply: async () => { ...transform copies, never truncate... },  */
/*     verify: async () => { ...throw on any regression... },          */
/*   }                                                                 */
/* ------------------------------------------------------------------ */

export type Migration = {
  fromVersion: number;
  toVersion: number;
  description: string;
  apply: () => Promise<void>;
  /**
   * Post-apply verification against pre-migration counts and the exact
   * pre-migration snapshot. Throw to abort; the framework restores the
   * backup automatically.
   */
  verify: (
    before: StorageCounts,
    context: { snapshotBefore: StorageSnapshot },
  ) => Promise<void>;
};

/** Registered migrations, ordered by fromVersion. */
export const MIGRATIONS: Migration[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    description:
      "V3.9 Football History foundation — additive attendance-history namespace; existing data must remain byte-identical.",
    // Purely additive: the new key is created lazily on first write, so the
    // migration itself transforms nothing.
    apply: async () => {},
    verify: async (_before, { snapshotBefore }) => {
      const current = await readCoreSnapshot();
      const failures: string[] = [];
      for (const key of [
        CORE_KEYS.savedFrame,
        CORE_KEYS.groundVisits,
        CORE_KEYS.ticketStyle,
        CORE_KEYS.onboardingComplete,
        CACHE_KEYS.fixtureCache,
      ]) {
        if ((snapshotBefore[key] ?? null) !== (current[key] ?? null))
          failures.push(`existing data changed for ${key}`);
      }
      if (failures.length > 0) throw new Error(failures.join("; "));
    },
  },
];

export type MigrationOutcome = {
  ran: boolean;
  ok: boolean;
  fromVersion: number;
  toVersion: number;
};

/**
 * Entry point called once at startup BEFORE any user data is read into the
 * app. Stamps the version on first launch and runs pending migrations with
 * full backup/verify/restore discipline. Never throws.
 */
export async function ensureStorageSchema(): Promise<MigrationOutcome> {
  const outcome: MigrationOutcome = {
    ran: false,
    ok: true,
    fromVersion: STORAGE_VERSION.currentVersion,
    toVersion: STORAGE_VERSION.currentVersion,
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
    const from = raw ? Number.parseInt(raw, 10) : NaN;

    // First launch under V3.8+: stamp baseline. No transform, no backup needed.
    if (Number.isNaN(from)) {
      await AsyncStorage.setItem(
        STORAGE_VERSION_KEY,
        String(STORAGE_VERSION.currentVersion),
      );
      console.log(
        `[STORAGE-MIGRATION] storage version stamped: v${STORAGE_VERSION.currentVersion} (baseline, no migration required)`,
      );
      return outcome;
    }

    if (from === STORAGE_VERSION.currentVersion) return outcome;

    // Newer than this build understands (app downgrade): do nothing, keep data.
    if (from > STORAGE_VERSION.currentVersion) {
      console.warn(
        `[STORAGE-MIGRATION] stored version v${from} newer than supported v${STORAGE_VERSION.currentVersion}; leaving data untouched`,
      );
      return outcome;
    }

    outcome.fromVersion = from;
    outcome.toVersion = STORAGE_VERSION.currentVersion;

    const pending = MIGRATIONS.filter(
      (m) => m.fromVersion >= from && m.toVersion <= STORAGE_VERSION.currentVersion,
    ).sort((a, b) => a.fromVersion - b.fromVersion);

    if (pending.length === 0) {
      // Version bump without registered steps: stamp through safely.
      await AsyncStorage.setItem(
        STORAGE_VERSION_KEY,
        String(STORAGE_VERSION.currentVersion),
      );
      console.log(
        `[STORAGE-MIGRATION] v${from} → v${STORAGE_VERSION.currentVersion}: no registered steps, stamped through`,
      );
      return outcome;
    }

    for (const migration of pending) {
      const snapshot = await readCoreSnapshot();
      const before = countsFromSnapshot(snapshot);
      const backupKey = await persistBackup(snapshot, migration.fromVersion, migration.toVersion);

      console.log(
        [
          "[STORAGE-MIGRATION]",
          `fromVersion: ${migration.fromVersion}`,
          `toVersion: ${migration.toVersion}`,
          `ticketCountBefore: ${before.ticketCount}`,
          `seasonCountBefore: ${before.seasonCount}`,
          `groundVisitCountBefore: ${before.groundVisitCount}`,
          `backupCreated: ${backupKey}`,
        ].join("\n"),
      );

      try {
        await migration.apply();

        const afterSnapshot = await readCoreSnapshot();
        const after = countsFromSnapshot(afterSnapshot);

        // ---- safety rules -------------------------------------------------
        const failures: string[] = [];

        if (after.ticketCount < before.ticketCount)
          failures.push(
            `ticket count decreased (${before.ticketCount} → ${after.ticketCount})`,
          );

        const beforeTickets =
          parseSavedFrame(snapshot[CORE_KEYS.savedFrame])?.tickets ?? [];
        const afterTickets =
          parseSavedFrame(afterSnapshot[CORE_KEYS.savedFrame])?.tickets ?? [];
        const beforeIds = new Set(beforeTickets.map((t) => t.id));
        const afterIds = new Set(afterTickets.map((t) => t.id));
        for (const id of beforeIds)
          if (!afterIds.has(id)) failures.push(`ticket id vanished: ${id}`);

        const beforeUris = new Map(
          beforeTickets.map((t) => [t.id ?? "", t.uri ?? ""]),
        );
        for (const t of afterTickets) {
          const originalUri = beforeUris.get(t.id ?? "");
          if (originalUri !== undefined && originalUri !== (t.uri ?? ""))
            failures.push(`image reference changed for ticket ${t.id}`);
        }

        await migration.verify(before, { snapshotBefore: snapshot });

        if (failures.length > 0) throw new Error(failures.join("; "));
        // -------------------------------------------------------------------

        await AsyncStorage.setItem(
          STORAGE_VERSION_KEY,
          String(migration.toVersion),
        );
        outcome.ran = true;

        console.log(
          [
            "[STORAGE-MIGRATION-COMPLETE]",
            `ticketCountAfter: ${after.ticketCount}`,
            `seasonCountAfter: ${after.seasonCount}`,
            `groundVisitCountAfter: ${after.groundVisitCount}`,
            `verificationPassed: true`,
            `backupRetained: ${backupKey}`,
          ].join("\n"),
        );
      } catch (error) {
        await restoreBackup(snapshot).catch(() => {});
        outcome.ok = false;
        console.error(
          [
            "[STORAGE-MIGRATION-FAILED]",
            `fromVersion: ${migration.fromVersion}`,
            `toVersion: ${migration.toVersion}`,
            `error: ${error instanceof Error ? error.message : String(error)}`,
            `restoredFromBackup: ${backupKey}`,
            `action: original data preserved; migration halted; app continues on v${migration.fromVersion} schema`,
          ].join("\n"),
        );
        return outcome;
      }
    }

    await AsyncStorage.setItem(
      STORAGE_VERSION_KEY,
      String(STORAGE_VERSION.currentVersion),
    );
    return outcome;
  } catch (error) {
    console.warn(
      "[STORAGE-MIGRATION] version check failed; continuing with existing load path",
      error instanceof Error ? error.message : error,
    );
    outcome.ok = false;
    return outcome;
  }
}
