import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";

import {
  applyHostedMatchDatabase,
  getMatchDatabaseGeneratedAt,
} from "./fixtures";

const CACHE_PATH = `${FileSystem.documentDirectory}ticket-frame-tfd-v1.json`;
const DEFAULT_SNAPSHOT_URL =
  "https://raw.githubusercontent.com/FlipFinderAI/FlipFinderAI/tfd-live/snapshot-v1.json";
const MAX_SNAPSHOT_CHARACTERS = 8_000_000;
let cachedHydration: Promise<boolean> | null = null;

function snapshotUrl() {
  const configured = Constants.expoConfig?.extra?.tfdSnapshotUrl;
  return typeof configured === "string" && configured.trim()
    ? configured.trim()
    : DEFAULT_SNAPSHOT_URL;
}

function parseAndApply(raw: string) {
  if (!raw || raw.length > MAX_SNAPSHOT_CHARACTERS) return false;
  try {
    return applyHostedMatchDatabase(JSON.parse(raw));
  } catch {
    return false;
  }
}

export function hydrateCachedTfd() {
  if (cachedHydration) return cachedHydration;
  cachedHydration = FileSystem.readAsStringAsync(CACHE_PATH)
    .then(parseAndApply)
    .catch(() => false);
  return cachedHydration;
}

export async function refreshHostedTfd() {
  const response = await fetch(`${snapshotUrl()}?checked=${Date.now()}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`TFD feed unavailable (${response.status})`);
  const raw = await response.text();
  if (raw.length > MAX_SNAPSHOT_CHARACTERS)
    throw new Error("TFD feed exceeded the safe size limit");

  const before = getMatchDatabaseGeneratedAt();
  const applied = parseAndApply(raw);
  const after = getMatchDatabaseGeneratedAt();
  if (applied) {
    const temporary = `${CACHE_PATH}.new`;
    await FileSystem.writeAsStringAsync(temporary, raw);
    await FileSystem.deleteAsync(CACHE_PATH, { idempotent: true });
    await FileSystem.moveAsync({ from: temporary, to: CACHE_PATH });
  }
  return { applied, generatedAt: after, changed: before !== after };
}
