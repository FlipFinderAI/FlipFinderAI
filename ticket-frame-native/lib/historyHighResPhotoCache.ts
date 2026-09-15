import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import {
  HISTORY_HIGH_RES_PHOTO_CACHE_KEY,
  HISTORY_HIGH_RES_PHOTO_CACHE_LIMIT_KEY,
} from "./storageKeys";

const CACHE_DIRECTORY = `${FileSystem.cacheDirectory}history-high-res/`;

export const HISTORY_HIGH_RES_CACHE_OPTIONS_MB = [
  250,
  500,
  1024,
  2048,
] as const;

export const DEFAULT_HISTORY_HIGH_RES_CACHE_MB = 1024;

type CacheEntry = {
  assetId: string;
  fileName: string | null;
  size: number;
  viewCount: number;
  lastViewedAt: number;
};

type CacheIndex = Record<string, CacheEntry>;

const safeFileName = (assetId: string) =>
  `${encodeURIComponent(assetId).replace(/%/g, "_")}.jpg`;

const loadIndex = async (): Promise<CacheIndex> => {
  try {
    const raw = await AsyncStorage.getItem(
      HISTORY_HIGH_RES_PHOTO_CACHE_KEY,
    );
    return raw ? (JSON.parse(raw) as CacheIndex) : {};
  } catch {
    return {};
  }
};

const saveIndex = (index: CacheIndex) =>
  AsyncStorage.setItem(
    HISTORY_HIGH_RES_PHOTO_CACHE_KEY,
    JSON.stringify(index),
  );

const ensureDirectory = () =>
  FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, {
    intermediates: true,
  }).catch(() => undefined);

const fileUriForEntry = (entry: CacheEntry) =>
  entry.fileName ? `${CACHE_DIRECTORY}${entry.fileName}` : null;

export const getHistoryHighResCacheLimitMb = async () => {
  const raw = await AsyncStorage.getItem(
    HISTORY_HIGH_RES_PHOTO_CACHE_LIMIT_KEY,
  );

  const parsed = raw ? Number(raw) : DEFAULT_HISTORY_HIGH_RES_CACHE_MB;

  return HISTORY_HIGH_RES_CACHE_OPTIONS_MB.includes(
    parsed as (typeof HISTORY_HIGH_RES_CACHE_OPTIONS_MB)[number],
  )
    ? parsed
    : DEFAULT_HISTORY_HIGH_RES_CACHE_MB;
};

const enforceLimit = async (
  index: CacheIndex,
  maxMb: number,
  protectedAssetId?: string,
) => {
  const maxBytes = maxMb * 1024 * 1024;

  let totalBytes = Object.values(index).reduce(
    (total, entry) => total + entry.size,
    0,
  );

  if (totalBytes <= maxBytes) return;

  const evictionOrder = Object.values(index)
    .filter(
      (entry) =>
        entry.fileName &&
        entry.size > 0 &&
        entry.assetId !== protectedAssetId,
    )
    .sort(
      (a, b) =>
        a.viewCount - b.viewCount ||
        a.lastViewedAt - b.lastViewedAt,
    );

  for (const entry of evictionOrder) {
    if (totalBytes <= maxBytes) break;

    const uri = fileUriForEntry(entry);

    if (uri) {
      await FileSystem.deleteAsync(uri, {
        idempotent: true,
      }).catch(() => undefined);
    }

    totalBytes -= entry.size;
    entry.fileName = null;
    entry.size = 0;
  }

  await saveIndex(index);
};

export const setHistoryHighResCacheLimitMb = async (
  maxMb: number,
) => {
  if (
    !HISTORY_HIGH_RES_CACHE_OPTIONS_MB.includes(
      maxMb as (typeof HISTORY_HIGH_RES_CACHE_OPTIONS_MB)[number],
    )
  ) {
    throw new Error("Unsupported high-resolution cache size");
  }

  await AsyncStorage.setItem(
    HISTORY_HIGH_RES_PHOTO_CACHE_LIMIT_KEY,
    String(maxMb),
  );

  const index = await loadIndex();
  await enforceLimit(index, maxMb);
};

export const getCachedHistoryHighResPhoto = async (
  assetId: string,
): Promise<string | null> => {
  const index = await loadIndex();
  const entry = index[assetId];

  if (!entry?.fileName) return null;

  const uri = fileUriForEntry(entry);
  if (!uri) return null;

  const info = await FileSystem.getInfoAsync(uri).catch(() => null);

  if (!info?.exists || !(info.size ?? 0)) {
    entry.fileName = null;
    entry.size = 0;
    await saveIndex(index);
    return null;
  }

  entry.size = info.size ?? entry.size;
  entry.viewCount += 1;
  entry.lastViewedAt = Date.now();
  await saveIndex(index);

  return uri;
};

export const cacheHistoryHighResPhoto = async (
  assetId: string,
  sourceUri: string,
): Promise<string> => {
  await ensureDirectory();

  const index = await loadIndex();
  const previous = index[assetId];

  if (previous?.fileName) {
    const previousUri = fileUriForEntry(previous);

    if (previousUri) {
      const previousInfo = await FileSystem.getInfoAsync(
        previousUri,
      ).catch(() => null);

      if (previousInfo?.exists && (previousInfo.size ?? 0) > 0) {
        previous.size = previousInfo.size ?? previous.size;
        previous.viewCount += 1;
        previous.lastViewedAt = Date.now();
        await saveIndex(index);
        return previousUri;
      }
    }

    previous.fileName = null;
    previous.size = 0;
  }

  const fileName = safeFileName(assetId);
  const destination = `${CACHE_DIRECTORY}${fileName}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destination,
  });

  const info = await FileSystem.getInfoAsync(destination);

  if (!info.exists || !(info.size ?? 0)) {
    await FileSystem.deleteAsync(destination, {
      idempotent: true,
    }).catch(() => undefined);

    throw new Error("High-resolution photo cache copy failed");
  }

  index[assetId] = {
    assetId,
    fileName,
    size: info.size ?? 0,
    viewCount: (previous?.viewCount ?? 0) + 1,
    lastViewedAt: Date.now(),
  };

  await saveIndex(index);

  const maxMb = await getHistoryHighResCacheLimitMb();
  await enforceLimit(index, maxMb, assetId);

  return destination;
};

export const clearHistoryHighResPhotoCache = async () => {
  await FileSystem.deleteAsync(CACHE_DIRECTORY, {
    idempotent: true,
  }).catch(() => undefined);

  await AsyncStorage.removeItem(HISTORY_HIGH_RES_PHOTO_CACHE_KEY);
};

export const getHistoryHighResPhotoCacheUsage = async () => {
  const index = await loadIndex();

  let usedBytes = 0;
  let cachedPhotos = 0;
  let changed = false;

  for (const entry of Object.values(index)) {
    const uri = fileUriForEntry(entry);

    if (!uri) continue;

    const info = await FileSystem.getInfoAsync(uri).catch(() => null);

    if (!info?.exists || !(info.size ?? 0)) {
      entry.fileName = null;
      entry.size = 0;
      changed = true;
      continue;
    }

    const actualSize = info.size ?? 0;

    if (entry.size !== actualSize) {
      entry.size = actualSize;
      changed = true;
    }

    usedBytes += actualSize;
    cachedPhotos += 1;
  }

  if (changed) await saveIndex(index);

  return {
    usedBytes,
    cachedPhotos,
  };
};
