import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { distanceMiles } from "@/lib/geoDistance";
import type { FootballGround } from "@/lib/grounds";
import { MEDIA_METADATA_CACHE_KEY } from "@/lib/storageKeys";
import { MEDIA_INDEX_STATE_KEY } from "@/lib/storageKeys";

export type MatchMediaReference = {
  assetId: string;
  type: "photo" | "video";
  width?: number;
  height?: number;
  fileName?: string | null;
  // Persist how this media entered Match Memory. Legacy references have no
  // source and are deliberately preserved rather than guessed.
  source?: "automatic" | "manual";
  // Preserve the original Photos GPS on Ticket Frame's own media reference.
  // This survives durable copying and means venue/stadium intelligence does
  // not depend on repeatedly asking Apple Photos for the location.
  latitude?: number;
  longitude?: number;
  creationTime?: number;
  // Photos' lightweight library URI is sufficient for image thumbnails and
  // avoids resolving/downloading an iCloud original just to paint the grid.
  previewUri?: string;
  // A durable app-owned copy. Photos-library identifiers can disappear when
  // an item is deleted, access is limited, or iCloud has evicted the original.
  localUri?: string;
};

const MAX_MATCH_PHOTO_ASSETS = 2000;
const matchAssetQueryCache = new Map<string, Promise<MediaLibrary.Asset[]>>();
const matchAssetInfoCache = new Map<
  string,
  Promise<MediaLibrary.AssetInfo | null>
>();
let mediaAlbumsQuery: Promise<MediaLibrary.Album[]> | null = null;

function mediaAlbums() {
  if (!mediaAlbumsQuery)
    mediaAlbumsQuery = MediaLibrary.getAlbumsAsync({
      includeSmartAlbums: true,
    }).catch((error) => {
      mediaAlbumsQuery = null;
      throw error;
    });
  return mediaAlbumsQuery;
}

function matchPhotoTimeWindow(matchDate: string) {
  const dayStart = new Date(`${matchDate}T00:00:00`);
  const dayEnd = new Date(`${matchDate}T23:59:59`);
  return {
    // Evening games can finish after midnight, and Photos metadata can cross
    // the local-day boundary. The tighter geo radius makes this safe.
    createdAfter: dayStart.getTime() - 6 * 60 * 60 * 1000,
    createdBefore: dayEnd.getTime() + 6 * 60 * 60 * 1000,
  };
}

async function queryMatchPhotoAssets(matchDate: string, albumId?: string) {
  const window = matchPhotoTimeWindow(matchDate);
  const assets: MediaLibrary.Asset[] = [];
  let after: string | undefined;

  do {
    const page = await Promise.race([
      MediaLibrary.getAssetsAsync({
        mediaType: [
          MediaLibrary.MediaType.photo,
          MediaLibrary.MediaType.video,
        ],
        ...window,
        album: albumId,
        first: Math.min(250, MAX_MATCH_PHOTO_ASSETS - assets.length),
        after,
        sortBy: [MediaLibrary.SortBy.creationTime],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Media library search timeout")),
          10000,
        ),
      ),
    ]);

    assets.push(...page.assets);
    after = page.hasNextPage ? page.endCursor : undefined;
  } while (after && assets.length < MAX_MATCH_PHOTO_ASSETS);

  return assets;
}

export function matchPhotoAssets(matchDate: string, albumId?: string) {
  const cacheKey = `${matchDate}|${albumId ?? "all"}`;
  const cached = matchAssetQueryCache.get(cacheKey);
  if (cached) return cached;
  const query = queryMatchPhotoAssets(matchDate, albumId).catch((error) => {
    matchAssetQueryCache.delete(cacheKey);
    throw error;
  });
  matchAssetQueryCache.set(cacheKey, query);
  return query;
}

type PersistentMediaMetadata = {
  latitude?: number;
  longitude?: number;
  creationTime?: number;
  mediaType?: string;
  checkedAt: number;
};

let persistentMediaMetadataLoaded = false;
let persistentMediaMetadataLoading: Promise<void> | null = null;
let persistentMediaMetadata: Record<string, PersistentMediaMetadata> = {};
let metadataPersistTimer: ReturnType<typeof setTimeout> | null = null;

async function ensurePersistentMediaMetadataLoaded() {
  if (persistentMediaMetadataLoaded) return;
  if (persistentMediaMetadataLoading) return persistentMediaMetadataLoading;

  persistentMediaMetadataLoading = AsyncStorage.getItem(MEDIA_METADATA_CACHE_KEY)
    .then((raw) => {
      if (raw) {
        try {
          persistentMediaMetadata = JSON.parse(raw) as Record<
            string,
            PersistentMediaMetadata
          >;
        } catch {
          persistentMediaMetadata = {};
        }
      }
      persistentMediaMetadataLoaded = true;
    })
    .catch(() => {
      persistentMediaMetadata = {};
      persistentMediaMetadataLoaded = true;
    })
    .finally(() => {
      persistentMediaMetadataLoading = null;
    });

  return persistentMediaMetadataLoading;
}

function schedulePersistentMetadataSave() {
  if (metadataPersistTimer) return;
  metadataPersistTimer = setTimeout(() => {
    metadataPersistTimer = null;
    void AsyncStorage.setItem(
      MEDIA_METADATA_CACHE_KEY,
      JSON.stringify(persistentMediaMetadata),
    );
  }, 750);
}

export function cachedMatchAssetInfo(asset: MediaLibrary.Asset | string) {
  const assetId = typeof asset === "string" ? asset : asset.id;
  const cached = matchAssetInfoCache.get(assetId);
  if (cached) return cached;

  const query = (async () => {
    await ensurePersistentMediaMetadataLoaded();

    const persisted = persistentMediaMetadata[assetId];
    if (
      persisted &&
      typeof persisted.latitude === "number" &&
      typeof persisted.longitude === "number"
    ) {
      return {
        id: assetId,
        location: {
          latitude: persisted.latitude,
          longitude: persisted.longitude,
        },
      } as MediaLibrary.AssetInfo;
    }

    const info = await MediaLibrary.getAssetInfoAsync(asset, {
      // Classification only needs metadata. Never make navigation or an
      // automatic scan wait for an iCloud original to download.
      shouldDownloadFromNetwork: false,
    }).catch(() => null);

    if (info) {
      persistentMediaMetadata[assetId] = {
        latitude: info.location?.latitude,
        longitude: info.location?.longitude,
        creationTime:
          typeof asset === "string" ? undefined : asset.creationTime,
        mediaType:
          typeof asset === "string" ? undefined : String(asset.mediaType),
        checkedAt: Date.now(),
      };
      schedulePersistentMetadataSave();
    }

    return info;
  })()
    .then((info) => {
      if (!info) matchAssetInfoCache.delete(assetId);
      return info;
    })
    .catch(() => {
      matchAssetInfoCache.delete(assetId);
      return null;
    });

  matchAssetInfoCache.set(assetId, query);
  return query;
}

export async function refreshMatchAssetInfo(
  asset: MediaLibrary.Asset | string,
) {
  const assetId = typeof asset === "string" ? asset : asset.id;
  await ensurePersistentMediaMetadataLoaded();
  matchAssetInfoCache.delete(assetId);
  const info = await MediaLibrary.getAssetInfoAsync(asset, {
    shouldDownloadFromNetwork: false,
  }).catch(() => null);
  if (info) {
    persistentMediaMetadata[assetId] = {
      latitude: info.location?.latitude,
      longitude: info.location?.longitude,
      creationTime:
        typeof asset === "string" ? undefined : asset.creationTime,
      mediaType:
        typeof asset === "string" ? undefined : String(asset.mediaType),
      checkedAt: Date.now(),
    };
    schedulePersistentMetadataSave();
    matchAssetInfoCache.set(assetId, Promise.resolve(info));
  }
  return info;
}

// A one-mile radius keeps distant matchday media out while allowing normal GPS drift,
// while still covering stadium approaches, concourses and nearby parking.
// Automatic Match Memory media belongs to the stadium area. Anything farther
// away must enter through the explicit Matchday Experience workflow.
const STADIUM_PHOTO_RADIUS_MILES = 1;

export type MediaIndexFixture = {
  recordId: string;
  matchDate: string;
  ground: Pick<FootballGround, "latitude" | "longitude">;
};

type IndexedAsset = {
  assetId: string;
  type: "photo" | "video";
  creationTime: number;
  width?: number;
  height?: number;
  fileName?: string | null;
  previewUri?: string;
  latitude?: number;
  longitude?: number;
};

type MediaIndexState = {
  version: 1;
  assets: Record<string, IndexedAsset>;
  fixtureAssetIds: Record<string, string[]>;
  oldestIndexedCreationTime?: number;
  newestIndexedCreationTime?: number;
  fixtureRetryCursor?: number;
  activeAlbumId?: string;
  activeAlbumAfter?: string;
  completedAlbumIds?: string[];
  albumAssetCounts?: Record<string, number>;
  initialPassComplete: boolean;
};

const emptyMediaIndexState = (): MediaIndexState => ({
  version: 1,
  assets: {},
  fixtureAssetIds: {},
  initialPassComplete: false,
});

let mediaIndexState: MediaIndexState | null = null;
let mediaIndexLoad: Promise<MediaIndexState> | null = null;
let mediaIndexRun: Promise<void> | null = null;
let mediaIndexFixtures: MediaIndexFixture[] = [];
let priorityFixture: MediaIndexFixture | null = null;
let mediaIndexStopped = false;
const mediaIndexListeners = new Set<(
  recordId: string,
  references: MatchMediaReference[],
) => void>();

async function loadMediaIndexState() {
  if (mediaIndexState) return mediaIndexState;
  if (mediaIndexLoad) return mediaIndexLoad;
  mediaIndexLoad = AsyncStorage.getItem(MEDIA_INDEX_STATE_KEY)
    .then((raw) => {
      if (!raw) return emptyMediaIndexState();
      try {
        const parsed = JSON.parse(raw) as MediaIndexState;
        return parsed.version === 1 ? parsed : emptyMediaIndexState();
      } catch {
        return emptyMediaIndexState();
      }
    })
    .then((state) => (mediaIndexState = state))
    .finally(() => {
      mediaIndexLoad = null;
    });
  return mediaIndexLoad;
}

async function saveMediaIndexState(state: MediaIndexState) {
  mediaIndexState = state;
  await AsyncStorage.setItem(MEDIA_INDEX_STATE_KEY, JSON.stringify(state));
}

function indexedReference(asset: IndexedAsset): MatchMediaReference {
  return {
    source: "automatic",
    assetId: asset.assetId,
    type: asset.type,
    width: asset.width,
    height: asset.height,
    fileName: asset.fileName,
    latitude: asset.latitude,
    longitude: asset.longitude,
    creationTime: asset.creationTime,
    previewUri: asset.previewUri,
  };
}

function assetMatchesFixture(asset: IndexedAsset, fixture: MediaIndexFixture) {
  if (
    typeof asset.latitude !== "number" ||
    typeof asset.longitude !== "number"
  ) return false;
  const window = matchPhotoTimeWindow(fixture.matchDate);
  return asset.creationTime >= window.createdAfter &&
    asset.creationTime <= window.createdBefore &&
    distanceMiles(
      asset.latitude,
      asset.longitude,
      fixture.ground.latitude,
      fixture.ground.longitude,
    ) <= STADIUM_PHOTO_RADIUS_MILES;
}

function publishFixtureAssets(state: MediaIndexState, fixture: MediaIndexFixture) {
  const references = (state.fixtureAssetIds[fixture.recordId] ?? [])
    .map((assetId) => state.assets[assetId])
    .filter((asset): asset is IndexedAsset => Boolean(asset))
    .map(indexedReference);
  if (references.length)
    for (const listener of mediaIndexListeners)
      listener(fixture.recordId, references);
}

async function indexAssets(
  assets: MediaLibrary.Asset[],
  fixtures: MediaIndexFixture[],
  retryIncompleteMetadata = false,
) {
  const state = await loadMediaIndexState();
  for (let offset = 0; offset < assets.length; offset += 20) {
    // Invisible indexing must yield immediately when foreground work asks
    // it to stop. Priority fixture work is allowed to finish because that
    // work was explicitly promoted by the user's current action.
    if (mediaIndexStopped && fixtures === mediaIndexFixtures) return;

    // Foreground fixture requests pre-empt the general page between small
    // bridge batches. This bounds the wait without allowing a second Photos
    // scan to compete with the coordinated queue.
    if (priorityFixture && fixtures === mediaIndexFixtures) {
      const nextPriority = priorityFixture;
      priorityFixture = null;
      await runPriorityFixture(nextPriority);
    }
    const batch = assets.slice(offset, offset + 20);
    const inspected = await Promise.all(batch.map(async (asset) => {
      const existing = state.assets[asset.id];
      if (
        existing &&
        (!retryIncompleteMetadata ||
          (typeof existing.latitude === "number" &&
            typeof existing.longitude === "number"))
      ) return { ...existing, previewUri: existing.previewUri ?? asset.uri };
      const info = retryIncompleteMetadata
        ? await refreshMatchAssetInfo(asset)
        : await cachedMatchAssetInfo(asset);
      return {
        assetId: asset.id,
        type: asset.mediaType === MediaLibrary.MediaType.video ? "video" : "photo",
        creationTime: asset.creationTime,
        width: asset.width,
        height: asset.height,
        fileName: asset.filename ?? null,
        previewUri: asset.uri,
        latitude: info?.location?.latitude,
        longitude: info?.location?.longitude,
      } satisfies IndexedAsset;
    }));
    for (const indexed of inspected) {
      state.assets[indexed.assetId] = indexed;
      for (const fixture of fixtures) {
        if (!assetMatchesFixture(indexed, fixture)) continue;
        const ids = new Set(state.fixtureAssetIds[fixture.recordId] ?? []);
        const wasNew = !ids.has(indexed.assetId);
        ids.add(indexed.assetId);
        state.fixtureAssetIds[fixture.recordId] = [...ids];
        if (wasNew) publishFixtureAssets(state, fixture);
      }
    }
    // Persist a useful checkpoint without repeatedly serialising the entire
    // growing index on every small Photos bridge batch.
    if (offset > 0 && offset % 100 === 0)
      await saveMediaIndexState(state);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  await saveMediaIndexState(state);
}

async function runPriorityFixture(fixture: MediaIndexFixture) {
  const assets = await queryMatchPhotoAssets(fixture.matchDate);
  // A prior background pass may have encountered an iCloud/shared asset while
  // its lightweight GPS metadata was temporarily unavailable. Retry only the
  // incomplete assets in this fixture's tight date window; classification
  // still never downloads an original and still requires real stadium GPS.
  await indexAssets(assets, [fixture], true);
  const state = await loadMediaIndexState();
  publishFixtureAssets(state, fixture);
}

function assetFallsInAnyFixtureWindow(
  asset: MediaLibrary.Asset,
  fixtures: MediaIndexFixture[],
) {
  return fixtures.some((fixture) => {
    const window = matchPhotoTimeWindow(fixture.matchDate);
    return asset.creationTime >= window.createdAfter &&
      asset.creationTime <= window.createdBefore;
  });
}

async function indexNextAlbumPage(state: MediaIndexState) {
  const albums = await mediaAlbums().catch(() => []);
  const completed = new Set(state.completedAlbumIds ?? []);
  const albumAssetCounts = state.albumAssetCounts ?? {};
  for (const candidate of albums) {
    if (
      completed.has(candidate.id) &&
      albumAssetCounts[candidate.id] !== candidate.assetCount
    ) completed.delete(candidate.id);
  }
  let album = state.activeAlbumId
    ? albums.find((item) => item.id === state.activeAlbumId)
    : undefined;
  if (!album) album = albums.find((item) => !completed.has(item.id));
  if (!album) return;

  const page = await MediaLibrary.getAssetsAsync({
    album: album.id,
    mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
    first: 250,
    after: state.activeAlbumId === album.id
      ? state.activeAlbumAfter
      : undefined,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });
  const relevant = page.assets.filter((asset) =>
    assetFallsInAnyFixtureWindow(asset, mediaIndexFixtures),
  );
  if (relevant.length)
    await indexAssets(relevant, mediaIndexFixtures, true);

  if (page.hasNextPage && page.endCursor) {
    state.activeAlbumId = album.id;
    state.activeAlbumAfter = page.endCursor;
  } else {
    completed.add(album.id);
    state.completedAlbumIds = [...completed];
    state.albumAssetCounts = {
      ...albumAssetCounts,
      [album.id]: album.assetCount,
    };
    state.activeAlbumId = undefined;
    state.activeAlbumAfter = undefined;
  }
  await saveMediaIndexState(state);
}

async function runMediaIndex() {
  const state = await loadMediaIndexState();

  // Foreground always wins. If the user has opened/prioritised a specific
  // match, resolve only its tight match-date Photos window before doing any
  // invisible cache/index maintenance.
  if (priorityFixture) {
    const nextPriority = priorityFixture;
    priorityFixture = null;
    await runPriorityFixture(nextPriority);
  }

  if (mediaIndexStopped) return;

  // Fixture links are persisted. Rebuild only descriptors the current build
  // has never seen; rescanning every indexed asset for every fixture on each
  // heartbeat can monopolise the JS thread and freeze History/startup.
  let rebuiltFixtureLinks = false;
  for (const fixture of mediaIndexFixtures) {
    if (mediaIndexStopped) return;

    if (Object.prototype.hasOwnProperty.call(
      state.fixtureAssetIds,
      fixture.recordId,
    )) {
      publishFixtureAssets(state, fixture);
      continue;
    }
    const ids = Object.values(state.assets)
      .filter((asset) => assetMatchesFixture(asset, fixture))
      .map((asset) => asset.assetId);
    state.fixtureAssetIds[fixture.recordId] = ids;
    rebuiltFixtureLinks = true;
    publishFixtureAssets(state, fixture);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  if (rebuiltFixtureLinks) await saveMediaIndexState(state);

  // Albums (including iOS-exposed shared/iCloud and smart albums) are each
  // paged once and checkpointed. Filter by every fixture time window before
  // requesting GPS, so one pass can populate all seasons without repeating
  // the entire album for every unmatched match.
  if (
    !mediaIndexStopped &&
    state.initialPassComplete &&
    mediaIndexFixtures.length &&
    !priorityFixture
  )
    await indexNextAlbumPage(state);

  // Once the main pass is complete, each app-session heartbeat repairs a
  // bounded slice of fixture date windows. Earlier builds could mark an asset
  // indexed while Photos temporarily withheld its GPS; revisiting several
  // fixtures at a time restores those associations across older seasons
  // without a competing whole-library rescan.
  if (state.initialPassComplete && mediaIndexFixtures.length) {
    let cursor = state.fixtureRetryCursor ?? 0;
    const pastFixtures = mediaIndexFixtures.filter(
      (fixture) => fixture.matchDate <= new Date().toISOString().slice(0, 10),
    );
    for (let count = 0; count < Math.min(3, pastFixtures.length); count += 1) {
      if (mediaIndexStopped) return;
      if (priorityFixture) break;
      const fixture = pastFixtures[cursor % pastFixtures.length];
      await runPriorityFixture(fixture);
      cursor = (cursor + 1) % pastFixtures.length;
    }
    state.fixtureRetryCursor = cursor;
    await saveMediaIndexState(state);
  }

  let after: string | undefined;
  do {
    if (mediaIndexStopped) return;
    if (priorityFixture) {
      const nextPriority = priorityFixture;
      priorityFixture = null;
      await runPriorityFixture(nextPriority);
      continue;
    }
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      first: 250,
      after,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      ...(state.initialPassComplete && state.newestIndexedCreationTime
        ? { createdAfter: state.newestIndexedCreationTime }
        : !state.initialPassComplete && state.oldestIndexedCreationTime
          ? { createdBefore: state.oldestIndexedCreationTime + 1 }
          : {}),
    });
    const unindexed = page.assets.filter((asset) => !state.assets[asset.id]);
    await indexAssets(unindexed, mediaIndexFixtures);
    for (const asset of page.assets) {
      state.oldestIndexedCreationTime = Math.min(
        state.oldestIndexedCreationTime ?? asset.creationTime,
        asset.creationTime,
      );
      state.newestIndexedCreationTime = Math.max(
        state.newestIndexedCreationTime ?? asset.creationTime,
        asset.creationTime,
      );
    }
    await saveMediaIndexState(state);
    after = page.hasNextPage ? page.endCursor : undefined;
  } while (after);
  state.initialPassComplete = true;
  await saveMediaIndexState(state);
}

export function subscribeToMediaIndex(
  listener: (recordId: string, references: MatchMediaReference[]) => void,
) {
  mediaIndexListeners.add(listener);
  return () => {
    mediaIndexListeners.delete(listener);
  };
}

export async function startMediaIndex(fixtures: MediaIndexFixture[]) {
  mediaIndexFixtures = fixtures;
  mediaIndexStopped = false;
  const state = await loadMediaIndexState();
  for (const fixture of fixtures) publishFixtureAssets(state, fixture);
  if (!mediaIndexRun) {
    mediaIndexRun = runMediaIndex()
      .catch((error) => console.warn("[media-index] failed", error))
      .finally(() => { mediaIndexRun = null; });
  }
  return mediaIndexRun;
}

export function prioritizeMediaIndexFixture(fixture: MediaIndexFixture) {
  priorityFixture = fixture;
  void startMediaIndex(mediaIndexFixtures.some((item) => item.recordId === fixture.recordId)
    ? mediaIndexFixtures
    : [fixture, ...mediaIndexFixtures]);
}

export function stopMediaIndex() {
  mediaIndexStopped = true;
  return mediaIndexRun ?? Promise.resolve();
}

async function matchMediaAssetsAtGround(
  assets: MediaLibrary.Asset[],
  ground: Pick<FootballGround, "latitude" | "longitude">,
) {
  const inspected: {
    asset: MediaLibrary.Asset;
    info: MediaLibrary.AssetInfo | null;
  }[] = [];
  // Avoid flooding the iOS Photos bridge with hundreds of metadata calls at
  // once. Small batches leave taps and animations responsive during a scan.
  for (let offset = 0; offset < assets.length; offset += 20) {
    const batch = assets.slice(offset, offset + 20);
    inspected.push(
      ...(await Promise.all(
        batch.map(async (asset) => ({
          asset,
          info: await cachedMatchAssetInfo(asset),
        })),
      )),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const directMatches = inspected.filter(({ info }) =>
    Boolean(
      info?.location &&
        distanceMiles(
          info.location.latitude,
          info.location.longitude,
          ground.latitude,
          ground.longitude,
        ) <= STADIUM_PHOTO_RADIUS_MILES,
    ),
  );
  // Match Memory stadium discovery is deliberately strict.
  // Automatic stadium media must carry genuine GPS metadata and be within
  // the stadium radius. Date/time alone is never enough evidence because it
  // can pull unrelated photos from elsewhere on the same matchday.
  //
  // Locationless media remains available for explicit user selection and
  // Matchday Experience, but is never silently classified as stadium media.
  const matches = directMatches;
  return matches.map(({ asset, info }) => ({
    source: "automatic" as const,
    assetId: asset.id,
    type:
      asset.mediaType === MediaLibrary.MediaType.video
        ? ("video" as const)
        : ("photo" as const),
    width: asset.width,
    height: asset.height,
    fileName: asset.filename ?? null,
    latitude: info?.location?.latitude,
    longitude: info?.location?.longitude,
    creationTime: asset.creationTime,
  }));
}

export async function matchGeotaggedMatchdayMedia(
  assets: MediaLibrary.Asset[],
  ground: Pick<FootballGround, "latitude" | "longitude">,
) {
  // Distant pubs, restaurants and stations are intentionally excluded here.
  // They are attached only after the user creates/confirms a Matchday
  // Experience location.
  return matchMediaAssetsAtGround(assets, ground);
}

export async function removeDuplicateMatchPhotoReferences(
  stored: Record<string, string[]>,
): Promise<Record<string, string[]>> {
  const cleaned: Record<string, string[]> = {};
  for (const [recordId, uris] of Object.entries(stored)) {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const uri of uris) {
      let fingerprint = uri;
      try {
        if (uri.startsWith("file:")) {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          fingerprint = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            base64,
          );
        }
      } catch {
        // Keep a valid-looking reference even when an iCloud/file read fails.
      }
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      unique.push(uri);
    }
    cleaned[recordId] = unique;
  }
  return cleaned;
}
