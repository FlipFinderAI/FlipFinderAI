/* eslint-disable react-hooks/immutability */
import { useEffect, useRef, useState, useCallback, useMemo, Fragment } from "react";
import {
  Alert,
  AppState,
  Dimensions,
  Image,
    Keyboard,
  Linking,
  NativeModules,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Network from "expo-network";
import * as Crypto from "expo-crypto";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingFlow, {
  type OnboardingClub,
} from "@/components/onboarding/OnboardingFlow";
import {
  byCollectionOrder,
  byMatchDateOldestFirst,
  effectiveTicketStyle,
} from "../lib/ticketOrdering";
import FirstFrameCelebration from "@/components/onboarding/FirstFrameCelebration";
import DemoMode from "@/components/demo/DemoMode";
import FavouriteClubBadge from "@/components/club/FavouriteClubBadge";
import DraggableGridTile, { type TileRect } from "@/components/frames/DraggableGridTile";
import SeasonFrameExport from "@/components/frames/SeasonFrameExport";
import {
  FixtureListRow,
  LeagueTableRow,
} from "@/components/fixtures/FixtureRows";
import FixturesHeader, { type FixtureMode } from "@/components/fixtures/FixturesHeader";
import FixturesContent from "@/components/fixtures/FixturesContent";
import {
  FixturesError,
} from "@/components/fixtures/FixturesStatus";
import MatchMemoryVideoPlayer from "@/components/matchMemory/MatchMemoryVideoPlayer";
import {
  HistoryBackButton,
  MatchPhotoViewer,
} from "@/components/history/HistoryControls";
import HistoryCompetitionSelector from "@/components/history/HistoryCompetitionSelector";
import {
  HomeTicketImage,
  WalletTicketImage,
} from "@/components/tickets/TicketImages";
import TicketViewer from "@/components/tickets/TicketViewer";
import MatchConfirmationOverlay from "@/components/tickets/MatchConfirmationOverlay";
import OldSchoolCard from "@/components/tickets/OldSchoolCard";
import OldSchoolCaptureHost from "@/components/tickets/OldSchoolCaptureHost";
import {
  BackToHomeButton,
  BottomNavigation,
  type MainTab,
} from "@/components/navigation/MainNavigation";
import {
  formatFixtureDay,
  formatHistoryDate,
  formatKickoff12,
  formatKickoffTime,
  formatLastUpdated,
  formatTicketDate,
} from "@/lib/matchDisplayFormatting";
import {
  readableTextColour,
  visibleInkOnCream,
} from "@/lib/colorUtils";
import {
  currentTicketUri,
  logTicketImage,
  makeVersionedFingerprint,
  nowMs,
  permanentTicketUri,
  resolvePrintDimensions,
} from "@/lib/ticketFiles";
import {
  findGroundForClub,
  footballGroundForName,
} from "@/lib/clubGroundMatching";
import { distanceMiles } from "@/lib/geoDistance";
import {
  frameAccent,
  frameColour,
  frameHighlight,
  stylesList,
} from "@/lib/frameFinishes";
import {
  ENGLISH_LEAGUES,
  EXTRA_CLUBS,
  PLACEHOLDER_CLUB,
  PLACEHOLDER_CLUB_ID,
  type ClubOption,
} from "@/lib/clubCatalog";
import { CLUBS_92, CLUB_THEME } from "@/lib/englishClubCatalog";
import {
  AUTO_MEDIA_SCANNED_KEY,
  AUTO_PHOTO_MATCHED_KEY,
  COMPLETED_TICKETS_SINCE_BACKUP_KEY,
  DELETED_HISTORY_MATCHES_KEY,
  GROUND_VISITS_KEY,
  HISTORY_PHOTO_SETUP_KEY,
  MATCHDAY_CUSTOM_LOCATIONS_KEY,
  MATCHDAY_EXPERIENCES_KEY,
  MATCHDAY_MEDIA_ASSIGNMENTS_KEY,
  MATCH_MEDIA_REFERENCES_KEY,
  MATCH_PHOTOS_KEY,
  NEARBY_VENUE_CACHE_KEY,
  ONBOARDING_KEY,
  PARKING_CACHE_KEY,
  PHOTO_FEATURE_KEY,
  POLICY_AGREEMENT_KEY,
  PUB_VISIT_REPORTS_KEY,
  SAVED_FRAME_KEY,
  SIRI_ASKED_KEY,
  SIRI_FEATURE_KEY,
  TICKET_RESET_KEY,
  TICKET_STYLE_KEY,
} from "@/lib/storageKeys";
import {
  cachedMatchAssetInfo,
  refreshMatchAssetInfo,
  matchGeotaggedMatchdayMedia,
  matchPhotoAssets,
  prioritizeMediaIndexFixture,
  removeDuplicateMatchPhotoReferences,
  startMediaIndex,
  stopMediaIndex,
  subscribeToMediaIndex,
  type MatchMediaReference,
} from "@/lib/matchMediaLibrary";
import { clubInitials } from "@/lib/clubDisplay";
import {
  ticketClubOption as resolveTicketClubOption,
  ticketCollectionClubName as resolveTicketCollectionClubName,
} from "@/lib/ticketClubOwnership";
import { ticketGridPercentSize, ticketGridShape } from "@/lib/ticketGridLayout";
import { fetchMatchWeather, type MatchWeather } from "@/lib/matchWeather";
import "@/lib/notificationSetup";
import {
  ParkingSearchModule,
  SiriShortcutsModule,
  type NearbyParkingResult,
  type NearbyVenueKind,
  type NearbyVenueResult,
} from "@/lib/nativeIntegrations";
import type {
  MatchdayCustomLocation,
  MatchdayExperienceRecord,
  MatchdayFinderKind,
  MatchdayMediaAssignment,
  MatchdaySupporterType,
  MatchdayVenueVisit,
  PubSupporterAudience,
  PubVisitReport,
} from "@/lib/matchdayTypes";
import {
  MATCHDAY_VENUE_OUTER_RADIUS_MILES,
  STADIUM_MEDIA_CORE_RADIUS_MILES,
} from "@/lib/matchdayConfig";
import {
  autoCropTicketScreenshot,
} from "@/lib/ticketCropAnalysis";
import { openNativeCropper } from "@/lib/ticketCropper";
import { ensureStorageSchema } from "@/lib/storageMigrations";
import {
  addManualAttendance,
  attendanceSuppressionKey,
  canonicalSeason,
  findMatchingAttendance,
  historyCounts,
  isSeasonFixtureAttended,
  loadAttendanceHistory,
  saveAttendanceHistory,
  type AttendanceRecord,
  type AttendanceResult,
} from "@/lib/attendanceHistory";
import {
  deriveAttendancesFromTickets,
  isNonMatchTicketType,
  isValidMatchTicket,
  mergeHistoryRecords,
  resultForAttendance,
  scoresForAttendance,
} from "@/lib/historyDerivation";
import { fixtureForAttendance } from "@/lib/historyFixtureMatching";
import {
  historyStadiumRows,
  uniqueHistoryStadiumCount,
} from "@/lib/historyStadiums";
import {
  confirmedGroundVisitCounts,
  groundTrackerRows,
  type GroundTrackerRow,
} from "@/lib/groundTracker";
import {
  attendanceResultCounts,
  filteredHistoryMatches,
  HISTORY_SOURCE_LABEL,
  historyCompetitionOptions,
  newestConfirmedHistory,
} from "@/lib/historyArchive";
import { FOOTBALL_GROUNDS, type FootballGround } from "@/lib/grounds";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Picker } from "@react-native-picker/picker";
import {
  BACKUP_REMINDER_TICKET_COUNT,
  LOCAL_BACKUP_DIRECTORY,
  createLocalBackup,
  localBackupManifest,
  restoreLocalBackup,
} from "../lib/localBackup";
import {
  CURRENT_SEASON,
  fetchLeagueTableWithFallback,
  getMatchDatabaseGeneratedAt,
  findBundledLeagueForClub,
  getAllBundledClubFixtures,
  getBundledCompetitionNamesForSeason,
  getBundledCompetitionFixtures,
  fetchTeamFixtures,
  isFixturePlayed,
  loadCachedClubFixtures,
  resolveTeamId,
  type FixtureRow,
  type TableRow,
} from "@/lib/fixtures";
import { hydrateCachedTfd, refreshHostedTfd } from "@/lib/hostedTfd";
import { getHistoricalSeasonFixtures } from "@/lib/historicalMatchStore";

import {
  createSeasonFrame,
  normaliseSeasonEntry,
  seasonBoundsLabel,
  seasonForDate,
} from "@/lib/seasons";
import {
  canonicalClubName,
  clubNamesMatch,
  dateFromTicketText,
  normaliseFixtureText,
  type TicketSeatDetails,
} from "@/lib/ticketText";
import {
  TICKET_STYLE_OPTIONS,
  type SeasonTicket,
  type TicketStyle,
} from "@/lib/ticketTypes";
import {
  fetchAndCacheFixtures,
  loadCachedFixtures,
  loadManualHistoryFixtureSuggestions,
  saveManualHistoryFixtureDateResolution,
  matchFixtureForText,
  compareFixturesForPicker,
  getFixtureCacheState,
  type CachedFixture,
} from "@/lib/fixtureCache";
import {
  recogniseTicketImage,
  groundForHomeTeam,
  buildTicketDisplayName,
  type RecognizedTicket,
} from "@/lib/ticketRecognition";
// V3.9.5 — ticket types, edit-details and separate item stores.
import {
  buildRecognitionPatch,
  composeSeatNotes,
  parseFlexibleDateInput,
  splitLinkedFixture,
  type ItemEditDraft,
} from "@/lib/ticketEdits";
import {
  addSeasonTicketProfile,
  loadSeasonTicketProfiles,
  newProfileId,
  saveSeasonTicketProfiles,
  type SeasonTicketProfile,
} from "@/lib/seasonTicketProfiles";
import {
  addCarParkPass,
  loadCarParkPasses,
  newCarParkPassId,
  saveCarParkPasses,
  type CarParkPass,
} from "@/lib/carParkPasses";
import { APP_NAME, APP_VERSION } from "@/lib/appVersion";
import {
  acknowledgeMatchCheckIn,
  configureMatchGeofences,
  isInCheckInWindow,
  isMatchCheckInAcknowledged,
  isMatchCheckInEnabled,
  setMatchCheckInEnabled,
  type MatchCheckInFixture,
} from "@/lib/matchCheckIn";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SCORE_PREFIX = /^\s*\(\d{1,2}\s*[-–—]\s*\d{1,2}\)\s*/;

function canonicalStoredClub(club: ClubOption | undefined): ClubOption | undefined {
  if (!club) return undefined;
  const strippedName = club.name.replace(SCORE_PREFIX, "").trim();
  if (!strippedName) return undefined;
  const key = strippedName
    .toLowerCase()
    .replace(/\bfc\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/u(?:td)?$/, "united");
  const catalog = [...CLUBS_92, ...EXTRA_CLUBS];
  return catalog.find((candidate) => {
    const candidateKey = candidate.name
      .toLowerCase()
      .replace(/\bfc\b/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .replace(/u(?:td)?$/, "united");
    return candidateKey === key;
  });
}






export default function HomeScreen() {
  const [frameStyle, setFrameStyle] = useState(stylesList[0]);
  const [tickets, setTickets] = useState<SeasonTicket[]>([]);
  const savedFrameWriteChainRef = useRef<Promise<void>>(Promise.resolve());
  const [finished, setFinished] = useState(false);
  const [homeFrameFocused, setHomeFrameFocused] = useState(false);
  const [fullFrameZoomed, setFullFrameZoomed] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string>();
  const [enlargedTicketId, setEnlargedTicketId] = useState<string>();
  const [exporting, setExporting] = useState(false);
  const [ticketPdfBusy, setTicketPdfBusy] = useState(false);
  const [printBusy, setPrintBusy] = useState(false);
  const [confirmQueue, setConfirmQueue] = useState<
    { ticket: SeasonTicket; recognition: RecognizedTicket }[]
  >([]);
  const recognitionImageUrisRef = useRef<Map<string, string>>(new Map());
  const photoImportActiveRef = useRef(false);
  const [photoImportActive, setPhotoImportActive] = useState(false);
  const ticketReviewResolversRef = useRef<
    Map<string, (result: "saved" | "skipped") => void>
  >(new Map());
  const [alternatives, setAlternatives] = useState<CachedFixture[] | null>(null);
  const alternativesRequestRef = useRef(0);
  const [pickerNotice, setPickerNotice] = useState<string | null>(null);
  const [frameMenuOpen, setFrameMenuOpen] = useState(false);
  const [ticketStyle, setTicketStyle] = useState<TicketStyle>("e-ticket");
  const [ticketStyleMenuOpen, setTicketStyleMenuOpen] = useState(false);
  const [, setExportWidth] = useState(1100);
  const [storageReady, setStorageReady] = useState(false);
  // V3.7 first-launch experience: null = still resolving from storage.
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [celebrationTicket, setCelebrationTicket] =
    useState<SeasonTicket | null>(null);
  const celebrateArmedRef = useRef(false);
  const recognitionDoneRef = useRef(false);
  const celebratedRef = useRef(false);
  const celebrationCandidateIdRef = useRef<string | null>(null);
  // V3.7.1 — isolated Demo Mode (display-only; see components/demo/DemoMode.tsx).
  // No demo data ever reaches tickets / groundVisits / storage.
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [demoLaunchedFromOnboarding, setDemoLaunchedFromOnboarding] =
    useState(false);
  const [resumeOnboardingAtClub, setResumeOnboardingAtClub] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>("frames");
  const [fixtureMode, setFixtureMode] = useState<FixtureMode>("fixtures");
  const [seasonFixtures, setSeasonFixtures] = useState<FixtureRow[]>([]);
  const [leagueTableRows, setLeagueTableRows] = useState<TableRow[]>([]);
  const [tableSeason, setTableSeason] = useState<string>(CURRENT_SEASON);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesError, setFixturesError] = useState<string | null>(null);
  const [fixturesUpdatedAt, setFixturesUpdatedAt] = useState<number | null>(() => {
    const generatedAt = Date.parse(getMatchDatabaseGeneratedAt());
    return Number.isFinite(generatedAt) ? generatedAt : null;
  });
  const [tfdDataRevision, setTfdDataRevision] = useState(0);
  const verifiedFixtureClubRef = useRef("");
  const fixtureLoadRequestRef = useRef(0);
  const [verifiedFixtureClubKey, setVerifiedFixtureClubKey] = useState("");
  const [clubApiId, setClubApiId] = useState<string>("");
  const [clubs] = useState<ClubOption[]>([...CLUBS_92, ...EXTRA_CLUBS]);
const [clubSearch, setClubSearch] = useState("");const [openLeague, setOpenLeague] = useState("");
  const [groundsLoading, setGroundsLoading] = useState(false);
  const [groundSearch, setGroundSearch] = useState("");
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [groundVisits, setGroundVisits] = useState<Record<string, number>>({});
  // V3.9 — Football History: separate attendance namespace (never tickets).
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  // Never persist the initial empty state before the stored history has
  // finished loading. On a fast startup that race could erase a manual match.
  const [attendanceHistoryReady, setAttendanceHistoryReady] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  // V3.9.4 — draft includes an explicit result override so a match can be
  // logged as W/D/L even when the score is unknown.
  const [draftMatch, setDraftMatch] = useState({
    club: "",
    opponent: "",
    matchDate: "",
    season: "",
    competition: "",
    ground: "",
    homeAway: "home" as "home" | "away",
    homeScore: "",
    awayScore: "",
    notes: "",
    fixtureId: null as string | null,
    fixtureDateStatus: null as CachedFixture["dateStatus"] | null,
    resultOverride: null as AttendanceResult | null,
  });
  // V3.9.4 — Football History archive navigation.
  const [historyView, setHistoryView] = useState<
    "home" | "matches" | "stadiums" | "seasons"
  >("home");
  const [matchCompetitionFilter, setMatchCompetitionFilter] =
    useState("All Competitions");
  const [competitionMenuOpen, setCompetitionMenuOpen] = useState(false);
  const [matchSortOrder, setMatchSortOrder] = useState<"newest" | "oldest">(
    "newest",
  );
  const [seasonFilter, setSeasonFilter] = useState("All Seasons");
  const [historySearch, setHistorySearch] = useState("");

  // V4.0.86 — Matches Attended is the default Football History view.
  // Seasons are collapsed independently and stay as the user left them when
  // opening a Match Memory and returning.
  const [expandedMatchHistorySeasons, setExpandedMatchHistorySeasons] =
    useState<Set<string>>(() => new Set());

  // V4.0.86 — Seasons view renders large seasons lazily.
  // This is deliberately separate from Matches Attended expansion state.
  const [expandedSeasonHistorySeasons, setExpandedSeasonHistorySeasons] =
    useState<Set<string>>(() => new Set());

  const [selectedHistoryRecordId, setSelectedHistoryRecordId] =
    useState<string | null>(null);
  const [historySelectionMode, setHistorySelectionMode] = useState(false);
  const [selectedHistoryDeleteIds, setSelectedHistoryDeleteIds] =
    useState<Set<string>>(new Set());
  const [deletedHistoryMatchKeys, setDeletedHistoryMatchKeys] =
    useState<Set<string>>(new Set());
  const [deletedHistoryMatchesReady, setDeletedHistoryMatchesReady] =
    useState(false);
  const historyScrollRef = useRef<ScrollView>(null);
  const historyScrollOffsetRef = useRef(0);
  const restoreHistoryScrollRef = useRef(false);
  const [selectedHistoryStadium, setSelectedHistoryStadium] =
    useState<string | null>(null);
  const [matchPhotos, setMatchPhotos] = useState<Record<string, string[]>>({});
  const [matchPhotosReady, setMatchPhotosReady] = useState(false);
  const [matchMediaReferences, setMatchMediaReferences] = useState<
    Record<string, MatchMediaReference[]>
  >({});
  const matchMediaReferencesRef = useRef<Record<string, MatchMediaReference[]>>({});
  const persistMediaReferencesRef = useRef<
    (
      recordId: string,
      references: MatchMediaReference[],
      sourceUris?: Record<string, string>,
    ) => Promise<MatchMediaReference[]>
  >(async () => []);
  const importTicketRef = useRef<() => void>(() => {});
  useEffect(() => {
    matchMediaReferencesRef.current = matchMediaReferences;
  }, [matchMediaReferences]);
  const [matchMediaReferencesReady, setMatchMediaReferencesReady] =
    useState(false);
  const [resolvedMatchMedia, setResolvedMatchMedia] = useState<
    Record<string, (MatchMediaReference & { uri: string })[]>
  >({});
  const [matchdayMediaAssignments, setMatchdayMediaAssignments] = useState<
    Record<string, MatchdayMediaAssignment>
  >({});
  const matchdayMediaAssignmentsRef =
    useRef<Record<string, MatchdayMediaAssignment>>({});

  const [matchdayMediaAssignmentsReady, setMatchdayMediaAssignmentsReady] =
    useState(false);
  const [matchdayCustomLocations, setMatchdayCustomLocations] = useState<
    Record<string, MatchdayCustomLocation[]>
  >({});
  const [mediaEditMode, setMediaEditMode] = useState(false);
  const [selectedMediaKeys, setSelectedMediaKeys] = useState<Set<string>>(new Set());
  const promptedMediaLocationGroupsRef = useRef<Set<string>>(new Set());
  const resolvedMatchMediaSignatureRef = useRef<Record<string, string>>({});
  const historyPhotoResolutionPromisesRef = useRef<
    Map<string, Promise<MediaLibrary.AssetInfo | null>>
  >(new Map());
  const [selectedMatchVideoUri, setSelectedMatchVideoUri] =
    useState<string | null>(null);
  const resolvingMatchVideoAssetIdsRef = useRef<Set<string>>(new Set());
  const [expandedSeasonPhotoFixtureKey, setExpandedSeasonPhotoFixtureKey] =
    useState<string | null>(null);
  const matchPhotoWriteChainRef = useRef<Promise<void>>(Promise.resolve());
  const [photoCandidates, setPhotoCandidates] = useState<Record<string, string[]>>({});
  const [enlargedMatchPhotoUri, setEnlargedMatchPhotoUri] = useState<string | null>(null);
  const [enlargedMatchPhotoLoading, setEnlargedMatchPhotoLoading] = useState(false);
  const [enlargedMatchPhotoError, setEnlargedMatchPhotoError] = useState<string | null>(null);
  const enlargedMatchPhotoRetryRef = useRef<(() => void) | null>(null);
  const enlargedMatchPhotoRequestRef = useRef(0);
  const [photoAction, setPhotoAction] = useState<"choose" | "find" | "auto" | null>(null);
  const [autoDiscoveryCompleted, setAutoDiscoveryCompleted] = useState(false);
  const [photoMemoriesEnabled, setPhotoMemoriesEnabled] = useState(true);
  const [photoWifiOnly, setPhotoWifiOnly] = useState(true);
  const [siriEnabled, setSiriEnabled] = useState(false);
  const [localBackupCreatedAt, setLocalBackupCreatedAt] = useState<string | null>(null);
  const [localBackupBusy, setLocalBackupBusy] = useState(false);
  const [installedNavigationApps, setInstalledNavigationApps] = useState({
    waze: false,
    google: false,
    checked: false,
  });
  const [completedTicketsSinceBackup, setCompletedTicketsSinceBackup] =
    useState(0);
  const completedTicketIdsRef = useRef<Set<string>>(new Set());
  const backupReminderPendingRef = useRef(false);
  const [autoPhotoMatchedRecordIds, setAutoPhotoMatchedRecordIds] = useState<Set<string>>(new Set());
  const autoPhotoScannedRecordsRef = useRef<Set<string>>(new Set());
  const [autoMediaScannedReady, setAutoMediaScannedReady] = useState(false);
  const mediaIndexSessionStartedAtRef = useRef(Date.now());

  const persistMatchPhotos = (next: Record<string, string[]>) => {
    const payload = JSON.stringify(next);
    matchPhotoWriteChainRef.current = matchPhotoWriteChainRef.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(MATCH_PHOTOS_KEY, payload));
  };

  const persistMatchMediaReferences = (
    next: Record<string, MatchMediaReference[]>,
  ) => {
    void AsyncStorage.setItem(MATCH_MEDIA_REFERENCES_KEY, JSON.stringify(next));
  };

  const addMatchMediaReferences = (
    recordId: string,
    references: MatchMediaReference[],
  ) => {
    if (!references.length) return;

    setMatchMediaReferences((current) => {
      const existing = current[recordId] ?? [];
      const byAssetId = new Map(
        existing.map((reference) => [reference.assetId, reference]),
      );

      let changed = false;
      for (const reference of references) {
        const previous = byAssetId.get(reference.assetId);
        const definedUpdate = Object.fromEntries(
          Object.entries(reference).filter(([, value]) => value !== undefined),
        ) as Partial<MatchMediaReference>;
        const merged = previous
          ? {
              ...previous,
              ...definedUpdate,
              localUri: reference.localUri ?? previous.localUri,
            }
          : reference;
        if (!previous || JSON.stringify(previous) !== JSON.stringify(merged))
          changed = true;
        byAssetId.set(reference.assetId, merged);
      }

      if (!changed) return current;

      const next = {
        ...current,
        [recordId]: Array.from(byAssetId.values()),
      };

      // Keep imperative/background index callbacks in lockstep with React so
      // a second streamed batch cannot merge against stale references.
      matchMediaReferencesRef.current = next;
      persistMatchMediaReferences(next);
      return next;
    });
  };

  const closeEnlargedMatchPhoto = () => {
    enlargedMatchPhotoRequestRef.current += 1;
    enlargedMatchPhotoRetryRef.current = null;
    setEnlargedMatchPhotoUri(null);
    setEnlargedMatchPhotoLoading(false);
    setEnlargedMatchPhotoError(null);
  };

  const openSavedMatchPhoto = (uri: string) => {
    // Legacy ph:// entries are resolved when their Match Memory opens.
    // Never send an unresolved Apple Photos identifier to React Native Image.
    if (uri.startsWith("ph://")) {
      setEnlargedMatchPhotoError(
        "This photo is still being prepared from Apple Photos. Try again in a moment.",
      );
      return;
    }

    enlargedMatchPhotoRequestRef.current += 1;
    enlargedMatchPhotoRetryRef.current = () => openSavedMatchPhoto(uri);
    setEnlargedMatchPhotoError(null);
    setEnlargedMatchPhotoLoading(true);
    setEnlargedMatchPhotoUri(uri);
  };

  useEffect(() => {
    if (!selectedHistoryRecordId) return;

    const stored = matchPhotos[selectedHistoryRecordId] ?? [];
    const legacyPhotos = stored.filter((uri) => uri.startsWith("ph://"));

    if (!legacyPhotos.length) return;

    let cancelled = false;

    const resolveLegacyPhotos = async () => {
      const replacements = new Map<string, string>();
      const directory = `${FileSystem.documentDirectory}match-memories/`;

      await FileSystem.makeDirectoryAsync(directory, {
        intermediates: true,
      }).catch(() => {});

      for (const uri of legacyPhotos) {
        if (cancelled) return;

        try {
          const assetId = uri.slice("ph://".length);

          const info = await MediaLibrary.getAssetInfoAsync(assetId, {
            shouldDownloadFromNetwork: true,
          });

          const sourceUri =
            info.localUri ??
            (info.uri && !info.uri.startsWith("ph://")
              ? info.uri
              : undefined);

          if (!sourceUri) continue;

          const sourceName = info.filename ?? sourceUri;
          const extension =
            sourceName
              .split("?")[0]
              ?.match(/\.([a-zA-Z0-9]{2,5})$/)?.[1]
              ?.toLowerCase() ?? "jpg";

          const digest = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            `${selectedHistoryRecordId}|${assetId}|legacy-photo`,
          );

          const destination =
            `${directory}${selectedHistoryRecordId.replace(
              /[^a-zA-Z0-9_-]/g,
              "-",
            )}-${digest.slice(0, 20)}.${extension}`;

          const existing = await FileSystem.getInfoAsync(destination);

          if (!existing.exists || !(existing.size ?? 0)) {
            await FileSystem.copyAsync({
              from: sourceUri,
              to: destination,
            });
          }

          const copied = await FileSystem.getInfoAsync(destination);

          if (copied.exists && (copied.size ?? 0) > 0) {
            replacements.set(uri, destination);
          }
        } catch (error) {
          console.warn(
            "Could not migrate legacy Match Memory photo",
            uri,
            error,
          );
        }
      }

      if (cancelled || !replacements.size) return;

      setMatchPhotos((current) => {
        const currentPhotos = current[selectedHistoryRecordId] ?? [];

        const nextPhotos = Array.from(
          new Set(
            currentPhotos.map(
              (uri) => replacements.get(uri) ?? uri,
            ),
          ),
        );

        const next = {
          ...current,
          [selectedHistoryRecordId]: nextPhotos,
        };

        persistMatchPhotos(next);
        return next;
      });
    };

    void resolveLegacyPhotos();

    return () => {
      cancelled = true;
    };
  }, [selectedHistoryRecordId]);

  const openReferencedMatchPhoto = async (
    recordId: string,
    media: MatchMediaReference & { uri: string },
  ) => {
    const requestId = enlargedMatchPhotoRequestRef.current + 1;
    enlargedMatchPhotoRequestRef.current = requestId;
    enlargedMatchPhotoRetryRef.current = () => {
      void openReferencedMatchPhoto(recordId, media);
    };
    setEnlargedMatchPhotoError(null);
    setEnlargedMatchPhotoLoading(true);
    setEnlargedMatchPhotoUri(media.localUri ?? media.uri);

    try {
      if (media.localUri) {
        const localInfo = await FileSystem.getInfoAsync(media.localUri);
        if (localInfo.exists && (localInfo.size ?? 0) > 0) return;
      }

      // Join any original-photo request already running for this asset.
      // Tapping an instant thumbnail must not start a second iCloud download.
      let assetInfo: MediaLibrary.AssetInfo | null = null;
      const inFlight =
        historyPhotoResolutionPromisesRef.current.get(media.assetId);

      if (inFlight) {
        assetInfo = await inFlight;
      } else {
        const request = MediaLibrary.getAssetInfoAsync(media.assetId, {
          shouldDownloadFromNetwork: true,
        }).catch(() => null);

        historyPhotoResolutionPromisesRef.current.set(
          media.assetId,
          request,
        );

        try {
          assetInfo = await request;
        } finally {
          if (
            historyPhotoResolutionPromisesRef.current.get(media.assetId) ===
            request
          ) {
            historyPhotoResolutionPromisesRef.current.delete(media.assetId);
          }
        }
      }

      if (!assetInfo)
        throw new Error("Apple Photos returned no usable file");

      const sourceUri = assetInfo.localUri ?? assetInfo.uri;
      if (!sourceUri) throw new Error("Apple Photos returned no usable file");

      const memoryDirectory = `${FileSystem.documentDirectory}match-memories/`;
      await FileSystem.makeDirectoryAsync(memoryDirectory, { intermediates: true });
      const sourceName = assetInfo.filename ?? media.fileName ?? sourceUri;
      const extensionMatch = sourceName.match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
      const extension = extensionMatch?.[1]?.toLowerCase() ?? "jpg";
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${recordId}|${media.assetId}|fullscreen-photo`,
      );
      const safeRecordId = recordId.replace(/[^a-zA-Z0-9_-]/g, "_");
      const destination = `${memoryDirectory}${safeRecordId}-${digest.slice(0, 20)}.${extension}`;
      const destinationInfo = await FileSystem.getInfoAsync(destination);
      if (!destinationInfo.exists || (destinationInfo.size ?? 0) === 0)
        await FileSystem.copyAsync({ from: sourceUri, to: destination });

      const copiedInfo = await FileSystem.getInfoAsync(destination);
      if (!copiedInfo.exists || (copiedInfo.size ?? 0) === 0)
        throw new Error("Downloaded photo was empty");

      addMatchMediaReferences(recordId, [{ ...media, localUri: destination }]);
      if (enlargedMatchPhotoRequestRef.current === requestId) {
        setEnlargedMatchPhotoUri(destination);
        setEnlargedMatchPhotoError(null);
      }
    } catch (error) {
      console.warn("Could not open full-size Match Memory photo", error);
      if (enlargedMatchPhotoRequestRef.current === requestId)
        setEnlargedMatchPhotoError(
          "Ticket Frame could not download this photo from Apple Photos. Check your connection and Photos access, then try again.",
        );
    } finally {
      if (enlargedMatchPhotoRequestRef.current === requestId)
        setEnlargedMatchPhotoLoading(false);
    }
  };

  const openReferencedMatchVideo = async (
    recordId: string,
    media: MatchMediaReference & { uri: string },
  ) => {
    // An existing Ticket Frame copy is instant and needs no Photos work.
    if (media.localUri) {
      const local = await FileSystem.getInfoAsync(media.localUri).catch(
        () => null,
      );

      if (local?.exists && (local.size ?? 0) > 0) {
        setSelectedMatchVideoUri((current) =>
          current === media.localUri ? null : media.localUri!,
        );
        return;
      }
    }

    // Do not allow repeated taps to start the same expensive operation twice.
    if (resolvingMatchVideoAssetIdsRef.current.has(media.assetId)) return;
    resolvingMatchVideoAssetIdsRef.current.add(media.assetId);

    try {
      // The user's explicit Play action owns the Photos queue.
      await stopMediaIndex();

      let sourceUri: string | undefined;

      if (media.assetId.startsWith("selected-")) {
        if (media.uri && !media.uri.startsWith("ph://")) {
          sourceUri = media.uri;
        }
      } else {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(
          media.assetId,
          {
            shouldDownloadFromNetwork: true,
          },
        );

        sourceUri =
          assetInfo.localUri ??
          (assetInfo.uri && !assetInfo.uri.startsWith("ph://")
            ? assetInfo.uri
            : undefined);
      }

      if (!sourceUri) {
        throw new Error("Apple Photos returned no usable video file");
      }

      const directory =
        `${FileSystem.documentDirectory}match-memories/`;

      await FileSystem.makeDirectoryAsync(directory, {
        intermediates: true,
      });

      const sourceName = media.fileName ?? sourceUri;
      const extensionMatch = sourceName
        .split("#")[0]
        .split("?")[0]
        .match(/\.([a-z0-9]{2,5})$/i);

      const extension =
        extensionMatch?.[1]?.toLowerCase() ?? "mov";

      const sourceKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${recordId}|${media.assetId}|video-playback`,
      );

      const destination =
        `${directory}${recordId.replace(/[^a-z0-9-]/gi, "-")}-` +
        `${sourceKey.slice(0, 24)}.${extension}`;

      const existing =
        await FileSystem.getInfoAsync(destination);

      if (!existing.exists || !(existing.size ?? 0)) {
        await FileSystem.copyAsync({
          from: sourceUri,
          to: destination,
        });
      }

      const copied =
        await FileSystem.getInfoAsync(destination);

      if (!copied.exists || !(copied.size ?? 0)) {
        throw new Error("Downloaded video was empty");
      }

      const durableMedia = {
        ...media,
        localUri: destination,
        uri: destination,
      };

      addMatchMediaReferences(recordId, [durableMedia]);

      setResolvedMatchMedia((current) => {
        const existingMedia = current[recordId] ?? [];

        return {
          ...current,
          [recordId]: [
            ...existingMedia.filter(
              (item) => item.assetId !== durableMedia.assetId,
            ),
            durableMedia,
          ],
        };
      });

      setSelectedMatchVideoUri(destination);

      console.log(
        "[MATCH-VIDEO-ON-DEMAND]",
        JSON.stringify({
          assetId: media.assetId,
          destination,
          size: copied.size,
        }),
      );
    } catch (error) {
      console.warn(
        "Could not open Match Memory video",
        error,
      );

      Alert.alert(
        "Video unavailable",
        "Ticket Frame could not download this video from Apple Photos. Check your connection and Photos access, then try again.",
      );
    } finally {
      resolvingMatchVideoAssetIdsRef.current.delete(
        media.assetId,
      );
    }
  };

  const removeMatchMediaReference = (
    recordId: string,
    reference: MatchMediaReference & { uri?: string },
  ) => {
    setSelectedMatchVideoUri((current) =>
      current === reference.uri ? null : current,
    );
    setResolvedMatchMedia((current) => ({
      ...current,
      [recordId]: (current[recordId] ?? []).filter(
        (item) => item.assetId !== reference.assetId,
      ),
    }));
    setMatchMediaReferences((current) => {
      const next = {
        ...current,
        [recordId]: (current[recordId] ?? []).filter(
          (item) => item.assetId !== reference.assetId,
        ),
      };
      persistMatchMediaReferences(next);
      return next;
    });
    const ownedUri = reference.localUri;
    if (
      ownedUri &&
      ownedUri.startsWith(FileSystem.documentDirectory ?? "__never__")
    )
      void FileSystem.deleteAsync(ownedUri, { idempotent: true });
  };

  const persistMediaReferences = async (
    recordId: string,
    references: MatchMediaReference[],
    sourceUris: Record<string, string> = {},
  ) => {
    if (!references.length) return [];
    // Automatic discovery stores Photos IDs and lightweight metadata only.
    // Fetch/copy an original only for an explicit user import or later display.
    if (references.every((reference) => reference.source === "automatic")) {
      addMatchMediaReferences(recordId, references);
      return references;
    }
    // Explicit additions retain Photos GPS/time on Ticket Frame's own
    // reference before the first publish. Copying the file must never strip
    // that metadata, and later undefined index fields cannot overwrite it.
    const enrichedReferences = await Promise.all(
      references.map(async (reference) => {
        if (reference.assetId.startsWith("selected-")) return reference;
        const info = await cachedMatchAssetInfo(reference.assetId);
        return {
          ...reference,
          latitude: reference.latitude ?? info?.location?.latitude,
          longitude: reference.longitude ?? info?.location?.longitude,
          creationTime: reference.creationTime ?? info?.creationTime,
          previewUri: reference.previewUri ?? info?.uri,
        };
      }),
    );
    addMatchMediaReferences(recordId, enrichedReferences);
    const directory = `${FileSystem.documentDirectory}match-memories/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const durable: MatchMediaReference[] = [];

    for (const reference of enrichedReferences) {
      let sourceUri = sourceUris[reference.assetId] || reference.localUri;
      if (!sourceUri) {
        const info = await cachedMatchAssetInfo(reference.assetId);
        sourceUri = info?.localUri ?? info?.uri;
      }
      if (!sourceUri) continue;

      const extensionMatch = (reference.fileName ?? sourceUri)
        .split("?")[0]
        ?.match(/\.([a-z0-9]{2,5})$/i);
      const extension =
        extensionMatch?.[1]?.toLowerCase() ??
        (reference.type === "video" ? "mov" : "jpg");
      const sourceKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${reference.assetId}|${sourceUri}`,
      );
      const destination = `${directory}${recordId.replace(/[^a-z0-9-]/gi, "-")}-${sourceKey.slice(0, 24)}.${extension}`;

      try {
        const existing = await FileSystem.getInfoAsync(destination);
        if (!existing.exists)
          await FileSystem.copyAsync({ from: sourceUri, to: destination });
        durable.push({ ...reference, localUri: destination });
      } catch {
        // Keep a still-valid Photos reference, but do not claim it is durable.
        durable.push(reference);
      }
    }

    addMatchMediaReferences(recordId, durable);
    return durable;
  };
  useEffect(() => {
    persistMediaReferencesRef.current = persistMediaReferences;
  });

  const addPhotoUris = async (recordId: string, uris: string[]) => {
    if (!uris.length) return;
    const directory = `${FileSystem.documentDirectory}match-memories/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const permanent: string[] = [];
    for (const uri of uris) {
      if (uri.startsWith(directory)) {
        permanent.push(uri);
        continue;
      }
      const cleanExtension = uri.split("?")[0]?.match(/\.(jpg|jpeg|png|heic)$/i)?.[1];
      const extension = cleanExtension?.toLowerCase() ?? "jpg";
      const sourceKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        uri,
      );
      const destination = `${directory}${recordId.replace(/[^a-z0-9-]/gi, "-")}-${sourceKey.slice(0, 24)}.${extension}`;
      try {
        const existing = await FileSystem.getInfoAsync(destination);
        if (!existing.exists)
          await FileSystem.copyAsync({ from: uri, to: destination });
        permanent.push(destination);
      } catch {
        // Some iCloud assets expose only their Photos URI. Keep it available
        // rather than losing the user's explicit selection.
        permanent.push(uri);
      }
    }
    setMatchPhotos((current) => {
      const next = {
        ...current,
        [recordId]: Array.from(
          new Set([...(current[recordId] ?? []), ...permanent]),
        ),
      };
      persistMatchPhotos(next);
      return next;
    });
  };

  const chooseMatchPhotos = async (record: AttendanceRecord) => {
    if (!photoMemoriesEnabled) {
      Alert.alert(
        "Photos are off",
        "Turn on Use Photos for Match Memories in Settings first.",
      );
      return;
    }

    setPhotoAction("choose");

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photos permission needed",
          "Allow photo and video access to save match memories.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (result.canceled) return;

      const references: MatchMediaReference[] = [];
      const fallbackPhotoUris: string[] = [];
      const sourceUris: Record<string, string> = {};

      for (const asset of result.assets) {
        const isVideo =
          asset.type === "video" || asset.type === "pairedVideo";

        if (asset.assetId) {
          sourceUris[asset.assetId] = asset.uri;
          references.push({
            assetId: asset.assetId,
            type: isVideo ? "video" : "photo",
            width: asset.width,
            height: asset.height,
            fileName: asset.fileName,
            source: "manual",
          });
          continue;
        }

        if (isVideo) {
          const syntheticId = `selected-${await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            asset.uri,
          )}`;
          sourceUris[syntheticId] = asset.uri;
          references.push({
            assetId: syntheticId,
            type: "video",
            width: asset.width,
            height: asset.height,
            fileName: asset.fileName,
            source: "manual",
          });
        } else {
          fallbackPhotoUris.push(asset.uri);
        }
      }

      await persistMediaReferences(record.id, references, sourceUris);

      if (fallbackPhotoUris.length) {
        await addPhotoUris(record.id, fallbackPhotoUris);
      }

    } catch {
      Alert.alert(
        "Media unavailable",
        "Ticket Frame could not open the selected photos or videos.",
      );
    } finally {
      setPhotoAction(null);
    }
  };

  const chooseSeasonFixturePhotos = async (
    profile: SeasonTicketProfile,
    fixture: {
      opponent: string;
      date: string;
      competition: string | null;
      venue: string | null;
      seasonKey: string;
      homeScore?: number | null;
      awayScore?: number | null;
    },
  ) => {
    if (!photoMemoriesEnabled) {
      Alert.alert(
        "Photos are off",
        "Turn on Use Photos for Match Memories in Settings first.",
      );
      return;
    }
    setPhotoAction("choose");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photos permission needed",
        "Allow photo access to save match memories.",
      );
      setPhotoAction(null);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      const { record } = confirmSeasonAttendance(
        profile,
        fixture,
        {
          stand: profile.stand ?? "",
          block: profile.block ?? "",
          row: profile.row ?? "",
          seat: profile.seat ?? "",
        },
      );
      await addPhotoUris(record.id, result.assets.map((asset) => asset.uri));
      setExpandedSeasonPhotoFixtureKey(`${fixture.date}|${fixture.opponent}`);
    }
    setPhotoAction(null);
  };
  const [fixtureSuggestions, setFixtureSuggestions] = useState<CachedFixture[]>([]);
  const [manualFixturePool, setManualFixturePool] = useState<FixtureRow[]>([]);
  const [manualFixtureLoading, setManualFixtureLoading] = useState(false);
  const manualFixtureLoadRequestRef = useRef(0);

  // V4.0.86 — Manual Add wheels use pending values until the user explicitly
  // confirms each step. This prevents an iOS wheel from loading historical
  // data while it is still spinning and lets completed wheels collapse.
  const [manualPickerStep, setManualPickerStep] = useState(0);
  const [manualPendingSeason, setManualPendingSeason] = useState("");
  const manualSeasonWheelValueRef = useRef("");
  const [manualPendingCompetition, setManualPendingCompetition] = useState("");
  const [manualPendingHomeTeam, setManualPendingHomeTeam] = useState("");
  const [manualPendingAwayTeam, setManualPendingAwayTeam] = useState("");

  const [manualHomeTeam, setManualHomeTeam] = useState("");
  const [manualAwayTeam, setManualAwayTeam] = useState("");
  const [manualDateDay, setManualDateDay] = useState("");
  const [manualDateMonth, setManualDateMonth] = useState("");
  const [manualDateBlank, setManualDateBlank] = useState(false);
  // V3.9.5 — separate item stores (never part of saved-frame.v1).
  const [seasonTicketProfiles, setSeasonTicketProfiles] = useState<
    SeasonTicketProfile[]
  >([]);
  const [seasonTicketProfilesReady, setSeasonTicketProfilesReady] = useState(false);
  const promptedDiscoveredSeasonTicketsRef = useRef<Set<string>>(new Set());
  const [carParkPasses, setCarParkPasses] = useState<CarParkPass[]>([]);
  const [homeTicketSeason, setHomeTicketSeason] = useState("All Tickets");
  const [homeViewMode, setHomeViewMode] = useState<"frame" | "wallet">("frame");
  const [homeWalletOpenTicketId, setHomeWalletOpenTicketId] =
    useState<string | undefined>();
  const homeWalletOpenY = useSharedValue(0);

  const homeScrollRef = useRef<ScrollView>(null);
  const homeWalletSectionYRef = useRef(0);
  const [fullFrameSeason, setFullFrameSeason] = useState("All Tickets");
  const [fullFrameSeasonMenuOpen, setFullFrameSeasonMenuOpen] = useState(false);
  const [homeFixturesProfileId, setHomeFixturesProfileId] = useState<
    string | null
  >(null);
  // V3.9.7 — MY HOME FIXTURES loads fixtures for the PROFILE's saved season
  // (never the active season). null = not loaded yet; [] = loaded, empty.
  const [profileFixtures, setProfileFixtures] = useState<
    CachedFixture[] | null
  >(null);
  const [historyFixtures, setHistoryFixtures] = useState<CachedFixture[]>([]);
  const [seasonSeatDraft, setSeasonSeatDraft] = useState<{
    fixtureKey: string;
    stand: string;
    block: string;
    row: string;
    seat: string;
  } | null>(null);

  // V3.9.2 — Next Match now lives ONLY in the shared renderNextMatchCard,
  // fed by the Fixtures pipeline (seasonFixtures via loadFixtures). The old
  // separate clubNextMatch fetch was a broken duplicate and is gone.
  const [gpsAccuracy, setGpsAccuracy] =
    useState<number | null>(null);
  const [matchCheckInEnabled, setMatchCheckInEnabledState] = useState(true);
  const [pendingMatchCheckIn, setPendingMatchCheckIn] =
    useState<MatchCheckInFixture | null>(null);
  const [favouriteClub, setFavouriteClub] =
    useState<ClubOption>(PLACEHOLDER_CLUB);

  const activeFrameColour =
    frameStyle === "Club Colours"
      ? favouriteClub.primary
      : frameColour[frameStyle] ?? favouriteClub.primary;
  const clubFramePalette = Array.from(
    new Set(
      [
        ...(favouriteClub.palette ?? []),
        favouriteClub.primary,
        favouriteClub.secondary,
        "#ffffff",
      ].filter(Boolean),
    ),
  );
  const activeFrameHighlight =
    frameStyle === "Club Colours"
      ? clubFramePalette[2] ?? "#ffffff"
      : frameHighlight[frameStyle] ?? "#ffffff";
  const activeFrameAccent =
    frameStyle === "Club Colours"
      ? clubFramePalette[1] ?? "#ffffff"
      : frameAccent[frameStyle] ?? "#ffffff";

  const [nextWeather, setNextWeather] = useState<{
    key: string;
    loading: boolean;
    data: MatchWeather | null;
  } | null>(null);
  const [parkingPanel, setParkingPanel] = useState<{
    groundId: string;
    loading: boolean;
    error: boolean;
    items: NearbyParkingResult[];
    distanceFrom?: "stadium" | "current";
  } | null>(null);
  const [parkingCache, setParkingCache] = useState<Record<string, NearbyParkingResult[]>>({});
  const [nearbyVenuePanel, setNearbyVenuePanel] = useState<{
    groundId: string;
    kind: NearbyVenueKind;
    loading: boolean;
    error: boolean;
    items: NearbyVenueResult[];
    distanceFrom?: "stadium" | "current";
  } | null>(null);
  const [nearbyVenueCache, setNearbyVenueCache] = useState<
    Record<string, NearbyVenueResult[]>
  >({});
  const [pubVisitReports, setPubVisitReports] = useState<PubVisitReport[]>([]);
  const [matchdayExperiences, setMatchdayExperiences] =
    useState<MatchdayExperienceRecord[]>([]);
  const [matchdayExperiencesReady, setMatchdayExperiencesReady] = useState(false);
  const [activeMatchdayExperienceId, setActiveMatchdayExperienceId] =
    useState<string | null>(null);
  const [matchdayFinder, setMatchdayFinder] =
    useState<MatchdayFinderKind | null>(null);
  const [matchdayVenueQuery, setMatchdayVenueQuery] = useState("");
  const [matchdaySearchOrigin, setMatchdaySearchOrigin] = useState<{
    latitude: number;
    longitude: number;
    groundId: string;
  } | null>(null);
  const [visitedPubId, setVisitedPubId] = useState<string | null>(null);
  const [visitedPubAudience, setVisitedPubAudience] =
    useState<PubSupporterAudience | null>(null);
  const [visitedPubLocation, setVisitedPubLocation] = useState<{
    confirmed: boolean;
    distanceMiles: number;
  } | null>(null);

  useEffect(() => {
    const placesModule = ParkingSearchModule;
    if (
      (matchdayFinder !== "pub" && matchdayFinder !== "restaurant") ||
      !matchdaySearchOrigin ||
      !placesModule?.searchPlacesQuery ||
      matchdayVenueQuery.trim().length < 2
    ) return;
    const kind = matchdayFinder;
    const query = matchdayVenueQuery.trim();
    const timer = setTimeout(() => {
      setNearbyVenuePanel({
        groundId: matchdaySearchOrigin.groundId,
        kind,
        loading: true,
        error: false,
        items: [],
        distanceFrom: "current",
      });
      void placesModule.searchPlacesQuery(
        matchdaySearchOrigin.latitude,
        matchdaySearchOrigin.longitude,
        kind,
        query,
      ).then((items) => {
        setNearbyVenuePanel({
          groundId: matchdaySearchOrigin.groundId,
          kind,
          loading: false,
          error: false,
          items: items.slice(0, 5),
          distanceFrom: "current",
        });
      }).catch(() => {
        setNearbyVenuePanel((current) => current?.kind === kind
          ? { ...current, loading: false, error: true }
          : current);
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [matchdayFinder, matchdaySearchOrigin, matchdayVenueQuery]);

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.getItem(PARKING_CACHE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Record<string, NearbyParkingResult[]>;
        if (parsed && typeof parsed === "object") setParkingCache(parsed);
      } catch {}
    });
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || !Object.keys(parkingCache).length) return;
    void AsyncStorage.setItem(PARKING_CACHE_KEY, JSON.stringify(parkingCache));
  }, [parkingCache, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.multiGet([
      NEARBY_VENUE_CACHE_KEY,
      PUB_VISIT_REPORTS_KEY,
    ]).then((entries) => {
      try {
        const venues = entries[0][1];
        if (venues) setNearbyVenueCache(JSON.parse(venues));
      } catch {}
      try {
        const reports = entries[1][1];
        if (reports) setPubVisitReports(JSON.parse(reports));
      } catch {}
    });
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || !Object.keys(nearbyVenueCache).length) return;
    void AsyncStorage.setItem(
      NEARBY_VENUE_CACHE_KEY,
      JSON.stringify(nearbyVenueCache),
    );
  }, [nearbyVenueCache, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.setItem(PUB_VISIT_REPORTS_KEY, JSON.stringify(pubVisitReports));
  }, [pubVisitReports, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.getItem(MATCHDAY_EXPERIENCES_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        setMatchdayExperiences(Array.isArray(parsed) ? parsed : []);
      })
      .catch(() => setMatchdayExperiences([]))
      .finally(() => setMatchdayExperiencesReady(true));
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || !matchdayExperiencesReady) return;
    void AsyncStorage.setItem(
      MATCHDAY_EXPERIENCES_KEY,
      JSON.stringify(matchdayExperiences),
    );
  }, [matchdayExperiences, matchdayExperiencesReady, storageReady]);

  useEffect(() => {
    if (!matchdayExperiencesReady) return;
    const checkForClosure = () => {
      const now = Date.now();
      const expired = matchdayExperiences.filter(
        (item) =>
          item.captureEnabled &&
          item.autoOffAt &&
          new Date(item.autoOffAt).getTime() <= now,
      );
      if (expired.length) {
        const ids = new Set(expired.map((item) => item.id));
        setMatchdayExperiences((current) =>
          current.map((item) =>
            ids.has(item.id)
              ? { ...item, captureEnabled: false, updatedAt: new Date().toISOString() }
              : item,
          ),
        );
        return;
      }
      const due = matchdayExperiences.find(
        (item) =>
          item.captureEnabled &&
          item.closePromptAt &&
          new Date(item.closePromptAt).getTime() <= now &&
          (item.closePromptCount ?? 0) < 2,
      );
      if (!due) return;
      const nextCount = (due.closePromptCount ?? 0) + 1;
      setMatchdayExperiences((current) =>
        current.map((item) =>
          item.id === due.id
            ? {
                ...item,
                closePromptCount: nextCount,
                closePromptAt:
                  nextCount === 1
                    ? new Date(now + 30 * 60 * 1000).toISOString()
                    : item.autoOffAt,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      const closeNow = () =>
        setMatchdayExperiences((current) =>
          current.map((item) =>
            item.id === due.id
              ? { ...item, captureEnabled: false, updatedAt: new Date().toISOString() }
              : item,
          ),
        );
      const chooseReminder = () =>
        Alert.alert("Remind me", "Choose when to ask again. Matchday Experience turns off automatically at the eight-hour limit.", [
          ...([1, 2, 4, 8] as const).map((hours) => ({
            text: `${hours} hour${hours === 1 ? "" : "s"}`,
            onPress: () =>
              setMatchdayExperiences((current) =>
                current.map((item) => {
                  if (item.id !== due.id) return item;
                  const requested = now + hours * 60 * 60 * 1000;
                  const limit = item.autoOffAt
                    ? new Date(item.autoOffAt).getTime()
                    : requested;
                  return {
                    ...item,
                    closePromptAt: new Date(Math.min(requested, limit)).toISOString(),
                    closePromptCount: 1,
                    updatedAt: new Date().toISOString(),
                  };
                }),
              ),
          })),
          { text: "Cancel", style: "cancel" },
        ]);
      Alert.alert(
        "Close Matchday Experience?",
        `${due.clubName} v ${due.opponentName} has finished. Close Matchday Experience now?`,
        [
          { text: "Yes, close", onPress: closeNow },
          { text: "Remind me", onPress: chooseReminder },
        ],
      );
    };
    const timer = setTimeout(checkForClosure, 0);
    const interval = setInterval(checkForClosure, 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [matchdayExperiences, matchdayExperiencesReady]);

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.getItem(MATCHDAY_MEDIA_ASSIGNMENTS_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : {};
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          setMatchdayMediaAssignments(parsed);
      })
      .catch(() => {})
      .finally(() => setMatchdayMediaAssignmentsReady(true));
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.getItem(MATCHDAY_CUSTOM_LOCATIONS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Record<string, MatchdayCustomLocation[]>;
        if (parsed && typeof parsed === "object") setMatchdayCustomLocations(parsed);
      } catch {}
    });
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.setItem(MATCHDAY_CUSTOM_LOCATIONS_KEY, JSON.stringify(matchdayCustomLocations));
  }, [matchdayCustomLocations, storageReady]);

  useEffect(() => {
    matchdayMediaAssignmentsRef.current = matchdayMediaAssignments;
  }, [matchdayMediaAssignments]);

  useEffect(() => {
    if (!storageReady || !matchdayMediaAssignmentsReady) return;
    void AsyncStorage.setItem(
      MATCHDAY_MEDIA_ASSIGNMENTS_KEY,
      JSON.stringify(matchdayMediaAssignments),
    );
  }, [matchdayMediaAssignments, matchdayMediaAssignmentsReady, storageReady]);

  useEffect(() => {
    if (!selectedHistoryRecordId || !matchdayMediaAssignmentsReady) return;
    const history = attendanceHistory.find((item) => item.id === selectedHistoryRecordId);
    if (!history) return;
    const experience = matchdayExperiences.find(
      (item) =>
        item.matchDate?.slice(0, 10) === history.matchDate?.slice(0, 10) &&
        clubNamesMatch(item.clubName, history.club) &&
        clubNamesMatch(item.opponentName, history.opponent),
    );
    const references = matchMediaReferences[selectedHistoryRecordId] ?? [];
    let cancelled = false;
    void (async () => {
      const additions: Record<string, MatchdayMediaAssignment> = {};
      const ground =
        (experience
          ? FOOTBALL_GROUNDS.find((item) => item.id === experience.groundId)
          : undefined) ??
        footballGroundForName(history.ground ?? "") ??
        findGroundForClub(
          history.homeAway === "away" ? history.opponent : history.club,
        );
      const otherLocations = new Map<
        string,
        { latitude: number; longitude: number; keys: string[] }
      >();
      // User-confirmed venues are reusable Ticket Frame knowledge.
      // Prefer the GPS where the user's media was actually taken because
      // Apple Maps coordinates can point to the centre of a large venue,
      // while the user's photos may come from an entrance, garden or car park.
      const confirmedVenues = matchdayExperiences
        .flatMap((item) => item.venues)
        .map((visit) => {
          const latitude =
            typeof visit.confirmedFromLatitude === "number"
              ? visit.confirmedFromLatitude
              : visit.latitude;
          const longitude =
            typeof visit.confirmedFromLongitude === "number"
              ? visit.confirmedFromLongitude
              : visit.longitude;

          return {
            id: visit.id,
            name: visit.venueName,
            kind: visit.kind,
            latitude,
            longitude,
            confirmed: true as const,
          };
        });

      const cachedNearbyVenues = (["pub", "restaurant"] as const).flatMap((kind) =>
        ground
          ? [
              ...(nearbyVenueCache[`${kind}:stadium:${ground.id}`] ?? []),
              ...(nearbyVenueCache[`${kind}:${ground.id}`] ?? []),
            ].map((venue) => ({
              ...venue,
              kind,
              confirmed: false as const,
            }))
          : [],
      );

      const knownVenues = [...confirmedVenues, ...cachedNearbyVenues].filter(
        (
          venue,
        ): venue is typeof venue & {
          latitude: number;
          longitude: number;
        } =>
          typeof venue.latitude === "number" &&
          typeof venue.longitude === "number" &&
          Number.isFinite(venue.latitude) &&
          Number.isFinite(venue.longitude),
      );
      for (const reference of references) {
        const key = `${selectedHistoryRecordId}|asset:${reference.assetId}`;
        const existingAssignment =
          matchdayMediaAssignmentsRef.current[key];
        if (existingAssignment?.source === "manual") continue;
        // Prefer GPS permanently retained on Ticket Frame's media reference.
        // Older references can fall back to the persistent Photos metadata
        // cache, so venue intelligence remains compatible with existing data.
        const referenceHasLocation =
          typeof reference.latitude === "number" &&
          typeof reference.longitude === "number" &&
          Number.isFinite(reference.latitude) &&
          Number.isFinite(reference.longitude);

        const cachedInfo = referenceHasLocation
          ? null
          : await cachedMatchAssetInfo(reference.assetId);

        const location = referenceHasLocation
          ? {
              latitude: reference.latitude as number,
              longitude: reference.longitude as number,
            }
          : cachedInfo?.location;

        if (
          !location ||
          typeof location.latitude !== "number" ||
          typeof location.longitude !== "number" ||
          !Number.isFinite(location.latitude) ||
          !Number.isFinite(location.longitude)
        ) {
          continue;
        }
        const nearest = knownVenues
          .map((venue) => ({
            venue,
            miles: distanceMiles(
              location.latitude,
              location.longitude,
              venue.latitude,
              venue.longitude,
            ),
          }))
          .sort((a, b) => {
            const distanceDifference = a.miles - b.miles;
            if (Math.abs(distanceDifference) > 0.01) return distanceDifference;
            if (a.venue.confirmed && !b.venue.confirmed) return -1;
            if (!a.venue.confirmed && b.venue.confirmed) return 1;
            return distanceDifference;
          })[0];
        const milesFromGround = ground
          ? distanceMiles(
              location.latitude,
              location.longitude,
              ground.latitude,
              ground.longitude,
            )
          : Number.POSITIVE_INFINITY;

        // The stadium is authoritative. Check it before nearby venues so
        // media taken inside/around the ground is never incorrectly labelled
        // as a neighbouring pub, restaurant, station or generic location.
        if (ground && milesFromGround <= STADIUM_MEDIA_CORE_RADIUS_MILES) {
          additions[key] = {
            placeName: ground.stadium,
            placeKind: "stadium",
            latitude: location.latitude,
            longitude: location.longitude,
            source: "automatic",
          };
        } else if (nearest && nearest.miles <= 0.15) {
          additions[key] = {
            placeName: nearest.venue.name,
            placeKind: nearest.venue.kind,
            venueVisitId: nearest.venue.id,
            latitude: nearest.venue.latitude,
            longitude: nearest.venue.longitude,
            source: "automatic",
          };
        } else {
          additions[key] = {
            placeName: "Matchday location",
            placeKind: "location",
            latitude: location.latitude,
            longitude: location.longitude,
            source: "automatic",
          };
          // Roughly 100-metre cells keep a burst of photos at one place
          // together and ensure the user is asked once for the group.
          const clusterKey = `${location.latitude.toFixed(3)}|${location.longitude.toFixed(3)}`;
          const cluster = otherLocations.get(clusterKey) ?? {
            latitude: location.latitude,
            longitude: location.longitude,
            keys: [],
          };
          cluster.keys.push(key);
          otherLocations.set(clusterKey, cluster);
        }
      }
      if (cancelled) return;
      if (Object.keys(additions).length)
        setMatchdayMediaAssignments((current) => {
          const next = { ...current };
          for (const [key, assignment] of Object.entries(additions)) {
            const existing = next[key];
            if (!existing || existing.source === "automatic")
              next[key] = assignment;
          }
          return next;
        });

      const pendingCluster = Array.from(otherLocations.entries()).find(
        ([clusterKey]) =>
          !promptedMediaLocationGroupsRef.current.has(
            `${selectedHistoryRecordId}|${clusterKey}`,
          ),
      );
      if (!pendingCluster) return;
      const [clusterKey, cluster] = pendingCluster;
      promptedMediaLocationGroupsRef.current.add(
        `${selectedHistoryRecordId}|${clusterKey}`,
      );
      const address = await Location.reverseGeocodeAsync({
        latitude: cluster.latitude,
        longitude: cluster.longitude,
      }).catch(() => []);
      if (cancelled) return;

      const place = address[0];
      const recognisedName =
        place?.name ?? place?.street ?? place?.district ?? place?.city ?? null;

      const withinVenueZone = Boolean(
        ground &&
        distanceMiles(
          cluster.latitude,
          cluster.longitude,
          ground.latitude,
          ground.longitude,
        ) <= MATCHDAY_VENUE_OUTER_RADIUS_MILES,
      );

      const assignCluster = (assignment: MatchdayMediaAssignment) =>
        setMatchdayMediaAssignments((current) => {
          const next = { ...current };
          cluster.keys.forEach((key) => {
            next[key] = assignment;
          });
          return next;
        });

      type MediaPlaceCandidate = {
        venue: NearbyVenueResult;
        kind: "pub" | "restaurant" | "station" | "metro";
      };

      const searchKinds = [
        "pub",
        "restaurant",
        "station",
        "metro",
      ] as const;

      // Cache venue intelligence by GPS cell as well as by stadium.
      // Once Ticket Frame has investigated this area, reuse the Apple Maps
      // results instead of repeating the same venue searches.
      const gpsVenueCell =
        `${cluster.latitude.toFixed(3)}|${cluster.longitude.toFixed(3)}`;

      let placeCandidates: MediaPlaceCandidate[] = searchKinds
        .flatMap((kind) =>
          (
            nearbyVenueCache[`gps:${kind}:${gpsVenueCell}`] ?? []
          ).map((venue) => ({
            venue,
            kind,
          })),
        )
        .filter(
          (candidate) =>
            Number.isFinite(candidate.venue.latitude) &&
            Number.isFinite(candidate.venue.longitude) &&
            Number.isFinite(candidate.venue.distanceMiles),
        )
        .sort(
          (a, b) =>
            a.venue.distanceMiles - b.venue.distanceMiles,
        );

      if (!placeCandidates.length && ParkingSearchModule?.searchPlaces) {
        const parkingSearch = ParkingSearchModule;

        const searches = await Promise.all(
          searchKinds.map(async (kind) => {
            try {
              const results = (
                await parkingSearch.searchPlaces!(
                  cluster.latitude,
                  cluster.longitude,
                  kind,
                )
              )
                .filter(
                  (venue) =>
                    Number.isFinite(venue.latitude) &&
                    Number.isFinite(venue.longitude) &&
                    Number.isFinite(venue.distanceMiles),
                )
                .sort((a, b) => a.distanceMiles - b.distanceMiles)
                .slice(0, 3);

              return { kind, results };
            } catch {
              return { kind, results: [] as NearbyVenueResult[] };
            }
          }),
        );

        if (cancelled) return;

        const cacheAdditions: Record<string, NearbyVenueResult[]> = {};

        for (const { kind, results } of searches) {
          if (results.length) {
            cacheAdditions[`gps:${kind}:${gpsVenueCell}`] = results;
          }
        }

        if (Object.keys(cacheAdditions).length) {
          setNearbyVenueCache((current) => ({
            ...current,
            ...cacheAdditions,
          }));
        }

        placeCandidates = searches
          .flatMap(({ kind, results }) =>
            results.map((venue) => ({
              venue,
              kind,
            })),
          )
          .sort(
            (a, b) =>
              a.venue.distanceMiles - b.venue.distanceMiles,
          );
      }

      if (cancelled) return;

      const nearestCandidate = placeCandidates[0];
      const secondCandidate = placeCandidates[1];

      // Approximately 65 metres.
      // Only auto-name when Apple Maps has one clearly strong result.
      const AUTO_PLACE_RADIUS_MILES = 0.04;
      const AUTO_PLACE_LEAD_MILES = 0.025;

      const highConfidenceCandidate =
        nearestCandidate &&
        nearestCandidate.venue.distanceMiles <= AUTO_PLACE_RADIUS_MILES &&
        (
          !secondCandidate ||
          secondCandidate.venue.distanceMiles -
            nearestCandidate.venue.distanceMiles >= AUTO_PLACE_LEAD_MILES
        )
          ? nearestCandidate
          : null;

      if (highConfidenceCandidate) {
        assignCluster({
          placeName: highConfidenceCandidate.venue.name,
          placeKind: highConfidenceCandidate.kind,
          latitude: highConfidenceCandidate.venue.latitude,
          longitude: highConfidenceCandidate.venue.longitude,
          source: "automatic",
        });
        return;
      }

      const likelyCandidates = placeCandidates
        .filter((candidate) => candidate.venue.distanceMiles <= 0.15)
        .slice(0, 3);

      if (likelyCandidates.length) {
        Alert.alert(
          "Where were these taken?",
          "Ticket Frame found nearby places from the photo GPS. Choose the correct place.",
          [
            ...likelyCandidates.map((candidate) => ({
              text: `${candidate.venue.name} · ${candidate.venue.distanceMiles.toFixed(2)} mi`,
              onPress: () =>
                assignCluster({
                  placeName: candidate.venue.name,
                  placeKind: candidate.kind,
                  latitude: candidate.venue.latitude,
                  longitude: candidate.venue.longitude,
                  source: "manual",
                }),
            })),
            {
              text: recognisedName
                ? `Other · ${recognisedName}`
                : "Other location",
              onPress: () =>
                assignCluster({
                  placeName: recognisedName ?? "Matchday location",
                  placeKind: "location",
                  source: "manual",
                }),
            },
            {
              text: "Not now",
              style: "cancel",
              onPress: () =>
                assignCluster({
                  placeName: "Matchday location",
                  placeKind: "location",
                  source: "manual",
                }),
            },
          ],
        );
        return;
      }

      Alert.alert(
        withinVenueZone
          ? "Were these taken at a nearby pub or restaurant?"
          : "Were these taken somewhere else?",
        recognisedName
          ? `These photos appear to be at ${recognisedName}, not inside the stadium. Save them together there?`
          : "These photos have the same location away from the stadium. Save them together as another location?",
        [
          {
            text: "Stadium",
            onPress: () => assignCluster({ placeName: "Stadium", placeKind: "stadium", source: "manual" }),
          },
          {
            text: recognisedName ? `Save as ${recognisedName}` : "Other location",
            onPress: () => assignCluster({ placeName: recognisedName ?? "Matchday location", placeKind: "location", source: "manual" }),
          },
          {
            text: "Not now",
            style: "cancel",
            onPress: () => assignCluster({ placeName: "Matchday location", placeKind: "location", source: "manual" }),
          },
        ],
      );
    })();
    return () => { cancelled = true; };
  }, [attendanceHistory, matchMediaReferences, matchdayExperiences, matchdayMediaAssignmentsReady, nearbyVenueCache, selectedHistoryRecordId]);

  async function loadParkingForGround(
    ground: FootballGround,
    distanceFrom: "stadium" | "current" = "stadium",
  ) {
    const cacheKey = `${distanceFrom}:${ground.id}`;
    const cached = parkingCache[cacheKey] ?? parkingCache[ground.id];
    setParkingPanel({
      groundId: ground.id,
      loading: !cached?.length,
      error: false,
      items: cached?.slice(0, 5) ?? [],
      distanceFrom,
    });
    try {
      if (!ParkingSearchModule)
        throw new Error("Apple Maps parking module unavailable");
      const nearby = await Promise.race([
        ParkingSearchModule.search(ground.latitude, ground.longitude),
        new Promise<NearbyParkingResult[]>((_, reject) =>
          setTimeout(() => reject(new Error("parking search timed out")), 12000),
        ),
      ]);
      if (!nearby.length) throw new Error("no nearby parking mapped");
      const closest = nearby.slice(0, 3);
      setParkingCache((current) => ({ ...current, [cacheKey]: closest }));
      setParkingPanel((current) =>
        current?.groundId === ground.id
          ? { groundId: ground.id, loading: false, error: false, items: closest, distanceFrom }
          : current,
      );
    } catch {
      setParkingPanel((current) =>
        current?.groundId === ground.id
          ? {
              groundId: ground.id,
              loading: false,
              error: !cached?.length,
              items: cached?.slice(0, 3) ?? [],
              distanceFrom,
            }
          : current,
      );
    }
  }

  async function loadNearbyVenues(
    ground: FootballGround,
    kind: NearbyVenueKind,
    distanceFrom: "stadium" | "current" = "stadium",
  ) {
    const cacheKey = `${kind}:${distanceFrom}:${ground.id}`;
    const cached = nearbyVenueCache[cacheKey];
    setNearbyVenuePanel({
      groundId: ground.id,
      kind,
      loading: !cached?.length,
      error: false,
      items: cached?.slice(0, 3) ?? [],
      distanceFrom,
    });
    try {
      if (!ParkingSearchModule?.searchPlaces)
        throw new Error("Apple Maps place search unavailable");
      const nearby = (await ParkingSearchModule.searchPlaces(
        ground.latitude,
        ground.longitude,
        kind,
      ))
        .sort((a, b) => a.distanceMiles - b.distanceMiles)
        .slice(0, 5);
      if (!nearby.length) throw new Error("no nearby venues mapped");
      setNearbyVenueCache((current) => ({ ...current, [cacheKey]: nearby }));
      setNearbyVenuePanel((current) =>
        current?.groundId === ground.id && current.kind === kind
          ? { groundId: ground.id, kind, loading: false, error: false, items: nearby, distanceFrom }
          : current,
      );
    } catch {
      setNearbyVenuePanel((current) =>
        current?.groundId === ground.id && current.kind === kind
          ? {
              groundId: ground.id,
              kind,
              loading: false,
              error: !cached?.length,
              items: cached?.slice(0, 5) ?? [],
              distanceFrom,
            }
          : current,
      );
    }
  }

  useEffect(() => {
    const upcoming = seasonFixtures.find(
      (r) => r.season === CURRENT_SEASON && !isFixturePlayed(r),
    );
    let live = true;
    let cancelled = false;
    const resolveWeather = async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (cancelled) return;
      if (!upcoming) {
        setNextWeather((prev) => (prev === null ? prev : null));
        return;
      }
      const key = String(upcoming.id);
      setNextWeather((prev) =>
        prev && prev.key === key && prev.loading
          ? prev
          : { key, loading: true, data: null },
      );
      if (!upcoming.date) {
        setNextWeather({ key, loading: false, data: null });
        return;
      }
      const ground =
        findGroundForClub(upcoming.homeName || favouriteClub.name) ??
        findGroundForClub(favouriteClub.name);
      if (!ground) {
        setNextWeather({ key, loading: false, data: null });
        return;
      }
      try {
        const data = await fetchMatchWeather(
          ground.latitude,
          ground.longitude,
          upcoming.kickoff ?? null,
          upcoming.date,
        );
        if (live) setNextWeather({ key, loading: false, data });
      } catch {
        if (live) setNextWeather({ key, loading: false, data: null });
      }
    };
    void resolveWeather();
    return () => {
      live = false;
      cancelled = true;
    };
  }, [seasonFixtures, favouriteClub.name]);

  useEffect(() => {
    if (!storageReady) return;
    void (async () => {
      const enabled = await isMatchCheckInEnabled();
      setMatchCheckInEnabledState(enabled);
      await Notifications.setNotificationCategoryAsync("MATCH_ATTENDANCE", [
        { identifier: "ATTENDED_YES", buttonTitle: "Yes, I attended" },
        { identifier: "ATTENDED_NO", buttonTitle: "No" },
      ]);
    })();
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || !matchCheckInEnabled || favouriteClub.id === PLACEHOLDER_CLUB_ID)
      return;
    const clubName = favouriteClub.name;
    const clubNorm = normaliseFixtureText(clubName);
    const next = seasonFixtures.find(
      (fixture) =>
        fixture.date &&
        !isFixturePlayed(fixture) &&
        [fixture.homeName, fixture.awayName].some(
          (name) => normaliseFixtureText(name) === clubNorm,
        ),
    );
    if (!next?.date) {
      void configureMatchGeofences([]);
      return;
    }
    const homeIsFavourite = normaliseFixtureText(next.homeName) === clubNorm;
    const opponent = homeIsFavourite ? next.awayName : next.homeName;
    const venueGround = next.venue ? footballGroundForName(next.venue) : undefined;
    const ground = venueGround ?? findGroundForClub(next.homeName);
    if (!ground) return;
    let kickoff: string | null = next.kickoff;
    if (next.kickoff?.includes("T")) {
      const parsed = new Date(next.kickoff);
      if (!Number.isNaN(parsed.getTime()))
        kickoff = `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
    }
    const candidate: MatchCheckInFixture = {
      key: `next|${next.date}|${normaliseFixtureText(opponent)}`,
      club: clubName,
      opponent,
      date: next.date,
      kickoff,
      competition: next.competition,
      ground: ground.stadium,
      homeAway: homeIsFavourite ? "home" : "away",
      latitude: ground.latitude,
      longitude: ground.longitude,
    };
    void configureMatchGeofences([candidate]);

    // While the app is open, request one balanced fix only inside the match
    // window. Outside it, no foreground GPS request is made.
    if (isInCheckInWindow(candidate))
      void Location.getForegroundPermissionsAsync().then(async (permission) => {
        if (!permission.granted) return;
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (
          distanceMiles(
            current.coords.latitude,
            current.coords.longitude,
            candidate.latitude,
            candidate.longitude,
          ) <= 0.35 &&
          !(await isMatchCheckInAcknowledged(candidate.key))
        ) {
          await acknowledgeMatchCheckIn(candidate.key);
          setPendingMatchCheckIn(candidate);
        }
      });
  }, [
    favouriteClub.id,
    favouriteClub.name,
    matchCheckInEnabled,
    seasonFixtures,
    storageReady,
  ]);

  useEffect(() => {
    const processResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const fixture = response.notification.request.content.data
        ?.matchCheckIn as MatchCheckInFixture | undefined;
      if (!fixture) return;
      if (response.actionIdentifier === "ATTENDED_NO") {
        void acknowledgeMatchCheckIn(fixture.key);
        return;
      }
      setPendingMatchCheckIn(fixture);
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(processResponse);
    void Notifications.getLastNotificationResponseAsync().then(processResponse);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pendingMatchCheckIn) return;
    const fixture = pendingMatchCheckIn;
    const season =
      canonicalSeason(fixture.date) || CURRENT_SEASON.replace("-", "/").slice(0, 7);
    const save = (asSeasonTicket: boolean) => {
      const profile = seasonTicketProfiles.find(
        (item) =>
          clubNamesMatch(item.club, fixture.club) &&
          item.seasonKey === season,
      );
      setAttendanceHistory((current) =>
        addManualAttendance(
          current,
          {
            club: fixture.club,
            opponent: fixture.opponent,
            matchDate: fixture.date,
            season,
            competition: fixture.competition,
            ground: fixture.ground,
            homeAway: fixture.homeAway,
            result: null,
            homeScore: null,
            awayScore: null,
            notes:
              asSeasonTicket && profile
                ? composeSeatNotes({
                    stand: profile.stand ?? "",
                    block: profile.block ?? "",
                    row: profile.row ?? "",
                    seat: profile.seat ?? "",
                  }) ?? undefined
                : undefined,
          },
          { source: asSeasonTicket ? "season-ticket" : "manual" },
        ).records,
      );
      void acknowledgeMatchCheckIn(fixture.key);
      setPendingMatchCheckIn(null);
      if (!asSeasonTicket)
        setTimeout(
          () =>
            Alert.alert(
              "Attendance saved",
              "Would you like to add the ticket photo to your frame?",
              [
                { text: "Not now", style: "cancel" },
                { text: "Add ticket", onPress: () => importTicketRef.current() },
              ],
            ),
          300,
        );
    };
    const cancel = () => {
      void acknowledgeMatchCheckIn(fixture.key);
      setPendingMatchCheckIn(null);
    };
    const title = "Did you attend this game?";
    const message = `${fixture.club} ${fixture.homeAway === "home" ? "v" : "at"} ${fixture.opponent}\n${fixture.ground}`;
    if (fixture.homeAway === "home") {
      Alert.alert(title, `${message}\n\nAdd it using your season ticket?`, [
        { text: "No, I didn’t attend", style: "cancel", onPress: cancel },
        { text: "Attended", onPress: () => save(false) },
        { text: "Use season ticket", onPress: () => save(true) },
      ]);
    } else {
      Alert.alert(title, message, [
        { text: "No", style: "cancel", onPress: cancel },
        { text: "Yes", onPress: () => save(false) },
      ]);
    }
  }, [pendingMatchCheckIn, seasonTicketProfiles]);



  async function captureExportMaster() {
    const exportView = exportFrameRef.current;

    if (!exportView)
      throw new Error("High-resolution season frame is not ready.");

    resetSeasonFrameZoom();
    await new Promise((resolve) => setTimeout(resolve, 650));

    const uri = await captureRef(exportView, {
      format: "png",
      result: "tmpfile",
    });

    const info = await FileSystem.getInfoAsync(uri);

    if (!info.exists || !info.size)
      throw new Error("Export master image is missing or empty.");

    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      Image.getSize(
        uri,
        (w, h) => resolve({ w, h }),
        () => resolve({ w: 0, h: 0 }),
      );
    });

    if (!dims.w || !dims.h)
      throw new Error("Export master image is invalid.");

    const expectedAspect = 420 / 594;
    const actualAspect = dims.w / dims.h;

    if (Math.abs(actualAspect - expectedAspect) > 0.02)
      throw new Error(
        `Master image has wrong shape (${dims.w}x${dims.h}). Expected A-series portrait ratio.`,
      );

    const debugUri =
      `${FileSystem.documentDirectory}export-master-debug.png`;

    await FileSystem.copyAsync({
      from: uri,
      to: debugUri,
    });

    console.log(
      `[EXPORT_TEST]\ntype: MASTER-PNG\nwidth: ${dims.w}\nheight: ${dims.h}\nfileSizeMB: ${(info.size / 1048576).toFixed(2)}\nticketCount: ${exportJob?.length ?? 0}\ndebugCopy: ${debugUri}`,
    );

    return {
      uri,
      size: info.size,
      width: dims.w,
      height: dims.h,
    };
  }

  async function buildCapturedFramePdf(captured: {
    uri: string;
    width: number;
    height: number;
  }) {
    // True ISO A2 portrait: 420 × 594 mm.
    const A2_WIDTH_PT = (420 / 25.4) * 72;
    const A2_HEIGHT_PT = (594 / 25.4) * 72;

    const base64 = await FileSystem.readAsStringAsync(captured.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const html = `<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@page {
  size: ${A2_WIDTH_PT}pt ${A2_HEIGHT_PT}pt;
  margin: 0;
}
html {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
}
body {
  position: relative;
  width: ${A2_WIDTH_PT - 0.5}pt;
  height: ${A2_HEIGHT_PT - 0.5}pt;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
}
img {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: ${A2_WIDTH_PT - 0.5}pt;
  height: ${A2_HEIGHT_PT - 0.5}pt;
  margin: 0;
  padding: 0;
  border: 0;
}
</style>
</head>
<body>
<img src="data:image/png;base64,${base64}" />
</body>
</html>`;

    console.log(
      `[SeasonFrameExport] pageMM=420x594 pagePt=${A2_WIDTH_PT.toFixed(
        2,
      )}x${A2_HEIGHT_PT.toFixed(2)} masterPx=${captured.width}x${captured.height}`,
    );

    const { uri: temporaryUri } = await Print.printToFileAsync({
      html,
      width: A2_WIDTH_PT,
      height: A2_HEIGHT_PT,
      base64: false,
    });

    const pdfUri = `${FileSystem.documentDirectory}TicketFrame-Season-${seasonFrame.season.replace("/", "-")}.pdf`;

    await FileSystem.copyAsync({
      from: temporaryUri,
      to: pdfUri,
    });

    return pdfUri;
  }

  async function buildTicketVectorPdf(ticket: SeasonTicket) {
    if (!ticket.uri) throw new Error("This ticket has no photo to export.");
    const photoUri = currentTicketUri(ticket.uri) ?? ticket.uri;

    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      if (ticket.cropWidth && ticket.cropHeight) {
        resolve({ w: ticket.cropWidth, h: ticket.cropHeight });
        return;
      }
      Image.getSize(
        photoUri,
        (w, h) => resolve({ w, h }),
        () => resolve({ w: 0, h: 0 }),
      );
    });
    const aspect =
      dims.w > 0 && dims.h > 0 ? dims.w / dims.h : 420 / 594;
    const PAGE_H = 1684;
    const PAGE_W = Math.max(200, Math.round(PAGE_H * aspect));

    let base64 = "";
    let mime = "image/jpeg";
    try {
      base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      mime = photoUri.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";
    } catch {
      // fall through to error below
    }
    if (!base64) throw new Error("Could not read the ticket photo.");

    const html = `<html><head><meta charset="utf-8"><style>
@page { size: ${PAGE_W}pt ${PAGE_H}pt; margin: 0 }
html, body { margin: 0; padding: 0; width: ${PAGE_W}px; height: ${PAGE_H}px; overflow: hidden; background: #ffffff }
img { display: block; width: 100%; height: 100%; object-fit: contain }
</style></head><body><img src="data:${mime};base64,${base64}" /></body></html>`;

    const { uri: tmpPdfUri } = await Print.printToFileAsync({
      width: PAGE_W,
      height: PAGE_H,
      base64: false,
      html,
    });
    const tmpInfo = await FileSystem.getInfoAsync(tmpPdfUri);
    if (!tmpInfo.exists || !tmpInfo.size)
      throw new Error("PDF was not created.");
    console.log(
      `[EXPORT_TEST]\ntype: TICKET-PDF\nfileSizeMB: ${(tmpInfo.size / 1048576).toFixed(2)}\nticket: ${ticket.name}\npagePt: ${PAGE_W}x${PAGE_H}`,
    );
    const safeName =
      (ticket.name || "ticket").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") ||
      "ticket";
    const pdfUri = `${FileSystem.documentDirectory}TicketFrame-${safeName}.pdf`;
    await FileSystem.copyAsync({ from: tmpPdfUri, to: pdfUri });
    return pdfUri;
  }

  async function exportSingleTicketPdf(ticket: SeasonTicket) {
    if (ticketPdfBusy) return;
    setTicketPdfBusy(true);
    try {
      const pdfUri = await buildTicketVectorPdf(ticket);
      await Sharing.shareAsync(pdfUri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Save this ticket PDF to Files",
      });
    } catch (error) {
      console.error("Ticket PDF export failed", error);
      Alert.alert(
        "Could not create PDF",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setTicketPdfBusy(false);
    }
  }

  async function printTicket(ticket: SeasonTicket) {
    if (printBusy) return;
    setPrintBusy(true);
    try {
      const uri = currentTicketUri(ticket.uri);
      if (!uri)
        throw new Error("This ticket has no original image to print.");
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists)
        throw new Error("The original ticket image could not be found.");
      const dims = await resolvePrintDimensions(
        uri,
        ticket.cropWidth,
        ticket.cropHeight,
      );
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mime = uri.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";
      const LONG_SIDE_PT = 720;
      let pageW = 595;
      let pageH = 842;
      if (dims && dims.width > 0 && dims.height > 0) {
        if (dims.width >= dims.height) {
          pageW = LONG_SIDE_PT;
          pageH = Math.max(1, Math.round((LONG_SIDE_PT * dims.height) / dims.width));
        } else {
          pageH = LONG_SIDE_PT;
          pageW = Math.max(1, Math.round((LONG_SIDE_PT * dims.width) / dims.height));
        }
      }
      const html = `<html><head><meta charset="utf-8"><style>@page { size: ${pageW}pt ${pageH}pt; margin: 0 } html, body { margin: 0; padding: 0; width: ${pageW}pt; height: ${pageH}pt; overflow: hidden } img { display: block; width: ${pageW}pt; height: ${pageH}pt; object-fit: contain }</style></head><body><img src="data:${mime};base64,${base64}" /></body></html>`;
      await Print.printAsync({ html });
    } catch (error) {
      console.error("Ticket print failed", error);
      Alert.alert(
        "Could not print ticket",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setPrintBusy(false);
    }
  }

  async function exportTicketImage(ticket: SeasonTicket) {
    try {
      const uri = currentTicketUri(ticket.uri);
      if (!uri)
        throw new Error("This ticket has no image to export.");
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists)
        throw new Error("The original ticket image could not be found.");
      const isPng = uri.toLowerCase().endsWith(".png");
      await Sharing.shareAsync(uri, {
        mimeType: isPng ? "image/png" : "image/jpeg",
        UTI: isPng ? "public.png" : "public.jpeg",
        dialogTitle: "Export full-resolution ticket image",
      });
    } catch (error) {
      console.error("Ticket image export failed", error);
      Alert.alert(
        "Could not export ticket",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function recogniseAndQueue(ticket: SeasonTicket): Promise<boolean> {
    const uri =
      recognitionImageUrisRef.current.get(ticket.id) ??
      currentTicketUri(ticket.uri);
    console.log(
      `[ticket-recognition-start]\nticket: ${ticket.name}\nseason: ${
        ticket.seasonKey || seasonFrame.season
      }\nselected club: ${favouriteClub.name}\nimage: ${uri ?? "missing"}`,
    );
    if (!uri) {
      Alert.alert("Recognition failed", "Could not recognise this ticket", [
        { text: "Try Again", onPress: () => void recogniseAndQueue(ticket) },
        { text: "Cancel", style: "cancel" },
      ]);
      return false;
    }
    if (celebrateArmedRef.current && !celebrationCandidateIdRef.current)
      celebrationCandidateIdRef.current = ticket.id;
    try {
      const recognition = await recogniseTicketImage(
        uri,
        favouriteClub.name,
        ticket.seasonKey || seasonFrame.season,
        { league: favouriteClub.league },
      );
      console.log(
        `[ticket-final-match]\nhomeTeam: ${recognition.homeTeam ?? "-"}\nawayTeam: ${
          recognition.awayTeam ?? "-"
        }\ndate: ${recognition.date ?? "-"}\nkickoff: ${
          recognition.kickoff ?? "-"
        }\ncompetition: ${recognition.competition ?? "-"}\nground: ${
          recognition.ground ?? "-"
        }\nseason: ${ticket.seasonKey || seasonFrame.season}\nconfidence: ${recognition.confidence}%`,
      );
      // OCR is only a proposal. Do not write teams/dates into the collection
      // until the user confirms a TFD-backed fixture or saves explicit edits.
      // Complete match reads can open the final confirmation directly. Any
      // incomplete match read falls back to Type of Item; bulk scans remain
      // queued and are confirmed one at a time.
      setConfirmQueue((current) =>
        current.some((entry) => entry.ticket.id === ticket.id)
          ? current
          : [...current, { ticket, recognition }],
      );
      return true;
    } catch (error) {
      console.log("[ticket-recognition] failed", error);
      Alert.alert("Recognition failed", "Could not recognise this ticket", [
        { text: "Try Again", onPress: () => void recogniseAndQueue(ticket) },
        { text: "Cancel", style: "cancel" },
      ]);
      return false;
    } finally {
      recognitionDoneRef.current = true;
    }
  }

  async function enqueueRecognition(list: SeasonTicket[]) {
    for (const ticket of list) {
      await recogniseAndQueue(ticket);
    }
  }

  const incompleteRecognitionQueuedRef = useRef(false);
  useEffect(() => {
    if (!storageReady || incompleteRecognitionQueuedRef.current) return;
    const incomplete = tickets.filter(
      (ticket) =>
        Boolean(currentTicketUri(ticket.uri)) &&
        !isNonMatchTicketType(ticket.ticketType) &&
        !ticket.homeTeam?.trim() &&
        !ticket.awayTeam?.trim(),
    );
    if (!incomplete.length) return;
    incompleteRecognitionQueuedRef.current = true;
    void enqueueRecognition(incomplete);
    // Run once after persisted tickets have loaded; queue processing writes
    // the recognised details back into the same ticket records.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, tickets]);

  function applyRecognisedMatch(
    ticketId: string,
    data: {
      homeTeam?: string | null;
      awayTeam?: string | null;
      date?: string | null;
      kickoff?: string | null;
      competition?: string | null;
      ground?: string | null;
      seatDetails?: TicketSeatDetails | null;
      ticketType?: string | null;
      seasonKey?: string | null;
      confirmedMatch?: boolean;
      clubName?: string | null;
      displayName?: string | null;
    },
  ) {
    setTickets((current) =>
      current.map((item) => {
        if (item.id !== ticketId) return item;
        const homeTeam = data.homeTeam ?? item.homeTeam ?? null;
        const awayTeam = data.awayTeam ?? item.awayTeam ?? null;
        const matchDate = data.date ?? item.matchDate;
        const kickoffTime = data.kickoff ?? item.kickoffTime;
        const ticketType = data.ticketType ?? item.ticketType ?? null;
        const associatedClub =
          data.clubName?.trim() ||
          item.clubName?.trim() ||
          [homeTeam, awayTeam].find((team) =>
            team ? clubNamesMatch(team, favouriteClub.name) : false,
          ) ||
          homeTeam ||
          awayTeam ||
          null;
        const nextSeasonKey =
          ticketType === "Season Ticket"
            ? data.seasonKey?.trim() || item.seasonKey
            : matchDate
              ? seasonForDate(matchDate) ?? ""
              : data.seasonKey?.trim() || "";
        const displayName =
          data.displayName?.trim() ||
          (buildTicketDisplayName({
            homeTeam,
            awayTeam,
            date: matchDate,
            kickoff: kickoffTime,
          }) ??
          (ticketType && !homeTeam && !awayTeam
            ? `${ticketType}\n${associatedClub ?? "Club not set"}\n${
                nextSeasonKey || seasonFrame.season
              }`
            : null));
        return {
          ...item,
          homeTeam,
          awayTeam,
          clubName: associatedClub,
          matchDate,
          kickoffTime,
          competition: data.competition ?? item.competition,
          ground: data.ground ?? item.ground ?? null,
          ticketType,
          confirmedMatch: data.confirmedMatch ?? item.confirmedMatch,
          seasonKey: nextSeasonKey,
          details:
            !item.details && data.seatDetails
              ? data.seatDetails
              : item.details,
          name: displayName ?? item.name,
        };
      }),
    );
  }

  function dequeueConfirm(
    ticketId?: string,
    result: "saved" | "skipped" = "saved",
  ) {
    setConfirmQueue((current) => {
      const completedTicketId = ticketId ?? current[0]?.ticket.id;
      if (!completedTicketId) return current;
      // A picker/import race used to be able to queue the same ticket twice.
      // Completing it must close every duplicate while preserving other
      // imported tickets waiting behind it.
      return current.filter((entry) => entry.ticket.id !== completedTicketId);
    });
    if (ticketId) {
      const resolve = ticketReviewResolversRef.current.get(ticketId);
      ticketReviewResolversRef.current.delete(ticketId);
      resolve?.(result);
    }
    setAlternatives(null);
  }

  function markTicketCompleted(ticketId: string) {
    if (completedTicketIdsRef.current.has(ticketId)) return;
    completedTicketIdsRef.current.add(ticketId);
    setCompletedTicketsSinceBackup((current) => {
      const next = current + 1;
      void AsyncStorage.setItem(
        COMPLETED_TICKETS_SINCE_BACKUP_KEY,
        String(next),
      ).catch(() => {});
      if (next >= BACKUP_REMINDER_TICKET_COUNT)
        backupReminderPendingRef.current = true;
      return next;
    });
  }

  function duplicateMatchMessage(
    ticketId: string,
    homeTeam: string | null | undefined,
    awayTeam: string | null | undefined,
    matchDate: string | null | undefined,
  ): string | null {
    if (!homeTeam || !awayTeam || !matchDate) return null;
    const duplicate = tickets.find(
      (ticket) =>
        ticket.id !== ticketId &&
        ticket.matchDate === matchDate &&
        Boolean(ticket.homeTeam && ticket.awayTeam) &&
        ((clubNamesMatch(ticket.homeTeam!, homeTeam) &&
          clubNamesMatch(ticket.awayTeam!, awayTeam)) ||
          (clubNamesMatch(ticket.homeTeam!, awayTeam) &&
            clubNamesMatch(ticket.awayTeam!, homeTeam))),
    );
    return duplicate
      ? `${homeTeam} v ${awayTeam} on ${formatTicketDate(matchDate) ?? matchDate} is already saved.`
      : null;
  }

  function handleConfirmMatch(item: {
    ticket: SeasonTicket;
    recognition: RecognizedTicket;
  }) {
    const duplicate = duplicateMatchMessage(
      item.ticket.id,
      item.recognition.homeTeam,
      item.recognition.awayTeam,
      item.recognition.date,
    );
    if (duplicate) {
      Alert.alert("Duplicate match ticket", duplicate);
      return;
    }
    const confirmedGround = item.recognition.homeTeam
      ? groundForHomeTeam(item.recognition.homeTeam, item.recognition.date) ||
        item.recognition.ground
      : item.recognition.ground;
    applyRecognisedMatch(item.ticket.id, {
      ...item.recognition,
      ground: confirmedGround,
      confirmedMatch: true,
    });
    markTicketCompleted(item.ticket.id);
    dequeueConfirm(item.ticket.id, "saved");
  }

  // V3.9.5 — classification, edit-details and separate item stores -------

  function handleSaveEdits(
    item: { ticket: SeasonTicket },
    draft: ItemEditDraft,
  ): string | null {
    const { patch, dateError } = buildRecognitionPatch(draft);
    if (dateError) return dateError;
    const duplicate = duplicateMatchMessage(
      item.ticket.id,
      patch.homeTeam,
      patch.awayTeam,
      patch.date,
    );
    if (duplicate) return duplicate;
    const typedSeason = draft.seasonKey.trim();
    const normalisedSeason = typedSeason
      ? normaliseSeasonEntry(typedSeason)
      : null;
    if (typedSeason && !normalisedSeason)
      return "Enter the season as 2026/27 or 2026/2027.";
    const savedSeason =
      normalisedSeason ??
      (patch.date ? seasonForDate(patch.date) : null) ??
      item.ticket.seasonKey ??
      "";
    const resolvedGround = patch.homeTeam
      ? groundForHomeTeam(patch.homeTeam, patch.date ?? null) || patch.ground
      : patch.ground;
    // Empty text means "clear this field" — pass "" so it overwrites.
    applyRecognisedMatch(item.ticket.id, {
      homeTeam: patch.homeTeam ?? "",
      awayTeam: patch.awayTeam ?? "",
      date: patch.date,
      kickoff: patch.kickoff ?? "",
      competition: patch.competition ?? "",
      ground: resolvedGround ?? "",
      seasonKey: savedSeason,
      ticketType: patch.ticketType ?? "",
      seatDetails: patch.seatDetails,
      confirmedMatch: false,
    });
    setConfirmQueue((current) =>
      current.map((entry, index) =>
        index === 0 && entry.ticket.id === item.ticket.id
          ? {
              ...entry,
              recognition: {
                ...entry.recognition,
                homeTeam: patch.homeTeam || null,
                awayTeam: patch.awayTeam || null,
                date: patch.date ?? entry.recognition.date,
                kickoff: patch.kickoff || null,
                competition: patch.competition || null,
                ground: resolvedGround || null,
                seatDetails:
                  patch.seatDetails ?? entry.recognition.seatDetails,
                ticketType: patch.ticketType || null,
              },
            }
          : entry,
      ),
    );
    return null;
  }

  function handleSaveSeasonProfile(
    item: { ticket: SeasonTicket },
    fields: {
      club: string;
      seasonKey: string;
      stand: string;
      block: string;
      row: string;
      seat: string;
      fanId: string;
      ticketNumber: string;
      holderName: string;
    },
  ) {
    const seasonClub = fields.club.trim();
    if (!seasonClub) {
      Alert.alert(
        "Season ticket club required",
        "Enter the club printed on this season ticket. Favourite Club is not used automatically.",
      );
      return;
    }
    const profile: SeasonTicketProfile = {
      id: newProfileId(),
      club: seasonClub,
      seasonKey:
        fields.seasonKey.trim() ||
        item.ticket.seasonKey ||
        seasonFrame.season,
      stand: fields.stand.trim() || null,
      block: fields.block.trim() || null,
      row: fields.row.trim() || null,
      seat: fields.seat.trim() || null,
      fanId: fields.fanId.trim() || null,
      ticketNumber: fields.ticketNumber.trim() || null,
      holderName: fields.holderName.trim() || null,
      imageUri: currentTicketUri(item.ticket.uri),
      createdAt: nowMs(),
    };
    const { records, matchedExisting } = addSeasonTicketProfile(
      seasonTicketProfiles,
      profile,
    );
    setSeasonTicketProfiles(records);
    // OWNERSHIP MODEL — the season card is a possession: it STAYS in the
    // ticket archive exactly as scanned. The profile is metadata for
    // attendance; it never becomes individual fixture frames. Tagging the
    // ticket keeps it out of match derivation (no automatic attendance).
    applyRecognisedMatch(item.ticket.id, {
      homeTeam: "",
      awayTeam: "",
      ticketType: "Season Ticket",
      clubName: profile.club,
      displayName: [
        "Season Ticket",
        profile.club,
        profile.holderName || profile.seasonKey,
      ].join("\n"),
      seasonKey: profile.seasonKey,
      seatDetails: {
        stand: fields.stand.trim() || undefined,
        block: fields.block.trim() || undefined,
        row: fields.row.trim() || undefined,
        seat: fields.seat.trim() || undefined,
      },
    });
    markTicketCompleted(item.ticket.id);
    dequeueConfirm(item.ticket.id, "saved");
    Alert.alert(
      matchedExisting ? "Profile updated" : "Season ticket saved",
      matchedExisting
        ? `${profile.club} · ${profile.seasonKey} profile merged — kept in My Tickets, no duplicates created.`
        : `${profile.club} · ${profile.seasonKey} kept in My Tickets with a seat-details profile.`,
    );
    setProfileFixtures(null);
  }

  function handleSaveCarParkPass(
    item: { ticket: SeasonTicket },
    fields: {
      title: string;
      seasonKey: string;
      matchDate: string;
      ground: string;
      linkedOpponent: string;
      linkedDate: string;
    },
    recognition: RecognizedTicket,
  ) {
    const linkedDate = parseFlexibleDateInput(fields.linkedDate);
    const matchDate = parseFlexibleDateInput(fields.matchDate);
    if (fields.matchDate.trim() && !matchDate) {
      Alert.alert(
        "Invalid date",
        "Enter the date as YYYY-MM-DD or e.g. 14 March 2010.",
      );
      return false;
    }
    // The link field may hold a full "Home v Away" fixture or a lone opponent;
    // storage keeps the club/opponent split whenever the club is named.
    const { linkedClub, linkedOpponent } = splitLinkedFixture(
      fields.linkedOpponent,
      favouriteClub.name,
    );
    const pass: CarParkPass = {
      id: newCarParkPassId(),
      title:
        fields.title.trim() ||
        `${fields.ground.trim() || favouriteClub.name} Car Park Pass`,
      ground: fields.ground.trim() || null,
      matchDate: matchDate ?? null,
      linkedClub,
      linkedOpponent,
      linkedDate: linkedDate ?? null,
      imageUri: currentTicketUri(item.ticket.uri),
      createdAt: nowMs(),
    };
    const { records } = addCarParkPass(carParkPasses, pass);
    setCarParkPasses(records);
    // OWNERSHIP MODEL — the pass is a possession: it STAYS in the ticket
    // archive with its recognised details intact. The "Car Park Pass" type
    // tag alone keeps it out of match derivation (isNonMatchTicketType); it
    // is never turned into match-ticket frames and never counts as
    // attendance, stadium visits or season history.
    applyRecognisedMatch(item.ticket.id, {
      homeTeam: recognition.homeTeam,
      awayTeam: recognition.awayTeam,
      date: recognition.date,
      kickoff: recognition.kickoff,
      competition: recognition.competition,
      ground: fields.ground.trim() || undefined,
      seasonKey: fields.seasonKey || item.ticket.seasonKey,
      ticketType: "Car Park Pass",
      seatDetails: recognition.seatDetails,
    });
    markTicketCompleted(item.ticket.id);
    dequeueConfirm(item.ticket.id, "saved");
    Alert.alert(
      "Car park pass saved",
      "Kept in My Tickets and linked where relevant. Car park passes never count towards attendance.",
    );
    return true;
  }

  function confirmSeasonAttendance(
    profile: SeasonTicketProfile,
    fixture: {
      opponent: string;
      date: string | null;
      competition: string | null;
      venue: string | null;
      /** Explicit season for past-season tickets; defaults to date-derived. */
      seasonKey?: string;
      homeScore?: number | null;
      awayScore?: number | null;
    },
    seats: { stand: string; block: string; row: string; seat: string },
  ) {
    const seatNotes = composeSeatNotes(seats);
    const homeScore = fixture.homeScore ?? null;
    const awayScore = fixture.awayScore ?? null;
    // Home fixtures only: the favourite club is always the home side, so a
    // known score maps directly onto a result.
    const result =
      homeScore !== null && awayScore !== null
        ? homeScore > awayScore
          ? ("win" as const)
          : homeScore === awayScore
            ? ("draw" as const)
            : ("loss" as const)
        : null;
    const favouriteGround = findGroundForClub(profile.club || favouriteClub.name);
    const { records, matchedExisting, record } = addManualAttendance(
      attendanceHistory,
      {
        club: profile.club || favouriteClub.name,
        opponent: fixture.opponent,
        matchDate: fixture.date || null,
        season:
          fixture.seasonKey ||
          canonicalSeason(fixture.date) ||
          profile.seasonKey ||
          activeSeason,
        competition: fixture.competition || null,
        ground: fixture.venue || favouriteGround?.stadium || null,
        homeAway: "home",
        result,
        homeScore,
        awayScore,
        notes: seatNotes ?? undefined,
      },
      { source: "season-ticket" },
    );
    setAttendanceHistory(records);
    return { matchedExisting, record };
  }

  async function loadAlternatives(
    item: { ticket: SeasonTicket },
    seasonOverride?: string,
  ) {
    const requestId = ++alternativesRequestRef.current;
    setAlternatives(null);
    setPickerNotice(null);
    const seasonKey =
      (seasonOverride ? normaliseSeasonEntry(seasonOverride) : null) ||
      item.ticket.seasonKey ||
      seasonFrame.season;
    try {
      const cached = await loadCachedFixtures(favouriteClub.name, seasonKey);
      if (requestId !== alternativesRequestRef.current) return;
      if (cached.length)
        setAlternatives([...cached].sort(compareFixturesForPicker));
      const fixtures = await fetchAndCacheFixtures(
        favouriteClub.name,
        seasonKey,
        { league: favouriteClub.league },
      );
      const ordered = [...fixtures].sort(compareFixturesForPicker);
      if (requestId !== alternativesRequestRef.current) return;
      const byCompetition: Record<string, number> = {};
      for (const fixture of fixtures) {
        const label = fixture.competition || "Unlabelled";
        byCompetition[label] = (byCompetition[label] ?? 0) + 1;
      }
      console.log(
        `[ticket-fixture-picker-debug]\nselected club: ${favouriteClub.name}\nseason: ${seasonKey}\nfixtures loaded: ${fixtures.length}\ncompetitions available: ${Object.keys(byCompetition).length}\nfixture count by competition:\n${Object.entries(byCompetition)
          .map(([label, count]) => `  ${label}: ${count}`)
          .join("\n")}`,
      );
      if (!fixtures.length) {
        setPickerNotice(
          "No fixtures downloaded yet — check your internet connection and try again.",
        );
      } else {
        const cacheState = await getFixtureCacheState(favouriteClub.name, seasonKey);
        if (cacheState.state === "stale")
          setPickerNotice(
            `Showing previously downloaded fixtures · Last updated: ${
              formatLastUpdated(cacheState.fetchedAt) ?? "unknown"
            }`,
          );
      }
      if (requestId === alternativesRequestRef.current) setAlternatives(ordered);
    } catch {
      if (requestId !== alternativesRequestRef.current) return;
      setPickerNotice(
        "Could not download fixtures — check your internet connection.",
      );
      setAlternatives([]);
    }
  }

  function handlePickFixture(
    item: { ticket: SeasonTicket },
    fixture: CachedFixture,
  ): string | null {
    const home =
      fixture.homeAway === "home" ? favouriteClub.name : fixture.opponent;
    const away =
      fixture.homeAway === "home" ? fixture.opponent : favouriteClub.name;
    const duplicate = duplicateMatchMessage(
      item.ticket.id,
      home,
      away,
      fixture.date,
    );
    if (duplicate) return duplicate;
    const ground =
      groundForHomeTeam(home, fixture.date || null) || fixture.venue || null;
    applyRecognisedMatch(item.ticket.id, {
      homeTeam: home,
      awayTeam: away,
      date: fixture.date || null,
      kickoff: fixture.kickoff || null,
      competition: fixture.competition || null,
      // The home club's stadium is the canonical geo anchor for match photos.
      ground,
      confirmedMatch: false,
    });
    setConfirmQueue((current) =>
      current.map((entry, index) =>
        index === 0 && entry.ticket.id === item.ticket.id
          ? {
              ...entry,
              recognition: {
                ...entry.recognition,
                homeTeam: home,
                awayTeam: away,
                date: fixture.date || null,
                kickoff: fixture.kickoff || null,
                competition: fixture.competition || null,
                ground,
                ticketType: "Match Ticket",
              },
            }
          : entry,
      ),
    );
    return null;
  }

  function waitForExportImages(total: number) {
    return new Promise<void>((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (total === 0 || exportLoadedRef.current.size >= total) {
          resolve();
          return;
        }
        if (Date.now() - started > 8000) {
          console.warn(
            `[EXPORT_RENDER] image wait timeout: ${exportLoadedRef.current.size}/${total}`,
          );
          resolve();
          return;
        }
        setTimeout(tick, 60);
      };
      tick();
    });
  }

  async function exportFrame(kind: "photo" | "pdf" | "print") {
    if (exporting) return;
    setExporting(true);
    console.log(`[export-start]\ntype: ${kind}\nticketCount: ${fullFrameTickets.length}`);
    try {
      exportLoadedRef.current = new Set();
      const job = [...fullFrameTickets];
      await ensureOldSchoolAssets(job);
      setExportJob(job);
      const imageTotal = job.filter((ticket) => ticket.uri).length;
      console.log(`[EXPORT_RENDER] mounted\ntickets: ${job.length}\nimages expected: ${imageTotal}`);
      await waitForExportImages(imageTotal);
      await new Promise((r) => setTimeout(r, 300));
      const captured = await captureExportMaster();

      if (kind === "pdf" || kind === "print") {
        const pdfUri = await buildCapturedFramePdf(captured);
        if (kind === "pdf") {
          await Sharing.shareAsync(pdfUri, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
            dialogTitle: "Share or save the season frame PDF",
          });
        } else {
          try {
            await Print.printAsync({ uri: pdfUri });
          } catch {
            // Closing the iOS print sheet is a cancellation, not a request to
            // open a second PDF save/share sheet.
          }
        }
        return;
      }

      console.log(
        `[EXPORT_TEST]\ntype: PHOTO\nwidth: ${captured.width}\nheight: ${captured.height}\nfileSizeMB: ${(captured.size / 1048576).toFixed(2)}\nticketCount: ${fullFrameTickets.length}`,
      );
      await Sharing.shareAsync(captured.uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: "Captured season frame",
      });
    } catch (error) {
      console.error("Frame export failed", error);
      Alert.alert(
        "Export could not finish",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setExporting(false);
      setExportJob(null);
    }
  }

  const [activeSeason, setActiveSeason] = useState(
    () => seasonForDate(new Date()) ?? "",
  );
  const [showSeasonManager, setShowSeasonManager] = useState(false);
  const [venuePrivacyExpanded, setVenuePrivacyExpanded] = useState(false);
  const [settingsDetailsExpanded, setSettingsDetailsExpanded] = useState<
    Record<string, boolean>
  >({});
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [policyAgreementReady, setPolicyAgreementReady] = useState(false);
  useEffect(() => {
    void AsyncStorage.getItem(POLICY_AGREEMENT_KEY).then((value) =>
      setPolicyAgreed(value === "accepted"),
    ).finally(() => setPolicyAgreementReady(true));
  }, []);
  const [seasonPickerOpen, setSeasonPickerOpen] = useState(false);
  const [draftSeason, setDraftSeason] = useState<string | null>(null);
  const seasonFrame = createSeasonFrame(favouriteClub.name, activeSeason);
  const frameCaptureRef = useRef<View>(null);
  const [exportJob, setExportJob] = useState<SeasonTicket[] | null>(null);
  const exportFrameRef = useRef<View>(null);
  const exportLoadedRef = useRef<Set<string>>(new Set());
  const editingTicketIdRef = useRef<string | null>(null);

  // Independent zoom/pan state for the full season frame
  const seasonScale = useSharedValue(1);
  const seasonSavedScale = useSharedValue(1);
  const seasonTranslateX = useSharedValue(0);
  const seasonTranslateY = useSharedValue(0);
  const seasonSavedTranslateX = useSharedValue(0);
  const seasonSavedTranslateY = useSharedValue(0);
  const seasonPinchStartScale = useSharedValue(1);
  const seasonPinchStartTranslateX = useSharedValue(0);
  const seasonPinchStartTranslateY = useSharedValue(0);
  const seasonPinchStartFocalX = useSharedValue(0);
  const seasonPinchStartFocalY = useSharedValue(0);
  const seasonPinching = useSharedValue(false);
  const homeFramePopped = useSharedValue(false);
  const homeFocusBackdropOpacity = useSharedValue(0);
  const homeFocusEntryScale = useSharedValue(0.9);
  const fullFrameZoomSignal = useSharedValue(false);
  const fullSeasonPagePopped = useSharedValue(false);

  function openFullFrameFromHome() {
    resetSeasonFrameZoom();
    seasonScale.value = 1.08;
    seasonSavedScale.value = 1.08;
    homeFocusBackdropOpacity.value = 0;
    homeFocusEntryScale.value = 0.9;
    setHomeFrameFocused(true);
    setFinished(true);
    homeFocusBackdropOpacity.value = withTiming(0.94, { duration: 650 });
    homeFocusEntryScale.value = withSpring(1);
  }

  function openFocusedFullSeasonFrame() {
    resetSeasonFrameZoom();
    setEnlargedTicketId(undefined);
    setHomeFrameFocused(false);
    setFullFrameZoomed(false);
    setFinished(true);
  }

  function enterFocusedFullSeasonFrame() {
    setEnlargedTicketId(undefined);
    resetSeasonFrameZoom();

    homeFocusBackdropOpacity.value = 0;
    homeFocusEntryScale.value = 0.9;

    seasonScale.value = 1;
    seasonSavedScale.value = 1;
    fullFrameZoomSignal.value = true;
    setFullFrameZoomed(true);

    homeFocusBackdropOpacity.value = withTiming(0.94, { duration: 650 });
    homeFocusEntryScale.value = withSpring(1);
  }

  const homeFramePinchGesture = Gesture.Pinch()
    .onBegin(() => {
      homeFramePopped.value = false;
    })
    .onUpdate((event) => {
      if (event.scale > 1.06 && !homeFramePopped.value) {
        homeFramePopped.value = true;
        runOnJS(openFullFrameFromHome)();
      }
    });

  const fullSeasonPagePinchGesture = Gesture.Pinch()
    .onBegin(() => {
      fullSeasonPagePopped.value = false;
    })
    .onUpdate((event) => {
      if (event.scale > 1.06 && !fullSeasonPagePopped.value) {
        fullSeasonPagePopped.value = true;
        runOnJS(enterFocusedFullSeasonFrame)();
      }
    });

  // Full season focused frame has its own zoom and movement.
  // Keep all active pinch maths on the UI thread and anchor scaling to the
  // users' focal point so the frame stays underneath their fingers.
  const seasonPinchGesture = Gesture.Pinch()
    .onBegin((event) => {
      seasonPinching.value = true;
      seasonPinchStartScale.value = seasonScale.value;
      seasonPinchStartTranslateX.value = seasonTranslateX.value;
      seasonPinchStartTranslateY.value = seasonTranslateY.value;
      seasonPinchStartFocalX.value = event.focalX;
      seasonPinchStartFocalY.value = event.focalY;
    })
    .onUpdate((event) => {
      const startScale = Math.max(1, seasonPinchStartScale.value);
      const nextScale = Math.max(
        1,
        Math.min(4, startScale * event.scale),
      );
      const ratio = nextScale / startScale;

      seasonScale.value = nextScale;

      seasonTranslateX.value =
        event.focalX -
        seasonPinchStartFocalX.value * ratio +
        seasonPinchStartTranslateX.value * ratio;

      seasonTranslateY.value =
        event.focalY -
        seasonPinchStartFocalY.value * ratio +
        seasonPinchStartTranslateY.value * ratio;
    })
    .onEnd(() => {
      seasonPinching.value = false;

      if (seasonScale.value <= 1.05) {
        seasonSavedScale.value = 1;
        seasonScale.value = withTiming(1);
        seasonTranslateX.value = withTiming(0);
        seasonTranslateY.value = withTiming(0);
        seasonSavedTranslateX.value = 0;
        seasonSavedTranslateY.value = 0;
        fullFrameZoomSignal.value = false;
        if (!homeFrameFocused) {
          runOnJS(setEnlargedTicketId)(undefined);
          runOnJS(setFullFrameZoomed)(false);
        }
        // Only the frame that grew out of Home returns to Home. The dedicated
        // Full Season Frame page remains open at its normal size.
        if (homeFrameFocused) runOnJS(closeSeasonFrame)();
        return;
      }

      seasonSavedScale.value = seasonScale.value;
      seasonSavedTranslateX.value = seasonTranslateX.value;
      seasonSavedTranslateY.value = seasonTranslateY.value;
    })
    .onFinalize(() => {
      seasonPinching.value = false;
    });

  const seasonPanGesture = Gesture.Pan()
    .manualActivation(true)
    .maxPointers(1)
    .onTouchesMove((_event, stateManager) => {
      if (!seasonPinching.value && seasonScale.value > 1.01) {
        stateManager.activate();
      } else {
        stateManager.fail();
      }
    })
    .onUpdate((event) => {
      seasonTranslateX.value =
        seasonSavedTranslateX.value + event.translationX;
      seasonTranslateY.value =
        seasonSavedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      seasonSavedTranslateX.value = seasonTranslateX.value;
      seasonSavedTranslateY.value = seasonTranslateY.value;
    });

  const seasonFrameGesture = Gesture.Simultaneous(
    seasonPinchGesture,
    seasonPanGesture,
  );

  function closeSeasonFrame() {
    setEnlargedTicketId(undefined);
    resetSeasonFrameZoom();
    if (homeFrameFocused) {
      homeFocusBackdropOpacity.value = withTiming(0, { duration: 500 });
      homeFocusEntryScale.value = withTiming(0.9, { duration: 500 });
      setTimeout(() => {
        setHomeFrameFocused(false);
        setFinished(false);
      }, 500);
      return;
    }
    setHomeFrameFocused(false);
    setFinished(false);
  }

  const homeFocusBackdropStyle = useAnimatedStyle(() => ({
    opacity: homeFocusBackdropOpacity.value,
  }));
  const homeFocusEntryStyle = useAnimatedStyle(() => ({
    transform: [{ scale: homeFocusEntryScale.value }],
  }));

  const seasonFrameAnimatedStyle = useAnimatedStyle(() => {
    const rawScale = seasonScale.value;
    const rawX = seasonTranslateX.value;
    const rawY = seasonTranslateY.value;
    const scale = Number.isFinite(rawScale)
      ? Math.min(4, Math.max(1, rawScale))
      : 1;
    const translateX = Number.isFinite(rawX) ? rawX : 0;
    const translateY = Number.isFinite(rawY) ? rawY : 0;
    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    };
  });

  const fullFramePageBackdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (seasonScale.value - 1) / 0.35)),
  }));

  function resetSeasonFrameZoom() {
    setFullFrameZoomed(false);
    fullFrameZoomSignal.value = false;
    seasonScale.value = 1;
    seasonSavedScale.value = 1;
    seasonTranslateX.value = 0;
    seasonSavedTranslateX.value = 0;
    seasonTranslateY.value = 0;
    seasonSavedTranslateY.value = 0;
  }


  const legacyUserDataRef = useRef(false);
  const savedClubValidRef = useRef(false);
  useEffect(() => {
    void (async () => {
      // V3.8 — storage versioning runs BEFORE any user data is loaded.
      // Stamps the schema version on first launch, runs pending migrations
      // with backup + verification, and fails safely without ever throwing
      // or blocking the normal load path.
      await ensureStorageSchema();

      // One-time user-requested cleanup for this release. Remove every saved
      // ticket-like record, including records that are not currently visible
      // in Home filters, while retaining the favourite club and app settings.
      const resetDone = await AsyncStorage.getItem(TICKET_RESET_KEY);
      if (resetDone !== "true") {
        const savedRaw = await AsyncStorage.getItem(SAVED_FRAME_KEY);
        if (savedRaw) {
          try {
            const savedValue = JSON.parse(savedRaw) as {
              tickets?: SeasonTicket[];
              [key: string]: unknown;
            };
            for (const ticket of savedValue.tickets ?? []) {
              const uri = currentTicketUri(ticket.uri);
              if (uri) {
                await FileSystem.deleteAsync(uri, { idempotent: true }).catch(
                  () => {},
                );
              }
            }
            await AsyncStorage.setItem(
              SAVED_FRAME_KEY,
              JSON.stringify({ ...savedValue, tickets: [] }),
            );
          } catch {
            await AsyncStorage.removeItem(SAVED_FRAME_KEY);
          }
        }
        await Promise.all([
          saveSeasonTicketProfiles([]),
          saveCarParkPasses([]),
        ]);
        await AsyncStorage.setItem(TICKET_RESET_KEY, "true");
      }

      // V3.7.2 — fresh-install fix: resolve the onboarding gate on EVERY
      // startup path. No stored data + no completion flag ⇒ first-launch
      // experience. Any prior stored signal (saved frame OR ground visits)
      // marks a legacy user, who never sees it. A corrupt payload is treated
      // as fresh rather than crashing startup.
      return Promise.all([
        AsyncStorage.getItem(SAVED_FRAME_KEY),
        AsyncStorage.getItem(GROUND_VISITS_KEY),
      ]);
    })()
      .then(([saved, groundRaw]) => {
        if (groundRaw) legacyUserDataRef.current = true;
        if (!saved) return;
        try {
          const value = JSON.parse(saved) as {
            tickets?: SeasonTicket[];
            frameStyle?: string;
            favouriteClub?: ClubOption;
            activeSeason?: string;
          };
          if (
            (Array.isArray(value.tickets) && value.tickets.length > 0) ||
            value.favouriteClub?.name
          )
            legacyUserDataRef.current = true;
          if (Array.isArray(value.tickets))
            setTickets(
              value.tickets.map((ticket) => ({
                ...ticket,
                uri: currentTicketUri(ticket.uri),
                matchDate: ticket.matchDate || null,
                displayStyle:
                  ticket.displayStyle === "old-school"
                    ? undefined
                    : ticket.displayStyle,
              })),
            );
          if (value.frameStyle && stylesList.includes(value.frameStyle))
            setFrameStyle(value.frameStyle);
          const storedClub = value.favouriteClub;
          const savedClub = canonicalStoredClub(storedClub);
          const savedClubValid = Boolean(
            savedClub &&
              savedClub.id !== PLACEHOLDER_CLUB_ID &&
              (savedClub.id.trim() ||
                (savedClub.name.trim() && savedClub.name !== "Your Club")),
          );
          savedClubValidRef.current = savedClubValid;
          if (savedClubValid && savedClub) {
            setFavouriteClub(savedClub);
            if (storedClub?.name !== savedClub.name) {
              console.warn(
                `[recovery] repaired favourite club ${storedClub?.name ?? "(missing)"} -> ${savedClub.name}`,
              );
            }
          }
          if (
            typeof value.activeSeason === "string" &&
            /^\d{4}\/\d{2}$/.test(value.activeSeason)
          )
            setActiveSeason(value.activeSeason);
        } catch {
          console.warn("[startup] saved frame unreadable — treated as fresh");
        }
      })
      .catch(() => {})
      .finally(() => {
        void AsyncStorage.getItem(TICKET_STYLE_KEY)
          .then((raw) => {
            if (raw === "old-school" || raw === "e-ticket" || raw === "match-ticket")
              setTicketStyle("e-ticket");
            console.log(
              "[HOME-TICKET-IMAGE] stored global ticket style:",
              raw ?? "(none)",
              "→ resolved: e-ticket",
            );
          })
          .catch(() => {})
          .finally(() => {
            // Existing/recovered installations open directly into Ticket Frame.
            // Keep onboarding available for manual replay without blocking startup.
            void AsyncStorage.setItem(ONBOARDING_KEY, "true").catch(() => {});
            setShowOnboarding(false);
            setStorageReady(true);
          });
      });
  }, []);
  useEffect(() => {
    void AsyncStorage.getItem(GROUND_VISITS_KEY)
      .then((raw) => {
        if (raw) setGroundVisits(JSON.parse(raw) as Record<string, number>);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    void loadAttendanceHistory()
      .then(setAttendanceHistory)
      .catch(() => {})
      .finally(() => setAttendanceHistoryReady(true));
  }, []);

  useEffect(() => {
    if (!storageReady || !attendanceHistoryReady || !attendanceHistory.length) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const requests = Array.from(
        new Map(
          attendanceHistory
            .filter((record) => record.club && record.season)
            .map((record) => [
              `${normaliseFixtureText(record.club)}|${record.season}`,
              { club: record.club, season: record.season },
            ]),
        ).values(),
      );

      const hydrated: CachedFixture[] = [];

      for (const request of requests) {
        if (cancelled) return;

        const cached = await loadCachedFixtures(
          request.club,
          request.season,
        ).catch(() => []);

        hydrated.push(...cached);

        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (!cancelled) setHistoryFixtures(hydrated);
    })();

    return () => {
      cancelled = true;
    };
  }, [attendanceHistory, attendanceHistoryReady, storageReady]);
  useEffect(() => {
    if (!storageReady || !attendanceHistoryReady) return;
    void saveAttendanceHistory(attendanceHistory).catch(() => {});
  }, [attendanceHistory, attendanceHistoryReady, storageReady]);
  useEffect(() => {
    void AsyncStorage.getItem(DELETED_HISTORY_MATCHES_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        setDeletedHistoryMatchKeys(
          new Set(
            Array.isArray(parsed)
              ? parsed.filter(
                  (item): item is string => typeof item === "string",
                )
              : [],
          ),
        );
      })
      .catch(() => setDeletedHistoryMatchKeys(new Set()))
      .finally(() => setDeletedHistoryMatchesReady(true));
  }, []);

  useEffect(() => {
    if (!storageReady || !deletedHistoryMatchesReady) return;
    void AsyncStorage.setItem(
      DELETED_HISTORY_MATCHES_KEY,
      JSON.stringify([...deletedHistoryMatchKeys]),
    ).catch(() => {});
  }, [deletedHistoryMatchKeys, deletedHistoryMatchesReady, storageReady]);

  useEffect(() => {
    if (!storageReady || tickets.length !== 0) return;

    const clearDeletedTicketMatchMemory = async () => {
      // Clear live Match Memory state first so stale state cannot write itself
      // back into AsyncStorage after the persistent stores are removed.
      setMatchPhotos({});
      setMatchMediaReferences({});
      setResolvedMatchMedia({});
      setPhotoCandidates({});
      setMatchdayMediaAssignments({});
      setMatchdayCustomLocations({});
      setAutoPhotoMatchedRecordIds(new Set());

      setMediaEditMode(false);
      setSelectedMediaKeys(new Set());
      setSelectedMatchVideoUri(null);
      setEnlargedMatchPhotoUri(null);
      setSelectedHistoryRecordId(null);

      matchMediaReferencesRef.current = {};
      autoPhotoScannedRecordsRef.current = new Set();
      resolvedMatchMediaSignatureRef.current = {};

      await Promise.all([
        AsyncStorage.removeItem("ticket-frame.attendance-history.v1"),
        AsyncStorage.removeItem(GROUND_VISITS_KEY),
        AsyncStorage.removeItem(MATCH_PHOTOS_KEY),
        AsyncStorage.removeItem(MATCH_MEDIA_REFERENCES_KEY),
        AsyncStorage.removeItem(MATCHDAY_EXPERIENCES_KEY),
        AsyncStorage.removeItem(MATCHDAY_MEDIA_ASSIGNMENTS_KEY),
        AsyncStorage.removeItem(MATCHDAY_CUSTOM_LOCATIONS_KEY),
        AsyncStorage.removeItem(AUTO_PHOTO_MATCHED_KEY),
        AsyncStorage.removeItem(AUTO_MEDIA_SCANNED_KEY),
      ]);

      console.log(
        "[MATCH-MEMORY-RESET] live state and stored Match Memory cleared",
      );
    };

    void clearDeletedTicketMatchMemory();
  }, [storageReady, tickets]);

  useEffect(() => {
    void AsyncStorage.getItem(MATCH_PHOTOS_KEY)
      .then(async (raw) => {
        if (!raw) return;
        const stored = JSON.parse(raw) as Record<string, string[]>;
        const cleaned = await removeDuplicateMatchPhotoReferences(stored);
        setMatchPhotos(cleaned);
        if (JSON.stringify(cleaned) !== JSON.stringify(stored))
          await AsyncStorage.setItem(MATCH_PHOTOS_KEY, JSON.stringify(cleaned));
      })
      .catch(() => {})
      .finally(() => setMatchPhotosReady(true));
    void AsyncStorage.getItem(MATCH_MEDIA_REFERENCES_KEY)
      .then((raw) => {
        if (!raw) return;
        setMatchMediaReferences(
          JSON.parse(raw) as Record<string, MatchMediaReference[]>,
        );
      })
      .catch(() => {})
      .finally(() => setMatchMediaReferencesReady(true));

    void AsyncStorage.getItem(AUTO_PHOTO_MATCHED_KEY)
      .then((raw) => {
        if (raw) setAutoPhotoMatchedRecordIds(new Set(JSON.parse(raw) as string[]));
      })
      .catch(() => {});

    void Promise.all([
      AsyncStorage.getItem(AUTO_MEDIA_SCANNED_KEY),
      AsyncStorage.getItem(MATCH_MEDIA_REFERENCES_KEY),
    ])
      .then(([scannedRaw, referencesRaw]) => {
        const scannedIds = scannedRaw
          ? (JSON.parse(scannedRaw) as string[])
          : [];

        const storedReferences = referencesRaw
          ? (JSON.parse(referencesRaw) as Record<string, MatchMediaReference[]>)
          : {};

        // A record may only remain "already scanned" when it still has
        // real saved media. Deleting a ticket therefore cannot leave a
        // stale scan flag that blocks the same match when it is re-added.
        const validScannedIds = scannedIds.filter(
          (recordId) => (storedReferences[recordId] ?? []).length > 0,
        );

        autoPhotoScannedRecordsRef.current = new Set(validScannedIds);

        if (validScannedIds.length !== scannedIds.length) {
          void AsyncStorage.setItem(
            AUTO_MEDIA_SCANNED_KEY,
            JSON.stringify(validScannedIds),
          );
        }
      })
      .catch(() => {
        autoPhotoScannedRecordsRef.current = new Set();
      })
      .finally(() => setAutoMediaScannedReady(true));
  }, []);
  useEffect(() => {
    if (!matchMediaReferencesReady || !selectedHistoryRecordId) return;

    const recordId = selectedHistoryRecordId;
    const references = matchMediaReferences[recordId] ?? [];
    const selectedRecord = attendanceHistory.find(
      (record) => record.id === recordId,
    );
    const selectedHomeClub = selectedRecord
      ? selectedRecord.homeAway === "away"
        ? selectedRecord.opponent
        : selectedRecord.club
      : null;
    const selectedGround = selectedRecord
      ? (selectedRecord.ground
          ? footballGroundForName(selectedRecord.ground)
          : undefined) ??
        (selectedHomeClub ? findGroundForClub(selectedHomeClub) : undefined)
      : undefined;
    const signature = references
      .map((reference) => `${reference.assetId}:${reference.type}:${reference.localUri ?? ""}`)
      .join("|");

    if (resolvedMatchMediaSignatureRef.current[recordId] === signature) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      references.map(async (reference): Promise<
        (MatchMediaReference & { uri: string }) | null
      > => {
        try {
          let durableUri = reference.localUri;

          if (durableUri) {
            const local = await FileSystem.getInfoAsync(durableUri);
            if (!local.exists || !local.size) durableUri = undefined;
          }

          let photosUri: string | undefined;

          if (!reference.assetId.startsWith("selected-")) {
            // Classification uses the fast persistent GPS cache, while
            // Match Memory display asks Photos for the full usable asset URI.
            const metadataInfo = await cachedMatchAssetInfo(reference.assetId);

            // V4.0.86 — React Native Image cannot render Apple's ph://
            // identifiers directly. Resolve History photos to a real local
            // file URI before exposing them to the Match Memory UI.
            const previewUri =
              reference.previewUri &&
              !reference.previewUri.startsWith("ph://")
                ? reference.previewUri
                : undefined;

            const needsResolvedPhoto =
              reference.type === "photo" && !durableUri && !previewUri;

            let displayInfo: MediaLibrary.AssetInfo | null = null;

            if (needsResolvedPhoto) {
              const thumbnailUri = await NativeModules.HistoryPhotoThumbnailModule
                ?.thumbnail(reference.assetId, 900, 900)
                .catch(() => null);

              if (thumbnailUri && !cancelled) {
                setResolvedMatchMedia((current) => {
                  const existing = current[recordId] ?? [];
                  if (
                    existing.some(
                      (item) => item.assetId === reference.assetId,
                    )
                  ) {
                    return current;
                  }

                  return {
                    ...current,
                    [recordId]: [
                      ...existing,
                      {
                        ...reference,
                        uri: thumbnailUri,
                      },
                    ],
                  };
                });
              }

              const inFlight =
                historyPhotoResolutionPromisesRef.current.get(
                  reference.assetId,
                );

              if (inFlight) {
                displayInfo = await inFlight;
              } else {
                const request = MediaLibrary.getAssetInfoAsync(
                  reference.assetId,
                  {
                    // The selected History photo may need its iCloud original,
                    // but concurrent renders must share the same expensive
                    // Photos request instead of downloading it repeatedly.
                    shouldDownloadFromNetwork: true,
                  },
                ).catch(() => null);

                historyPhotoResolutionPromisesRef.current.set(
                  reference.assetId,
                  request,
                );

                try {
                  displayInfo = await request;
                } finally {
                  if (
                    historyPhotoResolutionPromisesRef.current.get(
                      reference.assetId,
                    ) === request
                  ) {
                    historyPhotoResolutionPromisesRef.current.delete(
                      reference.assetId,
                    );
                  }
                }
              }
            }

            const resolvedPhotosUri =
              displayInfo?.localUri ??
              (displayInfo?.uri && !displayInfo.uri.startsWith("ph://")
                ? displayInfo.uri
                : undefined);

            photosUri =
              durableUri ??
              previewUri ??
              resolvedPhotosUri;
            // V4.0.89 — once History has successfully resolved a photo,
            // keep an app-owned copy so a cold restart can display it without
            // asking Photos/iCloud for the same image again.
            if (
              reference.type === "photo" &&
              !durableUri &&
              resolvedPhotosUri
            ) {
              try {
                const memoryDirectory =
                  `${FileSystem.documentDirectory}match-memories/`;
                await FileSystem.makeDirectoryAsync(memoryDirectory, {
                  intermediates: true,
                });

                const safeAssetId = reference.assetId.replace(
                  /[^a-zA-Z0-9._-]/g,
                  "_",
                );
                const extension =
                  reference.fileName?.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".jpg";
                const destination =
                  `${memoryDirectory}history-${safeAssetId}${extension}`;

                const existingCopy =
                  await FileSystem.getInfoAsync(destination).catch(() => null);

                if (!existingCopy?.exists || !existingCopy.size) {
                  await FileSystem.copyAsync({
                    from: resolvedPhotosUri,
                    to: destination,
                  });
                }

                durableUri = destination;

                addMatchMediaReferences(recordId, [
                  { ...reference, localUri: destination },
                ]);
              } catch {
                // Keep using the Photos result for this session if creation
                // of the durable app-owned copy fails.
              }
            }

            const location = metadataInfo?.location ?? displayInfo?.location;
            if (location && selectedGround) {
              const milesFromGround = distanceMiles(
                location.latitude,
                location.longitude,
                selectedGround.latitude,
                selectedGround.longitude,
              );
              const assignment =
                matchdayMediaAssignments[
                  `${recordId}|asset:${reference.assetId}`
                ];
              const belongsToExperience = Boolean(
                assignment &&
                  assignment.placeKind !== "stadium" &&
                  (assignment.source === "manual" ||
                    assignment.venueVisitId ||
                    assignment.placeKind === "pub" ||
                    assignment.placeKind === "restaurant" ||
                    assignment.placeKind === "station" ||
                    assignment.placeKind === "metro"),
              );
              if (milesFromGround > 1 && !belongsToExperience) return null;
            }
          }

          let uri = durableUri;

          // Opening Match Memory stays lightweight. A video keeps its
          // stable Photos identity until the user explicitly taps Play.
          if (reference.type === "video" && !uri) {
            uri =
              reference.previewUri ??
              `ph://${reference.assetId}`;
          }

          // Photos can safely continue using the existing resolution path.
          if (reference.type !== "video" && !uri) {
            uri = photosUri;
          }

          if (!uri) return null;

          const resolvedReference: MatchMediaReference & { uri: string } = {
            ...reference,
            uri,
          };

          if (
            reference.localUri &&
            uri === reference.localUri
          ) {
            resolvedReference.localUri = reference.localUri;
          }

          // Reveal each item as soon as it resolves; Promise.all below is only
          // used to know when the complete batch has finished.
          if (!cancelled) {
            setResolvedMatchMedia((current) => {
              const existing = current[recordId] ?? [];
              const next = [
                ...existing.filter(
                  (item) => item.assetId !== resolvedReference.assetId,
                ),
                resolvedReference,
              ];
              return { ...current, [recordId]: next };
            });
          }

          return resolvedReference;
        } catch {
          return null;
        }
      }),
    ).then((items) => {
      if (cancelled) return;

      const resolved = items.filter(
        (
          item,
        ): item is MatchMediaReference & { uri: string } =>
          item !== null,
      );

      // Never delete a Photos reference merely because iCloud or a shared
      // library did not make its original available on this attempt. A full
      // resolution is cached; a partial one remains eligible for retry.
      if (resolved.length === references.length)
        resolvedMatchMediaSignatureRef.current[recordId] = signature;
      else
        delete resolvedMatchMediaSignatureRef.current[recordId];

      setResolvedMatchMedia((current) => ({
        ...current,
        [recordId]: resolved,
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [
    matchMediaReferences,
    matchMediaReferencesReady,
    matchdayMediaAssignments,
    attendanceHistory,
    selectedHistoryRecordId,
  ]);

  useEffect(() => {
    if (!matchMediaReferencesReady || !selectedHistoryRecordId) return;
    const recordId = selectedHistoryRecordId;
    const incomplete = (matchMediaReferences[recordId] ?? []).filter(
      (reference) =>
        !reference.assetId.startsWith("selected-") &&
        (!Number.isFinite(reference.latitude) ||
          !Number.isFinite(reference.longitude)),
    );
    if (!incomplete.length) return;

    let cancelled = false;
    void (async () => {
      // Repair old/no-location cache entries in small batches. This asks only
      // for Photos metadata and never downloads an iCloud original.
      for (let offset = 0; offset < incomplete.length; offset += 8) {
        const repaired = (
          await Promise.all(
            incomplete.slice(offset, offset + 8).map(async (reference) => {
              const info = await refreshMatchAssetInfo(reference.assetId);
              const location = info?.location;
              if (
                !location ||
                !Number.isFinite(location.latitude) ||
                !Number.isFinite(location.longitude)
              ) return null;
              return {
                ...reference,
                latitude: location.latitude,
                longitude: location.longitude,
              } satisfies MatchMediaReference;
            }),
          )
        ).filter(Boolean) as MatchMediaReference[];
        if (cancelled) return;
        if (repaired.length) addMatchMediaReferences(recordId, repaired);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchMediaReferencesReady, selectedHistoryRecordId]);

  useEffect(() => {
    void AsyncStorage.getItem(PHOTO_FEATURE_KEY).then((raw) => {
      if (raw !== null) setPhotoMemoriesEnabled(raw !== "false");
    });
    void AsyncStorage.getItem(HISTORY_PHOTO_SETUP_KEY).then((raw) => {
      if (!raw) return;
      try { setPhotoWifiOnly(Boolean((JSON.parse(raw) as { wifiOnly?: boolean }).wifiOnly)); } catch {}
    });
  }, []);
  useEffect(() => {
    void AsyncStorage.getItem(SIRI_FEATURE_KEY)
      .then((raw) => setSiriEnabled(raw === "true"))
      .catch(() => setSiriEnabled(false));
  }, []);
  useEffect(() => {
    SiriShortcutsModule?.setEnabled(siriEnabled);
  }, [siriEnabled]);
  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.getItem(SIRI_ASKED_KEY).then((asked) => {
      if (asked === "true") return;
      void AsyncStorage.setItem(SIRI_ASKED_KEY, "true");
      Alert.alert(
        "Use Ticket Frame with Siri?",
        "Siri can find a saved ticket or Match Memory by team or date, open app sections, show game photos, tell you the next verified fixture and start stadium navigation. Ticket images, match photos and NFC details are not shared with Siri.",
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Enable Siri",
            onPress: () => {
              setSiriEnabled(true);
              void AsyncStorage.setItem(SIRI_FEATURE_KEY, "true");
            },
          },
        ],
      );
    });
  }, [storageReady]);
  useEffect(() => {
    void localBackupManifest().then((manifest) =>
      setLocalBackupCreatedAt(manifest?.createdAt ?? null),
    );
    void AsyncStorage.getItem(COMPLETED_TICKETS_SINCE_BACKUP_KEY).then(
      (raw) => {
        const count = Number.parseInt(raw ?? "0", 10);
        if (Number.isFinite(count) && count > 0)
          setCompletedTicketsSinceBackup(count);
      },
    );
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.all([
      Linking.canOpenURL("waze://"),
      Linking.canOpenURL("comgooglemaps://"),
    ]).then(([waze, google]) => {
      if (active) setInstalledNavigationApps({ waze, google, checked: true });
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (
      confirmQueue.length > 0 ||
      photoImportActive ||
      localBackupBusy ||
      !backupReminderPendingRef.current ||
      completedTicketsSinceBackup < BACKUP_REMINDER_TICKET_COUNT
    )
      return;
    backupReminderPendingRef.current = false;
    setCompletedTicketsSinceBackup(0);
    void AsyncStorage.setItem(COMPLETED_TICKETS_SINCE_BACKUP_KEY, "0").catch(
      () => {},
    );
    const timer = setTimeout(
      () =>
        Alert.alert(
          "Back up your completed tickets?",
          `${completedTicketsSinceBackup} tickets have been completed since your last backup. Back up now after finishing their photos, scores and details?`,
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Back Up Now",
              onPress: () => void handleCreateLocalBackup(),
            },
          ],
        ),
      450,
    );
    return () => clearTimeout(timer);
    // handleCreateLocalBackup is a screen-local action; the reminder is
    // intentionally driven only by queue/count/busy state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedTicketsSinceBackup, confirmQueue.length, localBackupBusy, photoImportActive]);
  useEffect(() => {
    if (!storageReady || !matchPhotosReady) return;
    persistMatchPhotos(matchPhotos);
  }, [matchPhotos, matchPhotosReady, storageReady]);
  // V3.9.5 — season ticket profiles + car park passes (own namespaces).
  useEffect(() => {
    if (!storageReady) return;
    void loadSeasonTicketProfiles()
      .then(setSeasonTicketProfiles)
      .catch(() => {})
      .finally(() => setSeasonTicketProfilesReady(true));
    void loadCarParkPasses()
      .then(setCarParkPasses)
      .catch(() => {});
  }, [storageReady]);
  useEffect(() => {
    if (!storageReady || !seasonTicketProfilesReady) return;
    void saveSeasonTicketProfiles(seasonTicketProfiles).catch(() => {});
  }, [seasonTicketProfiles, seasonTicketProfilesReady, storageReady]);

  // This is deliberately independent of the scan entry point. A qualifying
  // home attendance can arrive from manual Auto Add, startup scanning or an
  // earlier app version; History must still ask about season-ticket ownership.
  useEffect(() => {
    if (
      activeTab !== "history" ||
      photoAction ||
      !attendanceHistoryReady ||
      !matchMediaReferencesReady ||
      !seasonTicketProfilesReady
    ) return;
    const groups = new Map<string, AttendanceRecord[]>();
    for (const record of attendanceHistory) {
      if (
        record.homeAway !== "home" ||
        record.ticketId ||
        !record.season ||
        (record.source !== "photo-discovery" &&
          !(matchMediaReferences[record.id]?.length) &&
          !(matchPhotos[record.id]?.length))
      ) continue;
      if (seasonTicketProfiles.some(
        (profile) =>
          clubNamesMatch(profile.club, record.club) &&
          profile.seasonKey === record.season,
      )) continue;
      const key = `${canonicalClubName(record.club)}|${record.season}`;
      groups.set(key, [...(groups.get(key) ?? []), record]);
    }
    const pending = [...groups.entries()].find(
      ([key]) => !promptedDiscoveredSeasonTicketsRef.current.has(key),
    );
    if (!pending) return;
    const [key, records] = pending;
    const club = records[0].club;
    const season = records[0].season;
    const timer = setTimeout(() => {
      // Mark only when the question is genuinely presented. Incoming media
      // can rerun this effect and cancel the delay; marking before the timer
      // caused an entire season's question to be lost permanently.
      if (promptedDiscoveredSeasonTicketsRef.current.has(key)) return;
      promptedDiscoveredSeasonTicketsRef.current.add(key);
      void askSeasonTicketQuestion(club, season, records.length).then((confirmed) => {
        if (!confirmed) return;
        setSeasonTicketProfiles((current) =>
          addSeasonTicketProfile(current, {
            id: newProfileId(),
            club,
            seasonKey: season,
            discoveredFromMedia: true,
            createdAt: nowMs(),
          }).records,
        );
        const ids = new Set(records.map((record) => record.id));
        setAttendanceHistory((current) =>
          current.map((record) =>
            ids.has(record.id)
              ? {
                  ...record,
                  source: "season-ticket",
                  notes: record.notes ?? "Season-ticket attendance confirmed from matchday media.",
                }
              : record,
          ),
        );
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [
    activeTab,
    attendanceHistory,
    attendanceHistoryReady,
    matchMediaReferences,
    matchMediaReferencesReady,
    matchPhotos,
    photoAction,
    seasonTicketProfiles,
    seasonTicketProfilesReady,
  ]);

  // Backfill season cards saved before ticket-level club ownership existed.
  // The separate profile is authoritative; Favourite Club is never consulted.
  useEffect(() => {
    if (!storageReady || !seasonTicketProfilesReady || !seasonTicketProfiles.length)
      return;
    const task = setTimeout(() => setTickets((current) => {
      let changed = false;
      const next = current.map((ticket) => {
        if (ticket.ticketType !== "Season Ticket") return ticket;
        const ticketUri = currentTicketUri(ticket.uri);
        const exact = seasonTicketProfiles.find(
          (profile) =>
            ticketUri &&
            currentTicketUri(profile.imageUri ?? undefined) === ticketUri,
        );
        const sameSeason = seasonTicketProfiles.filter(
          (profile) => profile.seasonKey === ticket.seasonKey,
        );
        const profile = exact ?? (sameSeason.length === 1 ? sameSeason[0] : undefined);
        if (!profile) return ticket;
        const name = [
          "Season Ticket",
          profile.club,
          profile.holderName || profile.seasonKey,
        ].join("\n");
        if (ticket.clubName === profile.club && ticket.name === name) return ticket;
        changed = true;
        return { ...ticket, clubName: profile.club, name };
      });
      return changed ? next : current;
    }), 0);
    return () => clearTimeout(task);
  }, [seasonTicketProfiles, seasonTicketProfilesReady, storageReady]);
  useEffect(() => {
    if (!storageReady) return;
    void saveCarParkPasses(carParkPasses).catch(() => {});
  }, [carParkPasses, storageReady]);

  // With an empty ticket archive, ticket-owned metadata must not survive as
  // hidden seasons or attendance. Manual history is independent and stays.
  useEffect(() => {
    if (!storageReady || tickets.length !== 0) return;
    const inferredProfiles = seasonTicketProfiles.filter(
      (profile) => profile.discoveredFromMedia,
    );
    const hasTicketOwnedHistory = attendanceHistory.some((record) => {
      if (record.source === "ticket") return true;
      if (record.source !== "season-ticket") return false;
      return !inferredProfiles.some(
        (profile) =>
          clubNamesMatch(profile.club, record.club) &&
          profile.seasonKey === record.season,
      );
    });
    if (seasonTicketProfiles.length === inferredProfiles.length && !hasTicketOwnedHistory) return;
    const task = setTimeout(() => {
      if (seasonTicketProfiles.length !== inferredProfiles.length)
        setSeasonTicketProfiles(inferredProfiles);
      if (hasTicketOwnedHistory)
        setAttendanceHistory((current) =>
          current.filter(
            (record) =>
              record.source !== "ticket" &&
              (record.source !== "season-ticket" ||
                inferredProfiles.some(
                  (profile) =>
                    clubNamesMatch(profile.club, record.club) &&
                    profile.seasonKey === record.season,
                )),
          ),
        );
    }, 0);
    return () => clearTimeout(task);
  }, [
    storageReady,
    tickets.length,
    seasonTicketProfiles,
    attendanceHistory,
  ]);

  // V3.7 — fire the "first memory framed" celebration once the first real
  // ticket has been saved and its recognition pass has settled.
  useEffect(() => {
    if (!celebrateArmedRef.current || celebratedRef.current) return;
    if (!recognitionDoneRef.current) return;
    if (confirmQueue.length > 0 || tickets.length === 0) return;
    const candidate =
      tickets.find(
        (item) => item.id === celebrationCandidateIdRef.current,
      ) ?? tickets[tickets.length - 1];
    if (!candidate) return;
    celebratedRef.current = true;
    setCelebrationTicket(candidate);
  }, [confirmQueue.length, tickets]);

  // V3.7.1 — Demo Mode entries. Demo Mode is fully isolated: it renders
  // sample data only and cannot mutate the collection, statistics,
  // ground visits or storage.
  function handleOnboardingComplete(
    club: OnboardingClub,
    options: { openScanner: boolean },
  ) {
    const theme = CLUB_THEME[club.name];
    setFavouriteClub({
      ...club,
      primary: theme?.[0] ?? club.primary,
      secondary: theme?.[1] ?? club.secondary,
    });
    setShowOnboarding(false);
    setResumeOnboardingAtClub(false);
    void AsyncStorage.setItem(ONBOARDING_KEY, "true").catch(() => {});
    if (tickets.length === 0) {
      celebrateArmedRef.current = true;
      if (options.openScanner) {
        setTimeout(() => importTicket(), 400);
      }
    }
  }

  function handleReplayIntroduction() {
    setShowSeasonManager(false);
    setCelebrationTicket(null);
    setShowOnboarding(true);
  }

  // V3.7.1 — Demo Mode entries. Demo Mode is fully isolated: it renders
  // sample data only and cannot mutate the collection, statistics,
  // ground visits or storage.
  function openDemoModeFromOnboarding() {
    setDemoLaunchedFromOnboarding(true);
    setShowDemoMode(true);
  }

  function openDemoModeFromMain() {
    setDemoLaunchedFromOnboarding(false);
    setActiveTab("frames");
    setShowSeasonManager(false);
    setShowDemoMode(true);
  }

  function handleDemoExit() {
    // Return to wherever the user came from — nothing persisted.
    setShowDemoMode(false);
    setDemoLaunchedFromOnboarding(false);
  }

  function handleDemoAddFirstTicket() {
    const fromOnboarding = demoLaunchedFromOnboarding;
    setShowDemoMode(false);
    setDemoLaunchedFromOnboarding(false);
    if (fromOnboarding) {
      // Hand back to the introduction, opening on the club picker.
      setResumeOnboardingAtClub(true);
      setShowOnboarding(true);
    } else {
      importTicket();
    }
  }

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.setItem(
      GROUND_VISITS_KEY,
      JSON.stringify(groundVisits),
    ).catch(() => {});
  }, [groundVisits, storageReady]);
  useEffect(() => {
    if (!storageReady || !policyAgreementReady || !policyAgreed || !favouriteClub.name) return;
    if (favouriteClub.id === PLACEHOLDER_CLUB_ID) return;
    let cancelled = false;
    const current = seasonForDate(new Date()) ?? activeSeason;
    const start = Number(current.slice(0, 4));
    const fiveSeasons = Array.from({ length: 5 }, (_, index) => {
      const year = start - index;
      return `${year}/${String(year + 1).slice(-2)}`;
    });
    void (async () => {
      // Highest priority: the favourite club's five-season fixture/result
      // library. Every recognition and picker reads these snapshots first.
      for (const season of fiveSeasons) {
        if (cancelled) return;
        const cached = await loadCachedFixtures(favouriteClub.name, season);
        if (!cached.length)
          await fetchAndCacheFixtures(favouriteClub.name, season, {
            league: favouriteClub.league,
          });
      }
      if (cancelled) return;
      // Lower priority: make a future club change fast. Current-season rows
      // are warmed first, then older seasons, one small request at a time so
      // this never competes with ticket recognition or the visible UI.
      const others = clubs.filter(
        (club) =>
          club.id !== PLACEHOLDER_CLUB_ID &&
          normaliseFixtureText(club.name) !==
            normaliseFixtureText(favouriteClub.name),
      );
      const queue = [
        ...others.map((club) => ({ club, season: fiveSeasons[0] })),
        ...fiveSeasons.slice(1).flatMap((season) =>
          others.map((club) => ({ club, season })),
        ),
      ];
      for (const job of queue) {
        if (cancelled) return;
        const cached = await loadCachedFixtures(job.club.name, job.season);
        if (!cached.length)
          await fetchAndCacheFixtures(job.club.name, job.season, {
            league: job.club.league,
          }).catch(() => []);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    activeSeason,
    clubs,
    favouriteClub.id,
    favouriteClub.league,
    favouriteClub.name,
    policyAgreed,
    policyAgreementReady,
    storageReady,
  ]);

  useEffect(() => {
    if (!storageReady) return;
    const payload = JSON.stringify({
      tickets,
      frameStyle,
      favouriteClub,
      activeSeason,
    });
    // AsyncStorage writes can finish out of order during recognition. Keep
    // them strictly serial so an older pre-confirmation snapshot can never
    // overwrite the accepted fixture after the app closes.
    savedFrameWriteChainRef.current = savedFrameWriteChainRef.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(SAVED_FRAME_KEY, payload));
  }, [activeSeason, favouriteClub, frameStyle, storageReady, tickets]);
  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.setItem(TICKET_STYLE_KEY, ticketStyle).catch(() => {});
  }, [storageReady, ticketStyle]);
  async function locateForGrounds() {
    if (groundsLoading) return;
    setGroundsLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Location needed",
          "Allow location access to sort grounds by distance.",
        );
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setGpsAccuracy(current.coords.accuracy ?? null);
      setUserCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch {
      Alert.alert("Grounds unavailable", "Could not find your location.");
    } finally {
      setGroundsLoading(false);
    }
  }

  function toggleGroundVisit(groundId: string) {
    setGroundVisits((current) => {
      const next = { ...current };
      if (next[groundId]) delete next[groundId];
      else next[groundId] = 1;
      return next;
    });
  }

  function importTicket() {
    Alert.alert(
      "Add a Ticket",
      "iOS doesn't let apps read Apple Wallet directly, so:\n\n1. Open the expired ticket in Wallet\n2. Take a screenshot of it\n3. Choose an option below and select the screenshots\n\nEach photo is cropped by you, then recognised — you confirm the match before it's saved.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Files",
          onPress: () =>
            setTimeout(() => void chooseTicket(), 350),
        },
        {
          text: "Add Photo",
          onPress: () =>
            setTimeout(() => void choosePhoto(), 350),
        },
      ],
    );
  }

  function askSeasonTicketQuestion(
    club: string,
    season: string,
    matchCount: number,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Season ticket detected?",
        `We found photos or videos showing that you attended ${matchCount} ${club} home ${matchCount === 1 ? "match" : "matches"} in the ${season} season. Did you have a season ticket for this season?`,
        [
          { text: "No", style: "cancel", onPress: () => resolve(false) },
          { text: "Yes", onPress: () => resolve(true) },
        ],
        { cancelable: false },
      );
    });
  }

  function runHistoryAutoAdd() {
    if (photoAction === "auto") return;

    Alert.alert(
      "Auto Add",
      "Add New keeps previously deleted matches hidden. Add All restores deleted matches and also finds new fixtures and qualifying GPS photos/videos.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add New",
          onPress: () => void runHistoryAutoAddMode("new"),
        },
        {
          text: "Add All",
          onPress: () => void runHistoryAutoAddMode("all"),
        },
      ],
    );
  }

  async function runHistoryAutoAddMode(mode: "new" | "all") {
    if (photoAction === "auto") return;

    // Foreground discovery owns the single Photos lane. Let the resumable
    // background page finish/pause before the legacy Auto Add workflow starts.
    await stopMediaIndex();

    if (mode === "all") {
      setDeletedHistoryMatchKeys(new Set());
      await AsyncStorage.setItem(
        DELETED_HISTORY_MATCHES_KEY,
        "[]",
      ).catch(() => {});
    }

    const suppressedKeys =
      mode === "all"
        ? new Set<string>()
        : new Set(deletedHistoryMatchKeys);

    setPhotoAction("auto");
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photos permission needed",
          "Allow full Photos access so Auto Add can read match dates and GPS.",
        );
        return;
      }
      const limitedPhotoAccess = permission.accessPrivileges === "limited";

      // Foreground Auto Add owns the Photos lane.
      //
      // Do not make this user-requested action wait for the resumable general
      // media index. Auto Add performs its own targeted date/GPS discovery
      // below and persists every trusted association it finds.
      //
      // Invisible indexing remains stopped while Auto Add is active so it
      // cannot compete with the user's foreground action.
      const clubName = ticketCollectionClubName ?? favouriteClub.name;
      const fixtures = getAllBundledClubFixtures(clubName).filter(
        (fixture) => Boolean(fixture.date),
      );
      const fixturesByDate = new Map<string, FixtureRow[]>();
      for (const fixture of fixtures) {
        const date = fixture.date!;
        fixturesByDate.set(date, [...(fixturesByDate.get(date) ?? []), fixture]);
      }

      const mediaByFixture = new Map<string, MediaLibrary.Asset[]>();
      const assetsByDate = new Map<string, MediaLibrary.Asset[]>();

      // Auto Add must not discard a historical photo merely because the
      // currently hydrated/bundled fixture cache is missing that exact date.
      //
      // Restrict the repair path to seasons already represented by confirmed
      // History. This lets GPS repair incomplete historical fixture coverage
      // without turning every Auto Add into an unrestricted whole-library
      // metadata scan.
      const confirmedHistorySeasonStarts = new Set(
        attendanceHistory
          .filter((record) => record.confirmed)
          .map((record) => {
            const season = String(record.season ?? "").trim();
            const match = season.match(/^(\d{4})[-/]/);
            return match ? Number(match[1]) : NaN;
          })
          .filter((year) => Number.isFinite(year)),
      );

      const dateFallsInConfirmedHistorySeason = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // English football season: Jul-Dec belongs to this calendar year's
        // season start; Jan-Jun belongs to the previous calendar year's start.
        const seasonStart = month >= 7 ? year : year - 1;
        return confirmedHistorySeasonStarts.has(seasonStart);
      };
      const refreshedAssetInfoById = new Map<
        string,
        MediaLibrary.AssetInfo
      >();
      const albums = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });
      const albumIds: Array<string | undefined> = [
        undefined,
        ...albums.map((album) => album.id),
      ];
      const inspectedAssetIds = new Set<string>();
      const scanStatsBySeason = new Map<
        string,
        { dateAssets: number; gpsAssets: number; stadiumMatches: number }
      >();
      const incrementSeasonStat = (
        season: string,
        field: "dateAssets" | "gpsAssets" | "stadiumMatches",
      ) => {
        const stats = scanStatsBySeason.get(season) ?? {
          dateAssets: 0,
          gpsAssets: 0,
          stadiumMatches: 0,
        };
        stats[field] += 1;
        scanStatsBySeason.set(season, stats);
      };
      // Pre-2000 media with no exact dated TFD fixture is never allowed to
      // auto-confirm attendance. Keep its GPS evidence for explicit review.
      const historicalGpsEvidenceByDate = new Map<
        string,
        Array<{
          asset: MediaLibrary.Asset;
          latitude: number;
          longitude: number;
        }>
      >();

      for (const albumId of albumIds) {
        let after: string | undefined;
        do {
          const page = await MediaLibrary.getAssetsAsync({
            mediaType: [
              MediaLibrary.MediaType.photo,
              MediaLibrary.MediaType.video,
            ],
            first: 250,
            after,
            sortBy: [MediaLibrary.SortBy.creationTime],
            ...(albumId ? { album: albumId } : {}),
          });
          const possible = page.assets.filter((asset) => {
            if (inspectedAssetIds.has(asset.id)) return false;
            inspectedAssetIds.add(asset.id);
            const taken = new Date(asset.creationTime);
            const date = `${taken.getFullYear()}-${String(taken.getMonth() + 1).padStart(2, "0")}-${String(taken.getDate()).padStart(2, "0")}`;

            // Exact dated fixtures remain the fastest path. Also inspect media
            // from seasons already represented in confirmed History so GPS can
            // repair a missing/incomplete fixture cache. Pre-2000 retains its
            // explicit-confirmation fallback and is never silently accepted.
            return (
              fixturesByDate.has(date) ||
              dateFallsInConfirmedHistorySeason(taken) ||
              taken.getFullYear() < 2000
            );
          });
          for (const asset of possible) {
            const taken = new Date(asset.creationTime);
            const date = `${taken.getFullYear()}-${String(taken.getMonth() + 1).padStart(2, "0")}-${String(taken.getDate()).padStart(2, "0")}`;
            assetsByDate.set(date, [...(assetsByDate.get(date) ?? []), asset]);
            const seasons = new Set(
              (fixturesByDate.get(date) ?? []).map((fixture) =>
                canonicalSeason(fixture.date),
              ),
            );
            for (const season of seasons)
              if (season) incrementSeasonStat(season, "dateAssets");
          }
          for (let offset = 0; offset < possible.length; offset += 20) {
            const inspected = await Promise.all(
              possible.slice(offset, offset + 20).map(async (asset) => ({
                asset,
                // Auto Add is an explicit repair pass. Do not trust an older
                // cached no-location result: re-read lightweight Photos
                // metadata without downloading the iCloud original.
                info: await refreshMatchAssetInfo(asset),
              })),
            );
            for (const { asset, info } of inspected) {
              if (!info?.location) continue;
              refreshedAssetInfoById.set(asset.id, info);
              const taken = new Date(asset.creationTime);
              const date = `${taken.getFullYear()}-${String(taken.getMonth() + 1).padStart(2, "0")}-${String(taken.getDate()).padStart(2, "0")}`;

              if (
                taken.getFullYear() < 2000 &&
                !(fixturesByDate.get(date) ?? []).length
              ) {
                historicalGpsEvidenceByDate.set(date, [
                  ...(historicalGpsEvidenceByDate.get(date) ?? []),
                  {
                    asset,
                    latitude: info.location.latitude,
                    longitude: info.location.longitude,
                  },
                ]);

                // Explicit review only. Never auto-create attendance here.
                continue;
              }

              // V4.0.86 — demand-resolve a missing historical fixture only
              // for this GPS-backed photo date. Do not broaden foreground
              // History or scan historical seasons generally.
              //
              // This fixes post-2000 photos whose exact date is absent from
              // the normal bundled club fixture map. The season store is
              // queried once on demand and the resolved rows are then added
              // to this Auto Add run's date cache.
              let dateFixtures = fixturesByDate.get(date) ?? [];

              if (!dateFixtures.length && taken.getFullYear() >= 2000) {
                const season = canonicalSeason(date);
                const seasonStart = Number(season.match(/^(\d{4})/)?.[1]);

                if (season && Number.isFinite(seasonStart)) {
                  try {
                    const apiSeason = `${seasonStart}-${seasonStart + 1}`;
                    const historicalRows =
                      seasonStart < 2007
                        ? await getHistoricalSeasonFixtures(apiSeason)
                        : getBundledCompetitionNamesForSeason(apiSeason).flatMap(
                            (competition) =>
                              getBundledCompetitionFixtures(
                                competition,
                                apiSeason,
                              ),
                          );

                    dateFixtures = historicalRows.filter(
                      (fixture) =>
                        fixture.date === date &&
                        (
                          clubNamesMatch(fixture.homeName, clubName) ||
                          clubNamesMatch(fixture.awayName, clubName)
                        ),
                    );

                    if (dateFixtures.length) {
                      fixturesByDate.set(date, dateFixtures);
                    }
                  } catch {
                    // Missing historical data is unknown, never guessed.
                    dateFixtures = [];
                  }
                }
              }

              const seasons = new Set(
                dateFixtures.map((fixture) =>
                  canonicalSeason(fixture.date),
                ),
              );
              for (const season of seasons)
                if (season) incrementSeasonStat(season, "gpsAssets");

              const candidates = dateFixtures
                .map((fixture) => {
                  const ground =
                    (fixture.venue
                      ? footballGroundForName(fixture.venue)
                      : undefined) ?? findGroundForClub(fixture.homeName);
                  return ground
                    ? {
                        fixture,
                        ground,
                        miles: distanceMiles(
                          info.location!.latitude,
                          info.location!.longitude,
                          ground.latitude,
                          ground.longitude,
                        ),
                      }
                    : null;
                })
                .filter(
                  (candidate): candidate is NonNullable<typeof candidate> =>
                    // Keep manual Auto Add consistent with the automatic
                    // matcher: allow normal phone-GPS drift around grounds,
                    // approaches and stadium parking.
                    Boolean(candidate && candidate.miles <= 1),
                )
                .sort((a, b) => a.miles - b.miles);
              if (!candidates.length) continue;
              const fixture = candidates[0].fixture;
              incrementSeasonStat(
                canonicalSeason(fixture.date),
                "stadiumMatches",
              );
              mediaByFixture.set(fixture.id, [
                ...(mediaByFixture.get(fixture.id) ?? []),
                asset,
              ]);
            }
          }
          after = page.hasNextPage ? page.endCursor : undefined;
        } while (after);
      }

      // Once a fixture has a trusted stadium-GPS anchor, include the rest of
      // that matchday's geotagged media plus locationless videos from the same
      // stadium burst. This is what makes shared/iCloud albums useful rather
      // than saving only the single anchor photo.
      for (const [fixtureId] of mediaByFixture) {
        const fixture = fixtures.find((row) => row.id === fixtureId);
        if (!fixture?.date) continue;
        const ground =
          (fixture.venue ? footballGroundForName(fixture.venue) : undefined) ??
          findGroundForClub(fixture.homeName);
        if (!ground) continue;
        const expanded = await matchGeotaggedMatchdayMedia(
          assetsByDate.get(fixture.date) ?? [],
          ground,
        );
        const byId = new Map(
          (mediaByFixture.get(fixtureId) ?? []).map((asset) => [asset.id, asset]),
        );
        for (const reference of expanded) {
          const asset = (assetsByDate.get(fixture.date) ?? []).find(
            (item) => item.id === reference.assetId,
          );
          if (asset) byId.set(asset.id, asset);
        }
        mediaByFixture.set(fixtureId, [...byId.values()]);
      }

      const existing = mergeHistoryRecords(
        attendanceHistory,
        deriveAttendancesFromTickets(tickets, clubName),
      );
      const additions: AttendanceRecord[] = [];
      let alreadyAdded = 0;
      let addedMediaCount = 0;
      let historicalGpsConfirmed = 0;

      const historicalAttendancePatches = new Map<
        string,
        Pick<AttendanceRecord, "fixtureId" | "dateProvenance">
      >();

      const askHistoricalGpsFixture = (
        date: string,
        candidates: Array<{
          fixture: CachedFixture;
          ground: NonNullable<ReturnType<typeof findGroundForClub>>;
          miles: number;
        }>,
      ): Promise<
        | {
            fixture: CachedFixture;
            ground: NonNullable<ReturnType<typeof findGroundForClub>>;
            miles: number;
          }
        | null
      > =>
        new Promise((resolve) => {
          let index = 0;

          const showCandidate = () => {
            const candidate = candidates[index];
            const fixture = candidate.fixture;

            const homeTeam =
              fixture.homeAway === "home"
                ? clubName
                : fixture.opponent;

            const awayTeam =
              fixture.homeAway === "home"
                ? fixture.opponent
                : clubName;

            const score =
              fixture.homeScore != null &&
              fixture.awayScore != null
                ? ` · ${fixture.homeScore}-${fixture.awayScore}`
                : "";

            const buttons = [
              {
                text: "Dismiss",
                style: "cancel" as const,
                onPress: () => resolve(null),
              },
              ...(candidates.length > 1
                ? [
                    {
                      text: "Another Match",
                      onPress: () => {
                        index = (index + 1) % candidates.length;
                        showCandidate();
                      },
                    },
                  ]
                : []),
              {
                text: "Accept",
                onPress: () => resolve(candidate),
              },
            ];

            Alert.alert(
              "Possible historical match",
              `Photo date: ${date}
GPS: ${candidate.miles.toFixed(1)} miles from ${candidate.ground.stadium}

${homeTeam} v ${awayTeam}${score}
${fixture.competition || "Competition unknown"} · ${fixture.season}

Accept only if these photos are from this match. Choose Another Match for another possible fixture, or Dismiss if you were at this ground for another reason.`,
              buttons,
              { cancelable: false },
            );
          };

          showCandidate();
        });

      for (const [fixtureId, assets] of mediaByFixture) {
        const fixture = fixtures.find((row) => row.id === fixtureId);
        if (!fixture?.date) continue;
        const isHome = clubNamesMatch(fixture.homeName, clubName);
        const opponent = isHome ? fixture.awayName : fixture.homeName;
        const ground =
          fixture.venue || findGroundForClub(fixture.homeName)?.stadium || null;
        const clubScore = isHome ? fixture.homeScore : fixture.awayScore;
        const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;
        const record: AttendanceRecord = {
          id: `att-photo-${fixture.id}`,
          club: clubName,
          opponent,
          matchDate: fixture.date,
          season: canonicalSeason(fixture.date),
          competition: fixture.competition,
          ground,
          homeAway: isHome ? "home" : "away",
          result:
            clubScore == null || opponentScore == null
              ? null
              : clubScore > opponentScore
                ? "win"
                : clubScore < opponentScore
                  ? "loss"
                  : "draw",
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
          source: "photo-discovery",
          confirmed: true,
          createdAt: Date.now(),
        };
        const suppressionKey = attendanceSuppressionKey(record);
        if (suppressionKey && suppressedKeys.has(suppressionKey)) continue;

        const matched = findMatchingAttendance([...existing, ...additions], record);
        const recordId = matched?.id ?? record.id;
        if (matched) alreadyAdded += 1;
        else additions.push(record);
        const references: MatchMediaReference[] = assets.map((asset) => {
          const info = refreshedAssetInfoById.get(asset.id);
          return {
            source: "automatic",
            assetId: asset.id,
            type:
              asset.mediaType === MediaLibrary.MediaType.video
                ? "video"
                : "photo",
            width: asset.width,
            height: asset.height,
            fileName: asset.filename ?? null,
            creationTime: asset.creationTime,
            previewUri: asset.uri,
            latitude: info?.location?.latitude,
            longitude: info?.location?.longitude,
          };
        });
        const existingAssetIds = new Set(
          (matchMediaReferencesRef.current[recordId] ?? []).map(
            (reference) => reference.assetId,
          ),
        );
        addedMediaCount += references.filter(
          (reference) => !existingAssetIds.has(reference.assetId),
        ).length;
        await persistMediaReferencesRef.current(recordId, references);
      }

      // Pre-2000 fallback. The photo's own date tells us the season; its GPS
      // narrows the date-unknown TFD fixtures by ground. Nothing is accepted
      // until the user explicitly confirms the proposed match.
      for (const [evidenceDate, evidence] of historicalGpsEvidenceByDate) {
        const season = canonicalSeason(evidenceDate);
        const seasonStart = Number(season.match(/^(\d{4})/)?.[1]);

        if (
          !season ||
          !Number.isFinite(seasonStart) ||
          seasonStart >= 2000
        ) {
          continue;
        }

        let historicalSuggestions: CachedFixture[] = [];

        try {
          historicalSuggestions =
            await loadManualHistoryFixtureSuggestions(
              clubName,
              season,
            );
        } catch {
          continue;
        }

        const candidates = historicalSuggestions
          .filter(
            (fixture) =>
              Boolean(fixture.fixtureId) &&
              !fixture.date &&
              fixture.dateStatus === "unknown" &&
              fixture.played !== false &&
              fixture.attendanceEligible !== false,
          )
          .map((fixture) => {
            const homeClub =
              fixture.homeAway === "home"
                ? clubName
                : fixture.opponent;

            const ground =
              (fixture.venue
                ? footballGroundForName(fixture.venue)
                : undefined) ??
              findGroundForClub(homeClub);

            if (!ground) return null;

            const miles = Math.min(
              ...evidence.map((item) =>
                distanceMiles(
                  item.latitude,
                  item.longitude,
                  ground.latitude,
                  ground.longitude,
                ),
              ),
            );

            return {
              fixture,
              ground,
              miles,
            };
          })
          .filter(
            (
              candidate,
            ): candidate is {
              fixture: CachedFixture;
              ground: NonNullable<
                ReturnType<typeof findGroundForClub>
              >;
              miles: number;
            } => Boolean(candidate && candidate.miles <= 1),
          )
          .sort(
            (a, b) =>
              a.miles - b.miles ||
              a.fixture.opponent.localeCompare(
                b.fixture.opponent,
              ),
          );

        if (!candidates.length) continue;

        const accepted = await askHistoricalGpsFixture(
          evidenceDate,
          candidates,
        );

        if (!accepted?.fixture.fixtureId) continue;

        try {
          await saveManualHistoryFixtureDateResolution(
            accepted.fixture.fixtureId,
            evidenceDate,
            "user-confirmed-photo-gps",
          );
        } catch {
          Alert.alert(
            "Historical date not saved",
            "Ticket Frame did not add this match because the confirmed date could not be saved.",
          );
          continue;
        }

        const fixture = accepted.fixture;

        const clubScore =
          fixture.homeAway === "home"
            ? fixture.homeScore
            : fixture.awayScore;

        const opponentScore =
          fixture.homeAway === "home"
            ? fixture.awayScore
            : fixture.homeScore;

        const record: AttendanceRecord = {
          id: `att-photo-${fixture.fixtureId}`,
          club: clubName,
          opponent: fixture.opponent,
          matchDate: evidenceDate,
          season,
          competition: fixture.competition || null,
          ground:
            accepted.ground.stadium ||
            fixture.venue ||
            null,
          homeAway: fixture.homeAway,
          result:
            clubScore == null || opponentScore == null
              ? null
              : clubScore > opponentScore
                ? "win"
                : clubScore < opponentScore
                  ? "loss"
                  : "draw",
          homeScore: fixture.homeScore ?? null,
          awayScore: fixture.awayScore ?? null,
          source: "photo-discovery",
          confirmed: true,
          fixtureId: fixture.fixtureId,
          dateProvenance: "user-confirmed-photo-gps",
          notes:
            "Historical match explicitly confirmed from photo date and stadium GPS.",
          createdAt: Date.now(),
        };

        const suppressionKey =
          attendanceSuppressionKey(record);

        if (
          suppressionKey &&
          suppressedKeys.has(suppressionKey)
        ) {
          continue;
        }

        const matched = findMatchingAttendance(
          [...existing, ...additions],
          record,
        );

        const recordId = matched?.id ?? record.id;

        if (matched) {
          historicalAttendancePatches.set(recordId, {
            fixtureId: fixture.fixtureId,
            dateProvenance:
              "user-confirmed-photo-gps",
          });
          alreadyAdded += 1;
        } else {
          additions.push(record);
        }

        // Only attach media actually close to the accepted ground.
        const acceptedEvidence = evidence.filter(
          (item) =>
            distanceMiles(
              item.latitude,
              item.longitude,
              accepted.ground.latitude,
              accepted.ground.longitude,
            ) <= 1,
        );

        const references: MatchMediaReference[] =
          acceptedEvidence.map(
            ({ asset, latitude, longitude }) => ({
              source: "automatic",
              assetId: asset.id,
              type:
                asset.mediaType ===
                MediaLibrary.MediaType.video
                  ? "video"
                  : "photo",
              width: asset.width,
              height: asset.height,
              fileName: asset.filename ?? null,
              creationTime: asset.creationTime,
              previewUri: asset.uri,
              latitude,
              longitude,
            }),
          );

        await persistMediaReferencesRef.current(
          recordId,
          references,
        );

        historicalGpsConfirmed += 1;
      }

      if (
        additions.length ||
        historicalAttendancePatches.size
      ) {
        setAttendanceHistory((current) => {
          let next = current.map((record) => {
            const patch =
              historicalAttendancePatches.get(record.id);

            return patch
              ? { ...record, ...patch }
              : record;
          });

          for (const record of additions) {
            if (!findMatchingAttendance(next, record)) {
              next = [...next, record];
            }
          }

          return next;
        });
      }

      // A cluster of confirmed home attendances can indicate a season ticket
      // even when the physical card is absent. Ask once per club/season and
      // never infer ownership without the user's confirmation.
      const mediaConfirmedRecords: AttendanceRecord[] = [...additions];
      for (const record of existing) {
        if (
          record.homeAway === "home" &&
          !record.ticketId &&
          (record.source === "photo-discovery" ||
            (matchMediaReferencesRef.current[record.id] ?? []).length > 0) &&
          !mediaConfirmedRecords.some((item) => item.id === record.id)
        ) mediaConfirmedRecords.push(record);
      }
      for (const [fixtureId] of mediaByFixture) {
        const fixture = fixtures.find((row) => row.id === fixtureId);
        if (!fixture?.date || !clubNamesMatch(fixture.homeName, clubName)) continue;
        const candidate = existing.find(
          (record) =>
            record.homeAway === "home" &&
            !record.ticketId &&
            record.matchDate === fixture.date &&
            clubNamesMatch(record.club, clubName) &&
            clubNamesMatch(record.opponent, fixture.awayName),
        );
        if (candidate && !mediaConfirmedRecords.some((record) => record.id === candidate.id))
          mediaConfirmedRecords.push(candidate);
      }
      const homeBySeason = new Map<string, AttendanceRecord[]>();
      for (const record of mediaConfirmedRecords.filter(
        (item) => item.homeAway === "home" && !item.ticketId,
      )) {
        homeBySeason.set(record.season, [
          ...(homeBySeason.get(record.season) ?? []),
          record,
        ]);
      }
      for (const [season, records] of homeBySeason) {
        if (!season || seasonTicketProfiles.some(
          (profile) =>
            clubNamesMatch(profile.club, clubName) &&
            profile.seasonKey === season,
        )) continue;
        const confirmed = await askSeasonTicketQuestion(
          clubName,
          season,
          records.length,
        );
        if (!confirmed) continue;
        const profile: SeasonTicketProfile = {
          id: newProfileId(),
          club: clubName,
          seasonKey: season,
          discoveredFromMedia: true,
          createdAt: nowMs(),
        };
        setSeasonTicketProfiles((current) =>
          addSeasonTicketProfile(current, profile).records,
        );
        const discoveredIds = new Set(records.map((record) => record.id));
        setAttendanceHistory((current) =>
          current.map((record) =>
            discoveredIds.has(record.id)
              ? {
                  ...record,
                  source: "season-ticket",
                  notes: record.notes ?? "Season-ticket attendance confirmed from matchday media.",
                }
              : record,
          ),
        );
      }
      Alert.alert(
        "Auto Add finished",
        `${addedMediaCount} ${addedMediaCount === 1 ? "photo or video was" : "photos and videos were"} added.${additions.length ? ` ${additions.length} new ${additions.length === 1 ? "match was" : "matches were"} added to History.` : " No new matches were needed."}${alreadyAdded ? ` ${alreadyAdded} existing ${alreadyAdded === 1 ? "match was" : "matches were"} updated or left unchanged.` : ""}${limitedPhotoAccess ? " iOS currently allows access to Selected Photos only." : ""}\n\nSeason scan:\n${[...scanStatsBySeason.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([season, stats]) => `${season}: ${stats.dateAssets} on fixture dates · ${stats.gpsAssets} with GPS · ${stats.stadiumMatches} at stadiums`).join("\n") || "No fixture-date media was visible to Ticket Frame."}`,
      );
      setAutoDiscoveryCompleted(true);

      // V4.0.86 — foreground user actions always win.
      // Do not immediately start the heavy historical SQLite primer after
      // Auto Add. Manual Add / History must remain responsive once Auto Add
      // finishes. Historical seasons are loaded on demand instead.
    } catch (error) {
      console.warn("[history-auto-add] failed", error);
      Alert.alert(
        "Auto Add could not finish",
        "No History records were removed. Please try again with Photos access enabled.",
      );
    } finally {
      setPhotoAction(null);

      // Keep invisible media indexing paused after this explicit foreground
      // scan. The resumable cache can continue later from its saved boundary;
      // it must never delay Auto Add or the user's next interaction.
    }
  }
  useEffect(() => {
    importTicketRef.current = importTicket;
  });


  async function choosePhoto() {
    if (photoImportActiveRef.current) {
      Alert.alert(
        "Import already in progress",
        "Finish or skip the current ticket before starting another import.",
      );
      return;
    }
    photoImportActiveRef.current = true;
    setPhotoImportActive(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Allow photo access to import tickets."
        );
        return;
      }

      const selection =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          selectionLimit: 30,
          quality: 1,
          allowsEditing: false,
          exif: false,
          preferredAssetRepresentationMode:
            ImagePicker.UIImagePickerPreferredAssetRepresentationMode
              .Current,
        });

      if (selection.canceled) return;

      for (const asset of selection.assets) {
        void logTicketImage(
          "selected",
          asset.uri,
          asset.width,
          asset.height,
        );

      }

      const knownFingerprints = new Set(
        tickets
          .filter(
            (ticket) =>
              !ticket.seasonKey || ticket.seasonKey === seasonFrame.season,
          )
          .map((ticket) => ticket.fingerprint),
      );

      for (const [index, asset] of selection.assets.entries()) {
        let edited: {
          uri: string;
          width?: number;
          height?: number;
        } | null;

        {
          try {
            await new Promise((resolve) => setTimeout(resolve, 400));
            const encodeContext = ImageManipulator.manipulate(asset.uri);
            const encodeRendered = await encodeContext.renderAsync();
            const encodeSaved = await encodeRendered.saveAsync({
              compress: 1,
              format: SaveFormat.JPEG,
            });
            // Detect the ticket before opening the editor. The user begins
            // with a useful suggested crop and only fine-tunes it.
            const suggestedCrop = await autoCropTicketScreenshot(
              encodeSaved.uri,
            );
            void logTicketImage("editor-open", suggestedCrop.uri);
            const cropperResult = await openNativeCropper(
              suggestedCrop.uri,
              suggestedCrop.cropRect,
            );
            edited = cropperResult;
            if (!edited) {
              const fallback = await new Promise<"original" | "skip">(
                (resolve) =>
                  Alert.alert(
                    "Use original photo?",
                    "The suggested crop was cancelled. You can keep the complete original ticket instead.",
                    [
                      {
                        text: "Skip Photo",
                        style: "cancel",
                        onPress: () => resolve("skip"),
                      },
                      {
                        text: "Use Original Photo",
                        onPress: () => resolve("original"),
                      },
                    ],
                    { cancelable: false },
                  ),
              );
              edited =
                fallback === "original"
                  ? {
                      uri: encodeSaved.uri,
                      width: asset.width,
                      height: asset.height,
                    }
                  : null;
            }
          } catch (cropperError) {
            console.warn("[ticket-import] cropper threw", cropperError);
            Alert.alert("Cropper problem", String(cropperError));
            continue;
          }
        }
        if (!edited) continue;
        void logTicketImage(
          "cropped",
          edited.uri,
          edited.width,
          edited.height,
        );
        const fingerprint = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${asset.assetId ?? asset.fileName ?? asset.uri}|${asset.fileSize}|${asset.width}x${asset.height}`,
        );
        const savedUri = await permanentTicketUri(
          edited.uri,
          fingerprint,
          "image/jpeg",
        );

        const ticketId = `${fingerprint}-${index}`;
        // Scan the permanent copy. The cropper URI is temporary and can be
        // reclaimed while a bulk import is still processing, which previously
        // produced a blank first scan even though Recognise Match worked later.
        recognitionImageUrisRef.current.set(ticketId, savedUri);
        if (knownFingerprints.has(fingerprint)) {
          await new Promise<void>((resolve) =>
            Alert.alert(
              "Duplicate ticket skipped",
              "This ticket is already in the collection.",
              [{ text: "Continue", onPress: () => resolve() }],
              { cancelable: false },
            ),
          );
          continue;
        }

        const ticket: SeasonTicket = {
          id: ticketId,
          fingerprint,
          // Recognition owns the ticket details. Do not seed this ticket from
          // another import or from a preliminary OCR pass.
          name: "",
          uri: savedUri,
          aspectRatio:
            edited.width && edited.height
              ? edited.width / edited.height
              : undefined,
          cropWidth: edited.width,
          cropHeight: edited.height,
          matchDate: null,
          kickoffTime: null,
          competition: null,
          details: undefined,
          seasonKey: "",
          scale: 1,
          boxScale: 1,
          offsetX: 0,
          offsetY: 0,
        };
        knownFingerprints.add(fingerprint);
        setTickets((current) =>
          current.some((item) => item.fingerprint === fingerprint)
            ? current
            : [...current, ticket].sort(byMatchDateOldestFirst),
        );

        const reviewFinished = new Promise<"saved" | "skipped">((resolve) => {
          ticketReviewResolversRef.current.set(ticket.id, resolve);
        });
        const queued = await recogniseAndQueue(ticket);
        if (!queued) {
          ticketReviewResolversRef.current.delete(ticket.id);
          await new Promise<void>((resolve) =>
            Alert.alert(
              "Ticket needs attention",
              "Recognition did not finish. This ticket remains in My Tickets for a later retry.",
              [{ text: "Continue", onPress: () => resolve() }],
              { cancelable: false },
            ),
          );
          continue;
        }

        const result = await reviewFinished;
        // Confirmation updates React state first; wait for the serial saved-
        // frame writer to commit that exact ticket before advancing the bulk
        // crop queue or telling the user it is safely stored.
        await new Promise((resolve) => setTimeout(resolve, 100));
        await savedFrameWriteChainRef.current.catch(() => {});
        const hasAnother = index < selection.assets.length - 1;
        await new Promise<void>((resolve) =>
          Alert.alert(
            result === "saved" ? "Ticket saved" : "Ticket skipped",
            result === "saved"
              ? hasAnother
                ? "This ticket is complete. The next ticket will now open for resizing."
                : "This ticket is complete. The bulk import has finished."
              : hasAnother
                ? "This ticket was skipped. The next ticket will now open for resizing."
                : "This ticket was skipped. The bulk import has finished.",
            [
              {
                text: hasAnother ? "Next Ticket" : "Done",
                onPress: () => resolve(),
              },
            ],
            { cancelable: false },
          ),
        );
      }
    } catch {
      Alert.alert(
        "Photo error",
        "Could not import ticket photo."
      );
    } finally {
      photoImportActiveRef.current = false;
      setPhotoImportActive(false);
    }
  }

  async function chooseTicket() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/vnd.apple.pkpass", "image/*"],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled) {
      const added = await Promise.all(
        result.assets.map(async (asset, index) => {
          const fingerprint = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            `${asset.name}|${asset.size}|${asset.mimeType}`,
          );
          const uri = asset.mimeType?.startsWith("image/")
            ? await permanentTicketUri(asset.uri, fingerprint, asset.mimeType)
            : undefined;
          return {
            id: `${fingerprint}-${index}`,
            fingerprint,
            name: asset.name,
            uri,
            seasonKey: "",
            scale: 1,
            boxScale: 1,
            offsetX: 0,
            offsetY: 0,
          };
        }),
      );
      setTickets((current) => {
        const known = new Set(
          current
            .filter(
              (ticket) =>
                !ticket.seasonKey ||
                ticket.seasonKey === seasonFrame.season,
            )
            .map((ticket) => ticket.fingerprint),
        );
        const unique = added.filter((ticket) => !known.has(ticket.fingerprint));
        if (unique.length < added.length)
          Alert.alert(
            "Duplicate skipped",
            `${added.length - unique.length} ticket already existed in this frame.`,
          );
        return [...current, ...unique].sort(byMatchDateOldestFirst);
      });
    }
  }

  const [oldSchoolAssets, setOldSchoolAssets] = useState<
    Record<string, string>
  >({});
  const oldSchoolAssetsRef = useRef<Record<string, string>>({});
  const osQueueRef = useRef<string[]>([]);
  const osQueueTicketsRef = useRef<Map<string, SeasonTicket>>(new Map());
  const osCaptureRef = useRef<View>(null);
  const osBusyRef = useRef(false);
  const [osCaptureTicket, setOsCaptureTicket] = useState<SeasonTicket | null>(
    null,
  );

  const processOldSchoolQueue = useCallback(async () => {
    if (osBusyRef.current) return;
    osBusyRef.current = true;
    try {
      while (osQueueRef.current.length) {
        const fingerprint = osQueueRef.current.shift();
        if (!fingerprint) continue;
        const ticket = osQueueTicketsRef.current.get(fingerprint);
        if (
          !ticket ||
          !ticket.uri ||
          oldSchoolAssetsRef.current[fingerprint]
        ) {
          osQueueTicketsRef.current.delete(fingerprint);
          continue;
        }
        setOsCaptureTicket({ ...ticket });
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!osCaptureRef.current) continue;
        try {
          const tmpUri = await captureRef(osCaptureRef.current, {
            format: "png",
            quality: 1,
            result: "tmpfile",
          });
          const dest = `${FileSystem.documentDirectory}oldschool-${fingerprint}.png`;
          const info = await FileSystem.getInfoAsync(dest);
          if (info.exists) await FileSystem.deleteAsync(dest, { idempotent: true });
          await FileSystem.moveAsync({ from: tmpUri, to: dest });
          oldSchoolAssetsRef.current = {
            ...oldSchoolAssetsRef.current,
            [fingerprint]: dest,
          };
          setOldSchoolAssets(oldSchoolAssetsRef.current);
        } catch (error) {
          console.log("[old-school-capture] failed:", error);
        }
        osQueueTicketsRef.current.delete(fingerprint);
      }
    } finally {
      osBusyRef.current = false;
      setOsCaptureTicket(null);
    }
  }, []);

  const enqueueOldSchool = useCallback((list: SeasonTicket[]) => {
    let added = false;
    for (const ticket of list) {
      if (
        effectiveTicketStyle(ticket, ticketStyle) !== "old-school" ||
        !ticket.uri
      )
        continue;
      if (oldSchoolAssetsRef.current[ticket.fingerprint]) continue;
      osQueueTicketsRef.current.set(ticket.fingerprint, ticket);
      if (!osQueueRef.current.includes(ticket.fingerprint)) {
        osQueueRef.current.push(ticket.fingerprint);
        added = true;
      }
    }
    if (added || (!osBusyRef.current && osQueueRef.current.length))
      void processOldSchoolQueue();
  }, [processOldSchoolQueue, ticketStyle]);

  function ensureOldSchoolAssets(list: SeasonTicket[]) {
    return new Promise<void>((resolve) => {
      enqueueOldSchool(list);
      const started = Date.now();
      const tick = () => {
        const missing = list.some(
          (ticket) =>
            effectiveTicketStyle(ticket, ticketStyle) === "old-school" &&
            ticket.uri &&
            !oldSchoolAssetsRef.current[ticket.fingerprint],
        );
        if (!missing) return resolve();
        if (Date.now() - started > 25000) return resolve();
        setTimeout(tick, 150);
      };
      tick();
    });
  }

  function patchTicketDetails(
    target: SeasonTicket,
    details: TicketSeatDetails,
  ) {
    setTickets((current) =>
      current.map((item) =>
        item.fingerprint === target.fingerprint && !item.details
          ? { ...item, details }
          : item,
      ),
    );
  }

  function showTicketActions(ticket: SeasonTicket) {
    const options: {
      text: string;
      style?: "default" | "cancel" | "destructive";
      onPress?: () => void;
    }[] = [
      {
        text: "Edit ticket",
        onPress: () => void openTicketEditor(ticket),
      },
      {
        text: "Recognise Match",
        onPress: () => void recogniseAndQueue(ticket),
      },
      {
        text: "Print Ticket",
        onPress: () => void printTicket(ticket),
      },
      {
        text: "Export Ticket Image",
        onPress: () => void exportTicketImage(ticket),
      },
      {
        text: "Save as PDF",
        onPress: () => void exportSingleTicketPdf(ticket),
      },
      {
        text: "Delete Ticket",
        style: "destructive",
        onPress: () => deleteTicket(ticket),
      },
      { text: "Cancel", style: "cancel" },
    ];
    Alert.alert(
      ticket.name || "Ticket",
      "Choose an action for this ticket.",
      options,
    );
  }

  async function openTicketEditor(ticket: SeasonTicket) {
    if (!ticket.uri) {
      Alert.alert(
        "Nothing to edit",
        "This ticket has no image to adjust.",
      );
      return;
    }
    const liveUri = currentTicketUri(ticket.uri);
    if (!liveUri) return;

    editingTicketIdRef.current = ticket.id;

    const edited = await openNativeCropper(liveUri);
    editingTicketIdRef.current = null;
    if (!edited) return;

    void logTicketImage(
      "save-edited-ticket",
      edited.uri,
      edited.width,
      edited.height,
    );

    const versionedFingerprint = makeVersionedFingerprint(ticket.fingerprint);
    const savedUri = await permanentTicketUri(
      edited.uri,
      versionedFingerprint,
      "image/jpeg",
    );

    setTickets((current) =>
      current.map((item) =>
        item.id === ticket.id
          ? {
              ...item,
              uri: savedUri,
              aspectRatio:
                edited.width && edited.height
                  ? edited.width / edited.height
                  : item.aspectRatio,
              cropWidth: edited.width,
              cropHeight: edited.height,
            }
          : item,
      ),
    );

    void FileSystem.deleteAsync(liveUri, { idempotent: true }).catch(
      () => {},
    );
  }

  function deleteTicket(ticket: SeasonTicket) {
    Alert.alert(
      "Delete ticket?",
      "This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setTickets((current) =>
              current.filter(
                (item) =>
                  item.id !== ticket.id &&
                  item.fingerprint !== ticket.fingerprint
              )
            );

            const deletedUri = currentTicketUri(ticket.uri);
            setSeasonTicketProfiles((current) =>
              current.filter(
                (profile) =>
                  !deletedUri ||
                  currentTicketUri(profile.imageUri ?? undefined) !== deletedUri,
              ),
            );
            const recordsBeingDeleted = attendanceHistory.filter(
              (record) =>
                record.ticketId === ticket.id ||
                (
                  ticket.ticketType === "Season Ticket" &&
                  record.source === "season-ticket" &&
                  record.season === ticket.seasonKey
                ),
            );
            const deletedRecordIds = new Set(
              recordsBeingDeleted.map((record) => record.id),
            );

            setAttendanceHistory((current) =>
              current.filter((record) => !deletedRecordIds.has(record.id)),
            );

            if (deletedRecordIds.size) {
              setMatchPhotos((current) => {
                const next = { ...current };
                for (const recordId of deletedRecordIds) delete next[recordId];
                persistMatchPhotos(next);
                return next;
              });

              setMatchMediaReferences((current) => {
                const next = { ...current };
                for (const recordId of deletedRecordIds) delete next[recordId];
                persistMatchMediaReferences(next);
                matchMediaReferencesRef.current = next;
                return next;
              });

              setResolvedMatchMedia((current) => {
                const next = { ...current };
                for (const recordId of deletedRecordIds) delete next[recordId];
                return next;
              });

              setPhotoCandidates((current) => {
                const next = { ...current };
                for (const recordId of deletedRecordIds) delete next[recordId];
                return next;
              });

              setMatchdayCustomLocations((current) => {
                const next = { ...current };
                for (const recordId of deletedRecordIds) delete next[recordId];
                return next;
              });

              setMatchdayMediaAssignments((current) => {
                const next = { ...current };
                for (const key of Object.keys(next)) {
                  for (const recordId of deletedRecordIds) {
                    if (key.startsWith(`${recordId}|`)) {
                      delete next[key];
                      break;
                    }
                  }
                }
                return next;
              });

              setAutoPhotoMatchedRecordIds((current) => {
                const next = new Set(current);
                for (const recordId of deletedRecordIds) next.delete(recordId);
                void AsyncStorage.setItem(
                  AUTO_PHOTO_MATCHED_KEY,
                  JSON.stringify([...next]),
                );
                return next;
              });

              for (const recordId of deletedRecordIds) {
                autoPhotoScannedRecordsRef.current.delete(recordId);
                delete resolvedMatchMediaSignatureRef.current[recordId];
              }

              void AsyncStorage.setItem(
                AUTO_MEDIA_SCANNED_KEY,
                JSON.stringify([...autoPhotoScannedRecordsRef.current]),
              );

              if (
                selectedHistoryRecordId &&
                deletedRecordIds.has(selectedHistoryRecordId)
              ) {
                setMediaEditMode(false);
                setSelectedMediaKeys(new Set());
                setSelectedMatchVideoUri(null);
                setEnlargedMatchPhotoUri(null);
                setSelectedHistoryRecordId(null);
              }
            }

            if (selectedTicket === ticket.id) {
              setSelectedTicket(undefined);
            }

            if (ticket.uri) {
              const uri = currentTicketUri(ticket.uri);
              if (uri) {
                void FileSystem.deleteAsync(uri, { idempotent: true }).catch(
                  () => {},
                );
              }
            }
          },
        },
      ]
    );
  }

  
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setTickets((current) =>
    current.map((ticket) => ({
      ...ticket,
      scale: Number(ticket.scale) || 1,
      boxScale: Number(ticket.boxScale) || 1,
      offsetX: Number(ticket.offsetX) || 0,
      offsetY: Number(ticket.offsetY) || 0,
    }))
  );
}, []);

const sortedTickets = [...tickets].sort(byCollectionOrder);
const ticketCollectionClubName = resolveTicketCollectionClubName(
  tickets,
  seasonTicketProfiles,
);
const ticketClubOption = (ticket?: SeasonTicket): ClubOption =>
  resolveTicketClubOption({
    ticket,
    collectionClubName: ticketCollectionClubName,
    seasonTicketProfiles,
    clubs,
    favouriteClub,
  });
const ticketCollectionClub = ticketClubOption();
const seasonTickets = sortedTickets.filter(
  (ticket) => ticket.seasonKey === seasonFrame.season,
);
const homeSeasonOptions = Array.from(
  new Set([
    ...tickets
      .filter(
        (ticket) =>
          (ticket.ticketType === "Season Ticket" ||
            !isNonMatchTicketType(ticket.ticketType)) &&
          /^\d{4}\/\d{2}$/.test(ticket.seasonKey?.trim() ?? ""),
      )
      .map((ticket) => ticket.seasonKey || null)
      .filter(Boolean),
    ...seasonTicketProfiles
      .map((profile) =>
        /^\d{4}\/\d{2}$/.test(profile.seasonKey.trim())
          ? profile.seasonKey.trim()
          : null,
      )
      .filter(Boolean),
  ]),
).sort((a, b) => b!.localeCompare(a!)) as string[];
const homeDisplayTickets = [...tickets]
  .filter((ticket) =>
    homeTicketSeason === "All Tickets" ||
    ticket.seasonKey === homeTicketSeason,
  )
  .sort(byCollectionOrder);

const homeWalletTickets = [...homeDisplayTickets].sort((a, b) => {
  const dateDifference = byMatchDateOldestFirst(a, b);
  if (dateDifference !== 0) return dateDifference;

  return (
    (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.id.localeCompare(b.id)
  );
});

const homeWalletOpenTicket = homeWalletOpenTicketId
  ? homeWalletTickets.find(
      (ticket) => ticket.id === homeWalletOpenTicketId,
    )
  : undefined;

const homeWalletOpenStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: homeWalletOpenY.value }],
}));

const closeHomeWalletTicket = useCallback(() => {
  setHomeWalletOpenTicketId(undefined);
  homeWalletOpenY.value = 0;
}, [homeWalletOpenY]);

const openHomeWalletTicket = useCallback(
  (ticketId: string) => {
    homeWalletOpenY.value = 0;
    setHomeWalletOpenTicketId(ticketId);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        homeScrollRef.current?.scrollTo({
          y: Math.max(0, homeWalletSectionYRef.current),
          animated: true,
        });
      });
    });
  },
  [homeWalletOpenY],
);

const homeWalletOpenGesture = Gesture.Pan()
  .onUpdate((event) => {
    homeWalletOpenY.value = Math.max(0, event.translationY);
  })
  .onEnd((event) => {
    if (event.translationY > 110 || event.velocityY > 650) {
      homeWalletOpenY.value = withTiming(
        750,
        { duration: 220 },
        (finished) => {
          if (finished) {
            runOnJS(closeHomeWalletTicket)();
          }
        },
      );
    } else {
      homeWalletOpenY.value = withSpring(0, {
        damping: 18,
        stiffness: 180,
      });
    }
  });
const fullFrameTickets = sortedTickets.filter(
  (ticket) =>
    fullFrameSeason === "All Tickets" || ticket.seasonKey === fullFrameSeason,
);
const fullFrameTitle =
  fullFrameSeason === "All Tickets"
    ? `${ticketCollectionClub.name} All Tickets`
    : `${ticketCollectionClub.name} ${fullFrameSeason} Season`;
useEffect(() => {
  enqueueOldSchool(seasonTickets);
}, [enqueueOldSchool, seasonTickets]);

const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
const gridLayoutsRef = useRef<Record<string, TileRect>>({});

const handleTileDragStart = useCallback((id: string) => {
  setDraggingTicketId(id);
}, []);

const handleTileDragRelease = useCallback((id: string) => {
  setDraggingTicketId((current) => (current === id ? null : current));
}, []);

const handleTileDrop = (id: string, tx: number, ty: number) => {
  setDraggingTicketId(null);
  const rects = gridLayoutsRef.current;
  const me = rects[id];
  if (!me) return;
  const centerX = me.x + me.w / 2 + tx;
  const centerY = me.y + me.h / 2 + ty;
  let targetId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [otherId, rect] of Object.entries(rects)) {
    if (!rect || otherId === id) continue;
    const dx = rect.x + rect.w / 2 - centerX;
    const dy = rect.y + rect.h / 2 - centerY;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      targetId = otherId;
    }
  }
  if (!targetId) return;
  const orderedIds = fullFrameTickets.map((ticket) => ticket.id);
  const fromIndex = orderedIds.indexOf(id);
  const toIndex = orderedIds.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
  orderedIds.splice(toIndex, 0, orderedIds.splice(fromIndex, 1)[0]);
  const orderMap = new Map(orderedIds.map((tid, i) => [tid, i] as const));
  setTickets((current) =>
    current.map((ticket) => {
      const nextOrder = orderMap.get(ticket.id);
      return nextOrder === undefined ? ticket : { ...ticket, order: nextOrder };
    }),
  );
};
  const loadFixtures = useCallback(async (opts?: { force?: boolean }) => {
    const requestId = ++fixtureLoadRequestRef.current;
    if (opts?.force) {
      await refreshHostedTfd().then((result) => {
        const generatedAt = Date.parse(result.generatedAt);
        setFixturesUpdatedAt(Number.isFinite(generatedAt) ? generatedAt : null);
        if (result.changed) setTfdDataRevision((revision) => revision + 1);
      }).catch(() => {});
    }
    const ownerKey = `${normaliseFixtureText(favouriteClub.name)}|${favouriteClub.league}|${CURRENT_SEASON}`;
    // Cache-first: hydrate from the bundled provider snapshot so the screen
    // paints immediately without a device-side football API request.
    let cachedMine: FixtureRow[] = [];
    if (!opts?.force) {
      try {
        cachedMine = await loadCachedClubFixtures(
          favouriteClub.league,
          favouriteClub.name,
          favouriteClub.id,
        );
        if (cachedMine.length) {
          if (requestId !== fixtureLoadRequestRef.current) return;
          setSeasonFixtures(cachedMine);
          verifiedFixtureClubRef.current = ownerKey;
          setVerifiedFixtureClubKey(ownerKey);
          setFixturesError(null);
          setFixturesLoading(false);
          const tableResult = await fetchLeagueTableWithFallback(
            favouriteClub.league,
          ).catch(() => ({
            rows: [] as TableRow[],
            season: CURRENT_SEASON,
          }));
          if (requestId !== fixtureLoadRequestRef.current) return;
          setLeagueTableRows(tableResult.rows);
          setTableSeason(tableResult.season);
          // A recent combined league+cup cache is already verified. Do not
          // immediately repeat the expensive season-wide provider scan while
          // Home is mounting; refresh remains available from Fixtures.
          return;
        }
      } catch {
        // cache miss is fine — the refresh below will populate
      }
    }
    if (!cachedMine.length) {
      setVerifiedFixtureClubKey("");
      setSeasonFixtures([]);
    }
    if (!policyAgreed) {
      setFixturesLoading(false);
      setFixturesError(
        "Open Settings and accept Privacy & Terms before using live football data updates.",
      );
      return;
    }
    setFixturesLoading(true);
    setFixturesError(null);
    try {
      const apiId = (await resolveTeamId(favouriteClub.name, favouriteClub.league)) ?? favouriteClub.id;
      setClubApiId(apiId);
      const [fixturesResult, tableResult] = await Promise.all([
        fetchTeamFixtures(favouriteClub.id, favouriteClub.league, { ...opts, teamName: favouriteClub.name }),
        fetchLeagueTableWithFallback(favouriteClub.league).catch(() => ({
          rows: [] as TableRow[],
          season: CURRENT_SEASON,
        })),
      ]);
      if (requestId !== fixtureLoadRequestRef.current) return;
      let fixtureRows = fixturesResult.fixtures;
      if (!fixtureRows.length) {
        const seasonKey = seasonForDate(new Date()) ?? "";
        const fallback = await fetchAndCacheFixtures(
          favouriteClub.name,
          seasonKey,
          { league: favouriteClub.league },
        ).catch(() => [] as CachedFixture[]);
        fixtureRows = fallback.map((fixture) => {
          const home = fixture.homeAway === "home";
          return {
            id: `fallback-${fixture.date}-${fixture.opponent}`,
            date: fixture.date,
            kickoff: fixture.kickoff
              ? `${fixture.date}T${fixture.kickoff}:00`
              : null,
            homeId: home ? apiId : "",
            awayId: home ? "" : apiId,
            homeName: home ? favouriteClub.name : fixture.opponent,
            awayName: home ? fixture.opponent : favouriteClub.name,
            homeScore: null,
            awayScore: null,
            status: "STATUS_SCHEDULED",
            season: CURRENT_SEASON,
            competition: fixture.competition || null,
            venue: fixture.venue ?? null,
          } satisfies FixtureRow;
        });
      }
      if (fixtureRows.length) {
        setSeasonFixtures(fixtureRows);
        verifiedFixtureClubRef.current = ownerKey;
        setVerifiedFixtureClubKey(ownerKey);
      }
      setLeagueTableRows(tableResult.rows);
      setTableSeason(tableResult.season);
      // The iPhone consumes a bundled TFD snapshot. Never label a local
      // reread as a fresh provider update; show the snapshot's real build time.
      const generatedAt = Date.parse(getMatchDatabaseGeneratedAt());
      setFixturesUpdatedAt(Number.isFinite(generatedAt) ? generatedAt : null);
      if (!fixtureRows.length && !cachedMine.length)
        setFixturesError(
          "Fixtures are temporarily unavailable. Try again shortly.",
        );
    } catch {
      if (requestId !== fixtureLoadRequestRef.current) return;
      if (!cachedMine.length)
        setFixturesError("Fixtures are temporarily unavailable. Try again shortly.");
    } finally {
      if (requestId === fixtureLoadRequestRef.current)
        setFixturesLoading(false);
    }
  }, [favouriteClub.id, favouriteClub.name, favouriteClub.league, policyAgreed, tfdDataRevision]);

  useEffect(() => {
    let cancelled = false;
    const apply = async (remote: boolean) => {
      const changed = remote
        ? (await refreshHostedTfd().catch(() => ({ changed: false }))).changed
        : await hydrateCachedTfd();
      if (cancelled || !changed) return;
      const generatedAt = Date.parse(getMatchDatabaseGeneratedAt());
      setFixturesUpdatedAt(Number.isFinite(generatedAt) ? generatedAt : null);
      setTfdDataRevision((revision) => revision + 1);
    };
    void apply(false);
    const firstRemoteCheck = setTimeout(() => void apply(true), 5000);
    const interval = setInterval(() => void apply(true), 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearTimeout(firstRemoteCheck);
      clearInterval(interval);
    };
  }, []);

  // V3.9.7 — MY HOME FIXTURES loads fixtures for the PROFILE's saved season
  // (never the active season), cache-first via the shared fixture pipeline.
  // The Fixtures tab's seasonFixtures state is left untouched.
  async function loadProfileFixtures(profile: SeasonTicketProfile) {
    // My Home Fixtures belongs solely to this Season Ticket Profile.
    // Favourite Club must never determine its team, league or fixtures.
    const [seasonStart] = profile.seasonKey.split("/");
    const apiSeasonKey = seasonStart
      ? `${seasonStart}-${Number(seasonStart) + 1}`
      : profile.seasonKey;

    // Current-season Season Tickets must not treat a partial cache as the
    // complete fixture list. Show cache immediately, then refresh the season.
    const currentProfileSeason =
      seasonForDate(new Date()) ?? activeSeason;
    const shouldRefreshCurrentProfile =
      profile.seasonKey === currentProfileSeason;

    const listedClub = clubs.find((club) =>
      clubNamesMatch(club.name, profile.club),
    );

    // Prefer the saved club catalogue entry, but TFD itself is the fallback
    // authority for discovering which competition contains this club/season.
    const profileLeague =
      findBundledLeagueForClub(profile.club, apiSeasonKey) ??
      listedClub?.league;

    if (!profileLeague) {
      setProfileFixtures([]);
      return;
    }

    try {
      const cached = await loadCachedFixtures(profile.club, profile.seasonKey)
        .catch(() => [] as CachedFixture[]);
      if (cached.length) {
        setProfileFixtures(
          cached.filter(
            (fixture) =>
              fixture.homeAway === "home" &&
              !clubNamesMatch(fixture.opponent, profile.club),
          ),
        );
      }
      // fetchAndCacheFixtures reads the bundled TFD match database.
      // forceRefresh means rebuild this club's cache from TFD rather than
      // trusting a cache created by an older Favourite Club implementation.
      const fixtures = await fetchAndCacheFixtures(
        profile.club,
        profile.seasonKey,
        {
          league: profileLeague,
          forceRefresh:
            !cached.length || shouldRefreshCurrentProfile,
        },
      );

      setProfileFixtures(
        fixtures.filter(
          (fixture) =>
            fixture.homeAway === "home" &&
            !clubNamesMatch(fixture.opponent, profile.club),
        ),
      );
    } catch {
      const cached = await loadCachedFixtures(
        profile.club,
        profile.seasonKey,
      ).catch(() => [] as CachedFixture[]);

      setProfileFixtures(
        cached.filter(
          (fixture) =>
            fixture.homeAway === "home" &&
            !clubNamesMatch(fixture.opponent, profile.club),
        ),
      );
    }
  }

  useEffect(() => {
    if (!homeFixturesProfileId) return;
    const profile = seasonTicketProfiles.find(
      (entry) => entry.id === homeFixturesProfileId,
    );
    if (!profile) return;
    const run = async () => {
      await loadProfileFixtures(profile);
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeFixturesProfileId]);

  // V4.0.86 INTERACTION PRIORITY:
  // History must open and respond immediately from already-held/persistent
  // state. Do not rebuild the complete per-season fixture cache merely because
  // the user entered History; that secondary state update can steal the first
  // interaction and causes unnecessary re-rendering.
  //
  // Fixture/data pipelines populate the persistent cache elsewhere.
  // History remains a read-only consumer of the data it already has.


  // Repair attendances saved before neutral FA Cup venues were preserved.
  // The nominal first-listed club is not the home ground for semi-finals or
  // finals; Wembley is authoritative when the bundled fixture supplies it.
  useEffect(() => {
    if (!historyFixtures.length || !attendanceHistoryReady) return;
    setAttendanceHistory((current) => {
      let changed = false;
      const next = current.map((record) => {
        const fixture = fixtureForAttendance(record, historyFixtures);
        const competition = normaliseFixtureText(
          fixture?.competition || record.competition || "",
        );
        const round = normaliseFixtureText(fixture?.round || "");
        const neutralFaCup =
          competition === "fa cup" &&
          (round === "semi final" ||
            round === "semi finals" ||
            round === "final");
        if (!neutralFaCup || !fixture?.venue || record.ground === fixture.venue)
          return record;
        changed = true;
        return { ...record, ground: fixture.venue };
      });
      return changed ? next : current;
    });
  }, [attendanceHistoryReady, historyFixtures]);

  // PERFORMANCE: History is now cache-first.
  //
  // Opening History must never trigger a Photos-library scan, iCloud work,
  // fixture discovery or repeated media classification. Previously this
  // effect reran when History opened and whenever several large state objects
  // changed, making the tab feel slow even when the work had already been
  // completed.
  //
  // Existing attendance, media references and metadata caches are rendered
  // immediately. Expensive discovery is explicit through Auto Add / Find
  // Photos, where Add New can preserve previous work and Add All can perform
  // a deliberate full discovery.

  const mediaIndexCandidates = useMemo(() => {
    const clubName = ticketCollectionClubName ?? favouriteClub.name;
    const candidates = new Map<string, {
      descriptor: Parameters<typeof prioritizeMediaIndexFixture>[0];
      record?: AttendanceRecord;
      stadiumName: string;
    }>();
    for (const record of attendanceHistory) {
      if (!record.matchDate) continue;
      const homeClub = record.homeAway === "away" ? record.opponent : record.club;
      const ground =
        (record.ground ? footballGroundForName(record.ground) : undefined) ??
        findGroundForClub(homeClub);
      if (ground) candidates.set(record.id, {
        descriptor: { recordId: record.id, matchDate: record.matchDate, ground },
        stadiumName: ground.stadium,
      });
    }
    for (const fixture of getAllBundledClubFixtures(clubName)) {
      if (!fixture.date) continue;
      const isHome = clubNamesMatch(fixture.homeName, clubName);
      const opponent = isHome ? fixture.awayName : fixture.homeName;
      const ground =
        (fixture.venue ? footballGroundForName(fixture.venue) : undefined) ??
        findGroundForClub(fixture.homeName);
      if (!ground) continue;
      const proposed: AttendanceRecord = {
        id: `att-photo-${fixture.id}`,
        club: clubName,
        opponent,
        matchDate: fixture.date,
        season: canonicalSeason(fixture.date),
        competition: fixture.competition,
        ground: fixture.venue || ground.stadium,
        homeAway: isHome ? "home" : "away",
        result:
          fixture.homeScore == null || fixture.awayScore == null
            ? null
            : (isHome ? fixture.homeScore : fixture.awayScore) >
                (isHome ? fixture.awayScore : fixture.homeScore)
              ? "win"
              : (isHome ? fixture.homeScore : fixture.awayScore) <
                  (isHome ? fixture.awayScore : fixture.homeScore)
                ? "loss"
                : "draw",
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
        source: "photo-discovery",
        confirmed: true,
        createdAt: Date.now(),
      };
      const existing = findMatchingAttendance(attendanceHistory, proposed);
      const recordId = existing?.id ?? proposed.id;
      if (!candidates.has(recordId)) candidates.set(recordId, {
        descriptor: { recordId, matchDate: fixture.date, ground },
        record: existing ? undefined : proposed,
        stadiumName: ground.stadium,
      });
    }
    return candidates;
  }, [attendanceHistory, favouriteClub.name, ticketCollectionClubName]);

  const mediaIndexFixtures = useMemo(
    () => [...mediaIndexCandidates.values()].map((item) => item.descriptor),
    [mediaIndexCandidates],
  );

  useEffect(() => {
    if (!attendanceHistoryReady || !matchMediaReferencesReady) return;
    const recoverable = [...mediaIndexCandidates.entries()]
      .filter(([, candidate]) =>
        Boolean(
          candidate.record &&
          (matchMediaReferences[candidate.descriptor.recordId] ?? []).length,
        ),
      )
      .map(([, candidate]) => candidate.record!);
    if (!recoverable.length) return;
    setAttendanceHistory((current) => {
      const next = [...current];
      let changed = false;
      for (const record of recoverable) {
        const suppressionKey = attendanceSuppressionKey(record);
        if (
          (suppressionKey && deletedHistoryMatchKeys.has(suppressionKey)) ||
          findMatchingAttendance(next, record)
        ) continue;
        next.push(record);
        changed = true;
      }
      return changed ? next : current;
    });
  }, [
    attendanceHistoryReady,
    deletedHistoryMatchKeys,
    matchMediaReferences,
    matchMediaReferencesReady,
    mediaIndexCandidates,
  ]);

  useEffect(() => {
    if (!matchMediaReferencesReady) return;
    return subscribeToMediaIndex((recordId, references) => {
      const candidate = mediaIndexCandidates.get(recordId);
      if (!candidate) return;
      if (candidate.record) {
        const suppressionKey = attendanceSuppressionKey(candidate.record);
        if (suppressionKey && deletedHistoryMatchKeys.has(suppressionKey)) return;
        setAttendanceHistory((current) =>
          findMatchingAttendance(current, candidate.record!)
            ? current
            : [...current, candidate.record!],
        );
      }
      // The coordinator publishes every newly classified batch. Updating the
      // same state used by the open Match Memory fixes the old close/reopen
      // requirement while AsyncStorage preserves the association immediately.
      addMatchMediaReferences(recordId, references);
      setMatchdayMediaAssignments((current) => {
        const next = { ...current };
        let changed = false;
        for (const reference of references) {
          if (
            typeof reference.latitude !== "number" ||
            typeof reference.longitude !== "number"
          ) continue;
          const key = `${recordId}|asset:${reference.assetId}`;
          if (next[key]?.source === "manual") continue;
          next[key] = {
            placeName: candidate.stadiumName,
            placeKind: "stadium",
            latitude: reference.latitude,
            longitude: reference.longitude,
            source: "automatic",
          };
          changed = true;
        }
        return changed ? next : current;
      });
      setAutoPhotoMatchedRecordIds((current) => {
        if (current.has(recordId)) return current;
        const next = new Set(current);
        next.add(recordId);
        void AsyncStorage.setItem(AUTO_PHOTO_MATCHED_KEY, JSON.stringify([...next]));
        return next;
      });
    });
  }, [deletedHistoryMatchKeys, matchMediaReferencesReady, mediaIndexCandidates]);

  useEffect(() => {
    if (
      !storageReady ||
      !attendanceHistoryReady ||
      !matchMediaReferencesReady ||
      !photoMemoriesEnabled ||
      !mediaIndexFixtures.length
    ) return;
    let cancelled = false;

    // V4.0.87 — foreground user activity always wins.
    // Start one coordinated persistent builder after launch. It advances in
    // resumable 1,000-item logical blocks rather than spawning competing
    // Photos workers or repeatedly rescanning already indexed assets.
    const run = () => {
      if (cancelled) return;

      void MediaLibrary.getPermissionsAsync().then((permission) => {
        if (!cancelled && permission.granted) {
          void startMediaIndex(mediaIndexFixtures);
        }
      });
    };

    // V4.0.87 — resume the persistent photo + video cache quietly.
    //
    // Wait until launch/restore interactions have settled, then resume the
    // persistent media index. Each 1,000-item block is made from interruptible
    // 100-item Photos pages and permanently checkpoints completed work.
    //
    // Foreground actions still stop/pre-empt invisible work. Once the user
    // releases the foreground media lane, the builder resumes from its saved
    // boundary rather than starting the library again.
    const startupTimer: ReturnType<typeof setTimeout> | null = setTimeout(
      run,
      5000,
    );

    return () => {
      cancelled = true;
      if (startupTimer) clearTimeout(startupTimer);
    };
  }, [
    attendanceHistoryReady,
    matchMediaReferencesReady,
    mediaIndexFixtures,
    photoMemoriesEnabled,
    storageReady,
  ]);

  useEffect(() => {
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    if (selectedHistoryRecordId) {
      const fixture = mediaIndexFixtures.find(
        (item) => item.recordId === selectedHistoryRecordId,
      );

      if (fixture) {
        // Explicit user work owns the Photos queue immediately.
        prioritizeMediaIndexFixture(fixture);
      }
    } else if (mediaIndexFixtures.length && photoMemoriesEnabled) {
      // Do not restart invisible work the instant a fixture closes. Give the
      // user five quiet seconds first; if another fixture opens this effect is
      // cleaned up and the pending restart disappears.
      resumeTimer = setTimeout(() => {
        void MediaLibrary.getPermissionsAsync().then((permission) => {
          if (!cancelled && permission.granted) {
            void startMediaIndex(mediaIndexFixtures);
          }
        });
      }, 5000);
    }

    return () => {
      cancelled = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    };
  }, [
    mediaIndexFixtures,
    photoMemoriesEnabled,
    selectedHistoryRecordId,
  ]);

  useEffect(() => {
    if (!selectedHistoryRecordId) return;
    const fixture = mediaIndexFixtures.find(
      (item) => item.recordId === selectedHistoryRecordId,
    );
    if (!fixture) return;

    // Repair references stranded under an older/duplicate attendance ID.
    // This is cache-only and applies the same strict date window + one-mile
    // stadium GPS rule before publishing anything to the opened fixture.
    const dayStart = new Date(`${fixture.matchDate}T00:00:00`).getTime();
    const dayEnd = new Date(`${fixture.matchDate}T23:59:59`).getTime();
    const selectedAssetIds = new Set(
      (matchMediaReferences[selectedHistoryRecordId] ?? []).map(
        (reference) => reference.assetId,
      ),
    );
    const matchingStored = Object.values(matchMediaReferences)
      .flat()
      .filter((reference) =>
        !selectedAssetIds.has(reference.assetId) &&
        typeof reference.creationTime === "number" &&
        reference.creationTime >= dayStart - 6 * 60 * 60 * 1000 &&
        reference.creationTime <= dayEnd + 6 * 60 * 60 * 1000 &&
        typeof reference.latitude === "number" &&
        typeof reference.longitude === "number" &&
        distanceMiles(
          reference.latitude,
          reference.longitude,
          fixture.ground.latitude,
          fixture.ground.longitude,
        ) <= 1,
      );
    if (matchingStored.length)
      addMatchMediaReferences(selectedHistoryRecordId, matchingStored);

    // addMatchMediaReferences uses a ref-backed merge; including the complete
    // reference store lets newly hydrated legacy data repair immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchMediaReferences, mediaIndexFixtures, selectedHistoryRecordId]);

  useEffect(() => () => {
    void stopMediaIndex();
  }, []);

  useEffect(() => {
    // V3.9.2 — Home shares the Fixtures pipeline, so load on both tabs.
    if (activeTab !== "fixtures" && activeTab !== "frames") return;
    const run = async () => {
      await loadFixtures();
    };
    void run();
  }, [activeTab, loadFixtures]);

useEffect(() => {
  if (!storageReady) return;
  const pending = tickets.filter(
    (ticket) =>
      ticket.uri &&
      ticket.seasonKey &&
      !ticket.confirmedMatch &&
      !ticket.matchDate,
  );
  if (!pending.length) return;
  let cancelled = false;
  void (async () => {
    const seasonKeys = Array.from(
      new Set(pending.map((ticket) => ticket.seasonKey).filter(Boolean)),
    );
    const fixturesBySeason = new Map<string, CachedFixture[]>();
    for (const seasonKey of seasonKeys) {
      const fixtures = await fetchAndCacheFixtures(
        favouriteClub.name,
        seasonKey,
        { league: favouriteClub.league },
      );
      fixturesBySeason.set(seasonKey, fixtures);
      console.log(
        `[ticket-order] fixture cache ${favouriteClub.name} ${seasonKey}: ${fixtures.length} fixture(s)`,
      );
    }
    const recovered: { id: string; matchDate: string; name: string }[] = [];
    for (const ticket of pending) {
      try {
        const liveUri = currentTicketUri(ticket.uri);
        if (!liveUri) continue;
        const seasonKey = ticket.seasonKey;
        if (!seasonKey) continue;
        const ocrText = await TextRecognition.recognize(liveUri)
          .then((result) => result.text)
          .catch(() => "");
        const ocrDate = ocrText
          ? dateFromTicketText(ocrText, seasonKey)
          : null;
        const candidate = matchFixtureForText(
          `${ticket.name} ${ocrText}`,
          favouriteClub.name,
          fixturesBySeason.get(seasonKey) ?? [],
        );
        let confirmedDate: string | null = null;
        let source: "OCR" | "fixture lookup" | "none" = "none";
        // The date printed on the saved ticket is the source of truth. Fixture
        // matching only fills a date when OCR genuinely found none.
        if (ocrDate && seasonForDate(ocrDate) === seasonKey) {
          confirmedDate = ocrDate;
          source = "OCR";
        } else if (candidate) {
          confirmedDate = candidate.date;
          source = "fixture lookup";
        }
        console.log(
          `[ticket-date-resolution]\nticket: ${ticket.name}\nopponent: ${candidate?.opponent ?? ticket.name}\nocrDate: ${ocrDate ?? "none"}\nconfirmedDate: ${confirmedDate ?? "none"}\nsource: ${source}`,
        );
        if (confirmedDate && confirmedDate !== ticket.matchDate)
          recovered.push({
            id: ticket.id,
            matchDate: confirmedDate,
            name: ticket.name,
          });
        else if (
          !confirmedDate &&
          ticket.matchDate &&
          seasonForDate(ticket.matchDate) !== seasonKey
        ) {
          console.log(
            `[ticket-order] rejecting impossible date ${ticket.matchDate} on ${ticket.name}`,
          );
          recovered.push({
            id: ticket.id,
            matchDate: "",
            name: ticket.name,
          });
        }
      } catch (lookupError) {
        console.log("[ticket-order] migration lookup failed", lookupError);
      }
    }
    if (cancelled) return;
    setTickets((current) =>
      current.map((ticket) => {
        const hit = recovered.find((item) => item.id === ticket.id);
        if (!hit) return ticket;
        return { ...ticket, matchDate: hit.matchDate || null };
      }),
    );
    recovered.forEach((item) => {
      console.log(
        `[ticket-order] ticket: ${item.name} | opponent: ${item.name} | matchDate: ${item.matchDate} | source: fixture lookup`,
      );
    });
    console.log(
      `[ticket-order] migration complete: ${recovered.length} date(s) corrected`,
    );
  })();
  return () => {
    cancelled = true;
  };
  // Migration runs once per app start against freshly loaded tickets.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [storageReady]);
  const { columns, rows } = ticketGridShape(homeDisplayTickets.length);
  const homeTileWidth = `${100 / columns - 0.7}%` as `${number}%`;
  const homeRowHeight = Math.max(62, Math.round(240 / rows));
  const homeTileHeight = homeRowHeight;
  const {
    tileWidth: fullFrameTileWidth,
    tileHeight: fullFrameTileHeight,
  } = ticketGridPercentSize(fullFrameTickets.length);
  const {
    tileWidth: focusedFrameTileWidth,
    tileHeight: focusedFrameTileHeight,
  } = ticketGridPercentSize(homeDisplayTickets.length);

  // Ticket history belongs to the saved collection, not the current Favourite
  // Club. Favourite Club is only a final fallback for an empty collection.
  const resolvedHistoryClubName = (() => {
    if (ticketCollectionClubName) return ticketCollectionClubName;
    return favouriteClub.id !== PLACEHOLDER_CLUB_ID ? favouriteClub.name : null;
  })();


  // V3.9.2 — THE one Next Match card (shared by Home and Fixtures). Same
  // data pipeline (seasonFixtures via loadFixtures) and identical visuals.
  const renderNextMatchCard = (match: FixtureRow | null) => {
    if (!match) return null;
    const isHome = clubNamesMatch(match.homeName, favouriteClub.name);
    const targetClub = isHome ? favouriteClub.name : match.homeName;
    const matchGround = findGroundForClub(targetClub);
    const openDirections = () => {
      const ground = matchGround;
      if (!ground) {
        Alert.alert("Ground not found", `No stadium saved for ${targetClub}.`);
        return;
      }
      const navigationChoices = [
        ...(installedNavigationApps.waze
          ? [
              {
                text: "Waze",
                onPress: () => {
                  const place = encodeURIComponent(
                    `${ground.stadium} ${targetClub}`,
                  );
                  void Linking.openURL(`waze://?q=${place}&navigate=yes`).catch(
                    () =>
                      Linking.openURL(
                        `http://maps.apple.com/?daddr=${place}&dirflg=d`,
                      ).catch(() =>
                        Alert.alert("Directions unavailable", "Could not open a navigation app."),
                      ),
                  );
                },
              },
            ]
          : []),
        ...(installedNavigationApps.google
          ? [
              {
                text: "Google Maps",
                onPress: () => {
                  const place = encodeURIComponent(
                    `${ground.stadium}, ${targetClub}`,
                  );
                  void Linking.openURL(
                    `comgooglemaps://?daddr=${place}&directions=1`,
                  );
                },
              },
            ]
          : []),
      ];
      if (!navigationChoices.length) {
        Alert.alert(
          "Navigation app needed",
          "Install Waze or Google Maps to show directions buttons.",
        );
        return;
      }
      Alert.alert(
        `Navigate to ${ground.stadium}`,
        `${targetClub}${isHome ? " · Home" : " · Away"}`,
        [
          { text: "Cancel", style: "cancel" },
          ...navigationChoices,
        ],
      );
    };
    const openGoogleSearch = (query: string) =>
      void Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      );
    const openCarParkWaze = (carPark: { latitude: number; longitude: number }) => {
      const coordinates = `${carPark.latitude},${carPark.longitude}`;
      void Linking.openURL(`waze://?ll=${coordinates}&navigate=yes`).catch(() =>
        Linking.openURL(`https://waze.com/ul?ll=${coordinates}&navigate=yes`),
      );
    };
    const openCarParkGoogle = (carPark: { latitude: number; longitude: number }) => {
      const coordinates = `${carPark.latitude},${carPark.longitude}`;
      void Linking.openURL(`comgooglemaps://?daddr=${coordinates}&directionsmode=driving`).catch(() =>
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coordinates}&travelmode=driving`),
      );
    };
    const openParking = () => {
      if (!matchGround) {
        Alert.alert("Ground not found", `No stadium saved for ${targetClub}.`);
        return;
      }
      if (parkingPanel?.groundId === matchGround.id) {
        setParkingPanel(null);
        return;
      }
      setMatchdayFinder(null);
      setNearbyVenuePanel(null);
      void loadParkingForGround(matchGround);
    };
    const openNearby = (kind: NearbyVenueKind) => {
      if (!matchGround) {
        Alert.alert("Ground not found", `No stadium saved for ${targetClub}.`);
        return;
      }
      if (
        nearbyVenuePanel?.groundId === matchGround.id &&
        nearbyVenuePanel.kind === kind &&
        true
      ) {
        setNearbyVenuePanel(null);
        return;
      }
      setMatchdayFinder(null);
      setParkingPanel(null);
      setVisitedPubId(null);
      setVisitedPubAudience(null);
      setVisitedPubLocation(null);
      void loadNearbyVenues(matchGround, kind);
    };
    const openVenueGoogle = (venue: NearbyVenueResult) => {
      const coordinates = `${venue.latitude},${venue.longitude}`;
      void Linking.openURL(
        `comgooglemaps://?daddr=${coordinates}&directionsmode=driving`,
      ).catch(() =>
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${coordinates}&travelmode=driving`,
        ),
      );
    };
    const confirmPubLocation = async (venue: NearbyVenueResult) => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Location access needed",
          "Allow location while using Ticket Frame to confirm that you are at this pub.",
        );
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const miles = distanceMiles(
        current.coords.latitude,
        current.coords.longitude,
        venue.latitude,
        venue.longitude,
      );
      const confirmed = miles <= 0.15;
      setVisitedPubLocation({ confirmed, distanceMiles: miles });
      Alert.alert(
        confirmed ? "Location confirmed" : "Not close enough",
        confirmed
          ? `You are within ${miles.toFixed(2)} miles of ${venue.name}.`
          : `You appear to be ${miles.toFixed(1)} miles away. You can still record the visit, but it will not be location-confirmed.`,
      );
    };
    const submitPubVisit = (venue: NearbyVenueResult) => {
      if (!matchGround || !visitedPubAudience) {
        Alert.alert("Choose an answer", "Select Home, Away, Mixed or Unsure.");
        return;
      }
      const report: PubVisitReport = {
        id: `${venue.id}|${String(match.id)}`,
        venueId: venue.id,
        venueName: venue.name,
        groundId: matchGround.id,
        groundName: matchGround.stadium,
        audience: visitedPubAudience,
        matchId: String(match.id),
        matchDate: match.date ?? null,
        submittedAt: new Date().toISOString(),
        locationConfirmed: Boolean(visitedPubLocation?.confirmed),
        confirmationDistanceMiles: visitedPubLocation?.distanceMiles,
        syncStatus: "local",
      };
      setPubVisitReports((current) => [
        ...current.filter((item) => item.id !== report.id),
        report,
      ]);
      setVisitedPubId(null);
      setVisitedPubAudience(null);
      setVisitedPubLocation(null);
      Alert.alert(
        "Visit saved privately",
        "Your structured report is stored on this iPhone and is ready for the future moderated community database.",
      );
    };
    const openGroundView = () => {
      if (!matchGround) {
        Alert.alert("Ground not found", `No stadium saved for ${targetClub}.`);
        return;
      }
      openGoogleSearch(`${matchGround.stadium}, ${targetClub}`);
    };
    const opponentName = isHome ? match.awayName : match.homeName;
    const matchdayExperience = matchdayExperiences.find(
      (item) => item.matchId === String(match.id),
    );
    const updateMatchdayExperience = (
      update: (current: MatchdayExperienceRecord) => MatchdayExperienceRecord,
    ) => {
      if (!matchdayExperience) return;
      setMatchdayExperiences((current) =>
        current.map((item) =>
          item.id === matchdayExperience.id ? update(item) : item,
        ),
      );
    };
    const startMatchdayExperience = () => {
      setParkingPanel(null);
      setNearbyVenuePanel(null);
      if (!matchGround) {
        Alert.alert("Ground not found", `No stadium saved for ${targetClub}.`);
        return;
      }
      if (matchdayExperience) {
        setActiveMatchdayExperienceId((current) =>
          current === matchdayExperience.id ? null : matchdayExperience.id,
        );
        return;
      }
      const chooseStart = (supporter: MatchdaySupporterType) =>
        Alert.alert(
          "Start Matchday Experience?",
          "Photos and visited places can be saved with this match. You can switch capture off at any time without deleting anything already saved.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Start",
              onPress: () => {
                const now = new Date().toISOString();
                const datePart = String(match.date ?? "").slice(0, 10);
                const kickoffText = String(match.kickoff ?? "15:00");
                const timeMatch = kickoffText.match(/(?:T|^)(\d{2}):(\d{2})/);
                const kickoffAt = new Date(
                  `${datePart}T${timeMatch?.[1] ?? "15"}:${timeMatch?.[2] ?? "00"}:00`,
                );
                // Estimated final whistle is two hours after kick-off. The
                // first close prompt follows one hour later.
                const firstCloseAt = new Date(kickoffAt.getTime() + 3 * 60 * 60 * 1000);
                const autoOffAt = new Date(firstCloseAt.getTime() + 8 * 60 * 60 * 1000);
                const record: MatchdayExperienceRecord = {
                  id: `matchday|${String(match.id)}`,
                  matchId: String(match.id),
                  matchDate: match.date ?? null,
                  clubName: favouriteClub.name,
                  opponentName,
                  kickoff: match.kickoff ?? null,
                  groundId: matchGround.id,
                  groundName: matchGround.stadium,
                  supporter,
                  captureEnabled: true,
                  collapsed: false,
                  closePromptAt: firstCloseAt.toISOString(),
                  closePromptCount: 0,
                  autoOffAt: autoOffAt.toISOString(),
                  venues: [],
                  createdAt: now,
                  updatedAt: now,
                };
                setMatchdayExperiences((current) => [...current, record]);
                setActiveMatchdayExperienceId(record.id);
                void (async () => {
                  const permission = await Notifications.requestPermissionsAsync();
                  if (!permission.granted) return;
                  await Promise.all([
                    Notifications.scheduleNotificationAsync({
                      content: {
                        title: "Close Matchday Experience?",
                        body: `${favouriteClub.name} v ${opponentName} finished about an hour ago.`,
                        data: { matchdayExperienceId: record.id },
                      },
                      trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: firstCloseAt,
                      },
                    }),
                    Notifications.scheduleNotificationAsync({
                      content: {
                        title: "Matchday Experience is still on",
                        body: "Close it now or choose a reminder. It will turn off automatically at the eight-hour limit.",
                        data: { matchdayExperienceId: record.id },
                      },
                      trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: new Date(firstCloseAt.getTime() + 30 * 60 * 1000),
                      },
                    }),
                  ]);
                })().catch(() => {});
              },
            },
          ],
        );
      Alert.alert("Home or away fan?", "Choose how you are attending this match.", [
        { text: "Cancel", style: "cancel" },
        { text: "Home fan", onPress: () => chooseStart("home") },
        { text: "Away fan", onPress: () => chooseStart("away") },
      ]);
    };
    const openMatchdayFinder = async (kind: MatchdayFinderKind, refresh = false) => {
      if (!matchdayExperience?.captureEnabled || !matchGround) return;
      if (matchdayFinder === kind && !refresh) {
        setMatchdayFinder(null);
        setMatchdayVenueQuery("");
        setMatchdaySearchOrigin(null);
        setParkingPanel(null);
        setNearbyVenuePanel(null);
        return;
      }
      setMatchdayFinder(kind);
      setMatchdayVenueQuery("");
      setMatchdaySearchOrigin(null);
      setParkingPanel(null);
      setNearbyVenuePanel(null);
      // Car parks are a live-location lookup. Merely opening the finder must
      // not show cached or stadium-based suggestions; the user explicitly
      // starts the lookup with Update live location.
      if (kind === "carPark" && !refresh) return;
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setMatchdayFinder(null);
        Alert.alert("Location access needed", "Allow location while using Ticket Frame to find places near you.");
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const origin = {
        ...matchGround,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setMatchdaySearchOrigin({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        groundId: matchGround.id,
      });
      if (kind === "carPark") void loadParkingForGround(origin, "current");
      else void loadNearbyVenues(origin, kind, "current");
    };
    const checkInMatchdayVenue = (venue: NearbyVenueResult, kind: MatchdayFinderKind) => {
      if (!matchdayExperience?.captureEnabled) return;
      Alert.alert("Your rating", `Rate ${venue.name}.`, [
        ...([1, 2, 3, 4, 5] as const).map((rating) => ({
          text: `${rating} ★`,
          onPress: () => {
            const visit: MatchdayVenueVisit = {
              id: `${kind}|${venue.id}`,
              venueId: venue.id,
              venueName: venue.name,
              kind,
              latitude: venue.latitude,
              longitude: venue.longitude,
              rating,
              visitedAt: new Date().toISOString(),
            };
            updateMatchdayExperience((current) => ({
              ...current,
              venues: [...current.venues.filter((item) => item.id !== visit.id), visit],
              updatedAt: visit.visitedAt,
            }));
            Alert.alert("Checked in", `${venue.name} and your ${rating}-star rating have been saved.`);
          },
        })),
        { text: "Cancel", style: "cancel" },
      ]);
    };
    return (
      <View
        style={[
          s.nextMatchCard,
          {
            borderColor: favouriteClub.primary,
            backgroundColor: `${favouriteClub.primary}14`,
          },
        ]}
      >
        <Text
          style={[
            s.nextMatchKicker,
            { color: visibleInkOnCream(favouriteClub.primary) },
          ]}
        >
          NEXT MATCH
        </Text>
        <View style={s.nextMatchMainRow}>
          <View
            style={[
              s.fixtureHomeAwayChip,
              { backgroundColor: isHome ? favouriteClub.primary : "#e5e0d5" },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "900",
                color: isHome
                  ? readableTextColour(favouriteClub.primary)
                  : "#657069",
              }}
            >
              {isHome ? "H" : "A"}
            </Text>
          </View>
          <Text numberOfLines={1} style={s.nextMatchOpponent}>
            {isHome ? match.awayName : match.homeName}
          </Text>
        </View>
        <Text style={s.nextMatchMeta}>
          {formatFixtureDay(match.date)}
          {formatKickoffTime(match.kickoff)
            ? ` · Kick-off ${formatKickoffTime(match.kickoff)}`
            : " · Kick-off TBC"}
        </Text>
        <Text style={s.nextMatchCompetition}>
          {match.competition ?? favouriteClub.league}
          {isHome ? " · Home" : " · Away"}
        </Text>
        {nextWeather && nextWeather.key === String(match.id) ? (
          nextWeather.loading ? (
            <Text style={s.weatherLine}>Checking weather…</Text>
          ) : nextWeather.data ? (
            <Text style={s.weatherLine}>
              {nextWeather.data.icon} {nextWeather.data.label}
              {nextWeather.data.tempC != null
                ? ` · ${Math.round(nextWeather.data.tempC)}°C`
                : ""}
              {nextWeather.data.precipProb != null
                ? ` · ${nextWeather.data.precipProb}% rain`
                : ""}
            </Text>
          ) : null
        ) : null}
        {installedNavigationApps.checked &&
        (installedNavigationApps.waze || installedNavigationApps.google) ? (
        <Pressable
          onPress={openDirections}
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            marginTop: 12,
            borderWidth: 1,
            borderColor: visibleInkOnCream(favouriteClub.primary),
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          accessibilityLabel="Navigate to the match ground"
        >
          <Ionicons
            name="navigate-outline"
            size={15}
            color={visibleInkOnCream(favouriteClub.primary)}
          />
          <Text
            style={{
              marginLeft: 6,
              fontSize: 12,
              fontWeight: "800",
              color: visibleInkOnCream(favouriteClub.primary),
            }}
          >
            Get Directions
          </Text>
        </Pressable>
        ) : null}
        <Pressable
          onPress={startMatchdayExperience}
          style={({ pressed }) => ({
            marginTop: 14,
            width: "100%",
            borderRadius: 14,
            borderWidth: 2,
            borderColor: favouriteClub.primary,
            backgroundColor: favouriteClub.primary,
            paddingHorizontal: 16,
            paddingVertical: 14,
            opacity: pressed ? 0.72 : 1,
          })}
          accessibilityLabel="Open Matchday Experience"
        >
          <Text style={{ textAlign: "center", fontSize: 17, fontWeight: "900", color: readableTextColour(favouriteClub.primary) }}>
            MATCHDAY EXPERIENCE
          </Text>
          <Text style={{ textAlign: "center", marginTop: 4, fontSize: 11, fontWeight: "700", color: readableTextColour(favouriteClub.primary) }}>
            {matchdayExperience ? "Continue your matchday" : "Save places, photos and videos from your day"}
          </Text>
        </Pressable>

        {activeMatchdayExperienceId === matchdayExperience?.id ? (
          <View style={{ marginTop: 10, borderWidth: 2, borderColor: favouriteClub.primary, borderRadius: 12, padding: 12, backgroundColor: "#fffdf8" }}>
            <Pressable
              onPress={() => updateMatchdayExperience((current) => ({ ...current, collapsed: !current.collapsed, updatedAt: new Date().toISOString() }))}
              accessibilityLabel={matchdayExperience.collapsed ? "Open Matchday Experience started box" : "Close Matchday Experience started box"}
            >
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#17221c" }}>
                MATCHDAY EXPERIENCE STARTED {matchdayExperience.collapsed ? "＋" : "−"}
              </Text>
            </Pressable>
            {!matchdayExperience.collapsed ? (
              <>
                <Text style={[s.helpText, { marginTop: 4, marginBottom: 8 }]}>
                  {matchdayExperience.supporter === "home" ? "Home fan" : "Away fan"} · {matchdayExperience.groundName}
                </Text>
                <Pressable
                  onPress={() => updateMatchdayExperience((current) => ({ ...current, captureEnabled: !current.captureEnabled, updatedAt: new Date().toISOString() }))}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: matchdayExperience.captureEnabled }}
                  style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>
                    CAPTURE {matchdayExperience.captureEnabled ? "ON" : "OFF"}
                  </Text>
                </Pressable>
                <Text style={[s.helpText, { marginTop: 6, marginBottom: 8 }]}>
                  {matchdayExperience.captureEnabled ? "New Matchday Experience information can be saved." : "Paused. Previously saved information is kept."}
                </Text>
                <Text style={[s.helpText, { marginTop: 0, marginBottom: 8, fontWeight: "900" }]}>
                  Matchday Experience information will only be kept if you attend the match.
                </Text>
                <View style={{ gap: 7 }}>
                  {([
                    ["pub", "Find / Check in to Pub"],
                    ["restaurant", "Find / Check in to Restaurant"],
                    ["carPark", "Find / Check in to Car Park"],
                  ] as const).map(([kind, label]) => (
                    <Pressable
                      key={kind}
                      disabled={!matchdayExperience.captureEnabled}
                      onPress={() => void openMatchdayFinder(kind)}
                      style={{ borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 9, padding: 9, opacity: matchdayExperience.captureEnabled ? 1 : 0.45 }}
                    >
                      <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {matchdayFinder === "carPark" ? (
                  <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: `${favouriteClub.primary}33`, paddingTop: 9 }}>
                    <Text style={{ fontSize: 12, fontWeight: "900", color: "#17221c", marginBottom: 6 }}>CAR PARKS NEAR YOU</Text>
                    <Pressable onPress={() => void openMatchdayFinder("carPark", true)} style={{ alignSelf: "flex-start", marginBottom: 7, borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>UPDATE LIVE LOCATION</Text>
                    </Pressable>
                    {!parkingPanel || parkingPanel.distanceFrom !== "current" ? (
                      <Text style={s.weatherLine}>Press Update live location to find the three closest car parks.</Text>
                    ) : parkingPanel.loading ? <Text style={s.weatherLine}>Finding the three closest car parks…</Text> : parkingPanel.error ? (
                      <Pressable onPress={() => openGoogleSearch("car parks near me")}><Text style={{ fontSize: 12, fontWeight: "800", color: visibleInkOnCream(favouriteClub.primary) }}>Results unavailable · Search Google Maps</Text></Pressable>
                    ) : parkingPanel.items.slice(0, 3).map((carPark) => (
                      <View key={carPark.id} style={{ paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ded8ca" }}>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#17221c" }}>{carPark.name} · {carPark.distanceMiles.toFixed(1)} miles</Text>
                        <Pressable onPress={() => checkInMatchdayVenue(carPark, "carPark")} style={{ marginTop: 6, borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, padding: 7 }}>
                          <Text style={{ textAlign: "center", fontSize: 11, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>CHECK IN TO CAR PARK</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
                {(matchdayFinder === "pub" || matchdayFinder === "restaurant") && nearbyVenuePanel?.distanceFrom === "current" ? (
                  <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: `${favouriteClub.primary}33`, paddingTop: 9 }}>
                    <Text style={{ fontSize: 12, fontWeight: "900", color: "#17221c", marginBottom: 6 }}>{matchdayFinder === "pub" ? "PUBS" : "RESTAURANTS"} NEAR YOU</Text>
                    <TextInput
                      value={matchdayVenueQuery}
                      onChangeText={setMatchdayVenueQuery}
                      placeholder={matchdayFinder === "pub" ? "Search pub name or area" : "Try Pizza Express or Pizza Express Watford Road"}
                      autoCorrect
                      autoCapitalize="words"
                      returnKeyType="search"
                      clearButtonMode="while-editing"
                      accessibilityLabel={`Search for a ${matchdayFinder}`}
                      style={{
                        borderWidth: 1,
                        borderColor: favouriteClub.primary,
                        borderRadius: 9,
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                        marginBottom: 8,
                        color: "#17221c",
                        backgroundColor: "#ffffff",
                      }}
                    />
                    {nearbyVenuePanel.loading ? <Text style={s.weatherLine}>Finding nearby places…</Text> : nearbyVenuePanel.error ? (
                      <Pressable onPress={() => openGoogleSearch(matchdayVenueQuery.trim() || `${matchdayFinder}s near me`)}><Text style={{ fontSize: 12, fontWeight: "800", color: visibleInkOnCream(favouriteClub.primary) }}>Results unavailable · Search Maps</Text></Pressable>
                    ) : nearbyVenuePanel.items.slice(0, 5).map((venue) => (
                      <View key={venue.id} style={{ paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ded8ca" }}>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#17221c" }}>{venue.name} · {venue.distanceMiles.toFixed(1)} miles</Text>
                        {venue.address ? <Text style={s.weatherLine}>{venue.address}</Text> : null}
                        {venue.cuisine ? <Text style={s.weatherLine}>Cuisine: {venue.cuisine}</Text> : null}
                        <Pressable onPress={() => openVenueGoogle(venue)} style={{ marginTop: 6, borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, padding: 7 }}>
                          <Text style={{ textAlign: "center", fontSize: 11, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>NAVIGATE HERE</Text>
                        </Pressable>
                        <Pressable onPress={() => checkInMatchdayVenue(venue, matchdayFinder)} style={{ marginTop: 6, borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, padding: 7 }}>
                          <Text style={{ textAlign: "center", fontSize: 11, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>CHECK IN TO {matchdayFinder === "pub" ? "PUB" : "RESTAURANT"}</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}

        <Text style={[s.helpText, { marginTop: 12, marginBottom: 0, fontWeight: "800" }]}>STADIUM INFORMATION</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <Pressable
            onPress={openParking}
            style={{ borderWidth: 1, borderColor: visibleInkOnCream(favouriteClub.primary), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
            accessibilityLabel="Find parking near the match ground"
          >
            <Text style={{ fontSize: 12, fontWeight: "800", color: visibleInkOnCream(favouriteClub.primary) }}>Car Parks near Stadium</Text>
          </Pressable>
          <Pressable
            onPress={() => openNearby("pub")}
            style={{ borderWidth: 1, borderColor: visibleInkOnCream(favouriteClub.primary), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
            accessibilityLabel="Find pubs near the match ground"
          >
            <Text style={{ fontSize: 12, fontWeight: "800", color: visibleInkOnCream(favouriteClub.primary) }}>Pubs near Stadium</Text>
          </Pressable>
          <Pressable
            onPress={() => openNearby("restaurant")}
            style={{ borderWidth: 1, borderColor: visibleInkOnCream(favouriteClub.primary), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
            accessibilityLabel="Find restaurants near the match ground"
          >
            <Text style={{ fontSize: 12, fontWeight: "800", color: visibleInkOnCream(favouriteClub.primary) }}>Restaurants near Stadium</Text>
          </Pressable>
          <Pressable
            onPress={openGroundView}
            style={{ borderWidth: 1, borderColor: visibleInkOnCream(favouriteClub.primary), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
            accessibilityLabel="View the match ground in Google Maps"
          >
            <Text style={{ fontSize: 12, fontWeight: "800", color: visibleInkOnCream(favouriteClub.primary) }}>View Stadium</Text>
          </Pressable>
        </View>
        {matchGround && parkingPanel?.groundId === matchGround.id && parkingPanel.distanceFrom !== "current" ? (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: `${favouriteClub.primary}33`, paddingTop: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "900", color: "#17221c", marginBottom: 6 }}>
              NEARBY CAR PARKS · DISTANCE TO STADIUM
            </Text>
            <Pressable onPress={() => { setParkingPanel(null); setMatchdayFinder(null); }} accessibilityLabel="Close car parks">
              <Text style={{ fontSize: 12, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary), marginBottom: 6 }}>CLOSE</Text>
            </Pressable>
            {parkingPanel.loading ? (
              <Text style={s.weatherLine}>Finding the three closest car parks…</Text>
            ) : parkingPanel.error ? (
              <Pressable onPress={() => openGoogleSearch(`car parks near ${matchGround.stadium}, ${targetClub}`)}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: visibleInkOnCream(favouriteClub.primary) }}>
                  Results unavailable · Search Google Maps
                </Text>
              </Pressable>
            ) : (
              parkingPanel.items.map((carPark) => (
                <View key={carPark.id} style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#ded8ca" }}>
                  {carPark.previewUri ? (
                    <Image alt={`Map preview for ${carPark.name}`} source={{ uri: carPark.previewUri }} resizeMode="cover" style={{ width: "100%", height: 105, borderRadius: 8, marginBottom: 6 }} />
                  ) : null}
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#17221c" }}>
                    {carPark.name} · {carPark.distanceMiles.toFixed(1)} miles
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    {installedNavigationApps.waze ? (
                    <Pressable onPress={() => openCarParkWaze(carPark)} style={{ borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>Waze</Text>
                    </Pressable>
                    ) : null}
                    {installedNavigationApps.google ? (
                    <Pressable onPress={() => openCarParkGoogle(carPark)} style={{ borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>Google Maps</Text>
                    </Pressable>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
        {matchGround && nearbyVenuePanel?.groundId === matchGround.id && nearbyVenuePanel.distanceFrom !== "current" ? (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: `${favouriteClub.primary}33`, paddingTop: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "900", color: "#17221c", marginBottom: 6 }}>
              {nearbyVenuePanel.kind === "pub" ? "NEARBY PUBS" : "NEARBY RESTAURANTS"} · DISTANCE TO STADIUM
            </Text>
            <Pressable onPress={() => { setNearbyVenuePanel(null); setMatchdayFinder(null); }} accessibilityLabel="Close nearby places">
              <Text style={{ fontSize: 12, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary), marginBottom: 6 }}>CLOSE</Text>
            </Pressable>
            {nearbyVenuePanel.loading ? (
              <Text style={s.weatherLine}>Finding nearby places…</Text>
            ) : nearbyVenuePanel.error ? (
              <Pressable onPress={() => openGoogleSearch(`${nearbyVenuePanel.kind}s near ${matchGround.stadium}, ${targetClub}`)}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: visibleInkOnCream(favouriteClub.primary) }}>
                  Results unavailable · Search Google Maps
                </Text>
              </Pressable>
            ) : (
              nearbyVenuePanel.items.map((venue) => (
                <View key={venue.id} style={{ paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#ded8ca" }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#17221c" }}>
                    {venue.name} · {venue.distanceMiles.toFixed(1)} miles
                  </Text>
                  {venue.cuisine ? (
                    <Text style={s.weatherLine}>Cuisine: {venue.cuisine}</Text>
                  ) : null}
                  <Pressable
                    onPress={() => openVenueGoogle(venue)}
                    style={{ alignSelf: "flex-start", marginTop: 6, borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    accessibilityLabel={`Navigate to ${venue.name} with Google Maps`}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>Google Maps</Text>
                  </Pressable>
                  {nearbyVenuePanel.distanceFrom === "current" && matchdayExperience ? (
                    <Pressable onPress={() => checkInMatchdayVenue(venue, nearbyVenuePanel.kind)} style={{ alignSelf: "stretch", marginTop: 7, borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, padding: 7 }}>
                      <Text style={{ textAlign: "center", fontSize: 11, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>CHECK IN TO {nearbyVenuePanel.kind === "pub" ? "PUB" : "RESTAURANT"}</Text>
                    </Pressable>
                  ) : null}
                  {nearbyVenuePanel.kind === "pub" ? (
                    <View style={{ marginTop: 8 }}>
                      <Pressable
                        onPress={() => {
                          setVisitedPubId((current) => current === venue.id ? null : venue.id);
                          setVisitedPubAudience(null);
                          setVisitedPubLocation(null);
                        }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: visitedPubId === venue.id }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>
                          {visitedPubId === venue.id ? "☑" : "☐"} WHERE DID YOU GO? · {venue.name}
                        </Text>
                      </Pressable>
                      {visitedPubId === venue.id ? (
                        <View style={{ marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: "#f5f1e8" }}>
                          <Text style={{ fontSize: 12, fontWeight: "800", marginBottom: 7 }}>Who was it suitable for?</Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                            {(["home", "away", "mixed", "unsure"] as PubSupporterAudience[]).map((audience) => (
                              <Pressable
                                key={audience}
                                onPress={() => setVisitedPubAudience(audience)}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: visitedPubAudience === audience }}
                                style={{ borderWidth: 1, borderColor: favouriteClub.primary, backgroundColor: visitedPubAudience === audience ? favouriteClub.secondary : "#ffffff", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: "800", textTransform: "capitalize" }}>{audience}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <Pressable
                            onPress={() => void confirmPubLocation(venue)}
                            style={{ marginTop: 8, borderWidth: 1, borderColor: favouriteClub.primary, borderRadius: 8, padding: 8 }}
                            accessibilityLabel={`Confirm current location at ${venue.name}`}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "900" }}>
                              {visitedPubLocation?.confirmed ? "✓ LOCATION CONFIRMED" : "CONFIRM I'M HERE"}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => submitPubVisit(venue)}
                            style={{ marginTop: 8, backgroundColor: favouriteClub.primary, borderRadius: 8, padding: 9 }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "900", textAlign: "center", color: readableTextColour(favouriteClub.primary) }}>SAVE VISIT</Text>
                          </Pressable>
                          <Text style={[s.weatherLine, { marginTop: 7 }]}>Saved privately. Supporter policy remains unverified until moderated.</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>
    );
  };
  const isFavouriteClubFixture = (fixture: FixtureRow) => {
    if (clubApiId && (fixture.homeId === clubApiId || fixture.awayId === clubApiId))
      return true;
    return [fixture.homeName, fixture.awayName].some((name) =>
      clubNamesMatch(name, favouriteClub.name),
    );
  };
  const nextFavouriteFixture = seasonFixtures.find(
    (fixture) =>
      fixture.season === CURRENT_SEASON &&
      !isFixturePlayed(fixture) &&
      Boolean(fixture.date) &&
      fixture.date! >= new Date().toLocaleDateString("en-CA") &&
      isFavouriteClubFixture(fixture),
  ) ?? null;
  const expectedFixtureClubKey = `${normaliseFixtureText(favouriteClub.name)}|${favouriteClub.league}|${CURRENT_SEASON}`;
  const verifiedNextFavouriteFixture =
    verifiedFixtureClubKey === expectedFixtureClubKey
      ? nextFavouriteFixture
      : null;

  useEffect(() => {
    if (!storageReady || !SiriShortcutsModule) return;
    const ticketSummaries = tickets.map((ticket) => {
      const dateLabel = ticket.matchDate
        ? new Date(`${ticket.matchDate}T12:00:00`).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "";
      const teams = [ticket.homeTeam, ticket.awayTeam].filter(Boolean).join(" v ");
      const label = [teams || ticket.name, dateLabel].filter(Boolean).join(", ");
      return {
        id: ticket.id,
        label,
        searchable: [
          ticket.name,
          ticket.homeTeam,
          ticket.awayTeam,
          ticket.matchDate,
          dateLabel,
          ticket.competition,
          ticket.ground,
        ]
          .filter(Boolean)
          .join(" "),
      };
    });
    const fixture = verifiedNextFavouriteFixture;
    const memoryRecords = mergeHistoryRecords(
      attendanceHistory,
      deriveAttendancesFromTickets(
        tickets,
        ticketCollectionClubName ?? favouriteClub.name,
      ),
    );
    const matchSummaries = memoryRecords
      .filter((record) => record.confirmed && record.matchDate)
      .map((record) => {
        const dateLabel = record.matchDate
          ? new Date(`${record.matchDate}T12:00:00`).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "";
        const homeTeam = record.homeAway === "home" ? record.club : record.opponent;
        const awayTeam = record.homeAway === "away" ? record.club : record.opponent;
        return {
          id: record.id,
          label: `${homeTeam} v ${awayTeam}, ${dateLabel}`,
          searchable: [
            homeTeam,
            awayTeam,
            record.opponent,
            record.matchDate,
            dateLabel,
            record.competition,
            record.ground,
          ]
            .filter(Boolean)
            .join(" "),
          photoCount: matchPhotos[record.id]?.length ?? 0,
        };
      });
    const fixtureOpponent = fixture
      ? clubNamesMatch(fixture.homeName, favouriteClub.name)
        ? fixture.awayName
        : fixture.homeName
      : null;
    SiriShortcutsModule.updateSnapshot({
      favouriteClub: favouriteClub.name,
      tickets: ticketSummaries,
      matches: matchSummaries,
      nextFixture: fixture
        ? {
            label: [
              `${favouriteClub.name} v ${fixtureOpponent}`,
              fixture.date,
              formatKickoffTime(fixture.kickoff) || "kick-off to be confirmed",
            ].join(", "),
          }
        : null,
      grounds: FOOTBALL_GROUNDS.filter((ground) => ground.league !== "Historical").map(
        (ground) => ({
          name: ground.stadium,
          searchable: `${ground.stadium} ${ground.club}`,
          latitude: ground.latitude,
          longitude: ground.longitude,
        }),
      ),
    });
  }, [
    attendanceHistory,
    favouriteClub.name,
    matchPhotos,
    storageReady,
    ticketCollectionClubName,
    tickets,
    verifiedNextFavouriteFixture,
  ]);

  useEffect(() => {
    if (
      !storageReady ||
      !attendanceHistoryReady ||
      !siriEnabled ||
      !SiriShortcutsModule
    )
      return;
    const siriShortcuts = SiriShortcutsModule;
    const handleSiriAction = async () => {
      const action = await siriShortcuts.consumePendingAction().catch(
        () => null,
      );
      if (!action) return;
      if (action.type === "open") {
        setActiveTab(action.tab);
        return;
      }
      if (action.type === "ticket") {
        const ticket = tickets.find((item) => item.id === action.id);
        if (ticket) {
          setActiveTab("frames");
          setEnlargedTicketId(ticket.id);
        }
        return;
      }
      if (action.type === "memory") {
        setActiveTab("history");
        setHistoryView("matches");
        setSelectedHistoryRecordId(action.id);
        return;
      }
      if (action.type === "navigate") {
        const coordinates = `${action.latitude},${action.longitude}`;
        Alert.alert(`Navigate to ${action.name}`, "Choose your navigation app.", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Waze",
            onPress: () =>
              void Linking.openURL(`waze://?ll=${coordinates}&navigate=yes`).catch(
                () => Linking.openURL(`https://waze.com/ul?ll=${coordinates}&navigate=yes`),
              ),
          },
          {
            text: "Apple Maps",
            onPress: () =>
              void Linking.openURL(
                `http://maps.apple.com/?daddr=${coordinates}&dirflg=d`,
              ),
          },
        ]);
      }
    };
    void handleSiriAction();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void handleSiriAction();
    });
    return () => subscription.remove();
  }, [attendanceHistoryReady, siriEnabled, storageReady, tickets]);

  const openMainHome = () => {
    resetSeasonFrameZoom();
    setFinished(false);
    setHomeFrameFocused(false);
    setShowSeasonManager(false);
    setSeasonPickerOpen(false);
    setFullFrameSeasonMenuOpen(false);
    setFrameMenuOpen(false);
    setTicketStyleMenuOpen(false);
    setHomeFixturesProfileId(null);
    setProfileFixtures(null);
    setSelectedHistoryRecordId(null);
    setEnlargedTicketId(undefined);
    setActiveTab("frames");
  };

  const openMainTab = (tab: MainTab) => {
    if (tab === "frames") {
      openMainHome();
      return;
    }
    setShowSeasonManager(false);
    setSeasonPickerOpen(false);
    setFinished(false);
    setHomeFrameFocused(false);
    resetSeasonFrameZoom();
    setActiveTab(tab);
  };

  const bottomNav = () => (
    <BottomNavigation
      activeTab={activeTab}
      primaryColour={favouriteClub.primary}
      secondaryColour={favouriteClub.secondary}
      onOpenTab={openMainTab}
    />
  );
  const backToHomeButton = (marginBottom = 18) => (
    <BackToHomeButton
      primaryColour={favouriteClub.primary}
      onPress={openMainHome}
      marginBottom={marginBottom}
    />
  );

  // V3.9 — manual "Add Match To History". Suggestions come from the fixture
  // engine cache; saving goes through the same duplicate-safe upsert.
  function apiSeasonKeyForManualHistory(season: string): string {
    const start = Number(season.match(/^(\d{4})/)?.[1]);
    return Number.isFinite(start) ? `${start}-${start + 1}` : season;
  }

  async function loadManualFixturePoolForSeason(season: string) {
    const requestId = ++manualFixtureLoadRequestRef.current;

    setManualFixtureLoading(true);
    setManualFixturePool([]);

    try {
      const start = Number(season.match(/^(\d{4})/)?.[1]);
      const apiSeason = apiSeasonKeyForManualHistory(season);

      const fixtures =
        Number.isFinite(start) && start < 2007
          ? await getHistoricalSeasonFixtures(apiSeason)
          : getBundledCompetitionNamesForSeason(apiSeason).flatMap(
              (competition) =>
                getBundledCompetitionFixtures(competition, apiSeason),
            );

      const uniqueFixtures = Array.from(
        new Map(fixtures.map((fixture) => [fixture.id, fixture])).values(),
      ).sort(
        (a, b) =>
          (a.competition ?? "").localeCompare(b.competition ?? "") ||
          a.homeName.localeCompare(b.homeName) ||
          a.awayName.localeCompare(b.awayName) ||
          (a.date ?? "9999").localeCompare(b.date ?? "9999"),
      );

      if (requestId !== manualFixtureLoadRequestRef.current) return;

      setManualFixturePool(uniqueFixtures);
    } catch (error) {
      if (requestId !== manualFixtureLoadRequestRef.current) return;

      console.warn(
        "[manual-history] fixture load failed",
        season,
        error,
      );

      setManualFixturePool([]);

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      Alert.alert(
        "Historical fixtures could not load",
        `${season}: ${message}`,
      );
    } finally {
      if (requestId === manualFixtureLoadRequestRef.current) {
        setManualFixtureLoading(false);
      }
    }
  }

  function applyManualFixtureSelection(
    competition: string,
    homeTeam: string,
    awayTeam: string,
  ) {
    const fixture = manualFixturePool.find(
      (candidate) =>
        candidate.competition === competition &&
        clubNamesMatch(candidate.homeName, homeTeam) &&
        clubNamesMatch(candidate.awayName, awayTeam),
    );

    if (!fixture) return;

    const historyClub = resolvedHistoryClubName?.trim() ?? "";
    const historyClubIsAway =
      Boolean(historyClub) && clubNamesMatch(historyClub, fixture.awayName);
    const historyClubIsHome =
      Boolean(historyClub) && clubNamesMatch(historyClub, fixture.homeName);

    const club = historyClubIsAway
      ? fixture.awayName
      : fixture.homeName;

    const opponent = historyClubIsAway
      ? fixture.homeName
      : fixture.awayName;

    const homeAway: "home" | "away" =
      historyClubIsAway ? "away" : "home";

    const knownDate = fixture.date ?? "";
    const dateParts = knownDate.match(/^\d{4}-(\d{2})-(\d{2})$/);

    setManualDateMonth(dateParts?.[1] ?? "");
    setManualDateDay(dateParts?.[2] ?? "");
    setManualDateBlank(!knownDate);

    setDraftMatch((current) => ({
      ...current,
      club: historyClubIsHome || historyClubIsAway ? club : fixture.homeName,
      opponent:
        historyClubIsHome || historyClubIsAway
          ? opponent
          : fixture.awayName,
      matchDate: knownDate,
      competition: fixture.competition ?? competition,
      ground: fixture.venue ?? "",
      homeAway:
        historyClubIsHome || historyClubIsAway
          ? homeAway
          : "home",
      homeScore:
        fixture.homeScore != null ? String(fixture.homeScore) : "",
      awayScore:
        fixture.awayScore != null ? String(fixture.awayScore) : "",
      fixtureId: fixture.id,
      fixtureDateStatus:
        fixture.dateStatus ??
        (fixture.date ? "licensed-source" : "unknown"),
      resultOverride: null,
    }));
  }

  async function openAddMatchForm() {
    // Invalidate any older Manual Add load. Opening the screen should be
    // immediate; historical data is loaded only after CONFIRM SEASON.
    manualFixtureLoadRequestRef.current += 1;

    setDraftMatch({
      club: "",
      opponent: "",
      matchDate: "",
      season: activeSeason,
      competition: "",
      ground: "",
      homeAway: "home",
      homeScore: "",
      awayScore: "",
      notes: "",
      fixtureId: null,
      fixtureDateStatus: null,
      resultOverride: null,
    });

    setManualFixturePool([]);
    setManualFixtureLoading(false);
    setManualPickerStep(0);
    setManualPendingSeason(activeSeason);
    manualSeasonWheelValueRef.current = activeSeason;
    setManualPendingCompetition("");
    setManualPendingHomeTeam("");
    setManualPendingAwayTeam("");
    setManualHomeTeam("");
    setManualAwayTeam("");
    setManualDateDay("");
    setManualDateMonth("");
    setManualDateBlank(false);
    setShowAddMatch(true);
  }

  function applySuggestion(fixture: CachedFixture) {
    setDraftMatch((current) => ({
      ...current,
      fixtureId: fixture.fixtureId ?? null,
      fixtureDateStatus:
        fixture.dateStatus ?? (fixture.date ? "licensed-source" : null),
      opponent: fixture.opponent || current.opponent,
      // Never carry another fixture's date into an undated historical match.
      matchDate: fixture.date || "",
      season:
        canonicalSeason(fixture.date) ||
        (fixture.season ? fixture.season.replace("-", "/") : "") ||
        current.season,
      competition: fixture.competition || current.competition,
      ground: fixture.venue || current.ground,
      homeAway:
        fixture.homeAway === "away"
          ? "away"
          : fixture.homeAway === "home"
            ? "home"
            : current.homeAway,
      homeScore:
        fixture.homeScore != null
          ? String(fixture.homeScore)
          : current.homeScore,
      awayScore:
        fixture.awayScore != null
          ? String(fixture.awayScore)
          : current.awayScore,
      resultOverride: null,
    }));
  }

  async function saveManualMatch() {
    const club = draftMatch.club.trim() || resolvedHistoryClubName;
    if (!club) {
      Alert.alert(
        "Choose your club first",
        "Pick your club once and matches will link automatically.",
      );
      return;
    }
    const opponent = draftMatch.opponent.trim();

    if (!opponent) {
      Alert.alert(
        "Choose a fixture",
        "Select the season, division or competition, home team and away team.",
      );
      return;
    }

    let matchDate: string | null = null;

    if (!manualDateBlank) {
      if (!manualDateDay || !manualDateMonth) {
        Alert.alert(
          "Choose the match date",
          "Choose both a day and month, or select Leave date blank.",
        );
        return;
      }

      const seasonStart = Number(
        draftMatch.season.match(/^(\d{4})/)?.[1],
      );
      const day = Number(manualDateDay);
      const month = Number(manualDateMonth);

      if (
        !Number.isFinite(seasonStart) ||
        !Number.isFinite(day) ||
        !Number.isFinite(month)
      ) {
        Alert.alert("Invalid date", "Check the selected day and month.");
        return;
      }

      // A football season runs August–July. The selected season therefore
      // determines the year without inventing one.
      const year = month >= 8 ? seasonStart : seasonStart + 1;
      const candidate = `${year}-${String(month).padStart(2, "0")}-${String(
        day,
      ).padStart(2, "0")}`;

      const parsed = new Date(`${candidate}T12:00:00`);

      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== year ||
        parsed.getMonth() + 1 !== month ||
        parsed.getDate() !== day
      ) {
        Alert.alert(
          "Invalid date",
          "That day does not exist in the selected month.",
        );
        return;
      }

      matchDate = candidate;
    }

    const confirmingHistoricalDate =
      matchDate !== null &&
      Boolean(draftMatch.fixtureId) &&
      draftMatch.fixtureDateStatus === "unknown";

    if (confirmingHistoricalDate) {
      const selectedSeason =
        draftMatch.season.trim() || activeSeason;

      const expectedStart =
        Number(selectedSeason.match(/^(\d{4})/)?.[1]);

      const actualSeason = canonicalSeason(matchDate);
      const actualStart =
        Number(actualSeason.match(/^(\d{4})/)?.[1]);

      if (
        Number.isFinite(expectedStart) &&
        Number.isFinite(actualStart) &&
        expectedStart !== actualStart
      ) {
        Alert.alert(
          "Date is outside this season",
          `This fixture is from ${selectedSeason}. Check the match date and try again.`,
        );
        return;
      }

      try {
        await saveManualHistoryFixtureDateResolution(
          draftMatch.fixtureId!,
          matchDate!,
          "manual-entry",
        );
      } catch {
        Alert.alert(
          "Date not saved",
          "Ticket Frame could not save this historical fixture date. No match was added.",
        );
        return;
      }
    }
    const parseScore = (value: string) => {
      const trimmed = value.trim();
      if (!/^\d{1,3}$/.test(trimmed)) return null;
      return Number(trimmed);
    };
    const homeScore = parseScore(draftMatch.homeScore);
    const awayScore = parseScore(draftMatch.awayScore);
    let result: AttendanceResult | null = null;
    if (homeScore != null && awayScore != null) {
      const mine = draftMatch.homeAway === "home" ? homeScore : awayScore;
      const theirs = draftMatch.homeAway === "home" ? awayScore : homeScore;
      result = mine > theirs ? "win" : mine < theirs ? "loss" : "draw";
    }
    // An explicit W/D/L pick always wins over score inference.
    if (draftMatch.resultOverride) result = draftMatch.resultOverride;
    const homeClub = draftMatch.homeAway === "away" ? opponent : club;
    const resolvedGround =
      draftMatch.ground.trim() || findGroundForClub(homeClub)?.stadium || null;
    const { records, matchedExisting } = addManualAttendance(attendanceHistory, {
      club,
      opponent,
      matchDate,
      season:
        draftMatch.season.trim() || canonicalSeason(matchDate) || activeSeason,
      competition: draftMatch.competition.trim() || null,
      ground: resolvedGround,
      homeAway: draftMatch.homeAway,
      result,
      homeScore,
      awayScore,
      notes: draftMatch.notes.trim() || undefined,
      fixtureId: draftMatch.fixtureId ?? undefined,
      dateProvenance: matchDate
        ? draftMatch.fixtureDateStatus === "unknown"
          ? "manual-entry"
          : draftMatch.fixtureDateStatus === "manual-entry"
            ? "manual-entry"
            : draftMatch.fixtureDateStatus === "user-confirmed-photo"
              ? "user-confirmed-photo"
              : draftMatch.fixtureDateStatus === "user-confirmed-photo-gps"
                ? "user-confirmed-photo-gps"
                : draftMatch.fixtureId
                  ? "licensed-source"
                  : undefined
        : undefined,
    });
    setAttendanceHistory(records);
    setShowAddMatch(false);
    setHistoryView("home");
    Alert.alert(
      matchedExisting ? "Match updated" : "Match saved",
      matchedExisting
        ? `${club} v ${opponent} was already in your history — details merged, no duplicate added.`
        : `${club} v ${opponent} added to your football history.`,
    );
  }

  async function handleCreateLocalBackup() {
    if (localBackupBusy) return;
    setLocalBackupBusy(true);
    try {
      // Let queued Match Memory writes reach storage before taking the
      // snapshot, so the backup describes exactly what the user can see.
      await matchPhotoWriteChainRef.current.catch(() => {});
      const manifest = await createLocalBackup();
      setLocalBackupCreatedAt(manifest.createdAt);
      setCompletedTicketsSinceBackup(0);
      completedTicketIdsRef.current.clear();
      backupReminderPendingRef.current = false;
      await AsyncStorage.setItem(COMPLETED_TICKETS_SINCE_BACKUP_KEY, "0");
      Alert.alert(
        "Backup saved",
        "Tickets, history, settings and private ticket/Match Memory image copies are backed up on this iPhone.",
      );
    } catch {
      Alert.alert(
        "Backup not created",
        "Ticket Frame could not complete the backup. Your live data was not changed.",
      );
    } finally {
      setLocalBackupBusy(false);
    }
  }

  function handleRestoreLocalBackup() {
    if (!localBackupCreatedAt || localBackupBusy) return;
    Alert.alert(
      "Restore this backup?",
      "This replaces the current Ticket Frame data with the saved backup. It does not change your Apple Photos library.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: () => {
            setLocalBackupBusy(true);
            void restoreLocalBackup()
              .then(() =>
                Alert.alert(
                  "Backup restored",
                  "Close and reopen Ticket Frame to load the restored data.",
                ),
              )
              .catch(() =>
                Alert.alert(
                  "Restore failed",
                  "The live app data could not be replaced. The backup has been left in place.",
                ),
              )
              .finally(() => setLocalBackupBusy(false));
          },
        },
      ],
    );
  }

  function handleDeleteLocalBackup() {
    if (!localBackupCreatedAt || localBackupBusy) return;
    Alert.alert(
      "Delete backup?",
      "This removes only the backup. Your current tickets, history and photos stay in the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Backup",
          style: "destructive",
          onPress: () => {
            setLocalBackupBusy(true);
            void FileSystem.deleteAsync(LOCAL_BACKUP_DIRECTORY, {
              idempotent: true,
            })
              .then(() => {
                setLocalBackupCreatedAt(null);
                Alert.alert("Backup deleted", "Your live app data was not changed.");
              })
              .catch(() =>
                Alert.alert("Could not delete backup", "Please try again."),
              )
              .finally(() => setLocalBackupBusy(false));
          },
        },
      ],
    );
  }

  // V3.7 — first-launch gate: null = still resolving (splash), true =
  // introduction overlay. Existing users resolve to false and never see this.
  if (showDemoMode)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#10261c" }}>
        <DemoMode
          onExit={handleDemoExit}
          onAddFirstTicket={handleDemoAddFirstTicket}
        />
      </SafeAreaView>
    );

  if (showOnboarding !== false)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#10261c" }}>
        {showOnboarding ? (
          <OnboardingFlow
            key={resumeOnboardingAtClub ? "resume-club" : "fresh"}
            clubs={clubs}
            onComplete={handleOnboardingComplete}
            onLaunchDemo={openDemoModeFromOnboarding}
            startAtClub={resumeOnboardingAtClub}
          />
        ) : null}
      </SafeAreaView>
    );

  if (activeTab === "club")
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView
      contentContainerStyle={s.page}
      onScrollBeginDrag={Keyboard.dismiss}
      keyboardShouldPersistTaps="handled"
    >
          <Text style={s.kicker}>MY CLUB</Text>
          <Text style={[s.title, { color: visibleInkOnCream(favouriteClub.primary) }]}>Favourite team</Text>
          <Pressable
            style={[s.clubCard, { borderColor: visibleInkOnCream(favouriteClub.primary) }]}
            onPress={() => setActiveTab("frames")}
          >
            <View style={[s.colourDot, { backgroundColor: favouriteClub.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.clubName}>{favouriteClub.name}</Text>
              <Text>{favouriteClub.league}</Text>
            </View>
            <Ionicons name="star" size={22} color={favouriteClub.secondary} />
          </Pressable>
          <Text style={s.helpText}>
Choose one team. Its colours automatically control the Club Colours frame style.
</Text>

<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
  <TextInput
    placeholder="Search clubs..."
    value={clubSearch}
    onChangeText={setClubSearch}
    style={{
      borderWidth: 1,
      borderColor: "#cccccc",
      borderRadius: 10,
      padding: 12,
      flex: 1,
    }}
  />
  {clubSearch.length > 0 && (
    <Pressable
      hitSlop={12}
      onPress={() => setClubSearch("")}
      style={{ paddingHorizontal: 10 }}
    >
      <Ionicons name="close-circle" size={22} color="#999999" />
    </Pressable>
  )}
</View>
          {backToHomeButton(20)}
          {(() => {
            const query = clubSearch.trim().toLowerCase();
            const selectClub = (club: ClubOption) => {
              const theme = CLUB_THEME[club.name];
              setFavouriteClub({
                ...club,
                primary: theme?.[0] ?? club.primary,
                secondary: theme?.[1] ?? club.secondary,
              });
            };
            const renderClubRow = (club: ClubOption) => (
              <Pressable
                key={club.id}
                style={[s.clubRow, favouriteClub.id === club.id && s.clubRowSelected]}
                onPress={() => selectClub(club)}
              >
                <View style={[s.colourDot, { backgroundColor: club.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.clubRowText}>{club.name}</Text>
                  <Text style={{ color: "#777777", fontSize: 12 }}>{club.league}</Text>
                </View>
                {favouriteClub.id === club.id && <Ionicons name="checkmark-circle" size={20} color="#174532" />}
              </Pressable>
            );
            if (query) {
              const localMatches = clubs.filter((club) =>
                club.name.toLowerCase().includes(query),
              );
              const results = [...localMatches].sort((a, b) =>
                a.name.localeCompare(b.name),
              );
              return (
                <>
                  <Text style={s.leagueTitle}>
                    SEARCH RESULTS ({results.length})
                  </Text>
                  {results.map(renderClubRow)}
                  {!results.length && (
                    <Text style={s.helpText}>
                      No clubs match &ldquo;{clubSearch}&rdquo;. Keep typing or check the spelling.
                    </Text>
                  )}
                </>
              );
            }
            return ENGLISH_LEAGUES.map((league) => (
              <View key={league.label}>
                <Pressable
                  onPress={() =>
                    setOpenLeague(
                      openLeague === league.label ? "" : league.label
                    )
                  }
                >
                  <Text style={s.leagueTitle}>
                    {league.label}
                    {openLeague === league.label ? " ▲" : " ▼"}
                  </Text>
                </Pressable>
                {openLeague === league.label &&
                  clubs
                    .filter(
                      (club) =>
                        club.league === league.label &&
                        club.name
                          .toLowerCase()
                          .includes(clubSearch.toLowerCase()),
                    )
                    .map(renderClubRow)}
              </View>
            ));
          })()}
          {bottomNav()}
        </ScrollView>
      </SafeAreaView>
    );

  // V3.9.5 — MY HOME FIXTURES (season ticket attendance). Home fixtures
  // only — away games are never listed for a season ticket holder.
  const homeFixturesProfile = homeFixturesProfileId
    ? seasonTicketProfiles.find(
        (profile) => profile.id === homeFixturesProfileId,
      )
    : undefined;

  if (activeTab === "history" && homeFixturesProfile) {
    // V3.9.7 — fixtures come from the profile's OWN saved season (loaded by
    // loadProfileFixtures), home games only. CachedFixture rows carry the
    // opponent plus homeAway relative to the profile club.
    // My Home Fixtures is sourced exclusively from the selected
    // Season Ticket Profile's TFD-derived rows.
    const sharedByMatch = new Map<string, CachedFixture>();

    for (const fixture of profileFixtures ?? []) {
      sharedByMatch.set(
        `${fixture.date}|${normaliseFixtureText(fixture.opponent)}`,
        fixture,
      );
    }
    const orderedHomeFixtures = Array.from(sharedByMatch.values())
      .filter((fixture) => fixture.homeAway === "home")
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.opponent.localeCompare(b.opponent),
      );
    const currentSeason = seasonForDate(new Date());
    const isCurrentSeasonProfile =
      homeFixturesProfile.seasonKey === currentSeason;

    // V4.0.87 — A Current Season season ticket must expose the complete
    // home-fixture list, not only the next unplayed match.
    //
    // The fixture itself is the stable record. Scores/results enrich that
    // same cached fixture when they become available; an unplayed fixture is
    // never hidden merely because it does not have a result yet.
    const homeFixturesList = orderedHomeFixtures;
    // Attendance matching REQUIRES the actual fixture date (lib guard).
    const isSeasonAttended = (fixture: { opponent: string; date: string }) =>
      isSeasonFixtureAttended(attendanceHistory, fixture);
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: "#f5f1e8" }]}>
        <ScrollView
          style={{ backgroundColor: "#f5f1e8" }}
          contentContainerStyle={[s.page, { paddingBottom: 120 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={s.hxBack}
            hitSlop={8}
            onPress={() => {
              setHomeFixturesProfileId(null);
              setSeasonSeatDraft(null);
              setProfileFixtures(null);
            }}
          >
            <Ionicons name="arrow-back" size={18} color="#17221c" />
            <Text style={s.hxBackText}>Done</Text>
          </Pressable>
          <Text style={[s.kicker, { marginBottom: 6 }]}>
            🎟 SEASON TICKET PROFILE
          </Text>
          <Text style={[s.title, { color: "#17221c", fontSize: 26 }]}>
            My Home Fixtures
          </Text>
          <Text style={[s.helpText, { marginTop: 2, marginBottom: 16 }]}>
            {`${homeFixturesProfile.club} · ${homeFixturesProfile.seasonKey} — all home fixtures for the season. Results are added to these fixtures as they become available.`}
          </Text>

          {!profileFixtures || profileFixtures.length === 0 ? (
            <View style={[s.collectionCard, { borderColor: "#c9c2b1" }]}>
              <Text style={s.helpText}>
                {!profileFixtures
                  ? "Loading your club’s fixtures…"
                  : "No fixtures downloaded for this season yet."}
              </Text>
              <Pressable
                style={[s.resetButton, { backgroundColor: favouriteClub.primary }]}
                onPress={() => void loadProfileFixtures(homeFixturesProfile)}
              >
                <Text
                  style={[
                    s.resetButtonText,
                    { color: readableTextColour(favouriteClub.primary) },
                  ]}
                >
                  RETRY
                </Text>
              </Pressable>
            </View>
          ) : null}

          {profileFixtures &&
          profileFixtures.length > 0 &&
          homeFixturesList.length === 0 ? (
            <View style={[s.collectionCard, { borderColor: "#c9c2b1" }]}>
              <Text style={s.helpText}>
                No home fixtures found for this season yet.
              </Text>
            </View>
          ) : null}

          {homeFixturesList.map((fixture) => {
            const fixtureKey = `${fixture.date}|${fixture.opponent}`;
            const attended = isSeasonAttended(fixture);
            const attendanceRecord = attendanceHistory.find(
              (record) =>
                record.matchDate === fixture.date &&
                clubNamesMatch(record.club, homeFixturesProfile.club) &&
                normaliseFixtureText(record.opponent) ===
                  normaliseFixtureText(fixture.opponent),
            );
            const fixtureIndexDescriptor = mediaIndexFixtures.find(
              (item) => item.matchDate === fixture.date,
            );
            const fixturePhotos = attendanceRecord
              ? matchPhotos[attendanceRecord.id] ?? []
              : [];
            const fixtureReferencedMedia = attendanceRecord
              ? matchMediaReferences[attendanceRecord.id] ?? []
              : [];
            const fixtureHasPhoto =
              fixturePhotos.length > 0 ||
              fixtureReferencedMedia.some((media) => media.type === "photo");
            const fixtureHasVideo = fixtureReferencedMedia.some(
              (media) => media.type === "video",
            );
            const displayAttended =
              attended || fixtureHasPhoto || fixtureHasVideo;
            const photosExpanded =
              expandedSeasonPhotoFixtureKey === fixtureKey;
            const fixtureResult =
              fixture.homeScore != null && fixture.awayScore != null
                ? fixture.homeScore > fixture.awayScore
                  ? "W"
                  : fixture.homeScore < fixture.awayScore
                    ? "L"
                    : "D"
                : null;
            return (
              <View
                key={fixtureKey}
                onTouchStart={() => {
                  if (fixtureIndexDescriptor)
                    prioritizeMediaIndexFixture(fixtureIndexDescriptor);
                }}
                style={[
                  s.collectionCard,
                  {
                    flexDirection: "column",
                    alignItems: "stretch",
                    borderColor: favouriteClub.primary,
                    backgroundColor: "#fffdf8",
                    marginBottom: 14,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, color: "#657069", fontWeight: "700" }}
                  >
                    {formatHistoryDate(fixture.date)}
                  </Text>
                  {displayAttended ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove attended status"
                      onPress={() =>
                        Alert.alert(
                          "Remove attended status?",
                          `Remove ${homeFixturesProfile.club} v ${fixture.opponent} from your confirmed attendance? Saved photos and videos will not be deleted.`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Remove attendance",
                              style: "destructive",
                              onPress: () => {
                                if (!attendanceRecord) return;
                                const suppressionKey =
                                  attendanceSuppressionKey(attendanceRecord);
                                if (suppressionKey)
                                  setDeletedHistoryMatchKeys((current) => {
                                    const next = new Set(current);
                                    next.add(suppressionKey);
                                    return next;
                                  });
                                setAttendanceHistory((current) =>
                                  current.filter(
                                    (record) => record.id !== attendanceRecord.id,
                                  ),
                                );
                              },
                            },
                          ],
                        )
                      }
                      style={{
                        backgroundColor: "#1a7a3c",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fffaf2",
                          fontWeight: "900",
                          fontSize: 10,
                          letterSpacing: 0.6,
                        }}
                      >
                        ✓ ATTENDED
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "Confirm attendance?",
                          `Confirm that you attended ${homeFixturesProfile.club} v ${fixture.opponent}. Seat details are not required.`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Confirm attendance",
                              onPress: () => {
                                const { matchedExisting } =
                                  confirmSeasonAttendance(
                                    homeFixturesProfile,
                                    {
                                      opponent: fixture.opponent,
                                      date: fixture.date,
                                      competition: fixture.competition,
                                      venue: fixture.venue ?? null,
                                      homeScore: fixture.homeScore ?? null,
                                      awayScore: fixture.awayScore ?? null,
                                    },
                                    {
                                      stand: homeFixturesProfile.stand ?? "",
                                      block: homeFixturesProfile.block ?? "",
                                      row: homeFixturesProfile.row ?? "",
                                      seat: homeFixturesProfile.seat ?? "",
                                    },
                                  );
                                Alert.alert(
                                  matchedExisting
                                    ? "Already attended"
                                    : "Attendance confirmed",
                                  matchedExisting
                                    ? `${homeFixturesProfile.club} v ${fixture.opponent} was already in your history.`
                                    : `${homeFixturesProfile.club} v ${fixture.opponent} was added to your history.`,
                                );
                              },
                            },
                          ],
                        )
                      }
                      style={({ pressed }) => ({
                        borderWidth: 1.5,
                        borderColor: favouriteClub.primary,
                        borderRadius: 8,
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: visibleInkOnCream(favouriteClub.primary),
                          fontWeight: "900",
                          fontSize: 10,
                          letterSpacing: 0.4,
                        }}
                      >
                        I ATTENDED
                      </Text>
                    </Pressable>
                  )}
                  {fixtureHasPhoto || fixtureHasVideo ? (
                  <Pressable
                    hitSlop={8}
                    accessibilityLabel={
                      fixtureHasPhoto
                        ? "Saved match photos"
                        : "Add match photos"
                    }
                    disabled={photoAction === "choose"}
                    onPress={() => {
                      // Cached associations publish immediately; if this date
                      // has not been indexed yet it jumps ahead of the general
                      // library pass without starting a competing scan.
                      if (fixtureIndexDescriptor)
                        prioritizeMediaIndexFixture(fixtureIndexDescriptor);
                      setExpandedSeasonPhotoFixtureKey(
                        fixtureHasPhoto && photosExpanded
                          ? null
                          : fixtureKey,
                      );
                      if (fixtureHasPhoto) {
                        if (attendanceRecord) {
                          setHomeFixturesProfileId(null);
                          setSelectedHistoryRecordId(attendanceRecord.id);
                        }
                        return;
                      }
                      if (attendanceRecord) {
                        void chooseMatchPhotos(attendanceRecord);
                        return;
                      }
                      void chooseSeasonFixturePhotos(homeFixturesProfile, {
                        opponent: fixture.opponent,
                        date: fixture.date,
                        competition: fixture.competition || null,
                        venue: fixture.venue ?? null,
                        seasonKey: homeFixturesProfile.seasonKey,
                        homeScore: fixture.homeScore ?? null,
                        awayScore: fixture.awayScore ?? null,
                      });
                    }}
                    style={{ marginLeft: 7, opacity: photoAction === "choose" ? 0.5 : 1 }}
                  >
                    <Ionicons
                      name="camera"
                      size={19}
                      color={visibleInkOnCream(favouriteClub.primary)}
                    />
                  </Pressable>
                  ) : displayAttended ? (
                    <Pressable
                      hitSlop={8}
                      accessibilityLabel="Find match photos and videos"
                      onPress={() => {
                        if (fixtureIndexDescriptor)
                          prioritizeMediaIndexFixture(fixtureIndexDescriptor);
                      }}
                      style={{ marginLeft: 8, paddingVertical: 5, paddingHorizontal: 7 }}
                    >
                      <Text style={{ color: visibleInkOnCream(favouriteClub.primary), fontWeight: "900", fontSize: 10 }}>
                        FIND MEDIA
                      </Text>
                    </Pressable>
                  ) : null}
                  {fixtureHasVideo ? (
                    <View
                      accessibilityLabel="Match has videos"
                      style={{ marginLeft: 7 }}
                    >
                      <Ionicons
                        name="videocam"
                        size={20}
                        color={visibleInkOnCream(favouriteClub.primary)}
                      />
                    </View>
                  ) : null}
                  {fixtureResult ? (
                    <View
                      style={{
                        backgroundColor:
                          fixtureResult === "W"
                            ? "#1a7a3c"
                            : fixtureResult === "L"
                              ? "#a03030"
                              : "#777777",
                        borderRadius: 8,
                        minWidth: 26,
                        marginLeft: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fffaf2", fontWeight: "900" }}>
                        {fixtureResult}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {fixture.competition ? (
                  <Text style={[s.hxComp, { textAlign: "left" }]}>
                    {fixture.competition.toUpperCase()}
                  </Text>
                ) : null}
                <Text style={[s.clubName, { marginTop: 4, flexShrink: 1 }]}> 
                  <Text style={{ fontWeight: "800" }}>{homeFixturesProfile.club}</Text>
                  {" v "}
                  <Text>{fixture.opponent}</Text>
                  {fixture.homeScore != null && fixture.awayScore != null
                    ? `   ${fixture.homeScore}-${fixture.awayScore}`
                    : ""}
                </Text>
                {fixture.venue ? (
                  <Text numberOfLines={1} style={{ color: "#657069", marginTop: 2 }}>
                    🏟 {fixture.venue}
                  </Text>
                ) : null}
                {attendanceRecord ? (
                  <Pressable
                    onPress={() => {
                      setHomeFixturesProfileId(null);
                      setSelectedHistoryRecordId(attendanceRecord.id);
                    }}
                    style={({ pressed }) => ({
                      marginTop: 10,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text
                      style={{
                        color: visibleInkOnCream(favouriteClub.primary),
                        fontWeight: "900",
                      }}
                    >
                      OPEN MATCH MEMORY
                    </Text>
                  </Pressable>
                ) : null}
                {photosExpanded && fixturePhotos.length ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: 10,
                    }}
                  >
                    {fixturePhotos.map((uri) => (
                      <View key={uri} style={{ width: "32.5%" }}>
                        <Image
                          alt="Match memory"
                          source={{ uri }}
                          style={{ width: "100%", aspectRatio: 1, borderRadius: 6 }}
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          {bottomNav()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (activeTab === "history") {

    // HISTORY CORRECTION FOUNDATION — derivation logic is unchanged in
    // V3.9.4. This release only redesigns how the archive is presented.
    const derivedFromTickets = deriveAttendancesFromTickets(
      tickets,
      resolvedHistoryClubName,
    );
    const manualRecords = attendanceHistory.filter(
      (record) => record.source !== "ticket",
    );
    const mergedHistory = mergeHistoryRecords(
      manualRecords,
      derivedFromTickets,
    ).filter((record) => {
      const key = attendanceSuppressionKey(record);
      return !key || !deletedHistoryMatchKeys.has(key);
    });
    const counts = historyCounts(mergedHistory);

    // SEASONS come from every valid saved ticket's seasonKey (all seasons,
    // never current-only), plus manually recorded seasons.
    const seasonKeySet = new Set<string>();
    const ticketsPerSeason = new Map<string, number>();
    for (const ticket of tickets) {
      if (
        ticket.seasonKey?.trim() &&
        (ticket.ticketType === "Season Ticket" || isValidMatchTicket(ticket))
      )
        seasonKeySet.add(ticket.seasonKey.trim());
      const key = ticket.seasonKey?.trim();
      if (key && isValidMatchTicket(ticket))
        ticketsPerSeason.set(key, (ticketsPerSeason.get(key) ?? 0) + 1);
    }
    // Photo/GPS discovery and manual history can create a valid match without
    // a saved ticket. Its season must still appear in the season wheel.
    for (const record of mergedHistory) {
      const key = record.season?.trim();
      if (key) seasonKeySet.add(key);
    }
    counts.seasons = seasonKeySet.size;

    const suggestionChips = fixtureSuggestions
      .filter(
        (fixture, index, all) =>
          all.findIndex((f) => clubNamesMatch(f.opponent, fixture.opponent)) === index,
      )
      .slice(0, 6);

    // ---------- archive view data ----------
    const newestFirst = newestConfirmedHistory(mergedHistory);
    const competitionOptions = historyCompetitionOptions(mergedHistory);
    const competitionSelector = (
      <HistoryCompetitionSelector
        options={competitionOptions}
        selected={matchCompetitionFilter}
        open={competitionMenuOpen}
        accent={favouriteClub.primary}
        onToggle={() => setCompetitionMenuOpen((open) => !open)}
        onSelect={(option) => {
          setMatchCompetitionFilter(option);
          setCompetitionMenuOpen(false);
        }}
      />
    );

    const historySearchQuery = normaliseFixtureText(historySearch);
    const recordMatchesHistorySearch = (record: AttendanceRecord) =>
      !historySearchQuery ||
      [record.club, record.opponent, record.competition, record.ground,
        record.matchDate, record.season].some((value) =>
        normaliseFixtureText(value ?? "").includes(historySearchQuery),
      );
    const historySearchBox = (
      <TextInput
        value={historySearch}
        onChangeText={setHistorySearch}
        placeholder="Search fixtures or stadiums…"
        placeholderTextColor="#7a8179"
        clearButtonMode="while-editing"
        autoCorrect={false}
        returnKeyType="search"
        style={[s.historyInput, { marginBottom: 14 }]}
      />
    );

    const filteredMatches = filteredHistoryMatches(
      newestFirst,
      matchCompetitionFilter,
      "newest",
    ).filter(recordMatchesHistorySearch);
    const orderedMatches =
      matchSortOrder === "newest"
        ? filteredMatches
        : [...filteredMatches].reverse();

    // V4.0.86 — Matches Attended is organised as a season concertina.
    // Collapsed seasons render no match cards, which keeps History responsive.
    const matchHistorySeasonGroups = new Map<string, AttendanceRecord[]>();

    for (const record of orderedMatches) {
      const seasonKey = record.season?.trim() || "Season not set";
      const records = matchHistorySeasonGroups.get(seasonKey);

      if (records) {
        records.push(record);
      } else {
        matchHistorySeasonGroups.set(seasonKey, [record]);
      }
    }

    const orderedMatchHistorySeasonGroups =
      Array.from(matchHistorySeasonGroups.entries());

    const allMatchHistorySeasonsOpen =
      orderedMatchHistorySeasonGroups.length > 0 &&
      orderedMatchHistorySeasonGroups.every(([season]) =>
        expandedMatchHistorySeasons.has(season),
      );

    // Stadiums: each ground appears once; repeat matches add visits.
    const stadiumRows = historyStadiumRows(mergedHistory).filter(
      (stadium) =>
        !historySearchQuery ||
        normaliseFixtureText(`${stadium.name} ${stadium.club ?? ""}`).includes(
          historySearchQuery,
        ),
    );

    const seasonOptions = Array.from(seasonKeySet).sort().reverse();
    const seasonMatches = newestFirst.filter(
      (record) =>
        (seasonFilter === "All Seasons" || record.season === seasonFilter) &&
        recordMatchesHistorySearch(record),
    );
    const seasonStadiums = uniqueHistoryStadiumCount(seasonMatches);

    // V4.0.86 — Never mount every historical match just because Seasons opens.
    // All Seasons is grouped by season. A selected season only becomes a
    // concertina when it contains more than 15 matches.
    const seasonHistoryGroups = new Map<string, AttendanceRecord[]>();

    for (const record of seasonMatches) {
      const seasonKey = record.season?.trim() || "Season not set";
      const records = seasonHistoryGroups.get(seasonKey);

      if (records) {
        records.push(record);
      } else {
        seasonHistoryGroups.set(seasonKey, [record]);
      }
    }

    const orderedSeasonHistoryGroups =
      Array.from(seasonHistoryGroups.entries());

    const seasonHistoryNeedsConcertina =
      seasonFilter === "All Seasons" || seasonMatches.length > 15;
    // V4.0.86 PERFORMANCE:
    // fixtureForAttendance's first lookup requires an exact match date.
    // Index hydrated fixtures by date once, then give the matcher only that
    // small date bucket instead of making every History record scan the full
    // fixture collection. Its existing season/club matching and bundled-data
    // fallback remain unchanged, so this improves speed without changing
    // which fixture is considered correct.
    const historyFixturesByDate = new Map<string, CachedFixture[]>();

    for (const fixture of historyFixtures) {
      const dateKey = fixture.date;
      if (!dateKey) continue;

      const existing = historyFixturesByDate.get(dateKey);
      if (existing) existing.push(fixture);
      else historyFixturesByDate.set(dateKey, [fixture]);
    }

    // Foreground History must only use data already in memory/storage.
    // It must never open bundled historical football data just to calculate
    // the W/D/L header.
    const cachedFixtureForRecord = (
      record: AttendanceRecord,
    ): CachedFixture | undefined => {
      if (!record.matchDate) return undefined;

      const candidates =
        historyFixturesByDate.get(record.matchDate) ?? [];

      if (!candidates.length) return undefined;

      const targetSeason = String(record.season ?? "")
        .trim()
        .replace(
          /^(\d{4})\/(?:\d{2}|\d{4})$/,
          (_, year) => `${year}-${Number(year) + 1}`,
        );

      const exact = candidates.find((fixture) => {
        const fixtureSeason = String(fixture.season ?? "")
          .trim()
          .replace(
            /^(\d{4})\/(?:\d{2}|\d{4})$/,
            (_, year) => `${year}-${Number(year) + 1}`,
          );

        return (
          fixture.date === record.matchDate &&
          fixtureSeason === targetSeason &&
          clubNamesMatch(fixture.opponent, record.opponent)
        );
      });

      return exact;
    };

    // Match cards can still resolve more detail when actually opened/rendered.
    // The cache avoids resolving the same visible record twice.
    const historyFixtureByRecordId = new Map<
      string,
      CachedFixture | undefined
    >();

    const fixtureForRecord = (record: AttendanceRecord) => {
      if (historyFixtureByRecordId.has(record.id)) {
        return historyFixtureByRecordId.get(record.id);
      }

      const cached = cachedFixtureForRecord(record);

      if (cached) {
        historyFixtureByRecordId.set(record.id, cached);
        return cached;
      }

      // Foreground History is cache-only. Missing enrichment must not
      // make navigation open bundled historical football datasets.
      const fixture = fixtureForAttendance(record, [], {
        allowBundledFallback: false,
      });

      historyFixtureByRecordId.set(record.id, fixture);
      return fixture;
    };

    const scoresForRecord = (record: AttendanceRecord) =>
      scoresForAttendance(record, fixtureForRecord(record));

    const resultForRecord = (
      record: AttendanceRecord,
    ): AttendanceResult | null =>
      resultForAttendance(record, fixtureForRecord(record));

    // FAST summary path:
    // 1. saved result
    // 2. saved scores
    // 3. already-hydrated fixture
    // 4. unknown
    //
    // Never perform hidden historical lookup here.
    const cachedResultForRecord = (
      record: AttendanceRecord,
    ): AttendanceResult | null => {
      if (record.result) return record.result;

      if (
        record.homeScore != null &&
        record.awayScore != null
      ) {
        return resultForAttendance(record);
      }

      const fixture = cachedFixtureForRecord(record);

      return fixture
        ? resultForAttendance(record, fixture)
        : null;
    };

    const countHistoryResults = (
      records: AttendanceRecord[],
    ) => {
      let win = 0;
      let draw = 0;
      let loss = 0;

      for (const record of records) {
        const result = cachedResultForRecord(record);

        if (result === "win") win += 1;
        else if (result === "draw") draw += 1;
        else if (result === "loss") loss += 1;
      }

      return { win, draw, loss };
    };

    const seasonResults = countHistoryResults(seasonMatches);
    const matchResults = countHistoryResults(orderedMatches);

    const seasonTicketCount =
      seasonFilter === "All Seasons"
        ? Array.from(ticketsPerSeason.values()).reduce((a, b) => a + b, 0)
        : ticketsPerSeason.get(seasonFilter) ?? 0;

    // ---------- shared pieces ----------

    const hxBackButton = (onPress: () => void, label = "Back to History") => (
      <HistoryBackButton onPress={onPress} label={label} />
    );

    // V4.0.86 — The three History statistics are also the permanent History
    // navigation. Matches Attended is the default; the active section is
    // highlighted using the user's favourite-club colour.
    const historySectionTabs = (
      <View style={[s.historyCountsRow, { marginBottom: 20 }]}>
        {(
          [
            ["MATCHES ATTENDED", counts.matches, "matches"],
            ["STADIUMS ATTENDED", counts.grounds, "stadiums"],
            ["SEASONS", counts.seasons, "seasons"],
          ] as const
        ).map(([label, value, target]) => {
          const activeTarget =
            historyView === "home" || historyView === "matches"
              ? "matches"
              : historyView;

          const active = activeTarget === target;

          return (
            <Pressable
              key={label}
              onPress={() => {
                setCompetitionMenuOpen(false);

                if (target === "matches") {
                  setHistoryView("home");
                } else {
                  setHistoryView(target);
                }
              }}
              style={[
                s.historyCountCard,
                {
                  borderColor: favouriteClub.primary,
                  backgroundColor: active
                    ? favouriteClub.primary
                    : `${favouriteClub.primary}0d`,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  s.historyCountNumber,
                  {
                    color: active
                      ? readableTextColour(favouriteClub.primary)
                      : visibleInkOnCream(favouriteClub.primary),
                  },
                ]}
              >
                {value}
              </Text>

              <Text
                style={[
                  s.historyCountLabel,
                  active && {
                    color: readableTextColour(favouriteClub.primary),
                  },
                ]}
                numberOfLines={2}
              >
                {label}
              </Text>

              <Text
                style={[
                  s.hxCardCta,
                  active && {
                    color: readableTextColour(favouriteClub.primary),
                  },
                ]}
              >
                {active ? "SELECTED" : "VIEW →"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );

    const hxShell = (content: React.ReactNode) => (
      <>
        <SafeAreaView style={[s.safe, { backgroundColor: "#f5f1e8" }]}>
          <ScrollView
            ref={historyScrollRef}
            style={{ backgroundColor: "#f5f1e8" }}
            contentContainerStyle={[s.page, { paddingBottom: 120 }]}
            onScroll={(event) => {
              if (
                (historyView === "matches" || historyView === "home") &&
                !selectedHistoryRecordId
              ) {
                historyScrollOffsetRef.current =
                  event.nativeEvent.contentOffset.y;
              }
            }}
            scrollEventThrottle={16}
            onScrollBeginDrag={Keyboard.dismiss}
            keyboardShouldPersistTaps="handled"
          >
            {content}
            {bottomNav()}
          </ScrollView>
        </SafeAreaView>
        {(() => {
          const linkedTicket = enlargedTicketId
            ? tickets.find((ticket) => ticket.id === enlargedTicketId)
            : undefined;
          // This callback runs only after a button press, never during render.
          /* eslint-disable react-hooks/refs */
          const openLinkedTicketActions = linkedTicket
            ? () => showTicketActions(linkedTicket)
            : undefined;
          /* eslint-enable react-hooks/refs */
          return linkedTicket ? (
            <TicketViewer
              ticket={linkedTicket}
              accent={favouriteClub.primary}
              onClose={() => setEnlargedTicketId(undefined)}
              onActions={openLinkedTicketActions!}
            />
          ) : null;
        })()}
        {enlargedMatchPhotoUri ? (
          <MatchPhotoViewer
            uri={enlargedMatchPhotoUri}
            loading={enlargedMatchPhotoLoading}
            error={enlargedMatchPhotoError}
            onClose={closeEnlargedMatchPhoto}
            onRetry={() => enlargedMatchPhotoRetryRef.current?.()}
            onLoadStart={() => setEnlargedMatchPhotoLoading(true)}
            onLoadEnd={() => setEnlargedMatchPhotoLoading(false)}
            onImageError={() => {
              if (enlargedMatchPhotoLoading) return;
              setEnlargedMatchPhotoError(
                "Ticket Frame could not display this photo. Tap try again to request it from Apple Photos.",
              );
            }}
          />
        ) : null}
      </>
    );

    const renderMatchCard = (record: AttendanceRecord) => {
      const scores = scoresForRecord(record);
      const displayedHomeScore = scores.home;
      const displayedAwayScore = scores.away;
      const displayedResult = resultForRecord(record);
      const resultColour =
        displayedResult === "win"
          ? "#1a7a3c"
          : displayedResult === "loss"
            ? "#a03030"
            : "#777777";
      const referencedMedia = matchMediaReferences[record.id] ?? [];
      const hasMatchPhoto =
        (matchPhotos[record.id] ?? []).length > 0 ||
        referencedMedia.some((media) => media.type === "photo");
      const hasMatchVideo = referencedMedia.some(
        (media) => media.type === "video",
      );

      return (
        <Pressable
          key={record.id}
          onPress={() => {
            if (historySelectionMode) {
              setSelectedHistoryDeleteIds((current) => {
                const next = new Set(current);
                if (next.has(record.id)) next.delete(record.id);
                else next.add(record.id);
                return next;
              });
              return;
            }
            setSelectedHistoryRecordId(record.id);
          }}
          style={[
            s.collectionCard,
            {
              flexDirection: "column",
              alignItems: "stretch",
              borderColor: selectedHistoryDeleteIds.has(record.id)
                ? "#a03030"
                : favouriteClub.primary,
              borderWidth: selectedHistoryDeleteIds.has(record.id) ? 3 : undefined,
              backgroundColor: selectedHistoryDeleteIds.has(record.id)
                ? "#fff1ee"
                : "#fffdf8",
              marginBottom: 14,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              numberOfLines={1}
              style={{ flex: 1, color: "#657069", fontWeight: "700" }}
            >
              {formatHistoryDate(record.matchDate)}
            </Text>
            {hasMatchPhoto ? (
              <View
                accessibilityLabel="Match has photos"
                style={{ marginRight: hasMatchVideo || displayedResult ? 7 : 0 }}
              >
                <Ionicons
                  name="camera"
                  size={19}
                  color={visibleInkOnCream(favouriteClub.primary)}
                />
              </View>
            ) : null}
            {hasMatchVideo ? (
              <View
                accessibilityLabel="Match has videos"
                style={{ marginRight: displayedResult ? 7 : 0 }}
              >
                <Ionicons
                  name="videocam"
                  size={20}
                  color={visibleInkOnCream(favouriteClub.primary)}
                />
              </View>
            ) : null}
            {displayedResult ? (
              <View
                style={{
                  backgroundColor: resultColour,
                  borderRadius: 8,
                  minWidth: 26,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fffaf2", fontWeight: "900", fontSize: 12 }}
                >
                  {displayedResult === "win"
                    ? "W"
                    : displayedResult === "loss"
                      ? "L"
                      : "D"}
                </Text>
              </View>
            ) : null}
          </View>
          {record.competition ? (
            <Text numberOfLines={1} style={s.hxComp}>
              {record.competition.toUpperCase()}
            </Text>
          ) : null}
          <Text style={[s.clubName, { marginTop: 4 }]}> 
            {!record.opponent ? (
              <>{record.club}</>
            ) : (fixtureForRecord(record)?.homeAway ?? record.homeAway) === "home" ? (
              <>
                <Text style={{ fontWeight: "800" }}>{record.club}</Text>
                {" v "}
                <Text>{record.opponent}</Text>
              </>
            ) : (
              <>
                <Text>{record.opponent}</Text>
                {" v "}
                <Text style={{ fontWeight: "800" }}>{record.club}</Text>
              </>
            )}
            {displayedHomeScore != null && displayedAwayScore != null
              ? `   ${displayedHomeScore}-${displayedAwayScore}`
              : ""}
          </Text>
          {(() => {
            const fixture = fixtureForRecord(record);
            return fixture?.shootoutWinner &&
              fixture.homeShootoutScore != null &&
              fixture.awayShootoutScore != null ? (
              <Text style={{ color: "#657069", marginTop: 2, fontWeight: "700" }}>
                {fixture.shootoutWinner === "home"
                  ? (fixture.homeAway === "home" ? record.club : record.opponent)
                  : (fixture.homeAway === "away" ? record.club : record.opponent)} won {fixture.homeShootoutScore}–{fixture.awayShootoutScore} on penalties
              </Text>
            ) : null;
          })()}
          {record.ground ? (
            <Text numberOfLines={1} style={{ color: "#657069", marginTop: 2 }}>
              🏟 {record.ground}
            </Text>
          ) : null}
          {record.notes ? (
            <Text
              numberOfLines={3}
              style={{ fontStyle: "italic", marginTop: 4, color: "#4d5a52" }}
            >
              “{record.notes}”
            </Text>
          ) : null}
          <Text
            style={{
              marginTop: 6,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 0.5,
              color: "#8a8375",
            }}
          >
            {HISTORY_SOURCE_LABEL[record.source]}
            {record.ticketId ? " · LINKED TO TICKET" : ""}
          </Text>
        </Pressable>
      );
    };

    const findPhotosAtGround = async (record: AttendanceRecord) => {
      if (!photoMemoriesEnabled) {
        Alert.alert(
          "Photos are off",
          "Turn on Use Photos for Match Memories in Settings first.",
        );
        return;
      }

      if (!record.matchDate || !record.ground) {
        Alert.alert(
          "Ground or date missing",
          "Add the match date and stadium first.",
        );
        return;
      }

      const ground = footballGroundForName(record.ground);
      if (!ground) {
        Alert.alert(
          "Stadium location unavailable",
          "Ticket Frame does not have coordinates for this stadium yet.",
        );
        return;
      }

      setPhotoAction("find");

      try {
        // Give the fixture search exclusive access to Photos, then resume the
        // durable general pass at its saved boundary in finally below.
        await stopMediaIndex();
        const permission = await MediaLibrary.requestPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Photos permission needed",
            "Allow photo and video access to find Match Memories.",
          );
          return;
        }

        const assets = await matchPhotoAssets(record.matchDate);
        const references = await matchGeotaggedMatchdayMedia(assets, ground);

        if (!references.length) {
          Alert.alert(
            "No stadium media found",
            `No photos or videos with matching location data were found for ${record.opponent || ground.stadium}.`,
          );
          return;
        }

        await persistMediaReferences(record.id, references);

        setAutoPhotoMatchedRecordIds((current) => {
          const next = new Set(current);
          next.add(record.id);
          void AsyncStorage.setItem(
            AUTO_PHOTO_MATCHED_KEY,
            JSON.stringify([...next]),
          );
          return next;
        });

        autoPhotoScannedRecordsRef.current.add(record.id);
        void AsyncStorage.setItem(
          AUTO_MEDIA_SCANNED_KEY,
          JSON.stringify([...autoPhotoScannedRecordsRef.current]),
        );

        setPhotoCandidates((current) => ({
          ...current,
          [record.id]: [],
        }));

        const photoCount = references.filter(
          (reference) => reference.type === "photo",
        ).length;
        const videoCount = references.filter(
          (reference) => reference.type === "video",
        ).length;

        Alert.alert(
          "Match media found",
          `${photoCount} photo${photoCount === 1 ? "" : "s"} and ${videoCount} video${videoCount === 1 ? "" : "s"} linked to this match.`,
        );
      } catch {
        Alert.alert(
          "Media search unavailable",
          "Ticket Frame could not complete the Photos search. Please try again.",
        );
      } finally {
        setPhotoAction(null);

        // Foreground interaction wins.
        // Do not immediately restart invisible Photos indexing after an
        // explicit user media search. The persistent index keeps its saved
        // progress and can resume later from that boundary.
      }
    };

    const renderMatchHistoryConcertina = () => (
      <>
        <View style={[s.hxSortRow, { marginBottom: 12 }]}>
          {(["newest", "oldest"] as const).map((order) => (
            <Pressable
              key={order}
              onPress={() => setMatchSortOrder(order)}
              style={[
                s.hxSortChip,
                matchSortOrder === order && s.hxSortChipOn,
              ]}
            >
              <Text
                style={[
                  s.hxSortChipText,
                  matchSortOrder === order && { color: "#fffaf2" },
                ]}
              >
                {order === "newest" ? "NEWEST FIRST" : "OLDEST FIRST"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: 12,
          }}
        >
          <Pressable
            onPress={() => {
              if (allMatchHistorySeasonsOpen) {
                setExpandedMatchHistorySeasons(new Set());
              } else {
                setExpandedMatchHistorySeasons(
                  new Set(
                    orderedMatchHistorySeasonGroups.map(
                      ([season]) => season,
                    ),
                  ),
                );
              }
            }}
            style={({ pressed }) => [
              s.hxSortChip,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityLabel={
              allMatchHistorySeasonsOpen
                ? "Close all match history seasons"
                : "Open all match history seasons"
            }
          >
            <Text style={s.hxSortChipText}>
              {allMatchHistorySeasonsOpen
                ? "CLOSE ALL SEASONS"
                : "OPEN ALL SEASONS"}
            </Text>
          </Pressable>
        </View>

        {orderedMatchHistorySeasonGroups.map(
          ([season, seasonRecords]) => {
            const expanded =
              expandedMatchHistorySeasons.has(season);

            return (
              <View key={season} style={{ marginBottom: 10 }}>
                <Pressable
                  onPress={() =>
                    setExpandedMatchHistorySeasons((current) => {
                      const next = new Set(current);

                      if (next.has(season)) {
                        next.delete(season);
                      } else {
                        next.add(season);
                      }

                      return next;
                    })
                  }
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`${season}, ${seasonRecords.length} ${
                    seasonRecords.length === 1 ? "match" : "matches"
                  }`}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    borderWidth: 2,
                    borderColor: favouriteClub.primary,
                    borderRadius: 12,
                    backgroundColor: "#fffdf8",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    opacity: pressed ? 0.65 : 1,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#17221c",
                        fontSize: 18,
                        fontWeight: "900",
                      }}
                    >
                      {season}
                    </Text>

                    <Text
                      style={{
                        color: "#657069",
                        fontSize: 12,
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                    >
                      {seasonRecords.length}{" "}
                      {seasonRecords.length === 1
                        ? "match"
                        : "matches"}
                    </Text>
                  </View>

                  <Ionicons
                    name={
                      expanded
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
                    size={22}
                    color={visibleInkOnCream(
                      favouriteClub.primary,
                    )}
                  />
                </Pressable>

                {expanded ? (
                  <View style={{ marginTop: 10 }}>
                    {seasonRecords.map(renderMatchCard)}
                  </View>
                ) : null}
              </View>
            );
          },
        )}
      </>
    );

    const selectedHistoryRecord = selectedHistoryRecordId
      ? mergedHistory.find((record) => record.id === selectedHistoryRecordId)
      : undefined;
    if (selectedHistoryRecord) {
      const selectedFixture = fixtureForRecord(selectedHistoryRecord);
      const directlyLinkedTicket = selectedHistoryRecord.ticketId
        ? tickets.find((ticket) => ticket.id === selectedHistoryRecord.ticketId)
        : undefined;
      const seasonProfile =
        selectedHistoryRecord.source === "season-ticket"
          ? seasonTicketProfiles.find(
              (profile) =>
                normaliseFixtureText(profile.club) ===
                  normaliseFixtureText(selectedHistoryRecord.club) &&
                profile.seasonKey === selectedHistoryRecord.season,
            )
          : undefined;
      const seasonTicket = seasonProfile
        ? tickets.find(
            (ticket) =>
              ticket.ticketType === "Season Ticket" &&
              ticket.seasonKey === seasonProfile.seasonKey &&
              (normaliseFixtureText(ticket.homeTeam ?? "") ===
                normaliseFixtureText(seasonProfile.club) ||
                currentTicketUri(ticket.uri) ===
                  currentTicketUri(seasonProfile.imageUri ?? undefined)),
          )
        : undefined;
      // A season-ticket attendance has no individual fixture ticket. Use the
      // saved season card as its ticket-photo link in Match Memory.
      const linkedTicket = directlyLinkedTicket ?? seasonTicket;
      // Never hand a legacy Apple Photos ph:// identifier directly to
      // React Native Image. The effect above resolves it to a local file and
      // then it appears here normally.
      const rawPhotos = (matchPhotos[selectedHistoryRecord.id] ?? []).filter(
        (uri) => !uri.startsWith("ph://"),
      );
      const resolvedMedia =
        resolvedMatchMedia[selectedHistoryRecord.id] ?? [];
      const referencedPhotos = resolvedMedia.filter(
        (media) => media.type === "photo",
      );
      const referencedVideos = resolvedMedia.filter(
        (media) => media.type === "video",
      );
      // A selected Apple Photos asset may also have an app-owned URI copy.
      // Render that underlying image once while retaining both durable records.
      const referencedPhotoUris = new Set(
        referencedPhotos.flatMap((media) =>
          [media.uri, media.localUri].filter((uri): uri is string => Boolean(uri)),
        ),
      );
      const photos = rawPhotos.filter((uri) => !referencedPhotoUris.has(uri));
      const activeVideo = referencedVideos.find(
        (media) => media.uri === selectedMatchVideoUri,
      );
      const activeVideoUri = activeVideo?.uri ?? null;
      const candidates = photoCandidates[selectedHistoryRecord.id] ?? [];
      const photosMatchedAutomatically = autoPhotoMatchedRecordIds.has(selectedHistoryRecord.id);
      const selectedMatchdayExperience = matchdayExperiences.find(
        (item) =>
          item.matchDate?.slice(0, 10) === selectedHistoryRecord.matchDate?.slice(0, 10) &&
          clubNamesMatch(item.clubName, selectedHistoryRecord.club) &&
          clubNamesMatch(item.opponentName, selectedHistoryRecord.opponent),
      );
      const selectedHistoryGround =
        (selectedHistoryRecord.ground
          ? footballGroundForName(selectedHistoryRecord.ground)
          : undefined) ??
        findGroundForClub(
          selectedHistoryRecord.homeAway === "away"
            ? selectedHistoryRecord.opponent
            : selectedHistoryRecord.club,
        );
      const hasStrictStadiumGps = (media: MatchMediaReference) =>
        Boolean(
          selectedHistoryGround &&
            typeof media.latitude === "number" &&
            typeof media.longitude === "number" &&
            Number.isFinite(media.latitude) &&
            Number.isFinite(media.longitude) &&
            distanceMiles(
              media.latitude,
              media.longitude,
              selectedHistoryGround.latitude,
              selectedHistoryGround.longitude,
            ) <= 1,
        );
      const mediaLocationItems = [
        ...photos.map((uri) => ({
          key: `${selectedHistoryRecord.id}|uri:${uri}`,
          type: "photo" as const,
          hasGps: false,
          automaticStadium: photosMatchedAutomatically,
        })),
        ...referencedPhotos.map((media) => ({
          key: `${selectedHistoryRecord.id}|asset:${media.assetId}`,
          type: "photo" as const,
          hasGps:
            typeof media.latitude === "number" &&
            typeof media.longitude === "number" &&
            Number.isFinite(media.latitude) &&
            Number.isFinite(media.longitude),
          automaticStadium:
            media.source === "automatic" || hasStrictStadiumGps(media),
        })),
        ...referencedVideos.map((media) => ({
          key: `${selectedHistoryRecord.id}|asset:${media.assetId}`,
          type: "video" as const,
          hasGps:
            typeof media.latitude === "number" &&
            typeof media.longitude === "number" &&
            Number.isFinite(media.latitude) &&
            Number.isFinite(media.longitude),
          automaticStadium:
            media.source === "automatic" || hasStrictStadiumGps(media),
        })),
      ];
      const stadiumLocationName =
        selectedHistoryRecord.ground ??
        selectedMatchdayExperience?.groundName ??
        "Stadium";
      const mediaLocationGroups = new Map<string, { assignment: MatchdayMediaAssignment; keys: string[]; photos: number; videos: number }>();
      for (const item of mediaLocationItems) {
        const persistedAssignment = matchdayMediaAssignments[item.key];
        const storedAssignment =
          item.automaticStadium &&
          (!persistedAssignment ||
            normaliseFixtureText(persistedAssignment.placeName) ===
              "unassigned media")
            ? {
                placeName: stadiumLocationName,
                placeKind: "stadium" as const,
                source: "automatic" as const,
              }
            : persistedAssignment ?? {
                placeName: item.hasGps ? "Matchday location" : "Unassigned media",
                placeKind: "location" as const,
                source: "automatic" as const,
              };
        const assignment =
        storedAssignment.placeKind === "stadium" &&
        normaliseFixtureText(storedAssignment.placeName) === "stadium"
          ? { ...storedAssignment, placeName: stadiumLocationName }
          : storedAssignment;
        const groupKey = `${assignment.placeKind}|${assignment.placeName}`;
        const group = mediaLocationGroups.get(groupKey) ?? { assignment, keys: [], photos: 0, videos: 0 };
        group.keys.push(item.key);
        if (item.type === "photo") group.photos += 1;
        else group.videos += 1;
        mediaLocationGroups.set(groupKey, group);
      }
      for (const visit of selectedMatchdayExperience?.venues ?? []) {
      const groupKey = `${visit.kind}|${visit.venueName}`;
      const existingGroup = mediaLocationGroups.get(groupKey);

      if (existingGroup) {
        existingGroup.assignment = {
          ...existingGroup.assignment,
          placeName: visit.venueName,
          placeKind: visit.kind,
          venueVisitId: visit.id,
        };
        mediaLocationGroups.set(groupKey, existingGroup);
      } else {
        mediaLocationGroups.set(groupKey, {
          assignment: {
            placeName: visit.venueName,
            placeKind: visit.kind,
            venueVisitId: visit.id,
            source: "automatic",
          },
          keys: [],
          photos: 0,
          videos: 0,
        });
      }
    }

    for (const location of matchdayCustomLocations[selectedHistoryRecord.id] ?? []) {
        const groupKey = `${location.kind}|${location.name}`;
        if (!mediaLocationGroups.has(groupKey)) {
          mediaLocationGroups.set(groupKey, {
            assignment: { placeName: location.name, placeKind: location.kind, source: "manual" },
            keys: [],
            photos: 0,
            videos: 0,
          });
        }
      }
      const orderedMediaLocationGroups = Array.from(mediaLocationGroups.values()).sort((a, b) => {
        if (a.assignment.placeKind === "stadium") return -1;
        if (b.assignment.placeKind === "stadium") return 1;
        const aCreated = (matchdayCustomLocations[selectedHistoryRecord.id] ?? []).find((item) => item.name === a.assignment.placeName)?.createdAt ?? "";
        const bCreated = (matchdayCustomLocations[selectedHistoryRecord.id] ?? []).find((item) => item.name === b.assignment.placeName)?.createdAt ?? "";
        return aCreated.localeCompare(bCreated);
      });
      const canAddHistoryVenue = Boolean(
        selectedHistoryRecord.confirmed &&
        linkedTicket &&
        selectedHistoryRecord.matchDate &&
        mediaLocationItems.length,
      );
      const createMediaLocation = () => {
        const addFolder = (kind: MatchdayCustomLocation["kind"]) => {
          const existing = matchdayCustomLocations[selectedHistoryRecord.id] ?? [];
          const baseName = kind === "pub" ? "New pub" : kind === "restaurant" ? "New restaurant" : "New train station";
          const sameTypeCount = existing.filter((item) => item.kind === kind).length;
          const name = sameTypeCount ? `${baseName} ${sameTypeCount + 1}` : baseName;
          const location: MatchdayCustomLocation = {
            id: `media-location|${Date.now()}|${kind}`,
            name,
            kind,
            createdAt: new Date().toISOString(),
          };
          setMatchdayCustomLocations((current) => ({
            ...current,
            [selectedHistoryRecord.id]: [...(current[selectedHistoryRecord.id] ?? []), location],
          }));
          setMediaEditMode(true);
          setSelectedMediaKeys(new Set());
          Alert.alert("Folder created", `Select the photos and videos for ${name}, then tap Move selected.`);
        };
        Alert.alert("New media location", "What type of place is it?", [
          { text: "Pub", onPress: () => addFolder("pub") },
          { text: "Restaurant", onPress: () => addFolder("restaurant") },
          { text: "Train station", onPress: () => addFolder("station") },
          { text: "Cancel", style: "cancel" },
        ]);
      };
      const addHistoryVenue = (
        keys: string[],
        kind: "stadium" | "pub" | "restaurant",
        suggestion?: NearbyVenueResult,
        onSaved?: (name: string) => void,
        confirmedFrom?: { latitude: number; longitude: number },
      ) => {
        if (!canAddHistoryVenue) {
          Alert.alert(
            "Attendance evidence needed",
            "A confirmed stadium visit, linked match ticket and same-day Match Memory media are required.",
          );
          return;
        }
        Alert.prompt(
          kind === "pub" ? "Which pub was this?" : "Which restaurant was this?",
          "Enter the venue name once for this whole photo group.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Next",
              onPress: (value?: string) => {
                const venueName = value?.trim() || suggestion?.name;
                if (!venueName) return;
                Alert.alert("Your rating", `Rate ${venueName}.`, [
                  ...([1, 2, 3, 4, 5] as const).map((rating) => ({
                    text: `${rating} ★`,
                    onPress: () => {
                      Alert.alert(
                        "Who is this venue suitable for?",
                        `Choose the supporter type for ${venueName}.`,
                        [
                          ...([
                            ["home", "Home fans"],
                            ["away", "Away fans"],
                            ["mixed", "Both"],
                            ["unsure", "Not sure"],
                          ] as const).map(([supporterAudience, label]) => ({
                            text: label,
                            onPress: () => {
                              const now = new Date().toISOString();
                              const ground =
                                footballGroundForName(selectedHistoryRecord.ground ?? "") ??
                                findGroundForClub(
                                  selectedHistoryRecord.homeAway === "away"
                                    ? selectedHistoryRecord.opponent
                                    : selectedHistoryRecord.club,
                                );
                              const experienceId =
                                selectedMatchdayExperience?.id ??
                                `history-matchday|${selectedHistoryRecord.id}`;
                              const visitId = `${experienceId}|${kind}|${normaliseFixtureText(venueName)}`;
                              const visit: MatchdayVenueVisit = {
                                id: visitId,
                                venueId: visitId,
                                venueName,
                                kind,
                                latitude: suggestion?.latitude,
                                longitude: suggestion?.longitude,
                                confirmedFromLatitude: confirmedFrom?.latitude,
                                confirmedFromLongitude: confirmedFrom?.longitude,
                                rating,
                                supporterAudience,
                                visitedAt: now,
                              };
                              setMatchdayExperiences((current) => {
                        const existing = current.find((item) => item.id === experienceId);
                        if (existing) {
                          return current.map((item) =>
                            item.id === experienceId
                              ? {
                                  ...item,
                                  venues: [...item.venues.filter((entry) => entry.id !== visitId), visit],
                                  updatedAt: now,
                                }
                              : item,
                          );
                        }
                        return [
                          ...current,
                          {
                            id: experienceId,
                            matchId: selectedHistoryRecord.id,
                            matchDate: selectedHistoryRecord.matchDate,
                            clubName: selectedHistoryRecord.club,
                            opponentName: selectedHistoryRecord.opponent,
                            groundId: ground?.id ?? `history-ground|${selectedHistoryRecord.id}`,
                            groundName: selectedHistoryRecord.ground ?? ground?.stadium ?? "Stadium",
                            supporter: selectedHistoryRecord.homeAway,
                            captureEnabled: false,
                            collapsed: true,
                            venues: [visit],
                            createdAt: now,
                            updatedAt: now,
                          },
                        ];
                      });
                      setMatchdayMediaAssignments((current) => {
                        const next = { ...current };
                        keys.forEach((key) => {
                          next[key] = {
                            placeName: venueName,
                            placeKind: kind,
                            venueVisitId: visitId,
                            source: "manual",
                          };
                        });
                        return next;
                      });
                              onSaved?.(venueName);
                            },
                          })),
                          { text: "Cancel", style: "cancel" },
                        ],
                      );
                    },
                  })),
                  { text: "Cancel", style: "cancel" },
                ]);
              },
            },
          ],
          "plain-text",
          suggestion?.name,
        );
      };
      const addSimpleHistoryLocation = (
        keys: string[],
        kind: "station",
        suggestion?: NearbyVenueResult,
        onSaved?: (name: string) => void,
      ) => {
        Alert.prompt(
          "Which train station was this?",
          "Choose a nearby suggestion or enter the station name.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Save",
              onPress: (value?: string) => {
                const placeName = value?.trim() || suggestion?.name;
                if (!placeName) return;
                setMatchdayMediaAssignments((current) => {
                  const next = { ...current };
                  keys.forEach((key) => {
                    next[key] = {
                      placeName,
                      placeKind: kind,
                      latitude: suggestion?.latitude,
                      longitude: suggestion?.longitude,
                      source: "manual",
                    };
                  });
                  return next;
                });
                onSaved?.(placeName);
              },
            },
          ],
          "plain-text",
          suggestion?.name,
        );
      };
      const findHistoryVenueNearMedia = async (
        keys: string[],
        kind: "location" | "pub" | "restaurant" | "station",
        onSaved?: (name: string) => void,
      ) => {
        let location: MediaLibrary.AssetInfo["location"] | null | undefined;

        for (const key of keys) {
          const marker = "|asset:";
          const markerIndex = key.indexOf(marker);
          if (markerIndex < 0) continue;

          const assetId = key.slice(markerIndex + marker.length);
          if (!assetId || assetId.startsWith("selected-")) continue;

          // Use Ticket Frame's permanent media GPS first. Only older media
          // references need to fall back to the Photos metadata cache.
          const reference = (
            matchMediaReferences[selectedHistoryRecord.id] ?? []
          ).find((item) => item.assetId === assetId);

          const referenceHasLocation =
            typeof reference?.latitude === "number" &&
            typeof reference?.longitude === "number" &&
            Number.isFinite(reference.latitude) &&
            Number.isFinite(reference.longitude);

          if (referenceHasLocation) {
            location = {
              latitude: reference.latitude as number,
              longitude: reference.longitude as number,
            };
            break;
          }

          // Force a fresh lightweight metadata read here. Older proper-app
          // caches may have permanently remembered a temporary no-GPS result.
          const info = await refreshMatchAssetInfo(assetId);
          const candidateLocation = info?.location;

          if (
            candidateLocation &&
            typeof candidateLocation.latitude === "number" &&
            typeof candidateLocation.longitude === "number" &&
            Number.isFinite(candidateLocation.latitude) &&
            Number.isFinite(candidateLocation.longitude)
          ) {
            location = candidateLocation;
            break;
          }
        }

        if (!location) {
          Alert.alert(
            "Photo location unavailable",
            "This group has no usable GPS location. Add the venue name manually instead.",
            [
              { text: "Cancel", style: "cancel" },
              kind === "location"
                ? {
                    text: "Use Matchday location",
                    onPress: () =>
                      setMatchdayMediaAssignments((current) => {
                        const next = { ...current };
                        keys.forEach((key) => {
                          next[key] = {
                            placeName: "Matchday location",
                            placeKind: "location",
                            source: "manual",
                          };
                        });
                        return next;
                      }),
                  }
                : kind === "station"
                  ? {
                      text: "Add train station",
                      onPress: () => addSimpleHistoryLocation(keys, kind, undefined, onSaved),
                    }
                  : {
                      text: kind === "pub" ? "Add pub or bar" : "Add restaurant",
                      onPress: () => addHistoryVenue(keys, kind, undefined, onSaved),
                    },
            ],
          );
          return;
        }
        try {
          if (!ParkingSearchModule?.searchPlaces)
            throw new Error("Apple Maps place search unavailable");
          const searchPlaces = ParkingSearchModule.searchPlaces.bind(
            ParkingSearchModule,
          );
          const venues = (kind === "location"
            ? (await Promise.all(
                (["pub", "restaurant", "station", "metro"] as const).map(
                  (placeKind) =>
                    searchPlaces(
                      location!.latitude,
                      location!.longitude,
                      placeKind,
                    ).then((items) =>
                      items.map((item) => ({ ...item, placeKind })),
                    ).catch(() => []),
                ),
              )).flat()
            : (await searchPlaces(
                location.latitude,
                location.longitude,
                kind,
              )).map((item) => ({ ...item, placeKind: kind })))
            .sort((a, b) => a.distanceMiles - b.distanceMiles)
            .filter((venue) => venue.distanceMiles <= 3)
            .filter(
              (venue, index, all) =>
                all.findIndex(
                  (item) =>
                    normaliseFixtureText(item.name) ===
                    normaliseFixtureText(venue.name),
                ) === index,
            )
            .slice(0, 5);
          if (!venues.length) {
            if (kind === "location") {
              setMatchdayMediaAssignments((current) => {
                const next = { ...current };
                keys.forEach((key) => {
                  next[key] = {
                    placeName: "Matchday location",
                    placeKind: "location",
                    source: "manual",
                  };
                });
                return next;
              });
            } else if (kind === "station") {
              addSimpleHistoryLocation(keys, kind, undefined, onSaved);
            } else {
              addHistoryVenue(keys, kind, undefined, onSaved);
            }
            return;
          }
          Alert.alert(
            kind === "location"
              ? "Nearby matchday locations"
              : kind === "pub"
                ? "Closest pubs and bars"
                : kind === "station"
                  ? "Closest train stations"
                  : "Closest restaurants",
            "Choose a place near these photos. The mileage is the distance from the media’s GPS location. Results are supplied by Apple Maps.",
            [
              ...venues.map((venue) => ({
                text: `${venue.name} · ${venue.distanceMiles.toFixed(2)} mi`,
                onPress: () => {
                  setMatchdayMediaAssignments((current) => {
                    const next = { ...current };
                    keys.forEach((key) => {
                      next[key] = {
                        placeName: venue.name,
                        placeKind:
                          kind === "location" ? "location" : kind,
                        latitude: venue.latitude,
                        longitude: venue.longitude,
                        source: "manual",
                      };
                    });
                    return next;
                  });
                  onSaved?.(venue.name);
                },
              })),
              ...(kind === "location"
                ? []
                : [{ text: "Add manually", onPress: () => kind === "station" ? addSimpleHistoryLocation(keys, kind, undefined, onSaved) : addHistoryVenue(keys, kind, undefined, onSaved) }]),
              { text: "Cancel", style: "cancel" as const },
            ],
          );
        } catch {
          Alert.alert(
            "Nearby places unavailable",
            "Ticket Frame could not load nearby venues. You can still add the name manually.",
            [
              { text: "Cancel", style: "cancel" },
              ...(kind === "location"
                ? [{ text: "Use Matchday location", onPress: () => setMatchdayMediaAssignments((current) => {
                    const next = { ...current };
                    keys.forEach((key) => { next[key] = { placeName: "Matchday location", placeKind: "location", source: "manual" }; });
                    return next;
                  }) }]
                : [{ text: "Add manually", onPress: () => kind === "station" ? addSimpleHistoryLocation(keys, kind, undefined, onSaved) : addHistoryVenue(keys, kind, undefined, onSaved) }]),
            ],
          );
        }
      };
      const moveMediaGroup = (keys: string[]) => {
        const apply = (assignment: MatchdayMediaAssignment) =>
          setMatchdayMediaAssignments((current) => {
            const next = { ...current };
            keys.forEach((key) => { next[key] = assignment; });
            return next;
          });
        const renameCustomLocation = (id: string, name: string) =>
          setMatchdayCustomLocations((current) => ({
            ...current,
            [selectedHistoryRecord.id]: (current[selectedHistoryRecord.id] ?? []).map((item) =>
              item.id === id ? { ...item, name } : item,
            ),
          }));
        Alert.alert("Move media group", "Choose where every item in this location group belongs.", [
          { text: "Cancel", style: "cancel" },
          { text: stadiumLocationName, onPress: () => apply({ placeName: stadiumLocationName, placeKind: "stadium", source: "manual" }) },
          { text: "Matchday location", onPress: () => void findHistoryVenueNearMedia(keys, "location") },
          { text: "Pub or bar", onPress: () => void findHistoryVenueNearMedia(keys, "pub") },
          { text: "Restaurant", onPress: () => void findHistoryVenueNearMedia(keys, "restaurant") },
          { text: "Station", onPress: () => void findHistoryVenueNearMedia(keys, "station") },
        ]);
      };
      const deleteMediaLocation = (
        assignment: MatchdayMediaAssignment,
        keys: string[],
      ) => {
        Alert.alert(
          "Delete media location?",
          `Delete ${assignment.placeName}? Photos and videos will stay in this Match Memory.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete Location",
              style: "destructive",
              onPress: () => {
                // Keep every media item. Only remove its relationship to
                // this location so it remains visible and can be reassigned.
                setMatchdayMediaAssignments((current) => {
                  const next = { ...current };

                  keys.forEach((key) => {
                    next[key] = {
                      placeName: "Unassigned media",
                      placeKind: "location",
                      source: "manual",
                    };
                  });

                  return next;
                });

                // Remove a manually-created location belonging to this match.
                setMatchdayCustomLocations((current) => ({
                  ...current,
                  [selectedHistoryRecord.id]: (
                    current[selectedHistoryRecord.id] ?? []
                  ).filter(
                    (location) =>
                      !(
                        location.name === assignment.placeName &&
                        location.kind === assignment.placeKind
                      ),
                  ),
                }));

                // Remove the match-specific visited venue/check-in if this
                // location came from one. The globally-known place itself is
                // deliberately not deleted.
                if (assignment.venueVisitId) {
                  setMatchdayExperiences((current) =>
                    current.map((experience) => ({
                      ...experience,
                      venues: experience.venues.filter(
                        (visit) => visit.id !== assignment.venueVisitId,
                      ),
                    })),
                  );
                }

                setSelectedMediaKeys(new Set());
                setMediaEditMode(false);
              },
            },
          ],
        );
      };

      const closeMatchMemory = () => {
        setMediaEditMode(false);
        setSelectedMediaKeys(new Set());
        setSelectedMatchVideoUri(null);
        setEnlargedMatchPhotoUri(null);
        restoreHistoryScrollRef.current =
          historyView === "matches" || historyView === "home";
        setSelectedHistoryRecordId(null);
      };

      const navigateToMatchMemoryLocation = async (
        name: string,
        latitude?: number,
        longitude?: number,
        visitId?: string,
        mediaKeys: string[] = [],
      ) => {
        let resolvedLatitude = latitude;
        let resolvedLongitude = longitude;

        const hasCoordinates =
          typeof resolvedLatitude === "number" &&
          typeof resolvedLongitude === "number" &&
          Number.isFinite(resolvedLatitude) &&
          Number.isFinite(resolvedLongitude);

        if (!hasCoordinates) {
          for (const key of mediaKeys) {
            const marker = "|asset:";
            const markerIndex = key.indexOf(marker);
            if (markerIndex < 0) continue;

            const assetId = key.slice(markerIndex + marker.length);
            if (!assetId) continue;

            const info = await cachedMatchAssetInfo(assetId).catch(() => null);
            const mediaLocation = info?.location;

            if (
              mediaLocation &&
              typeof mediaLocation.latitude === "number" &&
              typeof mediaLocation.longitude === "number" &&
              Number.isFinite(mediaLocation.latitude) &&
              Number.isFinite(mediaLocation.longitude)
            ) {
              resolvedLatitude = mediaLocation.latitude;
              resolvedLongitude = mediaLocation.longitude;
              break;
            }
          }

          if (
            typeof resolvedLatitude === "number" &&
            typeof resolvedLongitude === "number" &&
            Number.isFinite(resolvedLatitude) &&
            Number.isFinite(resolvedLongitude) &&
            visitId &&
            selectedMatchdayExperience
          ) {
            const recoveredLatitude = resolvedLatitude;
            const recoveredLongitude = resolvedLongitude;
            const recoveredAt = new Date().toISOString();

            setMatchdayExperiences((current) =>
              current.map((experience) =>
                experience.id === selectedMatchdayExperience.id
                  ? {
                      ...experience,
                      venues: experience.venues.map((visit) =>
                        visit.id === visitId
                          ? {
                              ...visit,
                              latitude: recoveredLatitude,
                              longitude: recoveredLongitude,
                            }
                          : visit,
                      ),
                      updatedAt: recoveredAt,
                    }
                  : experience,
              ),
            );
          }
        }

        if (
          typeof resolvedLatitude !== "number" ||
          typeof resolvedLongitude !== "number" ||
          !Number.isFinite(resolvedLatitude) ||
          !Number.isFinite(resolvedLongitude)
        ) {
          Alert.alert(
            "Location unavailable",
            `Ticket Frame remembers ${name}, but none of the saved media for this location contains usable GPS coordinates.`,
          );
          return;
        }

        const coordinates = `${resolvedLatitude},${resolvedLongitude}`;

        Alert.alert(
          `Navigate to ${name}`,
          "Choose your navigation app.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Waze",
              onPress: () =>
                void Linking.openURL(
                  `waze://?ll=${coordinates}&navigate=yes`,
                ).catch(() =>
                  Linking.openURL(
                    `https://waze.com/ul?ll=${coordinates}&navigate=yes`,
                  ),
                ),
            },
            {
              text: "Google Maps",
              onPress: () =>
                void Linking.openURL(
                  `comgooglemaps://?daddr=${coordinates}&directionsmode=driving`,
                ).catch(() =>
                  Linking.openURL(
                    `https://www.google.com/maps/dir/?api=1&destination=${coordinates}&travelmode=driving`,
                  ),
                ),
            },
          ],
        );
      };

      const toggleMediaSelection = (key: string) =>
        setSelectedMediaKeys((current) => {
          const next = new Set(current);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
      const finishMovingSelectedMedia = () => {
        if (!selectedMediaKeys.size) {
          Alert.alert("Select media", "Tap the photos and videos you want to move first.");
          return;
        }
        moveMediaGroup(Array.from(selectedMediaKeys));
        setSelectedMediaKeys(new Set());
        setMediaEditMode(false);
      };
      return hxShell(
        <>
          {hxBackButton(closeMatchMemory, "Back to matches")}
          <Text style={[s.title, { color: "#17221c", fontSize: 26 }]}>Match Memory</Text>
          <Text style={[s.clubName, { marginBottom: 4 }]}> 
            {(selectedFixture?.homeAway ?? selectedHistoryRecord.homeAway) === "home"
              ? `${selectedHistoryRecord.club} v ${selectedHistoryRecord.opponent}`
              : `${selectedHistoryRecord.opponent} v ${selectedHistoryRecord.club}`}
          </Text>
          <Text style={[s.helpText, { marginBottom: 14 }]}> 
            {formatHistoryDate(selectedHistoryRecord.matchDate)} · {selectedHistoryRecord.ground ?? "Stadium not set"}
          </Text>
          {(() => {
            const score = scoresForRecord(selectedHistoryRecord);
            return score.home != null && score.away != null ? (
              <Text style={{ fontSize: 24, fontWeight: "900", color: "#17221c", marginBottom: 8 }}>
                {selectedFixture?.shootoutWinner ? "Score after extra time" : "Score"}: {score.home}–{score.away}
              </Text>
            ) : null;
          })()}
          {selectedFixture?.attendance ? (
            <Text style={[s.helpText, { marginTop: -8, marginBottom: 6 }]}>Attendance: {selectedFixture.attendance.toLocaleString()}</Text>
          ) : null}
          {(selectedFixture?.homeScorers?.length || selectedFixture?.awayScorers?.length) ? (
            <Text style={[s.helpText, { marginTop: 0, marginBottom: 6 }]}>Goal scorers (normal and extra time): {[...(selectedFixture?.homeScorers ?? []), ...(selectedFixture?.awayScorers ?? [])].join(", ")}</Text>
          ) : null}
          {selectedFixture?.shootoutWinner &&
          selectedFixture.homeShootoutScore != null &&
          selectedFixture.awayShootoutScore != null ? (
            <>
              <Text style={[s.helpText, { marginTop: 0, marginBottom: 4, fontWeight: "900" }]}> 
                {selectedFixture.shootoutWinner === "home"
                  ? (selectedFixture.homeAway === "home" ? selectedHistoryRecord.club : selectedHistoryRecord.opponent)
                  : (selectedFixture.homeAway === "away" ? selectedHistoryRecord.club : selectedHistoryRecord.opponent)} won {selectedFixture.homeShootoutScore}–{selectedFixture.awayShootoutScore} on penalties
              </Text>
              <Text style={[s.helpText, { marginTop: 0, marginBottom: 12 }]}>Successful penalty takers: {[...(selectedFixture.homePenaltyScorers ?? []), ...(selectedFixture.awayPenaltyScorers ?? [])].join(", ") || "Not supplied"}</Text>
            </>
          ) : null}
          {linkedTicket ? (
            <Pressable onPress={() => setEnlargedTicketId(linkedTicket.id)}>
              <Image
                alt={`Ticket for ${selectedHistoryRecord.club} versus ${selectedHistoryRecord.opponent}`}
                source={{ uri: currentTicketUri(linkedTicket.uri) }}
                resizeMode="contain"
                style={{ width: "100%", height: 230, borderRadius: 12, backgroundColor: "#ebe7de" }}
              />
            </Pressable>
          ) : (
            <View style={[s.collectionCard, { justifyContent: "center" }]}> 
              <Text style={s.helpText}>No ticket photo is linked to this attendance yet.</Text>
            </View>
          )}
          <View style={[s.hxFormRow, { marginVertical: 14 }]}> 
            <Pressable
              disabled={photoAction === "choose" || photoAction === "find"}
              style={({ pressed }) => [s.resetButton, { flex: 1, backgroundColor: favouriteClub.primary, opacity: pressed || photoAction === "choose" ? 0.55 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              onPress={() => void chooseMatchPhotos(selectedHistoryRecord)}
            >
              <Text style={[s.resetButtonText, { color: readableTextColour(favouriteClub.primary) }]}>{photoAction === "choose" ? "OPENING…" : "ADD MEDIA"}</Text>
            </Pressable>
            <Pressable
              disabled={photoAction === "choose" || photoAction === "find" || photosMatchedAutomatically}
              style={({ pressed }) => [s.resetButton, { flex: 1, backgroundColor: favouriteClub.secondary, opacity: pressed || photoAction === "find" || photosMatchedAutomatically ? 0.55 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              onPress={() => void findPhotosAtGround(selectedHistoryRecord)}
            >
              <Text style={[s.resetButtonText, { color: readableTextColour(favouriteClub.secondary) }]}>{photosMatchedAutomatically ? "PHOTOS AUTO-SAVED" : photoAction === "find" ? "SEARCHING…" : "FIND AT STADIUM"}</Text>
            </Pressable>
          </View>
          {candidates.length ? (
            <>
              <Text style={[s.hxSectionTitle, { marginBottom: 8 }]}>FOUND PHOTOS — TAP EACH ONCE TO SAVE</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                {candidates.map((uri, index) => (
                  <Pressable
                    key={`${uri}-${index}`}
                    onPress={() => {
                      void addPhotoUris(selectedHistoryRecord.id, [uri]);
                      setPhotoCandidates((current) => ({
                        ...current,
                        [selectedHistoryRecord.id]: (current[selectedHistoryRecord.id] ?? []).filter((item) => item !== uri),
                      }));
                    }}
                    style={({ pressed }) => ({ width: "32.5%", opacity: pressed ? 0.5 : 1 })}
                  >
                    <Image
                      alt="Suggested match-day photo"
                      source={{ uri }}
                      onError={() => {
                        setPhotoCandidates((current) => ({
                          ...current,
                          [selectedHistoryRecord.id]: (current[selectedHistoryRecord.id] ?? []).filter((item) => item !== uri),
                        }));
                      }}
                      style={{ width: "100%", aspectRatio: 1 }}
                    />
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          {selectedHistoryRecord ? (
            <View style={[s.collectionCard, { marginBottom: 14, flexDirection: "column", alignItems: "stretch", backgroundColor: "#fffdf8" }]}> 
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={[s.hxSectionTitle, { marginTop: 0, marginBottom: 0, flex: 1 }]}>MEDIA LOCATIONS</Text>
                <Pressable onPress={() => { setMediaEditMode((current) => !current); setSelectedMediaKeys(new Set()); }} style={{ padding: 7 }} accessibilityLabel="Select photos and videos to move">
                  <Text style={{ fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>{mediaEditMode ? "DONE" : "EDIT"}</Text>
                </Pressable>
                <Pressable onPress={createMediaLocation} style={{ padding: 7 }} accessibilityLabel="Add a media location">
                  <Ionicons name="add-circle-outline" size={25} color={favouriteClub.primary} />
                </Pressable>
              </View>
              {mediaEditMode ? (
                <Pressable onPress={finishMovingSelectedMedia} style={{ paddingVertical: 9, borderRadius: 8, backgroundColor: favouriteClub.primary, marginBottom: 6 }}>
                  <Text style={{ textAlign: "center", fontWeight: "900", color: readableTextColour(favouriteClub.primary) }}>MOVE {selectedMediaKeys.size} SELECTED</Text>
                </Pressable>
              ) : null}
              {orderedMediaLocationGroups.map((group) => (
                <View key={`${group.assignment.placeKind}|${group.assignment.placeName}`} style={{ paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ddd6c8", flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={
                      group.assignment.placeKind === "stadium"
                        ? "football-outline"
                        : group.assignment.placeKind === "pub"
                          ? "beer-outline"
                          : group.assignment.placeKind === "restaurant"
                            ? "restaurant-outline"
                            : group.assignment.placeKind === "station"
                              ? "train-outline"
                              : group.assignment.placeKind === "metro"
                                ? "subway-outline"
                                : "location-outline"
                    }
                    size={20}
                    color={favouriteClub.primary}
                  />
                  <View style={{ flex: 1, marginLeft: 9 }}>
                    <Text style={{ color: "#17221c", fontWeight: "900" }}>{group.assignment.placeName}</Text>
                    <Text style={[s.helpText, { marginTop: 1, marginBottom: 0 }]}>{group.photos} photo{group.photos === 1 ? "" : "s"} · {group.videos} video{group.videos === 1 ? "" : "s"}</Text>
                  </View>
                  {group.assignment.placeName !== "Unassigned media" ? (
                    <Pressable
                      onPress={() => deleteMediaLocation(group.assignment, group.keys)}
                      style={{ padding: 7 }}
                      accessibilityLabel={`Delete location ${group.assignment.placeName}`}
                    >
                      <Ionicons name="close-circle" size={23} color="#B42318" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
          {orderedMediaLocationGroups.map((group, groupIndex) => {
            const groupKeySet = new Set(group.keys);

            const groupSavedPhotos = photos.filter((uri) =>
              groupKeySet.has(`${selectedHistoryRecord.id}|uri:${uri}`),
            );

            const groupReferencedPhotos = referencedPhotos.filter((media) =>
              groupKeySet.has(
                `${selectedHistoryRecord.id}|asset:${media.assetId}`,
              ),
            );

            const groupReferencedVideos = referencedVideos.filter((media) =>
              groupKeySet.has(
                `${selectedHistoryRecord.id}|asset:${media.assetId}`,
              ),
            );

            const matchingVisit =
              selectedMatchdayExperience?.venues.find(
                (visit) =>
                  visit.id === group.assignment.venueVisitId ||
                  (
                    visit.kind === group.assignment.placeKind &&
                    normaliseFixtureText(visit.venueName) ===
                      normaliseFixtureText(group.assignment.placeName)
                  ),
              ) ?? null;

            const locationIcon =
              group.assignment.placeKind === "stadium"
                ? "football-outline"
                : group.assignment.placeKind === "pub"
                  ? "beer-outline"
                  : group.assignment.placeKind === "restaurant"
                    ? "restaurant-outline"
                    : group.assignment.placeKind === "station"
                      ? "train-outline"
                      : group.assignment.placeKind === "metro"
                        ? "subway-outline"
                        : "location-outline";

            return (
              <View
                key={`${group.assignment.placeKind}|${group.assignment.placeName}|${groupIndex}`}
                style={{
                  marginTop: groupIndex === 0 ? 4 : 24,
                  paddingTop: groupIndex === 0 ? 0 : 18,
                  borderTopWidth: groupIndex === 0 ? 0 : 2,
                  borderTopColor: "#d8d1c3",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Ionicons
                    name={locationIcon}
                    size={22}
                    color={favouriteClub.primary}
                  />

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text
                      style={[
                        s.hxSectionTitle,
                        {
                          marginTop: 0,
                          marginBottom: 0,
                          fontSize: 17,
                        },
                      ]}
                    >
                      {group.assignment.placeName.toUpperCase()}
                    </Text>

                    {matchingVisit?.rating ? (
                      <Text
                        style={[
                          s.helpText,
                          {
                            marginTop: 2,
                            marginBottom: 0,
                            fontWeight: "800",
                          },
                        ]}
                      >
                        YOUR RATING: {"★".repeat(matchingVisit.rating)}
                        {"☆".repeat(5 - matchingVisit.rating)}
                      </Text>
                    ) : null}
                  </View>

                  {(matchingVisit ||
                    (typeof group.assignment.latitude === "number" &&
                      typeof group.assignment.longitude === "number")) ? (
                    <Pressable
                      onPress={() =>
                        void navigateToMatchMemoryLocation(
                          matchingVisit?.venueName ?? group.assignment.placeName,
                          matchingVisit?.latitude ?? group.assignment.latitude,
                          matchingVisit?.longitude ?? group.assignment.longitude,
                          matchingVisit?.id ?? group.assignment.venueVisitId,
                          group.keys,
                        )
                      }
                      style={{ padding: 7 }}
                      accessibilityLabel={`Navigate to ${
                        matchingVisit?.venueName ?? group.assignment.placeName
                      }`}
                    >
                      <Ionicons
                        name="navigate-circle-outline"
                        size={26}
                        color={favouriteClub.primary}
                      />
                    </Pressable>
                  ) : null}



                  <Pressable
                    onPress={() => moveMediaGroup(group.keys)}
                    style={{ paddingVertical: 6, paddingLeft: 10 }}
                    accessibilityLabel={`Change location for ${group.assignment.placeName}`}
                  >
                    <Text
                      style={{
                        fontWeight: "900",
                        color: visibleInkOnCream(favouriteClub.primary),
                      }}
                    >
                      CHANGE
                    </Text>
                  </Pressable>

                </View>

                <Text
                  style={[
                    s.hxSectionTitle,
                    {
                      marginTop: 0,
                      marginBottom: 8,
                      fontSize: 14,
                    },
                  ]}
                >
                  PHOTOS
                </Text>

                {groupSavedPhotos.length || groupReferencedPhotos.length ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 4,
                      marginBottom: 14,
                    }}
                  >
                    {groupSavedPhotos.map((uri, index) => {
                      const mediaKey = `${selectedHistoryRecord.id}|uri:${uri}`;

                      return (
                        <Pressable
                          key={`${uri}-${index}`}
                          onPress={() =>
                            mediaEditMode
                              ? toggleMediaSelection(mediaKey)
                              : openSavedMatchPhoto(uri)
                          }
                          onLongPress={() =>
                            Alert.alert(
                              "Delete this photo?",
                              "The match memory copy will be removed. Your original Photos library image is not deleted.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => {
                                    setMatchPhotos((current) => {
                                      const next = {
                                        ...current,
                                        [selectedHistoryRecord.id]: (
                                          current[selectedHistoryRecord.id] ?? []
                                        ).filter((item) => item !== uri),
                                      };
                                      persistMatchPhotos(next);
                                      return next;
                                    });

                                    if (
                                      uri.startsWith(
                                        FileSystem.documentDirectory ?? "__never__",
                                      )
                                    ) {
                                      void FileSystem.deleteAsync(uri, {
                                        idempotent: true,
                                      });
                                    }
                                  },
                                },
                              ],
                            )
                          }
                          style={({ pressed }) => ({
                            width: "32.5%",
                            opacity: pressed ? 0.6 : 1,
                            borderWidth: selectedMediaKeys.has(mediaKey) ? 4 : 0,
                            borderColor: favouriteClub.primary,
                          })}
                        >
                          <Image
                            alt="Saved match memory"
                            source={{ uri }}
                            style={{ width: "100%", aspectRatio: 1 }}
                          />
                        </Pressable>
                      );
                    })}

                    {groupReferencedPhotos.map((media) => {
                      const mediaKey = `${selectedHistoryRecord.id}|asset:${media.assetId}`;

                      return (
                        <Pressable
                          key={media.assetId}
                          onPress={() =>
                            mediaEditMode
                              ? toggleMediaSelection(mediaKey)
                              : void openReferencedMatchPhoto(
                                  selectedHistoryRecord.id,
                                  media,
                                )
                          }
                          onLongPress={() =>
                            Alert.alert(
                              "Remove this photo?",
                              "The Match Memory copy will be removed. The original in Apple Photos will not be deleted.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Remove",
                                  style: "destructive",
                                  onPress: () =>
                                    removeMatchMediaReference(
                                      selectedHistoryRecord.id,
                                      media,
                                    ),
                                },
                              ],
                            )
                          }
                          delayLongPress={400}
                          style={({ pressed }) => ({
                            width: "32.5%",
                            opacity: pressed ? 0.6 : 1,
                            borderWidth: selectedMediaKeys.has(mediaKey) ? 4 : 0,
                            borderColor: favouriteClub.primary,
                          })}
                        >
                          <Image
                            alt="Saved Apple Photos match memory"
                            source={{ uri: media.uri }}
                            style={{ width: "100%", aspectRatio: 1 }}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text
                    style={[
                      s.helpText,
                      { textAlign: "center", marginBottom: 14 },
                    ]}
                  >
                    No photos saved at this location.
                  </Text>
                )}

                <Text
                  style={[
                    s.hxSectionTitle,
                    {
                      marginTop: 4,
                      marginBottom: 8,
                      fontSize: 14,
                    },
                  ]}
                >
                  VIDEOS
                </Text>

                {groupReferencedVideos.length ? (
                  <>
                    {groupReferencedVideos.map((media, index) => {
                      const mediaKey = `${selectedHistoryRecord.id}|asset:${media.assetId}`;

                      return (
                        <Pressable
                          key={media.assetId}
                          onLongPress={() =>
                            Alert.alert(
                              `Remove Video ${index + 1}?`,
                              "The Match Memory copy will be removed. The original in Apple Photos will not be deleted.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Remove",
                                  style: "destructive",
                                  onPress: () =>
                                    removeMatchMediaReference(
                                      selectedHistoryRecord.id,
                                      media,
                                    ),
                                },
                              ],
                            )
                          }
                          delayLongPress={400}
                          onPress={() => {
                            if (mediaEditMode) {
                              toggleMediaSelection(mediaKey);
                              return;
                            }

                            const playableUri =
                              media.localUri ?? media.uri;

                            if (
                              media.localUri &&
                              selectedMatchVideoUri === playableUri
                            ) {
                              setSelectedMatchVideoUri(null);
                              return;
                            }

                            void openReferencedMatchVideo(
                              selectedHistoryRecord.id,
                              media,
                            );
                          }}
                          style={({ pressed }) => [
                            s.collectionCard,
                            {
                              marginBottom: 8,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              opacity: pressed ? 0.65 : 1,
                              borderWidth: selectedMediaKeys.has(mediaKey)
                                ? 3
                                : undefined,
                              borderColor: favouriteClub.primary,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              activeVideoUri === media.uri
                                ? "stop-circle"
                                : "play-circle"
                            }
                            size={30}
                            color={favouriteClub.primary}
                          />

                          <Text style={[s.clubName, { flex: 1 }]}>
                            {`Video ${index + 1}`}
                          </Text>
                        </Pressable>
                      );
                    })}

                    {groupReferencedVideos.some(
                      (media) => media.uri === activeVideoUri,
                    ) && activeVideoUri ? (
                      <View style={{ marginTop: 4 }}>
                        <MatchMemoryVideoPlayer
                          key={`${selectedHistoryRecord.id}:${activeVideoUri}`}
                          uri={activeVideoUri}
                        />
                      </View>
                    ) : null}
                  </>
                ) : (
                  <Text
                    style={[
                      s.helpText,
                      { textAlign: "center", marginBottom: 4 },
                    ]}
                  >
                    No videos saved at this location.
                  </Text>
                )}
              </View>
            );
          })}

          {!orderedMediaLocationGroups.length ? (
            <Text
              style={[
                s.helpText,
                { textAlign: "center", marginVertical: 18 },
              ]}
            >
              Match photos and videos will appear here.
            </Text>
          ) : null}
        <View style={{ marginTop: 20 }}>
            {hxBackButton(closeMatchMemory, "Back to matches")}
          </View>
        </>,
      );
    }

    const historyInput = (
      placeholder: string,
      key:
        | "club"
        | "opponent"
        | "matchDate"
        | "season"
        | "competition"
        | "ground"
        | "homeScore"
        | "awayScore"
        | "notes",
      opts?: { multiline?: boolean },
    ) => (
      <TextInput
        placeholder={placeholder}
        value={draftMatch[key]}
        onChangeText={(value) =>
          setDraftMatch((current) => ({ ...current, [key]: value }))
        }
        multiline={opts?.multiline}
        style={[
          s.historyInput,
          opts?.multiline
            ? { minHeight: 72, textAlignVertical: "top" as const }
            : null,
        ]}
      />
    );

    // ---------- ADD MATCH — full-screen form ----------

    if (showAddMatch) {
      const currentManualSeason =
        seasonForDate(new Date()) ?? activeSeason;
      const currentManualSeasonStart = Number(
        currentManualSeason.match(/^(\d{4})/)?.[1] ?? 1948,
      );
      const manualSeasonOptions = Array.from(
        { length: Math.max(1, currentManualSeasonStart - 1948 + 1) },
        (_, index) => {
          const year = currentManualSeasonStart - index;
          return `${year}/${String(year + 1).slice(-2)}`;
        },
      );

      const manualCompetitionOptions = Array.from(
        new Set(
          manualFixturePool
            .map((fixture) => fixture.competition?.trim() ?? "")
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b));

      // V4.0.86 — display historically correct English league names
    // without changing the stored TFD competition identity.
    const manualCompetitionDisplayName = (
      competition: string,
      season: string = draftMatch.season,
    ) => {
      const startYear = Number(season.match(/^(\d{4})/)?.[1]);
      if (!Number.isFinite(startYear)) return competition;

      if (startYear <= 1991) {
        if (competition === "Premier League") return "First Division";
        if (competition === "Championship") return "Second Division";
        if (competition === "League One") return "Third Division";
        if (competition === "League Two") return "Fourth Division";
      }

      if (startYear >= 1992 && startYear <= 2003) {
        if (competition === "Championship") return "First Division";
        if (competition === "League One") return "Second Division";
        if (competition === "League Two") return "Third Division";
      }

      return competition;
    };
const manualCompetitionFixtures = draftMatch.competition
        ? manualFixturePool.filter(
            (fixture) =>
              fixture.competition === draftMatch.competition,
          )
        : [];

      const manualHomeTeamOptions = Array.from(
        new Set(
          manualCompetitionFixtures.map((fixture) => fixture.homeName),
        ),
      ).sort((a, b) => a.localeCompare(b));

      const manualHomeFixtures = manualHomeTeam
        ? manualCompetitionFixtures.filter((fixture) =>
            clubNamesMatch(fixture.homeName, manualHomeTeam),
          )
        : [];

      const manualAwayTeamOptions = Array.from(
        new Set(manualHomeFixtures.map((fixture) => fixture.awayName)),
      ).sort((a, b) => a.localeCompare(b));

      const manualSelectedFixture =
        manualHomeTeam && manualAwayTeam
          ? manualHomeFixtures.find((fixture) =>
              clubNamesMatch(fixture.awayName, manualAwayTeam),
            )
          : undefined;

      const manualMonthOptions = [
        ["01", "January"],
        ["02", "February"],
        ["03", "March"],
        ["04", "April"],
        ["05", "May"],
        ["06", "June"],
        ["07", "July"],
        ["08", "August"],
        ["09", "September"],
        ["10", "October"],
        ["11", "November"],
        ["12", "December"],
      ] as const;

      const manualDayOptions = Array.from(
        { length: 31 },
        (_, index) => String(index + 1).padStart(2, "0"),
      );

      const autoResult =
        draftMatch.homeScore.trim() !== "" && draftMatch.awayScore.trim() !== ""
          ? (() => {
              const hs = Number(draftMatch.homeScore);
              const as = Number(draftMatch.awayScore);
              if (!Number.isFinite(hs) || !Number.isFinite(as)) return null;
              const mine = draftMatch.homeAway === "home" ? hs : as;
              const theirs = draftMatch.homeAway === "home" ? as : hs;
              return mine > theirs ? "win" : mine < theirs ? "loss" : "draw";
            })()
          : null;
      return (
        <SafeAreaView style={[s.safe, { backgroundColor: "#f5f1e8" }]}>
          <ScrollView
            style={{ backgroundColor: "#f5f1e8" }}
            contentContainerStyle={[s.page, { paddingBottom: 40 }]}
            keyboardShouldPersistTaps="handled"
          >
            {hxBackButton(() => setShowAddMatch(false))}
            <Text style={[s.title, { color: "#17221c", fontSize: 26 }]}>
              Add Match To History
            </Text>
            <Text style={[s.helpText, { marginTop: 2, marginBottom: 14 }]}>
              Log an attendance by hand. Tip: pick a fixture below to pre-fill,
              or type the details.
            </Text>

            <Text style={[s.helpText, { marginTop: 2, marginBottom: 14 }]}>
              Choose the fixture in order. Ticket Frame only shows teams that
              exist in the selected TFD season and competition.
            </Text>

            <Text style={s.hxFormLabel}>1 · SEASON</Text>

            {manualPickerStep === 0 ? (
              <>
                <View
                  style={[s.hxPickerWrap, { marginBottom: 8 }]}
                >
                  <Picker
                    testID="tfd-manual-season"
                    selectedValue={manualPendingSeason || draftMatch.season}
                    onValueChange={(value) => {
                      manualSeasonWheelValueRef.current = String(value);
                    }}
                    itemStyle={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: "#17221c",
                    }}
                  >
                    {manualSeasonOptions.map((season) => (
                      <Picker.Item
                        key={season}
                        label={season}
                        value={season}
                      />
                    ))}
                  </Picker>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    const season =
                      manualSeasonWheelValueRef.current ||
                      manualPendingSeason ||
                      draftMatch.season;
                    if (!season) return;

                    setDraftMatch((current) => ({
                      ...current,
                      season,
                      club: "",
                      opponent: "",
                      matchDate: "",
                      competition: "",
                      ground: "",
                      homeAway: "home",
                      homeScore: "",
                      awayScore: "",
                      fixtureId: null,
                      fixtureDateStatus: null,
                      resultOverride: null,
                    }));

                    setManualPendingCompetition("");
                    setManualPendingHomeTeam("");
                    setManualPendingAwayTeam("");
                    setManualHomeTeam("");
                    setManualAwayTeam("");
                    setManualDateDay("");
                    setManualDateMonth("");
                    setManualDateBlank(false);
                    setManualPickerStep(1);

                    void loadManualFixturePoolForSeason(season);
                  }}
                  style={[
                    s.hxSortChip,
                    { alignSelf: "flex-start", marginBottom: 12 },
                  ]}
                >
                  <Text style={s.hxSortChipText}>CONFIRM SEASON</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  manualFixtureLoadRequestRef.current += 1;
                  setManualFixtureLoading(false);
                  setManualFixturePool([]);
                  setManualPickerStep(0);
                  setManualPendingSeason(draftMatch.season);
                  manualSeasonWheelValueRef.current = draftMatch.season;
                  setManualPendingCompetition("");
                  setManualPendingHomeTeam("");
                  setManualPendingAwayTeam("");
                  setManualHomeTeam("");
                  setManualAwayTeam("");
                  setManualDateDay("");
                  setManualDateMonth("");
                  setManualDateBlank(false);

                  setDraftMatch((current) => ({
                    ...current,
                    competition: "",
                    club: "",
                    opponent: "",
                    matchDate: "",
                    ground: "",
                    homeAway: "home",
                    homeScore: "",
                    awayScore: "",
                    fixtureId: null,
                    fixtureDateStatus: null,
                    resultOverride: null,
                  }));
                }}
                style={[
                  s.hxSortChip,
                  s.hxSortChipOn,
                  { alignSelf: "flex-start", marginBottom: 12 },
                ]}
              >
                <Text style={[s.hxSortChipText, { color: "#fffaf2" }]}>
                  {draftMatch.season} · CHANGE
                </Text>
              </Pressable>
            )}

            {manualPickerStep >= 1 ? (
              manualFixtureLoading ? (
                <Text style={[s.helpText, { marginBottom: 12 }]}>
                  Loading fixtures for {draftMatch.season}…
                </Text>
              ) : manualFixturePool.length === 0 ? (
                <Text style={[s.helpText, { marginBottom: 12 }]}>
                  No TFD fixtures are available for this season yet.
                </Text>
              ) : (
                <>
                  <Text style={s.hxFormLabel}>
                    2 · DIVISION / LEAGUE / CUP
                  </Text>

                  {manualPickerStep === 1 ? (
                    <>
                      <View
                  style={[s.hxPickerWrap, { marginBottom: 8 }]}
                >
                        <Picker
                          selectedValue={manualPendingCompetition}
                          onValueChange={(value) =>
                            setManualPendingCompetition(value)
                          }
                          itemStyle={{
                            fontSize: 18,
                            fontWeight: "700",
                            color: "#17221c",
                          }}
                        >
                          <Picker.Item
                            label="Choose division / league / cup"
                            value=""
                          />
                          {manualCompetitionOptions.map((competition) => (
                            <Picker.Item
                              key={competition}
                              label={manualCompetitionDisplayName(competition)}
                              value={competition}
                            />
                          ))}
                        </Picker>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        disabled={!manualPendingCompetition}
                        onPress={() => {
                          if (!manualPendingCompetition) return;

                          setDraftMatch((current) => ({
                            ...current,
                            competition: manualPendingCompetition,
                            club: "",
                            opponent: "",
                            matchDate: "",
                            ground: "",
                            homeAway: "home",
                            homeScore: "",
                            awayScore: "",
                            fixtureId: null,
                            fixtureDateStatus: null,
                            resultOverride: null,
                          }));

                          setManualPendingHomeTeam("");
                          setManualPendingAwayTeam("");
                          setManualHomeTeam("");
                          setManualAwayTeam("");
                          setManualDateDay("");
                          setManualDateMonth("");
                          setManualDateBlank(false);
                          setManualPickerStep(2);
                        }}
                        style={[
                          s.hxSortChip,
                          {
                            alignSelf: "flex-start",
                            marginBottom: 12,
                            opacity: manualPendingCompetition ? 1 : 0.45,
                          },
                        ]}
                      >
                        <Text style={s.hxSortChipText}>
                          CONFIRM COMPETITION
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setManualPickerStep(1);
                        setManualPendingCompetition(
                          draftMatch.competition,
                        );
                        setManualPendingHomeTeam("");
                        setManualPendingAwayTeam("");
                        setManualHomeTeam("");
                        setManualAwayTeam("");
                        setManualDateDay("");
                        setManualDateMonth("");
                        setManualDateBlank(false);

                        setDraftMatch((current) => ({
                          ...current,
                          club: "",
                          opponent: "",
                          matchDate: "",
                          ground: "",
                          homeAway: "home",
                          homeScore: "",
                          awayScore: "",
                          fixtureId: null,
                          fixtureDateStatus: null,
                          resultOverride: null,
                        }));
                      }}
                      style={[
                        s.hxSortChip,
                        s.hxSortChipOn,
                        { alignSelf: "flex-start", marginBottom: 12 },
                      ]}
                    >
                      <Text
                        style={[
                          s.hxSortChipText,
                          { color: "#fffaf2" },
                        ]}
                      >
                        {manualCompetitionDisplayName(draftMatch.competition)} · CHANGE
                      </Text>
                    </Pressable>
                  )}

                  {draftMatch.competition && manualPickerStep >= 2 ? (
                    <>
                      <Text style={s.hxFormLabel}>3 · HOME TEAM</Text>

                      {manualPickerStep === 2 ? (
                        <>
                          <View
                            style={[s.hxPickerWrap, { marginBottom: 8 }]}
                          >
                            <Picker
                              selectedValue={manualPendingHomeTeam}
                              onValueChange={(value) =>
                                setManualPendingHomeTeam(value)
                              }
                              itemStyle={{
                                fontSize: 18,
                                fontWeight: "700",
                                color: "#17221c",
                              }}
                            >
                              <Picker.Item
                                label="Choose home team"
                                value=""
                              />
                              {manualHomeTeamOptions.map((team) => (
                                <Picker.Item
                                  key={team}
                                  label={team}
                                  value={team}
                                />
                              ))}
                            </Picker>
                          </View>

                          <Pressable
                            accessibilityRole="button"
                            disabled={!manualPendingHomeTeam}
                            onPress={() => {
                              if (!manualPendingHomeTeam) return;

                              setManualHomeTeam(manualPendingHomeTeam);
                              setManualPendingAwayTeam("");
                              setManualAwayTeam("");
                              setManualDateDay("");
                              setManualDateMonth("");
                              setManualDateBlank(false);
                              setManualPickerStep(3);
                            }}
                            style={[
                              s.hxSortChip,
                              {
                                alignSelf: "flex-start",
                                marginBottom: 12,
                                opacity: manualPendingHomeTeam ? 1 : 0.45,
                              },
                            ]}
                          >
                            <Text style={s.hxSortChipText}>
                              CONFIRM HOME TEAM
                            </Text>
                          </Pressable>
                        </>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setManualPickerStep(2);
                            setManualPendingHomeTeam(manualHomeTeam);
                            setManualPendingAwayTeam("");
                            setManualAwayTeam("");
                            setManualDateDay("");
                            setManualDateMonth("");
                            setManualDateBlank(false);

                            setDraftMatch((current) => ({
                              ...current,
                              club: "",
                              opponent: "",
                              matchDate: "",
                              ground: "",
                              homeAway: "home",
                              homeScore: "",
                              awayScore: "",
                              fixtureId: null,
                              fixtureDateStatus: null,
                              resultOverride: null,
                            }));
                          }}
                          style={[
                            s.hxSortChip,
                            s.hxSortChipOn,
                            { alignSelf: "flex-start", marginBottom: 12 },
                          ]}
                        >
                          <Text
                            style={[
                              s.hxSortChipText,
                              { color: "#fffaf2" },
                            ]}
                          >
                            {manualHomeTeam} · CHANGE
                          </Text>
                        </Pressable>
                      )}
                    </>
                  ) : null}

                  {manualHomeTeam && manualPickerStep >= 3 ? (
                    <>
                      <Text style={s.hxFormLabel}>4 · AWAY TEAM</Text>

                      {manualPickerStep === 3 ? (
                        <>
                          <View
                            style={[s.hxPickerWrap, { marginBottom: 8 }]}
                          >
                            <Picker
                              selectedValue={manualPendingAwayTeam}
                              onValueChange={(value) =>
                                setManualPendingAwayTeam(value)
                              }
                              itemStyle={{
                                fontSize: 18,
                                fontWeight: "700",
                                color: "#17221c",
                              }}
                            >
                              <Picker.Item
                                label="Choose away team"
                                value=""
                              />
                              {manualAwayTeamOptions.map((team) => (
                                <Picker.Item
                                  key={team}
                                  label={team}
                                  value={team}
                                />
                              ))}
                            </Picker>
                          </View>

                          <Pressable
                            accessibilityRole="button"
                            disabled={!manualPendingAwayTeam}
                            onPress={() => {
                              if (!manualPendingAwayTeam) return;

                              setManualAwayTeam(manualPendingAwayTeam);

                              applyManualFixtureSelection(
                                draftMatch.competition,
                                manualHomeTeam,
                                manualPendingAwayTeam,
                              );

                              setManualPickerStep(4);
                            }}
                            style={[
                              s.hxSortChip,
                              {
                                alignSelf: "flex-start",
                                marginBottom: 12,
                                opacity: manualPendingAwayTeam ? 1 : 0.45,
                              },
                            ]}
                          >
                            <Text style={s.hxSortChipText}>
                              CONFIRM AWAY TEAM
                            </Text>
                          </Pressable>
                        </>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setManualPickerStep(3);
                            setManualPendingAwayTeam(manualAwayTeam);
                            setManualDateDay("");
                            setManualDateMonth("");
                            setManualDateBlank(false);

                            setDraftMatch((current) => ({
                              ...current,
                              club: "",
                              opponent: "",
                              matchDate: "",
                              ground: "",
                              homeAway: "home",
                              homeScore: "",
                              awayScore: "",
                              fixtureId: null,
                              fixtureDateStatus: null,
                              resultOverride: null,
                            }));
                          }}
                          style={[
                            s.hxSortChip,
                            s.hxSortChipOn,
                            { alignSelf: "flex-start", marginBottom: 12 },
                          ]}
                        >
                          <Text
                            style={[
                              s.hxSortChipText,
                              { color: "#fffaf2" },
                            ]}
                          >
                            {manualAwayTeam} · CHANGE
                          </Text>
                        </Pressable>
                      )}
                    </>
                  ) : null}
                </>
              )
            ) : null}

            {manualSelectedFixture ? (
              <>
                <Text style={s.hxFormLabel}>5 · MATCH DATE</Text>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={[s.hxPickerWrap, { flex: 1 }]}
                  >
                    <Picker
                      selectedValue={manualDateDay}
                      enabled={!manualDateBlank}
                      onValueChange={(value) => {
                        setManualDateDay(value);
                        setManualDateBlank(false);
                        setDraftMatch((current) => ({
                          ...current,
                          matchDate: "",
                          fixtureDateStatus: current.fixtureId
                            ? "manual-entry"
                            : current.fixtureDateStatus,
                        }));
                      }}
                      itemStyle={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#17221c",
                      }}
                    >
                      <Picker.Item label="Day" value="" />
                      {manualDayOptions.map((day) => (
                        <Picker.Item
                          key={day}
                          label={String(Number(day))}
                          value={day}
                        />
                      ))}
                    </Picker>
                  </View>

                  <View
                    style={[s.hxPickerWrap, { flex: 1 }]}
                  >
                    <Picker
                      selectedValue={manualDateMonth}
                      enabled={!manualDateBlank}
                      onValueChange={(value) => {
                        setManualDateMonth(value);
                        setManualDateBlank(false);
                        setDraftMatch((current) => ({
                          ...current,
                          matchDate: "",
                          fixtureDateStatus: current.fixtureId
                            ? "manual-entry"
                            : current.fixtureDateStatus,
                        }));
                      }}
                      itemStyle={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#17221c",
                      }}
                    >
                      <Picker.Item label="Month" value="" />
                      {manualMonthOptions.map(([value, label]) => (
                        <Picker.Item
                          key={value}
                          label={label}
                          value={value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setManualDateBlank(true);
                    setManualDateDay("");
                    setManualDateMonth("");
                    setDraftMatch((current) => ({
                      ...current,
                      matchDate: "",
                    }));
                  }}
                  style={[
                    s.hxSortChip,
                    manualDateBlank && s.hxSortChipOn,
                    {
                      alignSelf: "flex-start",
                      marginBottom: 12,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.hxSortChipText,
                      manualDateBlank && { color: "#fffaf2" },
                    ]}
                  >
                    LEAVE DATE BLANK
                  </Text>
                </Pressable>

                <Text style={[s.helpText, { marginBottom: 12 }]}>
                  {manualDateBlank
                    ? "The match will be saved with Date unknown. Ticket Frame will not invent a date."
                    : draftMatch.fixtureDateStatus === "unknown"
                      ? "TFD knows this fixture but not its exact date. Choose the day and month from your ticket, photo or records, or leave it blank."
                      : "The TFD fixture date is preselected when known. You can change the day and month or leave the date blank."}
                </Text>

                <View
                  style={[
                    s.collectionCard,
                    {
                      borderColor: favouriteClub.primary,
                      backgroundColor: "#fffdf8",
                      marginBottom: 12,
                    },
                  ]}
                >
                  <Text style={s.collectionCount}>
                    {manualSelectedFixture.homeName} v{" "}
                    {manualSelectedFixture.awayName}
                  </Text>
                  <Text style={s.collectionSub}>
                    {manualCompetitionDisplayName(draftMatch.competition)} · {draftMatch.season}
                  </Text>
                </View>

                {historyInput("Ground / stadium", "ground")}
              </>
            ) : null}

            <Text style={s.hxFormLabel}>SCORE (OPTIONAL)</Text>
            <View style={[s.hxFormRow, { marginBottom: 10 }]}>
              <TextInput
                placeholder="Home goals"
                keyboardType="number-pad"
                value={draftMatch.homeScore}
                onChangeText={(value) =>
                  setDraftMatch((current) => ({
                    ...current,
                    homeScore: value.replace(/[^0-9]/g, ""),
                  }))
                }
                style={[s.historyInput, { flex: 1, marginBottom: 0 }]}
              />
              <TextInput
                placeholder="Away goals"
                keyboardType="number-pad"
                value={draftMatch.awayScore}
                onChangeText={(value) =>
                  setDraftMatch((current) => ({
                    ...current,
                    awayScore: value.replace(/[^0-9]/g, ""),
                  }))
                }
                style={[s.historyInput, { flex: 1, marginBottom: 0 }]}
              />
            </View>

            <Text style={s.hxFormLabel}>RESULT</Text>
            <View style={[s.hxFormRow, { flexWrap: "wrap", marginBottom: 12 }]}>
              {(
                [
                  ["auto", "Auto from score"],
                  ["win", "Win"],
                  ["draw", "Draw"],
                  ["loss", "Loss"],
                ] as const
              ).map(([value, label]) => {
                const active =
                  value === "auto"
                    ? draftMatch.resultOverride == null && autoResult != null
                    : draftMatch.resultOverride === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() =>
                      setDraftMatch((current) => ({
                        ...current,
                        resultOverride:
                          value === "auto" ? null : (value as AttendanceResult),
                      }))
                    }
                    style={[s.hxSortChip, active && s.hxSortChipOn]}
                  >
                    <Text
                      style={[s.hxSortChipText, active && { color: "#fffaf2" }]}
                      numberOfLines={1}
                    >
                      {label}
                      {value === "auto" && autoResult
                        ? ` · ${autoResult.toUpperCase()}`
                        : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {historyInput("Notes (atmosphere, memories…)", "notes", {
              multiline: true,
            })}

            <View style={s.hxFormBar}>
              <Pressable
                style={[s.resetButton, { flex: 1, backgroundColor: "#e7e0cf" }]}
                onPress={() => setShowAddMatch(false)}
              >
                <Text style={[s.resetButtonText, { color: "#43483f" }]}>
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                style={[
                  s.resetButton,
                  { flex: 1, backgroundColor: favouriteClub.primary },
                ]}
                onPress={saveManualMatch}
              >
                <Text
                  style={[
                    s.resetButtonText,
                    { color: readableTextColour(favouriteClub.primary) },
                  ]}
                >
                  SAVE MATCH
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // ---------- MATCH HISTORY ----------

    if (
      (historyView === "matches" || historyView === "home") &&
      !selectedHistoryRecordId &&
      restoreHistoryScrollRef.current
    ) {
      restoreHistoryScrollRef.current = false;
      requestAnimationFrame(() => {
        historyScrollRef.current?.scrollTo({
          y: historyScrollOffsetRef.current,
          animated: false,
        });
      });
    }

    if (historyView === "matches") {
      return hxShell(
        <>
          {historySectionTabs}
          <Text style={[s.title, { color: "#17221c", fontSize: 26 }]}>
            Matches Attended
          </Text>
          <Text style={[s.helpText, { marginTop: 2, marginBottom: 14 }]}> 
            Every match you have attended.
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <Pressable
              onPress={() => {
                setHistorySelectionMode((current) => {
                  if (current) setSelectedHistoryDeleteIds(new Set());
                  return !current;
                });
              }}
              style={[
                s.hxSortChip,
                historySelectionMode && s.hxSortChipOn,
              ]}
            >
              <Text
                style={[
                  s.hxSortChipText,
                  historySelectionMode && { color: "#fffaf2" },
                ]}
              >
                {historySelectionMode
                  ? "DONE"
                  : "EDIT"}
              </Text>
            </Pressable>

            {historySelectionMode &&
            selectedHistoryDeleteIds.size > 0 ? (
              <Pressable
                onPress={() => {
                  const selected = mergedHistory.filter((record) =>
                    selectedHistoryDeleteIds.has(record.id),
                  );

                  Alert.alert(
                    "Delete selected matches?",
                    `${selected.length} ${
                      selected.length === 1 ? "match" : "matches"
                    } will be removed from History. Add New keeps them deleted; Add All can restore them.`,
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          const selectedIds = new Set(
                            selected.map((record) => record.id),
                          );

                          const keys = selected
                            .map(attendanceSuppressionKey)
                            .filter(Boolean);

                          setDeletedHistoryMatchKeys((current) => {
                            const next = new Set(current);
                            for (const key of keys) next.add(key);
                            return next;
                          });

                          setAttendanceHistory((current) =>
                            current.filter(
                              (record) => !selectedIds.has(record.id),
                            ),
                          );

                          setSelectedHistoryDeleteIds(new Set());
                          setHistorySelectionMode(false);
                        },
                      },
                    ],
                  );
                }}
                style={[
                  s.hxSortChip,
                  {
                    borderColor: "#a03030",
                    backgroundColor: "#a03030",
                  },
                ]}
              >
                <Text
                  style={[
                    s.hxSortChipText,
                    { color: "#fffaf2" },
                  ]}
                >
                  DELETE SELECTED ({selectedHistoryDeleteIds.size})
                </Text>
              </Pressable>
            ) : null}
          </View>

          {historySearchBox}
          {competitionSelector}
          <View style={[s.hxSortRow, { marginBottom: 16 }]}> 
            {(["newest", "oldest"] as const).map((order) => (
              <Pressable
                key={order}
                onPress={() => setMatchSortOrder(order)}
                style={[
                  s.hxSortChip,
                  matchSortOrder === order && s.hxSortChipOn,
                ]}
              >
                <Text
                  style={[
                    s.hxSortChipText,
                    matchSortOrder === order && { color: "#fffaf2" },
                  ]}
                >
                  {order === "newest" ? "NEWEST FIRST" : "OLDEST FIRST"}
                </Text>
              </Pressable>
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 14,
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <Text style={{ fontWeight: "800", color: "#1a7a3c" }}>
              {matchResults.win} W
            </Text>
            <Text style={{ fontWeight: "800", color: "#777777" }}>
              {matchResults.draw} D
            </Text>
            <Text style={{ fontWeight: "800", color: "#a03030" }}>
              {matchResults.loss} L
            </Text>
          </View>
          {orderedMatches.length ? (
            orderedMatches.map(renderMatchCard)
          ) : (
            <Text style={[s.helpText, { textAlign: "center", marginTop: 20 }]}>
              No matches for this filter yet.
            </Text>
          )}
        </>,
      );
    }

    // ---------- STADIUM HISTORY ----------

    if (historyView === "stadiums") {
      if (selectedHistoryStadium) {
        const stadiumMatches = newestFirst.filter(
          (record) =>
            normaliseFixtureText(record.ground ?? "") ===
            normaliseFixtureText(selectedHistoryStadium),
        );
        return hxShell(
          <>
            {hxBackButton(
              () => setSelectedHistoryStadium(null),
              "Back to stadiums",
            )}
            <Text style={[s.title, { color: "#17221c", fontSize: 26 }]}> 
              {selectedHistoryStadium}
            </Text>
            <Text style={[s.helpText, { marginTop: 2, marginBottom: 16 }]}> 
              Tickets and Match Memories from this stadium.
            </Text>
            {stadiumMatches.map(renderMatchCard)}
          </>,
        );
      }
      return hxShell(
        <>
          {historySectionTabs}
          <Text style={[s.title, { color: "#17221c", fontSize: 26 }]}>
            Stadiums Attended
          </Text>
          <Text style={[s.helpText, { marginTop: 2, marginBottom: 16 }]}> 
            Every stadium you have watched football at. Each ground appears
            once — repeat matches add visits.
          </Text>
          {historySearchBox}
          {stadiumRows.length ? (
            stadiumRows.map((stadium) => (
              <Pressable
                key={stadium.name}
                style={({ pressed }) => [
                  s.hxArenaRow,
                  pressed && { opacity: 0.65 },
                ]}
                onPress={() => setSelectedHistoryStadium(stadium.name)}
                accessibilityLabel={`Show tickets from ${stadium.name}`}
              >
                <View style={{ flexShrink: 1 }}>
                  <Text style={s.hxArenaName} numberOfLines={2}>
                    {stadium.name}
                  </Text>
                  {!!stadium.club && (
                    <Text style={s.hxArenaClub} numberOfLines={1}>
                      {stadium.club}
                    </Text>
                  )}
                </View>
                <View style={s.hxArenaVisits}>
                  <Text style={s.hxArenaVisitsNumber}>{stadium.visits}</Text>
                  <Text style={s.hxArenaVisitsLabel}>
                    {stadium.visits === 1 ? "visit" : "visits"}
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[s.helpText, { textAlign: "center", marginTop: 20 }]}>
              Stadiums appear here once your matches include ground details.
            </Text>
          )}
        </>,
      );
    }

    // ---------- SEASON HISTORY ----------

    if (historyView === "seasons") {
      return hxShell(
        <>
          {historySectionTabs}
          <Text style={[s.title, { color: "#17221c", fontSize: 26 }]}> 
            Seasons
          </Text>
          <View style={{ marginTop: 12 }}>{historySearchBox}</View>
          <View style={[s.hxPickerWrap, { marginTop: 12 }]}> 
            <Picker
              selectedValue={seasonFilter}
              onValueChange={(value) => {
                setSeasonFilter(value);
                setExpandedSeasonHistorySeasons(new Set());
              }}
              itemStyle={{ fontSize: 20, fontWeight: "700", color: "#17221c" }}
            >
              <Picker.Item label="All Seasons" value="All Seasons" />
              {seasonOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
          <View style={s.historyCountsRow}>
            <View style={s.hxStatCard}>
              <Text style={s.hxStatNumber}>{seasonMatches.length}</Text>
              <Text style={s.historyCountLabel} numberOfLines={2}>
                MATCHES ATTENDED
              </Text>
            </View>
            <View style={s.hxStatCard}>
              <Text style={s.hxStatNumber}>{seasonStadiums}</Text>
              <Text style={s.historyCountLabel} numberOfLines={2}>
                STADIUMS VISITED
              </Text>
            </View>
            <View style={s.hxStatCard}>
              <Text style={s.hxStatNumber}>{seasonTicketCount}</Text>
              <Text style={s.historyCountLabel} numberOfLines={2}>
                TICKETS SAVED
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 14,
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <Text style={{ fontWeight: "800", color: "#1a7a3c" }}>
              {seasonResults.win} W
            </Text>
            <Text style={{ fontWeight: "800", color: "#777777" }}>
              {seasonResults.draw} D
            </Text>
            <Text style={{ fontWeight: "800", color: "#a03030" }}>
              {seasonResults.loss} L
            </Text>
          </View>
          {seasonMatches.length ? (
            seasonHistoryNeedsConcertina ? (
              <View>
                {orderedSeasonHistoryGroups.map(
                  ([season, records]) => {
                    const expanded =
                      expandedSeasonHistorySeasons.has(season);

                    return (
                      <View key={season} style={{ marginBottom: 10 }}>
                        <Pressable
                          onPress={() =>
                            setExpandedSeasonHistorySeasons((current) => {
                              const next = new Set(current);

                              if (next.has(season)) {
                                next.delete(season);
                              } else {
                                next.add(season);
                              }

                              return next;
                            })
                          }
                          accessibilityRole="button"
                          accessibilityState={{ expanded }}
                          accessibilityLabel={`${season}, ${records.length} ${
                            records.length === 1 ? "match" : "matches"
                          }`}
                          style={({ pressed }) => ({
                            minHeight: 56,
                            borderWidth: 2,
                            borderColor: favouriteClub.primary,
                            borderRadius: 12,
                            backgroundColor: "#fffdf8",
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            flexDirection: "row",
                            alignItems: "center",
                            opacity: pressed ? 0.65 : 1,
                          })}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: "#17221c",
                                fontSize: 18,
                                fontWeight: "900",
                              }}
                            >
                              {season}
                            </Text>

                            <Text
                              style={{
                                color: "#657069",
                                fontSize: 12,
                                fontWeight: "700",
                                marginTop: 2,
                              }}
                            >
                              {records.length}{" "}
                              {records.length === 1
                                ? "match"
                                : "matches"}
                            </Text>
                          </View>

                          <Ionicons
                            name={
                              expanded
                                ? "chevron-up-outline"
                                : "chevron-down-outline"
                            }
                            size={22}
                            color={visibleInkOnCream(
                              favouriteClub.primary,
                            )}
                          />
                        </Pressable>

                        {expanded ? (
                          <View style={{ marginTop: 10 }}>
                            {records.map(renderMatchCard)}
                          </View>
                        ) : null}
                      </View>
                    );
                  },
                )}
              </View>
            ) : (
              seasonMatches.map(renderMatchCard)
            )
          ) : (
            <Text style={[s.helpText, { textAlign: "center", marginTop: 8 }]}>
              {seasonFilter === "All Seasons"
                ? "No confirmed matches yet."
                : `No matches recorded for ${seasonFilter} yet.`}
            </Text>
          )}
        </>,
      );
    }

    // ---------- HISTORY HOME ----------

    return (
      <SafeAreaView style={[s.safe, { backgroundColor: "#f5f1e8" }]}>
        <ScrollView
          ref={historyScrollRef}
          style={{ backgroundColor: "#f5f1e8" }}
          contentContainerStyle={[s.page, { paddingBottom: 120 }]}
          onScroll={(event) => {
            if (!selectedHistoryRecordId) {
              historyScrollOffsetRef.current =
                event.nativeEvent.contentOffset.y;
            }
          }}
          scrollEventThrottle={16}
          onScrollBeginDrag={Keyboard.dismiss}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[s.kicker, { marginBottom: 6 }]}>📖 FOOTBALL HISTORY</Text>
          <Text
            style={[
              s.title,
              { color: "#17221c", fontSize: 26, letterSpacing: -0.4 },
            ]}
          >
            Your confirmed match history
          </Text>
          <Text style={[s.helpText, { marginTop: 2, marginBottom: 20 }]}> 
            Only matches you confirm count. Fixtures are never treated as
            attendance.
          </Text>
          {historySearchBox}

          {seasonTicketProfiles.length
            ? (() => {
                const sortedSeasonTicketProfiles = [...seasonTicketProfiles].sort(
                  (a, b) =>
                    b.seasonKey.localeCompare(a.seasonKey) ||
                    a.club.localeCompare(b.club) ||
                    a.createdAt - b.createdAt,
                );
                const useSeasonTicketCarousel =
                  sortedSeasonTicketProfiles.length > 5;
                const carouselPageWidth = Math.max(
                  280,
                  Dimensions.get("window").width - 40,
                );
                const carouselCardGap = 6;
                const carouselCardWidth =
                  (carouselPageWidth - carouselCardGap * 3) / 4;
                const seasonTicketPages = Array.from(
                  {
                    length: Math.ceil(sortedSeasonTicketProfiles.length / 4),
                  },
                  (_, pageIndex) =>
                    sortedSeasonTicketProfiles.slice(
                      pageIndex * 4,
                      pageIndex * 4 + 4,
                    ),
                );
                const openSeasonTicketProfile = (
                  profile: SeasonTicketProfile,
                ) => {
                  setProfileFixtures(null);
                  setSeasonSeatDraft(null);
                  setHomeFixturesProfileId(profile.id);
                };

                return (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={[s.hxSectionTitle, { marginBottom: 10 }]}>
                      SEASON TICKET ATTENDANCE
                    </Text>

                    {useSeasonTicketCarousel ? (
                      <>
                        <ScrollView
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          decelerationRate="fast"
                          snapToInterval={carouselPageWidth}
                          disableIntervalMomentum
                          style={{ marginHorizontal: -2 }}
                          contentContainerStyle={{ paddingHorizontal: 2 }}
                        >
                          {seasonTicketPages.map((page, pageIndex) => (
                            <View
                              key={`season-ticket-page-${pageIndex}`}
                              style={{
                                width: carouselPageWidth,
                                flexDirection: "row",
                                gap: carouselCardGap,
                                paddingRight: 2,
                              }}
                            >
                              {page.map((profile) => {
                                const displayClub = clubNamesMatch(
                                  profile.club,
                                  ticketCollectionClub.name,
                                )
                                  ? ticketCollectionClub.name
                                  : profile.club;

                                return (
                                  <Pressable
                                    key={profile.id}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Open ${displayClub} ${profile.seasonKey} season ticket`}
                                    onPress={() =>
                                      openSeasonTicketProfile(profile)
                                    }
                                    style={({ pressed }) => ({
                                      width: carouselCardWidth,
                                      minHeight: 104,
                                      borderWidth: 1,
                                      borderColor: favouriteClub.primary,
                                      borderRadius: 10,
                                      backgroundColor: "#fffdf8",
                                      paddingHorizontal: 6,
                                      paddingVertical: 8,
                                      justifyContent: "space-between",
                                      opacity: pressed ? 0.65 : 1,
                                    })}
                                  >
                                    <View>
                                      <Text
                                        numberOfLines={2}
                                        style={{
                                          color: "#17221c",
                                          fontWeight: "900",
                                          fontSize: 10,
                                          lineHeight: 12,
                                        }}
                                      >
                                        {displayClub}
                                      </Text>
                                      <Text
                                        numberOfLines={1}
                                        style={{
                                          color: "#657069",
                                          fontWeight: "800",
                                          fontSize: 10,
                                          marginTop: 4,
                                        }}
                                      >
                                        {profile.seasonKey}
                                      </Text>
                                    </View>
                                    <Text
                                      style={{
                                        color: visibleInkOnCream(
                                          favouriteClub.primary,
                                        ),
                                        fontWeight: "900",
                                        fontSize: 9,
                                        letterSpacing: 0.4,
                                      }}
                                    >
                                      OPEN
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          ))}
                        </ScrollView>

                        <Text
                          style={[
                            s.collectionSub,
                            {
                              marginTop: 7,
                              textAlign: "center",
                            },
                          ]}
                        >
                          Swipe for more season tickets · 4 shown at a time
                        </Text>
                      </>
                    ) : (
                      sortedSeasonTicketProfiles.map((profile) => (
                        <View
                          key={profile.id}
                          style={[
                            s.collectionCard,
                            {
                              borderColor: favouriteClub.primary,
                              backgroundColor: "#fffdf8",
                              marginBottom: 10,
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={s.collectionCount}>
                              {clubNamesMatch(
                                profile.club,
                                ticketCollectionClub.name,
                              )
                                ? ticketCollectionClub.name
                                : profile.club}{" "}
                              · {profile.seasonKey}
                            </Text>
                            <Text style={s.collectionSub}>
                              Home fixtures only. Confirm attendance here.
                            </Text>
                          </View>
                          <Pressable
                            style={[
                              s.resetButton,
                              { backgroundColor: favouriteClub.primary },
                            ]}
                            onPress={() =>
                              openSeasonTicketProfile(profile)
                            }
                          >
                            <Text
                              style={[
                                s.resetButtonText,
                                {
                                  color: readableTextColour(
                                    favouriteClub.primary,
                                  ),
                                },
                              ]}
                            >
                              OPEN
                            </Text>
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>
                );
              })()
            : null}

          {!resolvedHistoryClubName ? (
            <View style={[s.collectionCard, { borderColor: "#c9c2b1" }]}>
              <Text style={s.helpText}>
                Set your club once and new tickets will link to your history
                automatically.
              </Text>
              <Pressable
                style={[s.resetButton, { backgroundColor: favouriteClub.primary }]}
                onPress={() => setActiveTab("club")}
              >
                <Text
                  style={[
                    s.resetButtonText,
                    { color: readableTextColour(favouriteClub.primary) },
                  ]}
                >
                  CHOOSE YOUR CLUB
                </Text>
              </Pressable>
            </View>
          ) : null}

          {historySectionTabs}

          {resolvedHistoryClubName ? (
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 18 }}>
              <Pressable
                disabled={photoAction === "auto"}
                style={({ pressed }) => [
                  s.hxActionButton,
                  { minHeight: 50, paddingHorizontal: 4, paddingVertical: 6 },
                  { backgroundColor: favouriteClub.primary, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => void openAddMatchForm()}
              >
                <Ionicons name="football-outline" size={16} color={readableTextColour(favouriteClub.primary)} />
                <Text style={[s.hxActionButtonText, { color: readableTextColour(favouriteClub.primary), fontSize: 10 }]}> 
                  ADD MATCH
                </Text>
              </Pressable>
              <Pressable
                disabled={photoAction === "auto"}
                style={({ pressed }) => [
                  s.hxActionButton,
                  {
                    minHeight: 50,
                    paddingHorizontal: 4,
                    paddingVertical: 6,
                    backgroundColor: "#ffffff",
                    borderWidth: 2,
                    borderColor: favouriteClub.primary,
                    opacity:
                      pressed || photoAction === "auto" || autoDiscoveryCompleted
                        ? 0.55
                        : 1,
                  },
                ]}
                onPress={runHistoryAutoAdd}
              >
                <Ionicons name="images-outline" size={16} color={visibleInkOnCream(favouriteClub.primary)} />
                <Text style={[s.hxActionButtonText, { color: visibleInkOnCream(favouriteClub.primary), fontSize: 10 }]}> 
                  {photoAction === "auto"
                    ? "AUTO ADDING…"
                    : "AUTO ADD"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedHistoryDeleteIds(new Set());
                  setHistorySelectionMode(true);
                  setHistoryView("matches");
                }}
                style={({ pressed }) => [
                  s.hxActionButton,
                  {
                    minHeight: 50,
                    paddingHorizontal: 4,
                    paddingVertical: 6,
                    backgroundColor: "#ffffff",
                    borderWidth: 2,
                    borderColor: "#a03030",
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
                accessibilityLabel="Edit or delete matches from History"
              >
                <Ionicons name="trash-outline" size={16} color="#a03030" />
                <Text style={[s.hxActionButtonText, { color: "#a03030", fontSize: 10 }]}> 
                  DELETE
                </Text>
              </Pressable>
            </View>
          ) : null}

          {newestFirst.length ? (
            <>
              <Text style={[s.hxSectionTitle, { marginBottom: 10 }]}>
                MATCHES ATTENDED
              </Text>
              {competitionSelector}

              {filteredMatches.length ? (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 14,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <Text style={{ fontWeight: "800", color: "#1a7a3c" }}>
                    {matchResults.win} W
                  </Text>
                  <Text style={{ fontWeight: "800", color: "#777777" }}>
                    {matchResults.draw} D
                  </Text>
                  <Text style={{ fontWeight: "800", color: "#a03030" }}>
                    {matchResults.loss} L
                  </Text>
                </View>
              ) : null}

              {filteredMatches.length ? (
                renderMatchHistoryConcertina()
              ) : (
                <Text
                  style={[s.helpText, { textAlign: "center", marginBottom: 18 }]}
                >
                  No matches for this competition yet.
                </Text>
              )}

            </>
          ) : (
            <View
              style={[
                s.collectionCard,
                {
                  borderColor: favouriteClub.primary,
                  backgroundColor: "#fffdf8",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 18,
                  paddingHorizontal: 18,
                },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={30}
                color={visibleInkOnCream(favouriteClub.primary)}
              />
              <Text
                style={{
                  marginTop: 7,
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#17221c",
                  textAlign: "center",
                }}
              >
                No confirmed matches yet
              </Text>
              {seasonTickets.length > 0 ? (
                <Text
                  style={[
                    s.helpText,
                    {
                      width: "100%",
                      marginTop: 4,
                      marginBottom: 0,
                      textAlign: "center",
                    },
                  ]}
                >
                  You have saved tickets, but none contain recognisable match
                  details yet. Match tickets appear here automatically.
                </Text>
              ) : (
                <Text
                  style={[
                    s.helpText,
                    {
                      width: "100%",
                      marginTop: 4,
                      marginBottom: 0,
                      textAlign: "center",
                    },
                  ]}
                >
                  No matches in your football history yet. Save a ticket, or use
                  ADD MATCH TO HISTORY to log a past attendance by hand.
                </Text>
              )}
            </View>
          )}

          {bottomNav()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (activeTab === "grounds") {
    const confirmedGroundVisits = confirmedGroundVisitCounts(
      mergeHistoryRecords(
        attendanceHistory,
        deriveAttendancesFromTickets(
          tickets,
          ticketCollectionClubName ?? favouriteClub.name,
        ),
      ),
    );
    const { search, myLeagueGrounds, allGrounds } = groundTrackerRows({
      league: favouriteClub.league,
      searchText: groundSearch,
      coordinates: userCoords,
    });

    const renderGroundRow = (
      ground: GroundTrackerRow,
    ) => {
      // History/ticket attendances are the source of truth. Keep the older
      // manually tapped count as a fallback, without double-counting it.
      const visits = Math.max(
        groundVisits[ground.id] ?? 0,
        confirmedGroundVisits[ground.id] ?? 0,
      );
      const parkingOpen = parkingPanel?.groundId === ground.id;
      const openParkingNavigation = (
        provider: "waze" | "google",
        carPark: NearbyParkingResult,
      ) => {
        const coordinates = `${carPark.latitude},${carPark.longitude}`;
        if (provider === "waze") {
          void Linking.openURL(`waze://?ll=${coordinates}&navigate=yes`).catch(() =>
            Linking.openURL(`https://waze.com/ul?ll=${coordinates}&navigate=yes`),
          );
          return;
        }
        void Linking.openURL(
          `comgooglemaps://?daddr=${coordinates}&directionsmode=driving`,
        ).catch(() =>
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${coordinates}&travelmode=driving`,
          ),
        );
      };
      return (
        <View key={ground.id} style={[s.groundRow, { flexDirection: "column" }]}>
          <View style={{ width: "100%", flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <Text style={s.clubName}>{ground.club}</Text>
            <Text>🏟 {ground.stadium}</Text>
            <Text>{ground.league}</Text>
            <Text>
              {ground.distance != null
                ? `${ground.distance.toFixed(1)} miles away`
                : ground.address}
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontWeight: "700",
                color: visits ? "#1a7a3c" : "#888888",
              }}
            >
              {visits
                ? `✓ Visited · ${visits} visit${visits === 1 ? "" : "s"}`
                : "Not visited"}
            </Text>
            <Pressable
              onPress={() => toggleGroundVisit(ground.id)}
              style={{ alignSelf: "flex-start", marginTop: 7 }}
            >
              <Text style={{ color: visibleInkOnCream(favouriteClub.primary), fontWeight: "800" }}>
                {groundVisits[ground.id] ? "REMOVE MANUAL VISIT" : "MARK AS VISITED"}
              </Text>
            </Pressable>
          </View>
          <View>
            {installedNavigationApps.waze ? (
            <Pressable
              onPress={() =>
                Linking.openURL(
                  `waze://?ll=${ground.latitude},${ground.longitude}&navigate=yes`,
                ).catch(() =>
                  Linking.openURL(
                    `http://maps.apple.com/?daddr=${ground.latitude},${ground.longitude}&dirflg=d`,
                  ).catch(() =>
                    Alert.alert("Directions unavailable", "Could not open a navigation app."),
                  ),
                )
              }
            >
              <Text style={{ color: visibleInkOnCream(favouriteClub.primary), fontWeight: "800" }}>
                Waze
              </Text>
            </Pressable>
            ) : null}
            {installedNavigationApps.google ? (
            <Pressable
              style={{ marginTop: installedNavigationApps.waze ? 16 : 0 }}
              onPress={() =>
                Linking.openURL(
                  `comgooglemaps://?daddr=${ground.latitude},${ground.longitude}&directionsmode=driving`,
                ).catch(() =>
                  Linking.openURL(
                    `http://maps.apple.com/?daddr=${ground.latitude},${ground.longitude}&dirflg=d`,
                  ).catch(() =>
                    Alert.alert("Directions unavailable", "Could not open a navigation app."),
                  ),
                )
              }
            >
              <Text style={{ color: visibleInkOnCream(favouriteClub.primary), fontWeight: "800" }}>
                Google
              </Text>
            </Pressable>
            ) : null}
          </View>
          </View>
          <Pressable
            onPress={() => {
              if (parkingOpen && !parkingPanel.loading) setParkingPanel(null);
              else void loadParkingForGround(ground);
            }}
            style={{
              width: "100%",
              marginTop: 12,
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: visibleInkOnCream(favouriteClub.primary), fontWeight: "900" }}>
              {parkingOpen ? "HIDE CAR PARKS" : "3 NEARBY CAR PARKS"}
            </Text>
          </Pressable>
          {parkingOpen ? (
            <View style={{ width: "100%", marginTop: 9 }}>
              {parkingPanel.loading ? (
                <Text style={s.helpText}>Finding the three closest car parks…</Text>
              ) : parkingPanel.error ? (
                <Text style={[s.helpText, { marginBottom: 0 }]}>Parking results are temporarily unavailable.</Text>
              ) : (
                parkingPanel.items.map((carPark) => (
                  <View
                    key={carPark.id}
                    style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#ded8ca" }}
                  >
                    {carPark.previewUri ? (
                      <Image
                        alt={`Map preview for ${carPark.name}`}
                        source={{ uri: carPark.previewUri }}
                        resizeMode="cover"
                        style={{ width: "100%", height: 105, borderRadius: 8, marginBottom: 6 }}
                      />
                    ) : null}
                    <Text style={{ fontWeight: "800", color: "#17221c" }}>
                      {carPark.name} · {carPark.distanceMiles.toFixed(1)} miles
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 7 }}>
                      {(["waze", "google"] as const)
                        .filter((provider) => installedNavigationApps[provider])
                        .map((provider) => (
                        <Pressable
                          key={provider}
                          onPress={() => openParkingNavigation(provider, carPark)}
                          style={{
                            borderWidth: 1,
                            borderColor: favouriteClub.primary,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                          }}
                        >
                          <Text style={{ color: visibleInkOnCream(favouriteClub.primary), fontWeight: "900" }}>
                            {provider === "waze" ? "Waze" : "Google Maps"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>
      );
    };

    return (
      <SafeAreaView style={s.safe}>
        <ScrollView
      contentContainerStyle={s.page}
      onScrollBeginDrag={Keyboard.dismiss}
      keyboardShouldPersistTaps="handled"
    >
          <Text style={s.kicker}>🏟 GROUND TRACKER</Text>
          <Text style={s.title}>Find football grounds</Text>
          <Text style={s.helpText}>
            {gpsAccuracy
              ? `Location accuracy: ${Math.round(gpsAccuracy)} metres`
              : userCoords
                ? "Location ready"
                : "Allow location to sort grounds by distance."}
          </Text>

          <Pressable
            style={[
              s.resetButton,
              { backgroundColor: favouriteClub.primary, marginBottom: 14 },
            ]}
            onPress={() => void locateForGrounds()}
          >
            <Text
              style={[
                s.resetButtonText,
                { color: readableTextColour(favouriteClub.primary) },
              ]}
            >
              {groundsLoading ? "LOCATING..." : "REFRESH MY LOCATION"}
            </Text>
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <TextInput
              placeholder="Search any ground in the UK"
              value={groundSearch}
              onChangeText={setGroundSearch}
              style={{
                borderWidth: 1,
                borderColor: "#cccccc",
                borderRadius: 10,
                padding: 12,
                flex: 1,
              }}
            />
            {groundSearch.length > 0 && (
              <Pressable
                hitSlop={12}
                onPress={() => setGroundSearch("")}
                style={{ paddingHorizontal: 10 }}
              >
                <Ionicons name="close-circle" size={22} color="#999999" />
              </Pressable>
            )}
          </View>
          {backToHomeButton(20)}

          <Text style={[s.leagueTitle, { marginBottom: 8 }]}>MY LEAGUE</Text>
          {myLeagueGrounds.length ? (
            myLeagueGrounds.map(renderGroundRow)
          ) : (
            <Text style={s.helpText}>
              No grounds found for {favouriteClub.league}.
            </Text>
          )}

          <Text style={[s.leagueTitle, { marginTop: 18, marginBottom: 8 }]}>
            {search ? "ALL GROUNDS" : "ALL GROUNDS · NEAREST 5"}
          </Text>
          {allGrounds.length ? (
            allGrounds.map(renderGroundRow)
          ) : (
            <Text style={s.helpText}>
              No grounds match your search.
            </Text>
          )}

          {bottomNav()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (activeTab === "fixtures") {
    // Use the identical verified, date-aware selection as the Home screen.
    const nextMatch = verifiedNextFavouriteFixture;

    const hasFixtures = seasonFixtures.length > 0;
    const hasTable = leagueTableRows.length > 0;
    const updatedLabel = formatLastUpdated(fixturesUpdatedAt);

    const renderFixtureRow = ({
      item,
    }: {
      item: FixtureRow;
      index: number;
    }) => (
      <FixtureListRow
        item={item}
        nextMatchId={nextMatch?.id}
        clubName={favouriteClub.name}
        primaryColour={favouriteClub.primary}
      />
    );

    const renderTableRow = ({
      item,
      index,
    }: {
      item: TableRow;
      index: number;
    }) => (
      <LeagueTableRow
        item={item}
        index={index}
        selectedTeamId={clubApiId || favouriteClub.id}
        selectedTeamName={favouriteClub.name}
        primaryColour={favouriteClub.primary}
      />
    );

    return (
      <SafeAreaView style={s.safe}>
        <FixturesHeader
          clubName={favouriteClub.name}
          league={favouriteClub.league}
          primaryColour={favouriteClub.primary}
          updatedLabel={updatedLabel}
          loading={fixturesLoading}
          mode={fixtureMode}
          onRefresh={() => {
            void loadFixtures({ force: true }).then(() => {
              const generatedAt = Date.parse(getMatchDatabaseGeneratedAt());
              Alert.alert(
                "Table checked",
                Number.isFinite(generatedAt)
                  ? `Latest data in this app: ${formatLastUpdated(generatedAt)}.`
                  : "The installed table has been reloaded.",
              );
            });
          }}
          onModeChange={setFixtureMode}
        />

        {fixturesError && !(fixtureMode === "table" ? hasTable : hasFixtures) ? (
          <FixturesError
            message={fixturesError}
            primaryColour={favouriteClub.primary}
            onRetry={() => void loadFixtures()}
          />
        ) : null}

        <FixturesContent
          mode={fixtureMode}
          loading={fixturesLoading}
          fixtures={seasonFixtures}
          tableRows={leagueTableRows}
          tableSeason={tableSeason}
          updatedLabel={updatedLabel}
          nextMatchCard={renderNextMatchCard(nextMatch)}
          renderFixtureRow={renderFixtureRow}
          renderTableRow={renderTableRow}
        />

        {bottomNav()}
      </SafeAreaView>
    );
  }
  if (showSeasonManager) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.page}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.kicker}>SETTINGS</Text>
          <Text style={s.title}>Ticket Frame</Text>
          <Text style={s.helpText}>Latest build: {APP_VERSION}</Text>
          <Text style={s.helpText}>
            Seasons are created automatically from saved ticket dates. No manual
            season management is available.
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 9,
              marginVertical: 7,
              backgroundColor: "#ffffff",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ flex: 1, fontWeight: "900", fontSize: 14 }}>
                NEXT MATCH CHECK-IN
              </Text>
              <Pressable
                onPress={() =>
                  setSettingsDetailsExpanded((current) => ({
                    ...current,
                    checkIn: !current.checkIn,
                  }))
                }
                accessibilityRole="button"
                accessibilityState={{
                  expanded: Boolean(settingsDetailsExpanded.checkIn),
                }}
                style={{ paddingVertical: 3, paddingLeft: 8 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: visibleInkOnCream(favouriteClub.primary),
                  }}
                >
                  {settingsDetailsExpanded.checkIn ? "SEE LESS" : "SEE MORE"}
                </Text>
              </Pressable>
            </View>
            {settingsDetailsExpanded.checkIn ? (
              <Text style={[s.helpText, { marginBottom: 6 }]}>
                Low-power stadium detection for the single Next Match. It only
                offers a check-in from one hour before kick-off until one hour
                afterwards.
              </Text>
            ) : null}
            <Pressable
              onPress={() => void (async () => {
                const enabled = !matchCheckInEnabled;
                if (!enabled) {
                  setMatchCheckInEnabledState(false);
                  await setMatchCheckInEnabled(false);
                  await configureMatchGeofences([]);
                  return;
                }
                await Notifications.requestPermissionsAsync();
                const foreground = await Location.requestForegroundPermissionsAsync();
                const background = foreground.granted
                  ? await Location.requestBackgroundPermissionsAsync()
                  : null;
                const granted = foreground.granted && Boolean(background?.granted);
                setMatchCheckInEnabledState(granted);
                await setMatchCheckInEnabled(granted);
                if (!granted)
                  Alert.alert(
                    "Location access needed",
                    "Next Match Check-in remains off. Allow Always location access in iOS Settings to use stadium check-ins.",
                  );
              })()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                backgroundColor: matchCheckInEnabled
                  ? favouriteClub.secondary
                  : "#e4e1da",
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: matchCheckInEnabled }}
            >
              <Text
                style={{
                  fontWeight: "900",
                  color: matchCheckInEnabled
                    ? readableTextColour(favouriteClub.secondary)
                    : "#555555",
                }}
              >
                {matchCheckInEnabled ? "ON" : "OFF"}
              </Text>
              <Ionicons
                name={matchCheckInEnabled ? "toggle" : "toggle-outline"}
                size={30}
                color={matchCheckInEnabled ? favouriteClub.primary : "#777777"}
              />
            </Pressable>
          </View>
          
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 9,
              marginBottom: 7,
              backgroundColor: "#ffffff",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ flex: 1, fontWeight: "900", fontSize: 14 }}>
                USE WITH SIRI
              </Text>
              <Pressable
                onPress={() =>
                  setSettingsDetailsExpanded((current) => ({
                    ...current,
                    siri: !current.siri,
                  }))
                }
                accessibilityRole="button"
                accessibilityState={{
                  expanded: Boolean(settingsDetailsExpanded.siri),
                }}
                style={{ paddingVertical: 3, paddingLeft: 8 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: visibleInkOnCream(favouriteClub.primary),
                  }}
                >
                  {settingsDetailsExpanded.siri ? "SEE LESS" : "SEE MORE"}
                </Text>
              </Pressable>
            </View>
            {settingsDetailsExpanded.siri ? (
              <Text style={[s.helpText, { marginBottom: 6 }]}>
                Lets Siri find locally saved tickets and Match Memories by team or
                date, open game photos, open History, My Club, Stadiums or Fixtures,
                read the next verified favourite-club fixture, and open stadium
                navigation choices.
              </Text>
            ) : null}
            <Pressable
              onPress={() => {
                const enabled = !siriEnabled;
                setSiriEnabled(enabled);
                void AsyncStorage.setItem(SIRI_FEATURE_KEY, String(enabled));
                void AsyncStorage.setItem(SIRI_ASKED_KEY, "true");
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                opacity: pressed ? 0.6 : 1,
                backgroundColor: siriEnabled
                  ? favouriteClub.secondary
                  : "#e4e1da",
              })}
              accessibilityRole="switch"
              accessibilityState={{ checked: siriEnabled }}
            >
              <Text
                style={{
                  fontWeight: "900",
                  color: siriEnabled
                    ? readableTextColour(favouriteClub.secondary)
                    : "#555555",
                }}
              >
                {siriEnabled ? "ON" : "OFF"}
              </Text>
              <Ionicons
                name={siriEnabled ? "toggle" : "toggle-outline"}
                size={30}
                color={siriEnabled ? favouriteClub.primary : "#777777"}
              />
            </Pressable>
            {settingsDetailsExpanded.siri ? (
              <Text style={[s.helpText, { marginTop: 6, marginBottom: 0 }]}>
                Siri voice requests are processed by Apple. Ticket Frame shares a
                small text-only search index needed for the requested shortcut;
                ticket images, match photos, QR codes and NFC information are not
                included. You can turn this off at any time.
              </Text>
            ) : null}
          </View>
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 9,
              marginBottom: 7,
              backgroundColor: "#ffffff",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ flex: 1, fontWeight: "900", fontSize: 14 }}>
                USE PHOTOS FOR MATCH MEMORIES
              </Text>
              <Pressable
                onPress={() =>
                  setSettingsDetailsExpanded((current) => ({
                    ...current,
                    photos: !current.photos,
                  }))
                }
                accessibilityRole="button"
                accessibilityState={{
                  expanded: Boolean(settingsDetailsExpanded.photos),
                }}
                style={{ paddingVertical: 3, paddingLeft: 8 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: visibleInkOnCream(favouriteClub.primary),
                  }}
                >
                  {settingsDetailsExpanded.photos ? "SEE LESS" : "SEE MORE"}
                </Text>
              </Pressable>
            </View>
            {settingsDetailsExpanded.photos ? (
              <Text style={[s.helpText, { marginBottom: 6 }]}>
                Automatically saves photos matching a match date and stadium. ADD PHOTOS
                and FIND AT STADIUM remain available in every Match Memory.
              </Text>
            ) : null}
            <Pressable
              onPress={() => void (async () => {
                const enabled = !photoMemoriesEnabled;
                if (!enabled) {
                  setPhotoMemoriesEnabled(false);
                  await AsyncStorage.setItem(PHOTO_FEATURE_KEY, "false");
                  return;
                }
                const permission = await MediaLibrary.requestPermissionsAsync();
                const granted = permission.granted || permission.accessPrivileges === "limited";
                setPhotoMemoriesEnabled(granted);
                await AsyncStorage.setItem(PHOTO_FEATURE_KEY, String(granted));
                if (granted)
                  await AsyncStorage.removeItem(HISTORY_PHOTO_SETUP_KEY);
                else
                  Alert.alert(
                    "Photos access needed",
                    "Photo Memories remains off. Allow Photos access in iOS Settings to find match-day photos automatically.",
                  );
              })()}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                opacity: pressed ? 0.6 : 1,
                backgroundColor: photoMemoriesEnabled ? favouriteClub.secondary : "#e4e1da",
              })}
              accessibilityRole="switch"
              accessibilityState={{ checked: photoMemoriesEnabled }}
            >
              <Text style={{ fontWeight: "900", color: photoMemoriesEnabled ? readableTextColour(favouriteClub.secondary) : "#555555" }}>
                {photoMemoriesEnabled ? "ON" : "OFF"}
              </Text>
              <Ionicons name={photoMemoriesEnabled ? "toggle" : "toggle-outline"} size={30} color={photoMemoriesEnabled ? favouriteClub.primary : "#777777"} />
            </Pressable>
            {photoMemoriesEnabled ? (
              <>
                <Pressable
                  onPress={() => {
                    const wifiOnly = !photoWifiOnly;
                    setPhotoWifiOnly(wifiOnly);
                    void AsyncStorage.getItem(HISTORY_PHOTO_SETUP_KEY).then((raw) => {
                      let albumId: string | null = null;
                      try { albumId = raw ? (JSON.parse(raw) as { albumId?: string | null }).albumId ?? null : null; } catch {}
                      void AsyncStorage.setItem(HISTORY_PHOTO_SETUP_KEY, JSON.stringify({ albumId, wifiOnly }));
                    });
                  }}
                  style={({ pressed }) => ({ marginTop: 10, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#eae6dd", opacity: pressed ? 0.6 : 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" })}
                >
                  <Text style={{ fontWeight: "900", color: "#17221c" }}>PHOTOS: {photoWifiOnly ? "WI-FI ONLY" : "WI-FI OR MOBILE DATA"}</Text>
                  <Ionicons name="wifi-outline" size={22} color={favouriteClub.primary} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    autoPhotoScannedRecordsRef.current.clear();
                    void AsyncStorage.removeItem(HISTORY_PHOTO_SETUP_KEY);
                    Alert.alert("Photo scan reset", "Restart the app to confirm the All Photos and mobile-data preference again.");
                  }}
                  style={({ pressed }) => ({ marginTop: 8, paddingVertical: 10, opacity: pressed ? 0.55 : 1 })}
                >
                  <Text style={{ fontWeight: "800", color: favouriteClub.primary, textAlign: "center" }}>RESET ALL PHOTOS SCAN</Text>
                </Pressable>
              </>
            ) : null}
          </View>
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 7,
              backgroundColor: "#ffffff",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-outline" size={21} color={favouriteClub.primary} />
              <Text style={{ flex: 1, marginLeft: 9, fontWeight: "900", fontSize: 14 }}>
                VENUE LOOKUP & PRIVACY
              </Text>
              <Pressable
                onPress={() => setVenuePrivacyExpanded((current) => !current)}
                accessibilityRole="button"
                accessibilityState={{ expanded: venuePrivacyExpanded }}
                accessibilityLabel={venuePrivacyExpanded ? "Show less venue privacy information" : "See more venue privacy information"}
                style={{ paddingVertical: 5, paddingLeft: 10 }}
              >
                <Text style={{ fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>
                  {venuePrivacyExpanded ? "SHOW LESS" : "SEE MORE"}
                </Text>
              </Pressable>
            </View>
            {venuePrivacyExpanded ? (
              <View style={{ marginTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ddd6c8", paddingTop: 9 }}>
                <Text style={[s.helpText, { marginBottom: 8 }]}> 
                  Match-photo dates and locations are normally processed on this
                  iPhone. When you request nearby pubs, restaurants or car parks,
                  Ticket Frame uses Apple Maps to return the closest places. Ticket
                  Frame does not operate a location server, store these coordinates
                  remotely, use them for advertising or use them for tracking.
                </Text>
                <Pressable
                  onPress={() => void Linking.openURL("https://www.apple.com/legal/privacy/data/en/apple-maps/")}
                  accessibilityLabel="Open Apple Maps privacy information"
                >
                  <Text style={{ fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>
                    Apple Maps privacy information
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 9,
              marginBottom: 7,
              backgroundColor: "#ffffff",
            }}
          >
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 14,
              padding: 14,
              marginBottom: 12,
              backgroundColor: "#fffaf0",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <Ionicons
                name="play-circle-outline"
                size={24}
                color={favouriteClub.primary}
              />
              <Text style={{ flex: 1, fontWeight: "900", fontSize: 14 }}>
                WATCH TICKET FRAME DEMO
              </Text>
            </View>

            <Text style={[s.helpText, { marginBottom: 10 }]}>
              Take a guided tour of Ticket Frame without changing your tickets,
              memories or settings.
            </Text>

            <Pressable
              onPress={openDemoModeFromMain}
              accessibilityRole="button"
              accessibilityLabel="Watch Ticket Frame Demo"
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 11,
                backgroundColor: favouriteClub.primary,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons
                name="play"
                size={18}
                color={readableTextColour(favouriteClub.primary)}
              />
              <Text
                style={{
                  fontWeight: "900",
                  color: readableTextColour(favouriteClub.primary),
                }}
              >
                WATCH DEMO
              </Text>
            </Pressable>
          </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ flex: 1, fontWeight: "900", fontSize: 14 }}>
                BACKUP & RESTORE
              </Text>
              <Pressable
                onPress={() =>
                  setSettingsDetailsExpanded((current) => ({
                    ...current,
                    backup: !current.backup,
                  }))
                }
                accessibilityRole="button"
                accessibilityState={{
                  expanded: Boolean(settingsDetailsExpanded.backup),
                }}
                style={{ paddingVertical: 3, paddingLeft: 8 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: visibleInkOnCream(favouriteClub.primary),
                  }}
                >
                  {settingsDetailsExpanded.backup ? "SEE LESS" : "SEE MORE"}
                </Text>
              </Pressable>
            </View>
            {settingsDetailsExpanded.backup ? (
              <Text style={[s.helpText, { marginBottom: 6 }]}>
                Save a private snapshot of tickets, history, settings and Match
                Memory copies on this iPhone. An on-device backup is removed if
                Ticket Frame itself is deleted.
              </Text>
            ) : null}
            <Text style={{ color: "#68736d", fontWeight: "700", marginBottom: 10 }}>
              {localBackupCreatedAt
                ? `Latest backup: ${new Date(localBackupCreatedAt).toLocaleString("en-GB")}`
                : "No backup saved"}
            </Text>
            <Pressable
              disabled={localBackupBusy}
              onPress={() => void handleCreateLocalBackup()}
              style={({ pressed }) => ({
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 9,
                alignItems: "center",
                backgroundColor: favouriteClub.secondary,
                opacity: localBackupBusy ? 0.45 : pressed ? 0.65 : 1,
              })}
            >
              <Text style={{ fontWeight: "900", color: readableTextColour(favouriteClub.secondary) }}>
                {localBackupBusy ? "WORKING…" : localBackupCreatedAt ? "UPDATE BACKUP" : "CREATE BACKUP"}
              </Text>
            </Pressable>
            {localBackupCreatedAt ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Pressable
                  disabled={localBackupBusy}
                  onPress={handleRestoreLocalBackup}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderWidth: 1,
                    borderColor: favouriteClub.primary,
                    borderRadius: 10,
                    paddingVertical: 8,
                    alignItems: "center",
                    opacity: localBackupBusy ? 0.45 : pressed ? 0.6 : 1,
                  })}
                >
                  <Text style={{ fontWeight: "900", color: favouriteClub.primary }}>RESTORE</Text>
                </Pressable>
                <Pressable
                  disabled={localBackupBusy}
                  onPress={handleDeleteLocalBackup}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#b52d2d",
                    borderRadius: 10,
                    paddingVertical: 8,
                    alignItems: "center",
                    opacity: localBackupBusy ? 0.45 : pressed ? 0.6 : 1,
                  })}
                >
                  <Text style={{ fontWeight: "900", color: "#b52d2d" }}>DELETE BACKUP</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 10,
              marginBottom: 7,
              backgroundColor: "#ffffff",
            }}
          >
            <Pressable
              onPress={() => setSettingsDetailsExpanded((current) => ({
                ...current,
                sources: !current.sources,
              }))}
              style={{ flexDirection: "row", alignItems: "center" }}
              accessibilityRole="button"
              accessibilityState={{ expanded: Boolean(settingsDetailsExpanded.sources) }}
            >
              <Ionicons name="server-outline" size={21} color={favouriteClub.primary} />
              <Text style={{ flex: 1, marginLeft: 9, fontWeight: "900", fontSize: 14 }}>
                FOOTBALL DATA SOURCES
              </Text>
              <Text style={{ fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>
                {settingsDetailsExpanded.sources ? "SHOW LESS" : "SEE MORE"}
              </Text>
            </Pressable>
            {settingsDetailsExpanded.sources ? (
              <View style={{ marginTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ddd6c8", paddingTop: 9 }}>
                <Text style={[s.helpText, { marginBottom: 8 }]}>
                  Fixtures, scores, tables and related match information may be
                  compiled, checked or supplemented using the providers below.
                  Provider coverage varies by competition and season.
                </Text>
                {[
                  ["Football data provided by the Football-Data.org API", "https://www.football-data.org/"],
                  ["OpenFootball / football.json", "https://github.com/openfootball/football.json"],
                  ["Highlightly", "https://highlightly.net/"],
                  ["API-Football by API-Sports", "https://www.api-football.com/"],
                ].map(([label, url]) => (
                  <Pressable key={url} onPress={() => void Linking.openURL(url)} style={{ paddingVertical: 6 }}>
                    <Text style={{ fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
                <Text style={[s.helpText, { marginTop: 6, marginBottom: 0 }]}>
                  Third-party football data remains owned or licensed by its
                  respective provider and is subject to that provider's terms.
                </Text>
              </View>
            ) : null}
          </View>
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 10,
              marginBottom: 7,
              backgroundColor: "#ffffff",
            }}
          >
            <Pressable
              onPress={() => setSettingsDetailsExpanded((current) => ({
                ...current,
                policies: !current.policies,
              }))}
              style={{ flexDirection: "row", alignItems: "center" }}
              accessibilityRole="button"
              accessibilityState={{ expanded: Boolean(settingsDetailsExpanded.policies) }}
            >
              <Ionicons name="shield-checkmark-outline" size={21} color={favouriteClub.primary} />
              <Text style={{ flex: 1, marginLeft: 9, fontWeight: "900", fontSize: 14 }}>
                PRIVACY & TERMS
              </Text>
              <Text style={{ fontWeight: "900", color: visibleInkOnCream(favouriteClub.primary) }}>
                {settingsDetailsExpanded.policies ? "SHOW LESS" : "SEE MORE"}
              </Text>
            </Pressable>
            {settingsDetailsExpanded.policies ? (
              <View style={{ marginTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ddd6c8", paddingTop: 9 }}>
                <Text style={[s.helpText, { marginBottom: 9 }]}>
                  Ticket Frame uses football information from the listed data
                  providers to match fixtures and present scores and tables.
                  With your permission, photo/video dates and GPS locations are
                  processed to identify match attendance and matchday places.
                </Text>
                <Text style={[s.helpText, { marginBottom: 9 }]}>
                  Ticket Frame's software, design, branding, workflows and
                  original presentation are proprietary. You may use the app and
                  information shown through it for personal, non-commercial use
                  only. You must not copy, scrape, extract, republish, redistribute,
                  sublicense, reverse engineer or use Ticket Frame or its compiled
                  content to build or support another product or data service,
                  except where applicable law or an original third-party licence
                  expressly permits it.
                </Text>
                <Pressable
                  onPress={() => {
                    const accepted = !policyAgreed;
                    setPolicyAgreed(accepted);
                    void AsyncStorage.setItem(
                      POLICY_AGREEMENT_KEY,
                      accepted ? "accepted" : "declined",
                    );
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: policyAgreed }}
                  style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 7 }}
                >
                  <Ionicons
                    name={policyAgreed ? "checkbox" : "square-outline"}
                    size={26}
                    color={favouriteClub.primary}
                  />
                  <Text style={{ flex: 1, marginLeft: 9, fontWeight: "800", lineHeight: 20 }}>
                    I have read and agree to the Privacy Policy and Terms & Conditions.
                  </Text>
                </Pressable>
                {!policyAgreed ? (
                  <Text style={{ color: "#9d2d23", fontWeight: "800", marginTop: 4 }}>
                    Agreement is required before live data services are used.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => void Linking.openURL("mailto:info@handytize.co.uk?subject=Ticket%20Frame%20Support")}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 9,
              marginBottom: 7,
              backgroundColor: "#ffffff",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontWeight: "900", fontSize: 16, color: favouriteClub.primary }}>
              SUPPORT & PRIVACY CONTACT
            </Text>
            <Text style={[s.helpText, { marginTop: 5 }]}>info@handytize.co.uk</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              void Linking.openURL(
                "https://ticket-frame-privacy.marcus451121.chatgpt.site",
              )
            }
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 9,
              marginBottom: 7,
              backgroundColor: "#ffffff",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontWeight: "900", fontSize: 16, color: favouriteClub.primary }}>
              PRIVACY POLICY
            </Text>
            <Text style={[s.helpText, { marginTop: 5, marginBottom: 0 }]}>Open the published policy</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowSeasonManager(false)}
            style={[s.primary, { backgroundColor: favouriteClub.primary }]}
          >
            <Text
              style={[
                s.primaryText,
                { color: readableTextColour(favouriteClub.primary) },
              ]}
            >
              DONE
            </Text>
          </Pressable>
          {bottomNav()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Legacy season-manager implementation retained below for reference only;
  // manual season management is intentionally unreachable.
  if (false && showSeasonManager) {
    const seasonCounts = new Map<string, number>();
    tickets.forEach((ticket) => {
      if (!ticket.seasonKey) return;
      seasonCounts.set(
        ticket.seasonKey,
        (seasonCounts.get(ticket.seasonKey) ?? 0) + 1,
      );
    });
    const knownSeasons = Array.from(
      new Set([activeSeason, ...seasonCounts.keys()]),
    ).sort();

    return (
      <SafeAreaView style={s.safe}>
        <ScrollView
      contentContainerStyle={s.page}
      onScrollBeginDrag={Keyboard.dismiss}
      keyboardShouldPersistTaps="handled"
    >
          <Text style={s.kicker}>SEASON MANAGER</Text>
          <Text style={s.title}>Season settings</Text>
          <Text style={{ color: "#555555", marginBottom: 12 }}>
            {APP_NAME}
            {"\n"}
            Version {APP_VERSION}
          </Text>

          <Pressable
            onPress={openDemoModeFromMain}
            accessibilityLabel="Try Demo Mode"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 18,
              backgroundColor: "#ffffff",
            }}
          >
            <Ionicons
              name="play-circle-outline"
              size={15}
              color={favouriteClub.primary}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: visibleInkOnCream(favouriteClub.primary),
              }}
            >
              Try Demo Mode
            </Text>
          </Pressable>

          <Text style={[s.helpText, { fontWeight: "700" }]}>
            CURRENT SEASON
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800" }}>
              {activeSeason}
            </Text>
            <Text style={{ color: "#555555", marginTop: 4 }}>
              {seasonBoundsLabel(activeSeason)}
            </Text>
            <Text style={{ color: "#555555", marginTop: 2 }}>
              {seasonCounts.get(activeSeason) ?? 0} ticket(s) in this season
            </Text>
          </View>

          <Pressable
            onPress={() => {
              const now = new Date();
              const year =
                now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
              const currentLabel = `${year}/${String((year + 1) % 100).padStart(2, "0")}`;
              setDraftSeason(
                activeSeason && activeSeason <= currentLabel
                  ? currentLabel
                  : activeSeason || currentLabel,
              );
              setSeasonPickerOpen((open) => !open);
            }}
            style={{
              backgroundColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                color: readableTextColour(favouriteClub.primary),
                fontWeight: "700",
              }}
            >
              ADD NEW SEASON
            </Text>
          </Pressable>

          {seasonPickerOpen && (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#cccccc",
                borderRadius: 12,
                marginBottom: 18,
                overflow: "hidden",
              }}
            >
              <Picker
                selectedValue={draftSeason}
                onValueChange={(value) => setDraftSeason(value)}
                itemStyle={{ fontSize: 20 }}
              >
                {(() => {
                  const now = new Date();
                  const startYear =
                    now.getMonth() >= 6
                      ? now.getFullYear()
                      : now.getFullYear() - 1;
                  const seasons: string[] = [];
                  for (let y = 1948; y <= startYear; y++) {
                    seasons.push(
                      `${y}/${String((y + 1) % 100).padStart(2, "0")}`,
                    );
                  }
                  return seasons.map((season) => (
                    <Picker.Item key={season} label={season} value={season} />
                  ));
                })()}
              </Picker>
              <Pressable
                disabled={!draftSeason}
                onPress={() => {
                  if (!draftSeason) return;
                  setActiveSeason(draftSeason);
                  setSeasonPickerOpen(false);
                  setShowSeasonManager(false);
                }}
                style={{
                  backgroundColor: favouriteClub.primary,
                  padding: 13,
                  alignItems: "center",
                  borderTopWidth: 1,
                  borderTopColor: "#dddddd",
                }}
              >
                <Text
                  style={{
                    color: readableTextColour(favouriteClub.primary),
                    fontWeight: "800",
                  }}
                >
                  USE {draftSeason ?? "—"}
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={[s.helpText, { fontWeight: "700" }]}>
            VIEW SEASONS
          </Text>
          {knownSeasons.map((season) => (
            <Pressable
              key={season}
              onPress={() => {
                setActiveSeason(season);
                setShowSeasonManager(false);
              }}
              style={{
                borderWidth: 1,
                borderColor:
                  season === activeSeason ? favouriteClub.primary : "#cccccc",
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {season}
                {season === activeSeason ? "  •  current" : ""}
              </Text>
              <Text style={{ color: "#555555", fontSize: 12 }}>
                {seasonBoundsLabel(season)} ·{" "}
                {seasonCounts.get(season) ?? 0} ticket(s)
              </Text>
            </Pressable>
          ))}
          <Text style={s.helpText}>
            Season runs 10 July to 1 June. Matches between 2 June and 9 July sit
            outside normal season boundaries and stay on whatever season you
            filed them under.
          </Text>

          <Text style={[s.helpText, { fontWeight: "700", marginTop: 8 }]}>
            ABOUT TICKET FRAME
          </Text>
          <Text style={s.helpText}>
            Ticket Frame v1.1.0. Turn match tickets into framed memorabilia.
            Tickets are ordered by match date, stored privately on this device,
            and grouped into seasons running 10 July – 1 June.
          </Text>

          <Pressable
            onPress={() => setShowSeasonManager(false)}
            style={{
              borderWidth: 1,
              borderColor: favouriteClub.primary,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
              marginTop: 16,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: visibleInkOnCream(favouriteClub.primary),
                fontWeight: "700",
              }}
            >
              DONE
            </Text>
          </Pressable>
          {bottomNav()}
        </ScrollView>
      </SafeAreaView>
    );
  }
  const oldSchoolHost = (
    <OldSchoolCaptureHost
      captureRef={osCaptureRef}
      ticket={osCaptureTicket}
      club={osCaptureTicket ? ticketClubOption(osCaptureTicket) : null}
    />
  );

  if (finished && !homeFrameFocused)
    return (
      <>
      {oldSchoolHost}
      {exportJob ? (
        <SeasonFrameExport
          captureRef={exportFrameRef}
          tickets={exportJob}
          loadedRef={exportLoadedRef}
          ticketStyle={ticketStyle}
          club={ticketCollectionClub}
          oldSchoolAssets={oldSchoolAssets}
          title={fullFrameTitle}
          frameColour={activeFrameColour}
          frameAccent={activeFrameAccent}
          frameHighlight={activeFrameHighlight}
        />
      ) : null}
      <SafeAreaView style={[s.finished, { zIndex: 1, backgroundColor: "transparent" }]}> 
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#cec7b9" }]} />
        <Reanimated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "#050705" },
            fullFramePageBackdropStyle,
          ]}
        />
        <ScrollView
          scrollEnabled={!fullFrameZoomed}
          bounces={!fullFrameZoomed}
          contentContainerStyle={{ paddingTop: 74, paddingBottom: 40 }}
        >
        <View style={{ width: "100%", paddingHorizontal: 16, marginBottom: 14 }}>
          <Text
            style={[
              s.label,
              { color: visibleInkOnCream(favouriteClub.primary), marginBottom: 6 },
            ]}
          >
            FRAME TICKETS
          </Text>
          <Pressable
            onPress={() => setFullFrameSeasonMenuOpen((open) => !open)}
            style={[
              s.finish,
              {
                marginTop: 0,
                marginBottom: fullFrameSeasonMenuOpen ? 0 : 8,
                borderColor: visibleInkOnCream(favouriteClub.primary),
                flexDirection: "row",
                justifyContent: "space-between",
              },
            ]}
          >
            <Text
              style={[
                s.finishText,
                { color: visibleInkOnCream(favouriteClub.primary) },
              ]}
            >
              {fullFrameSeason}
            </Text>
            <Ionicons
              name={fullFrameSeasonMenuOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={visibleInkOnCream(favouriteClub.primary)}
            />
          </Pressable>
          {fullFrameSeasonMenuOpen ? (
            <View
              style={{
                borderWidth: 1.5,
                borderTopWidth: 0,
                borderColor: visibleInkOnCream(favouriteClub.primary),
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                overflow: "hidden",
              }}
            >
              {["All Tickets", ...homeSeasonOptions].map((season) => (
                <Pressable
                  key={season}
                  onPress={() => {
                    setFullFrameSeason(season);
                    setFullFrameSeasonMenuOpen(false);
                    resetSeasonFrameZoom();
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor:
                      season === fullFrameSeason ? "#f0ede5" : "#ffffff",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#17221c" }}>
                    {season}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <View
          style={{
            width: "100%",
            alignItems: "center",
            justifyContent: "flex-end",
            overflow: "visible",
            backgroundColor: "#cec7b9",
            zIndex: fullFrameZoomed ? 100 : 1,
          }}
        >
          <GestureDetector gesture={fullSeasonPagePinchGesture}>
            <Reanimated.View style={seasonFrameAnimatedStyle}>
            <View
              ref={frameCaptureRef}
              collapsable={false}
              onLayout={(event) => {
                const width = Math.round(event.nativeEvent.layout.width);
                if (width > 0) setExportWidth(width);
              }}
              style={[
                s.seasonFrame,
                {
                  backgroundColor: activeFrameColour,
                  borderColor: activeFrameHighlight,
                },
            ]}
          >
            <View
              style={[
                s.seasonBevel,
                {
                  backgroundColor: activeFrameAccent,
                  borderColor: activeFrameHighlight,
                },
              ]}
            >
              <View
                style={[
                  s.seasonMount,
                  { borderColor: activeFrameColour },
                ]}
              >
                <Text style={s.seasonTitle}>{fullFrameTitle}</Text>
                <Text style={s.seasonCount}>
                  {fullFrameTickets.length} SAVED ITEMS
                </Text>
                <View style={s.ticketGrid}>
                  {fullFrameTickets.map((ticket) => (
                    <DraggableGridTile
                      key={ticket.id}
                      ticketId={ticket.id}
                      tileWidth={fullFrameTileWidth}
                      tileHeight={fullFrameTileHeight}
                      boxScale={ticket.boxScale ?? 1}
                      dragEnabled={!fullFrameZoomed && fullFrameTickets.length > 1}
                      anyDragging={draggingTicketId !== null}
                      selfDragging={draggingTicketId === ticket.id}
                      layoutsRef={gridLayoutsRef}
                      onRequestDragStart={handleTileDragStart}
                      onDragDrop={handleTileDrop}
                      onDragRelease={handleTileDragRelease}
                      onPress={(ticketId) => setEnlargedTicketId(ticketId)}
                      baseStyle={s.gridTile}
                    >
                      {effectiveTicketStyle(ticket, ticketStyle) === "old-school" ? (
                        <OldSchoolCard ticket={ticket} club={ticketClubOption(ticket)} onDetailsFound={patchTicketDetails} />
                      ) : ticket.uri ? (
                        <Image
                          source={{ uri: ticket.uri }}
                          style={[
                            s.gridImage,
                            {
                              transform: [
                                { scale: ticket.scale },
                                { translateX: ticket.offsetX },
                                { translateY: ticket.offsetY },
                              ],
                            },
                          ]}
                          resizeMode="contain"
                          alt={ticket.name}
                          onError={() =>
                            console.log(
                              "[season-frame-zoom] image failed to render:",
                              ticket.uri,
                            )
                          }
                        />
                      ) : (
                        <View style={s.fileTicket}>
                          <Ionicons
                            name="ticket"
                            size={columns >= 5 ? 13 : 20}
                            color="#174a91"
                          />
                          <Text numberOfLines={2} style={s.fileTicketText}>
                            {ticket.name}
                          </Text>
                        </View>
                      )}
                    </DraggableGridTile>
                  ))}
                </View>
              </View>
            </View>
            </View>
            </Reanimated.View>
          </GestureDetector>
        </View>

        <Pressable
          style={[
            s.backButton,
            { backgroundColor: favouriteClub.primary },
          ]}
          onPress={closeSeasonFrame}
        >
          <Text
            style={[
              s.backButtonText,
              { color: readableTextColour(favouriteClub.primary) },
            ]}
          >
            ← Back to Home
          </Text>
        </Pressable>

        <Text
          style={[
            s.label,
            { color: visibleInkOnCream(favouriteClub.primary), marginTop: 10 },
          ]}
        >
          FRAME STYLE
        </Text>
        <View style={{ position: "relative", zIndex: 30, marginBottom: 4 }}>
          <Pressable
            onPress={() => setFrameMenuOpen((open) => !open)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: visibleInkOnCream(favouriteClub.primary),
              borderRadius: 10,
              backgroundColor: "#ffffff",
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
            accessibilityLabel="Choose frame style"
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  marginRight: 8,
                  backgroundColor: activeFrameColour,
                  borderColor: activeFrameHighlight,
                  borderWidth: 1,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: visibleInkOnCream(favouriteClub.primary),
                }}
              >
                {frameStyle}
              </Text>
            </View>
            <Ionicons
              name={frameMenuOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={visibleInkOnCream(favouriteClub.primary)}
            />
          </Pressable>
          {frameMenuOpen && (
            <View
              style={{
                marginTop: 6,
                maxHeight: 280,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#d4cdbf",
                backgroundColor: "#ffffff",
                shadowColor: "#000000",
                shadowOpacity: 0.15,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <ScrollView style={{ flexGrow: 0 }} nestedScrollEnabled>
                {stylesList.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setFrameStyle(item);
                      setFrameMenuOpen(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: "#eae4d7",
                      backgroundColor:
                        frameStyle === item ? `${favouriteClub.primary}14` : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        marginRight: 8,
                        backgroundColor:
                          item === "Club Colours"
                            ? favouriteClub.primary
                            : frameColour[item],
                        borderColor:
                          item === "Club Colours"
                            ? favouriteClub.secondary || "#ffffff"
                            : frameHighlight[item],
                        borderWidth: 1,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: frameStyle === item ? "900" : "600",
                        color: "#333333",
                      }}
                    >
                      {item}
                    </Text>
                    {frameStyle === item && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color={favouriteClub.primary}
                      />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <Text
          style={[
            s.label,
            {
              color: visibleInkOnCream(favouriteClub.primary),
              marginTop: 8,
            },
          ]}
        >
          TICKET STYLE
        </Text>
        <View style={{ position: "relative", zIndex: 29, marginBottom: 18 }}>
          <Pressable
            onPress={() => setTicketStyleMenuOpen((open) => !open)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: visibleInkOnCream(favouriteClub.primary),
              borderRadius: 10,
              backgroundColor: "#ffffff",
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
            accessibilityLabel="Choose ticket style"
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: visibleInkOnCream(favouriteClub.primary),
              }}
            >
              {TICKET_STYLE_OPTIONS.find((o) => o.value === ticketStyle)
                ?.label ?? "E-Ticket"}
            </Text>
            <Ionicons
              name={ticketStyleMenuOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={visibleInkOnCream(favouriteClub.primary)}
            />
          </Pressable>
          {ticketStyleMenuOpen && (
            <View
              style={{
                marginTop: 6,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#d4cdbf",
                backgroundColor: "#ffffff",
                shadowColor: "#000000",
                shadowOpacity: 0.15,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              {TICKET_STYLE_OPTIONS.filter(
                (option) => option.value !== "old-school",
              ).map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setTicketStyle(option.value);
                    setTicketStyleMenuOpen(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: "#eae4d7",
                    backgroundColor:
                      ticketStyle === option.value
                        ? `${favouriteClub.primary}14`
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight:
                        ticketStyle === option.value ? "900" : "600",
                      color: "#333333",
                    }}
                  >
                    {option.label}
                  </Text>
                  {ticketStyle === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color={favouriteClub.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <View style={s.exportRow}>
          <Pressable
            disabled={exporting}
            style={[
              s.exportButton,
              { backgroundColor: favouriteClub.primary },
            ]}
            onPress={() => void exportFrame("print")}
          >
            <Ionicons
              name="print-outline"
              size={18}
              color={readableTextColour(favouriteClub.primary)}
            />
            <Text
              style={[
                s.exportText,
                { color: readableTextColour(favouriteClub.primary) },
              ]}
            >
              Print
            </Text>
          </Pressable>
          <Pressable
            disabled={exporting}
            style={[
              s.exportButton,
              { backgroundColor: favouriteClub.primary },
            ]}
            onPress={() => void exportFrame("pdf")}
          >
            <Ionicons
              name="document-outline"
              size={18}
              color={readableTextColour(favouriteClub.primary)}
            />
            <Text
              style={[
                s.exportText,
                { color: readableTextColour(favouriteClub.primary) },
              ]}
            >
              PDF
            </Text>
          </Pressable>
          <Pressable
            disabled={exporting}
            style={[
              s.exportButton,
              { backgroundColor: favouriteClub.primary },
            ]}
            onPress={() => void exportFrame("photo")}
          >
            <Ionicons
              name="image-outline"
              size={18}
              color={readableTextColour(favouriteClub.primary)}
            />
            <Text
              style={[
                s.exportText,
                { color: readableTextColour(favouriteClub.primary) },
              ]}
            >
              {exporting ? "Making…" : "Photo"}
            </Text>
          </Pressable>
        </View>
        </ScrollView>
        {fullFrameZoomed ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                zIndex: 1000,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 14,
                paddingVertical: 42,
              },
            ]}
          >
            <Reanimated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "#050705" },
                homeFocusBackdropStyle,
              ]}
            />
            <GestureDetector gesture={seasonFrameGesture}>
              <Reanimated.View
                style={[
                  { width: "100%", maxHeight: "92%" },
                  homeFocusEntryStyle,
                seasonFrameAnimatedStyle,
                ]}
              >
                <View
                  style={[
                    s.seasonFrame,
                    {
                      backgroundColor: activeFrameColour,
                      borderColor: activeFrameHighlight,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.seasonBevel,
                      {
                        backgroundColor: activeFrameAccent,
                        borderColor: activeFrameHighlight,
                      },
                    ]}
                  >
                    <View style={[s.seasonMount, { borderColor: activeFrameColour }]}> 
                      <Text style={s.seasonTitle}>{fullFrameTitle}</Text>
                      <Text style={s.seasonCount}>
                        {fullFrameTickets.length} SAVED ITEMS
                      </Text>
                      <View style={s.ticketGrid}>
                        {fullFrameTickets.map((ticket) => (
                          <Pressable
                            key={ticket.id}
                            onPress={() => setEnlargedTicketId(ticket.id)}
                            style={[
                              s.gridTile,
                              {
                                width: fullFrameTileWidth,
                                height: fullFrameTileHeight,
                                transform: [{ scale: ticket.boxScale ?? 1 }],
                              },
                            ]}
                          >
                            {effectiveTicketStyle(ticket, ticketStyle) === "old-school" ? (
                              <OldSchoolCard
                                ticket={ticket}
                                club={ticketClubOption(ticket)}
                                onDetailsFound={patchTicketDetails}
                              />
                            ) : ticket.uri ? (
                              <HomeTicketImage ticket={ticket} styleKey="full-focus" />
                            ) : (
                              <View style={s.fileTicket}>
                                <Ionicons name="ticket" size={14} color="#174a91" />
                                <Text numberOfLines={2} style={s.fileTicketText}>
                                  {ticket.name}
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </Reanimated.View>
            </GestureDetector>
            <Text style={{ color: "#ffffff", marginTop: 12, fontWeight: "800" }}>
              Pinch smaller to return to Full Season Frame
            </Text>
          </View>
        ) : null}
        {(() => {
          const viewerTicket = enlargedTicketId
            ? tickets.find((item) => item.id === enlargedTicketId)
            : undefined;
          if (!viewerTicket) return null;
          return (
            <TicketViewer
              ticket={viewerTicket}
              accent={favouriteClub.primary}
              onClose={() => setEnlargedTicketId(undefined)}
              onActions={() => showTicketActions(viewerTicket)}
            />
          );
        })()}
      </SafeAreaView>
      </>
    );
  return (
    <SafeAreaView style={s.safe}>
      {oldSchoolHost}
      <ScrollView
      ref={homeScrollRef}
      contentContainerStyle={s.page}
      onScrollBeginDrag={Keyboard.dismiss}
      keyboardShouldPersistTaps="handled"
    >
        <View
          style={[
            s.homeHero,
            {
              backgroundColor: favouriteClub.primary,
              borderBottomColor: favouriteClub.secondary,
            },
          ]}
        >
          <View style={s.homeHeroTop}>
            <View style={s.clubBadgeShell}>
              <FavouriteClubBadge
                name={favouriteClub.name}
                initials={clubInitials(favouriteClub.name)}
                backgroundColor={favouriteClub.secondary}
                borderColor={readableTextColour(favouriteClub.primary)}
                textColor={readableTextColour(favouriteClub.secondary)}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  s.homeBrand,
                  { color: readableTextColour(favouriteClub.primary) },
                ]}
              >
                Ticket Frame
              </Text>
              <Text
                style={[
                  s.homeClubName,
                  { color: readableTextColour(favouriteClub.primary) },
                ]}
              >
                {favouriteClub.name}
              </Text>
            </View>

            <Pressable
              hitSlop={12}
              onPress={() => setShowSeasonManager(true)}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={favouriteClub.secondary}
              />
            </Pressable>
          </View>

          <Text
            style={[
              s.homeSeason,
              { color: readableTextColour(favouriteClub.primary) },
            ]}
          >
            {(homeSeasonOptions.length
              ? `${ticketCollectionClub.name} ${seasonFrame.season} Season`
              : `${ticketCollectionClub.name} Tickets`
            ).toUpperCase()}
          </Text>

          <Pressable
            style={[
              s.addTicketHeroButton,
              { backgroundColor: favouriteClub.secondary },
            ]}
            onPress={importTicket}
          >
            <Ionicons
              name="add-circle-outline"
              size={23}
              color={readableTextColour(favouriteClub.secondary)}
            />
            <Text
              style={[
                s.addTicketHeroText,
                { color: readableTextColour(favouriteClub.secondary) },
              ]}
            >
              ADD NEW TICKET
            </Text>
          </Pressable>
        </View>

        {favouriteClub.id !== PLACEHOLDER_CLUB_ID
          ? renderNextMatchCard(verifiedNextFavouriteFixture)
          : null}

          <View
            style={[
              s.collectionCard,
              {
                borderColor: favouriteClub.primary,
                paddingVertical: 8,
                marginBottom: 10,
              },
            ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                s.collectionCount,
                { color: visibleInkOnCream(favouriteClub.primary) },
              ]}
            >
              {homeDisplayTickets.length} {homeDisplayTickets.length === 1 ? "item" : "items"} shown
            </Text>
          </View>

          <View
            style={[
              s.collectionIcon,
              { backgroundColor: favouriteClub.primary },
            ]}
          >
            <Ionicons name="ticket-outline" size={22} color="#ffffff" />
          </View>
        </View>
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Text style={[s.helpText, { fontWeight: "800", marginBottom: 0 }]}>
            VIEW TICKETS
          </Text>

          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable
              onPress={() => setHomeViewMode("frame")}
              style={[
                s.finish,
                {
                  marginTop: 0,
                  paddingVertical: 7,
                  paddingHorizontal: 10,
                  minHeight: 0,
                  borderColor: visibleInkOnCream(favouriteClub.primary),
                  backgroundColor:
                    homeViewMode === "frame"
                      ? favouriteClub.primary
                      : "#ffffff",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "900",
                  color:
                    homeViewMode === "frame"
                      ? "#ffffff"
                      : visibleInkOnCream(favouriteClub.primary),
                }}
              >
                FRAME VIEW
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setHomeViewMode("wallet")}
              style={[
                s.finish,
                {
                  marginTop: 0,
                  paddingVertical: 7,
                  paddingHorizontal: 10,
                  minHeight: 0,
                  borderColor: visibleInkOnCream(favouriteClub.primary),
                  backgroundColor:
                    homeViewMode === "wallet"
                      ? favouriteClub.primary
                      : "#ffffff",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "900",
                  color:
                    homeViewMode === "wallet"
                      ? "#ffffff"
                      : visibleInkOnCream(favouriteClub.primary),
                }}
              >
                WALLET VIEW
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={s.homePickerWrap}>
          <Picker
            style={s.homePicker}
            itemStyle={s.homePickerItem}
            selectedValue={homeTicketSeason}
            onValueChange={(value) => setHomeTicketSeason(String(value))}
          >
            <Picker.Item label="All Tickets" value="All Tickets" />
            {homeSeasonOptions.map((season) => (
              <Picker.Item key={season} label={season} value={season} />
            ))}
          </Picker>
        </View>
        {homeViewMode === "frame" ? (
        <GestureDetector gesture={homeFramePinchGesture}>
          <View
            style={{
            width: "100%",
            padding: 5,
            borderWidth: 2,
            borderColor: activeFrameHighlight,
            backgroundColor: activeFrameColour,
            shadowColor: "#000",
            shadowOpacity: 0.32,
            shadowRadius: 12,
            shadowOffset: { width: 4, height: 8 },
            }}
          >
          <View
            style={{
              padding: 5,
              borderWidth: 3,
              borderColor: activeFrameHighlight,
              backgroundColor: activeFrameAccent,
            }}
          >
            <View
              collapsable={false}
              style={{
                width: "100%",
                padding: 5,
                borderWidth: 3,
                borderColor: activeFrameColour,
                backgroundColor: "#ece7db",
              }}
            >
              {homeDisplayTickets.length ? (
                <View style={[s.ticketGrid, { gap: 1 }]}> 
                  {homeDisplayTickets.map((ticket) => (
                    <Pressable
                      onPress={() => setEnlargedTicketId(ticket.id)}
                      onLongPress={() => showTicketActions(ticket)}
                      delayLongPress={450}
                      key={ticket.id}
                      style={[
                        s.gridTile,
                        {
                          width: homeTileWidth,
                          height: homeTileHeight,
                          transform: [{ scale: ticket.boxScale ?? 1 }],
                        },
                      ]}
                    >
                      {effectiveTicketStyle(ticket, ticketStyle) ===
                      "old-school" ? (
                        <OldSchoolCard
                          ticket={ticket}
                          club={ticketClubOption(ticket)}
                          onDetailsFound={patchTicketDetails}
                        />
                      ) : ticket.uri ? (
                        <HomeTicketImage ticket={ticket} styleKey="home" />
                      ) : (
                        <View style={s.fileTicket}>
                          <Ionicons name="ticket" size={14} color="#174a91" />
                          <Text numberOfLines={2} style={s.fileTicketText}>
                            {ticket.name}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={s.ticket}>
                  <Ionicons name="albums-outline" size={52} color="#174a91" />
                  <Text style={s.ticketTitle}>Build your season frame</Text>
                  <Text style={s.ticketCopy}>
                    Add every match ticket. All of them stay visible together.
                  </Text>
                  <Pressable
                    onPress={openDemoModeFromMain}
                    accessibilityLabel="See how it works"
                    style={{
                      marginTop: 14,
                      alignSelf: "center",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      borderWidth: 1,
                      borderColor: "#174a91",
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <Ionicons name="play-circle-outline" size={15} color="#174a91" />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#174a91",
                        letterSpacing: 0.5,
                      }}
                    >
                      SEE HOW IT WORKS
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
          </View>
        </GestureDetector>
      ) : (
        <View
          onLayout={(event) => {
            homeWalletSectionYRef.current = event.nativeEvent.layout.y;
          }}
          style={{
            width: "100%",
            paddingTop: 4,
            paddingBottom: 12,
            minHeight: 560,
          }}
        >
          {homeWalletTickets.length ? (
            homeWalletOpenTicket ? (
              <View
                style={{
                  width: "100%",
                  minHeight: 610,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <GestureDetector gesture={homeWalletOpenGesture}>
                  <Pressable
                  onLongPress={() => showTicketActions(homeWalletOpenTicket)}
                  delayLongPress={450}
                  style={{ width: "100%" }}
                >
                <Reanimated.View
                    style={[
                      {
                        width: "100%",
                        height: 470,
                        borderRadius: 18,
                        overflow: "hidden",
                        backgroundColor: "transparent",
                        shadowColor: "#000000",
                        shadowOpacity: 0.26,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 5 },
                        elevation: 8,
                        zIndex: 100,
                      },
                      homeWalletOpenStyle,
                    ]}
                  >
                    {effectiveTicketStyle(
                      homeWalletOpenTicket,
                      ticketStyle,
                    ) === "old-school" ? (
                      <OldSchoolCard
                        ticket={homeWalletOpenTicket}
                        club={ticketClubOption(homeWalletOpenTicket)}
                        onDetailsFound={patchTicketDetails}
                      />
                    ) : homeWalletOpenTicket.uri ? (
                      <WalletTicketImage
                      ticket={homeWalletOpenTicket}
                    />
                    ) : (
                      <View
                        style={[
                          s.fileTicket,
                          {
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Ionicons name="ticket" size={40} color="#174a91" />
                        <Text style={s.fileTicketText}>
                          {homeWalletOpenTicket.name}
                        </Text>
                      </View>
                    )}
                  </Reanimated.View>
                </Pressable>
                </GestureDetector>

                <View
                  style={{
                    width: "100%",
                    alignItems: "center",
                    paddingTop: 6,
                    height:
                      470 +
                      Math.max(0, homeWalletTickets.length - 2) * 60,
                  }}
                >
                  {homeWalletTickets
                    .filter(
                      (ticket) =>
                        ticket.id !== homeWalletOpenTicket.id,
                    )
                    .map((ticket, index) => (
                      <Pressable
                        key={ticket.id}
                        onPress={() => {
                          openHomeWalletTicket(ticket.id);
                        }}
                        style={{
                          position: "absolute",
                          top: index * 60,
                          left: 0,
                          width: "100%",
                          height: 470,
                          zIndex: index + 1,
                          borderRadius: 16,
                          overflow: "hidden",
                          backgroundColor: "transparent",
                        }}
                      >
                        {effectiveTicketStyle(ticket, ticketStyle) ===
                        "old-school" ? (
                          <OldSchoolCard
                            ticket={ticket}
                            club={ticketClubOption(ticket)}
                            onDetailsFound={patchTicketDetails}
                          />
                        ) : ticket.uri ? (
                          <WalletTicketImage ticket={ticket} />
                        ) : (
                          <View style={s.fileTicket}>
                            <Ionicons name="ticket" size={14} color="#174a91" />
                            <Text
                              numberOfLines={1}
                              style={s.fileTicketText}
                            >
                              {ticket.name}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                </View>
              </View>
            ) : (
              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  height:
                    470 +
                    Math.max(0, homeWalletTickets.length - 1) * 60,
                }}
              >
                {homeWalletTickets.map((ticket, index) => (
                  <Pressable
                    key={ticket.id}
                    onPress={() => {
                      openHomeWalletTicket(ticket.id);
                    }}
                    onLongPress={() => showTicketActions(ticket)}
                    delayLongPress={450}
                    style={{
                      position: "absolute",
                      top: index * 60,
                      left: 0,
                      width: "100%",
                      height: 470,
                      zIndex: index + 1,
                      borderRadius: 18,
                      overflow: "hidden",
                      backgroundColor: "transparent",
                      shadowColor: "#000000",
                      shadowOpacity: 0.16,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    }}
                  >
                    {effectiveTicketStyle(ticket, ticketStyle) ===
                    "old-school" ? (
                      <OldSchoolCard
                        ticket={ticket}
                        club={ticketClubOption(ticket)}
                        onDetailsFound={patchTicketDetails}
                      />
                    ) : ticket.uri ? (
                      <WalletTicketImage ticket={ticket} />
                    ) : (
                      <View
                        style={[
                          s.fileTicket,
                          {
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Ionicons name="ticket" size={28} color="#174a91" />
                        <Text
                          numberOfLines={2}
                          style={[
                            s.fileTicketText,
                            { marginTop: 8, textAlign: "center" },
                          ]}
                        >
                          {ticket.name}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )
          ) : (
            <View style={s.ticket}>
              <Ionicons name="wallet-outline" size={52} color="#174a91" />
              <Text style={s.ticketTitle}>
                No tickets in this wallet
              </Text>
              <Text style={s.ticketCopy}>
                Choose another season or add a ticket.
              </Text>
            </View>
          )}
        </View>
      )}

        {tickets.length > 0 && (
          <View style={{ width: "100%", marginTop: 10 }}>
            <Text style={[s.helpText, { fontWeight: "800", marginBottom: 6, display: "none" }]}> 
              FRAME TICKETS
            </Text>
            <Pressable
              onPress={() => setFullFrameSeasonMenuOpen((open) => !open)}
              style={[
                s.finish,
                {
                  display: "none",
                  marginTop: 0,
                  marginBottom: fullFrameSeasonMenuOpen ? 0 : 8,
                  borderColor: visibleInkOnCream(favouriteClub.primary),
                  flexDirection: "row",
                  justifyContent: "space-between",
                },
              ]}
            >
              <Text style={[s.finishText, { color: visibleInkOnCream(favouriteClub.primary) }]}> 
                {fullFrameSeason}
              </Text>
              <Ionicons
                name={fullFrameSeasonMenuOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={visibleInkOnCream(favouriteClub.primary)}
              />
            </Pressable>
            {false && fullFrameSeasonMenuOpen ? (
              <View
                style={{
                  borderWidth: 1.5,
                  borderTopWidth: 0,
                  borderColor: visibleInkOnCream(favouriteClub.primary),
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                {["All Tickets", ...homeSeasonOptions].map((season) => (
                  <Pressable
                    key={season}
                    onPress={() => {
                      setFullFrameSeason(season);
                      setFullFrameSeasonMenuOpen(false);
                    }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor:
                        season === fullFrameSeason ? "#f0ede5" : "#ffffff",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#17221c" }}>
                      {season}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Pressable
              unstable_pressDelay={0}
              style={({ pressed }) => [
                s.finish,
                {
                  borderColor: visibleInkOnCream(favouriteClub.primary),
                  opacity: pressed ? 0.62 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={() => {
                openFocusedFullSeasonFrame();
              }}
            >
              <Text style={[s.finishText, { color: visibleInkOnCream(favouriteClub.primary) }]}> 
                View Full Season Frame
              </Text>
            </Pressable>
          </View>
        )}
        {bottomNav()}
      </ScrollView>

      {homeFrameFocused ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: 1000,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 14,
              paddingVertical: 42,
            },
          ]}
        >
          <Reanimated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "#050705" },
              homeFocusBackdropStyle,
            ]}
          />
          <GestureDetector gesture={seasonFrameGesture}>
            <Reanimated.View
              style={[
                { width: "100%", maxHeight: "92%" },
                homeFocusEntryStyle,
                seasonFrameAnimatedStyle,
              ]}
            >
              <View
                style={[
                  s.seasonFrame,
                  {
                    backgroundColor: activeFrameColour,
                    borderColor: activeFrameHighlight,
                  },
                ]}
              >
                <View
                  style={[
                    s.seasonBevel,
                    {
                      backgroundColor: activeFrameAccent,
                      borderColor: activeFrameHighlight,
                    },
                  ]}
                >
                  <View style={[s.seasonMount, { borderColor: activeFrameColour }]}> 
                    <Text style={s.seasonTitle}>
                      {homeTicketSeason === "All Tickets"
                        ? `${ticketCollectionClub.name} Tickets`
                        : `${ticketCollectionClub.name} ${homeTicketSeason}`}
                    </Text>
                    <Text style={s.seasonCount}>
                      {homeDisplayTickets.length} SAVED ITEMS
                    </Text>
                    <View style={s.ticketGrid}>
                      {homeDisplayTickets.map((ticket) => (
                        <Pressable
                          key={ticket.id}
                          onPress={() => setEnlargedTicketId(ticket.id)}
                          style={[
                            s.gridTile,
                            {
                              width: focusedFrameTileWidth,
                              height: focusedFrameTileHeight,
                              transform: [{ scale: ticket.boxScale ?? 1 }],
                            },
                          ]}
                        >
                          {effectiveTicketStyle(ticket, ticketStyle) === "old-school" ? (
                            <OldSchoolCard
                              ticket={ticket}
                              club={ticketClubOption(ticket)}
                              onDetailsFound={patchTicketDetails}
                            />
                          ) : ticket.uri ? (
                            <HomeTicketImage ticket={ticket} styleKey="home-focus" />
                          ) : (
                            <View style={s.fileTicket}>
                              <Ionicons name="ticket" size={14} color="#174a91" />
                              <Text numberOfLines={2} style={s.fileTicketText}>
                                {ticket.name}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </Reanimated.View>
          </GestureDetector>
          <Text style={{ color: "#ffffff", marginTop: 12, fontWeight: "800" }}>
            Pinch smaller to return to Home
          </Text>
        </View>
      ) : null}

      {(() => {
        const viewerTicket = enlargedTicketId
          ? tickets.find((item) => item.id === enlargedTicketId)
          : undefined;
        if (!viewerTicket) return null;
        return (
          <TicketViewer
            ticket={viewerTicket}
            accent={favouriteClub.primary}
            onClose={() => setEnlargedTicketId(undefined)}
            onActions={() => showTicketActions(viewerTicket)}
          />
        );
      })()}

      {(() => {
        const pending = confirmQueue[0];
        if (!pending) return null;
        return (
          <MatchConfirmationOverlay
            key={pending.ticket.id}
            ticket={pending.ticket}
            recognition={pending.recognition}
            clubName={favouriteClub.name}
            clubStadium={favouriteClub.stadium}
            accent={favouriteClub.primary}
            secondaryAccent={favouriteClub.secondary}
            alternatives={alternatives}
            pickerNotice={pickerNotice}
            onConfirm={() => handleConfirmMatch(pending)}
            onPickFixture={(fixture) => handlePickFixture(pending, fixture)}
            onSkip={() => dequeueConfirm(pending.ticket.id, "skipped")}
            onRequestAlternatives={(seasonKey) =>
              void loadAlternatives(pending, seasonKey)
            }
            onSaveEdits={(draft) => handleSaveEdits(pending, draft)}
            onSaveSeasonProfile={(fields) =>
              handleSaveSeasonProfile(pending, fields)
            }
            onSaveCarParkPass={(fields, recognition) =>
              void handleSaveCarParkPass(pending, fields, recognition)
            }
          />
        );
      })()}

      {showDemoMode ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
          }}
        >
          <DemoMode
            onExit={handleDemoExit}
            onAddFirstTicket={handleDemoAddFirstTicket}
          />
        </View>
      ) : null}

      {celebrationTicket &&
        (() => {
          const ticket = celebrationTicket;
          const seat = ticket.details;
          return (
            <FirstFrameCelebration
              clubName={favouriteClub.name}
              onContinue={() => setCelebrationTicket(null)}
              ticket={{
                homeTeam: ticket.homeTeam ?? favouriteClub.name,
                awayTeam: ticket.awayTeam ?? "Opposition",
                competition: ticket.competition ?? "Match",
                venue:
                  (ticket.ground ?? favouriteClub.stadium) || "The ground",
                dateLabel:
                  formatTicketDate(ticket.matchDate) ??
                  ticket.matchDate ??
                  "Date TBC",
                kickoffLabel:
                  formatKickoff12(ticket.kickoffTime) ?? ticket.kickoffTime ?? "—",
                gateTime: "—",
                season: ticket.seasonKey || activeSeason,
                seat: {
                  stand: seat?.stand ?? "Stand",
                  block: seat?.block ?? "—",
                  row: seat?.row ?? "—",
                  seat: seat?.seat ?? "—",
                },
                ticketNo: ticket.fingerprint.slice(0, 14).toUpperCase(),
                category: seat?.ticketType ?? ticket.ticketType ?? "Adult",
                price: "",
                club: {
                  name: favouriteClub.name,
                  primary: favouriteClub.primary,
                  secondary: favouriteClub.secondary,
                },
              }}
            />
          );
        })()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#10261c" },
  page: { padding: 22, paddingBottom: 48, backgroundColor: "#f5f1e8" },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 30,
  },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#10261c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#b88d36",
  },
  markText: { color: "#fff", fontWeight: "800" },
  brandText: {
    fontFamily: "Georgia",
    fontSize: 24,
    fontWeight: "700",
    color: "#10261c",
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#8b6b24",
    fontWeight: "800",
  },
  title: {
    fontFamily: "Georgia",
    fontSize: 42,
    lineHeight: 45,
    color: "#17221c",
    marginTop: 9,
    marginBottom: 24,
  },
  homeHero: {
    marginHorizontal: -22,
    marginTop: -22,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderBottomWidth: 6,
    marginBottom: 18,
  },
  homeHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  homeTitleBlock: {
    alignItems: "center",
  },
  homeTitleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  clubBadgeShell: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  homeBrand: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  homeClubName: {
    color: "#ffffff",
    opacity: 0.88,
    fontSize: 13,
    marginTop: 1,
    fontWeight: "700",
  },
  homeSeason: {
    color: "#ffffff",
    marginTop: 20,
    marginBottom: 12,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1.5,
  },
  addTicketHeroButton: {
    minHeight: 52,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addTicketHeroText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  collectionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  collectionCount: {
    fontSize: 15,
    fontWeight: "900",
  },
  collectionSub: {
    color: "#68706b",
    fontSize: 10,
    marginTop: 4,
  },
  collectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomCard: {
    marginTop: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  zoomCardTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  zoomCardSub: {
    fontSize: 10,
    color: "#68706b",
    marginTop: 2,
  },
  resetButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 10,
  },
  frame: {
    backgroundColor: "#161716",
    padding: 8,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 9, height: 17 },
  },
  bevel: {
    padding: 9,
    borderWidth: 3,
    borderTopWidth: 6,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 5,
    shadowOffset: { width: 3, height: 4 },
  },
  lip: {
    padding: 7,
    backgroundColor: "#353735",
    borderWidth: 5,
    borderTopColor: "#111",
    borderLeftColor: "#111",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 4,
  },
  mount: {
    minHeight: 330,
    padding: 24,
    backgroundColor: "#e8e2d3",
    borderWidth: 2,
    borderColor: "#c9c0ae",
    alignItems: "center",
    justifyContent: "center",
  },
  ticket: {
    width: "100%",
    minHeight: 220,
    backgroundColor: "#fffaf0",
    borderTopWidth: 7,
    borderTopColor: "#174a91",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  ticketPhoto: { width: "100%", height: 260 },
  ticketSmall: { fontSize: 9, letterSpacing: 1.6, color: "#6a716d" },
  ticketTitle: {
    fontFamily: "Georgia",
    fontWeight: "700",
    fontSize: 20,
    textAlign: "center",
    color: "#17221c",
  },
  ticketCopy: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    color: "#657069",
  },
  caption: {
    fontFamily: "Georgia",
    fontStyle: "italic",
    marginTop: 18,
    color: "#57564f",
  },
  primary: {
    marginTop: 24,
    backgroundColor: "#174532",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  finish: {
    marginTop: 10,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#174532",
    alignItems: "center",
  },
  finishText: { color: "#174532", fontWeight: "800" },
  label: {
    marginTop: 26,
    marginBottom: 10,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: "#8b6b24",
  },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#cec8ba",
    backgroundColor: "#fff",
  },
  choiceSelected: {
    borderWidth: 2,
    borderColor: "#174532",
    backgroundColor: "#e2ebe5",
  },
  choiceText: { fontSize: 12, fontWeight: "700", color: "#17221c" },
  navActive: { color: "#8b6b24", fontWeight: "700" },
  navItem: { alignItems: "center", minWidth: 58, gap: 3 },
  helpText: { color: "#657069", lineHeight: 20, marginBottom: 16 },
  clubCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: "white",
  },
  colourDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: "#aaa" },
  clubName: { fontSize: 16, fontWeight: "800", color: "#17221c" },
  leagueTitle: { marginTop: 22, marginBottom: 8, fontSize: 18, fontWeight: "800", color: "#174532" },
  clubRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e3ddd1",
  },
  clubRowSelected: { backgroundColor: "#e2ebe5" },
  clubRowText: { flex: 1, fontSize: 15, fontWeight: "600" },
  groundRow: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8d1c2",
  },
  ticketGrid: {
    width: "100%",
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    alignContent: "space-evenly",
    gap: 2,
  },
  homePickerWrap: {
    borderWidth: 2,
    borderColor: "#c9c2b1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    height: 138,
    marginBottom: 14,
  },
  homePicker: { height: 138 },
  homePickerItem: { height: 138, fontSize: 18 },
  homeViewRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  homeViewButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#c9c2b1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  homeViewButtonText: { fontSize: 11, fontWeight: "900", color: "#17221c", textAlign: "center" },
  gridTile: { overflow: "hidden" },
  weatherLine: {
    fontSize: 12,
    fontWeight: "700",
    color: "#657069",
    marginTop: 2,
  },
  gridImage: { width: "100%", height: "100%" },
  fileTicket: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    borderTopWidth: 3,
    borderTopColor: "#174a91",
  },
  fileTicketText: { fontSize: 6, textAlign: "center", color: "#27362e" },
  finished: { flex: 1, backgroundColor: "#cec7b9", padding: 4 },
  finishedTouch: { flex: 1, alignItems: "center", justifyContent: "center" },
  seasonFrame: {
    width: "100%",
    aspectRatio: 420 / 594,
    backgroundColor: "#111",
    padding: 4,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 26,
    shadowOffset: { width: 10, height: 18 },
  },
  seasonBevel: {
    flex: 1,
    padding: 5,
    borderWidth: 2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  whiteFrame: { backgroundColor: "#f3f1e9" },
  walnutFrame: { backgroundColor: "#6a3d22" },
  clubFrame: { backgroundColor: "#174a91" },
  seasonMount: {
    flex: 1,
    backgroundColor: "#ece7db",
    padding: 6,
    borderWidth: 3,
    alignItems: "center",
  },
  seasonTitle: {
    fontFamily: "Georgia",
    fontWeight: "700",
    fontSize: 16,
    color: "#17221c",
    marginTop: 2,
  },
  seasonCount: {
    fontSize: 8,
    letterSpacing: 2,
    color: "#8b6b24",
    marginTop: 2,
    marginBottom: 4,
  },
  finishedHint: {
    fontSize: 10,
    color: "#57534d",
    textAlign: "center",
    paddingVertical: 7,
  },
  exportRow: { flexDirection: "row", gap: 8 },
  exportButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "#174532",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  exportText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  backButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 4,
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  nextMatchCard: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  nextMatchKicker: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "900",
  },
  nextMatchMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  nextMatchOpponent: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    color: "#10261c",
  },
  nextMatchMeta: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
    color: "#27362e",
  },
  nextMatchCompetition: {
    marginTop: 2,
    fontSize: 12,
    color: "#8b6b24",
    fontWeight: "700",
  },
  fixtureHomeAwayChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  historyCountsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  historyCountCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  historyCountNumber: {
    fontSize: 26,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  historyCountLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#657069",
    textAlign: "center",
  },
  historyInput: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  historyChip: {
    borderWidth: 1,
    borderColor: "#c9c2b1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: "#f6f1e6",
    maxWidth: 240,
  },
  historyChipText: { fontSize: 12, color: "#3d3a30", fontWeight: "600" },
  historyHaButton: {
    borderWidth: 1,
    borderColor: "#c9c2b1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  // V3.9.4 — Football History archive
  hxBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  hxBackText: { fontSize: 14, fontWeight: "800", color: "#17221c" },
  hxCardCta: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#657069",
  },
  hxPickerWrap: {
    height: 170,
    borderWidth: 1,
    borderColor: "#c9c2b1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    marginBottom: 10,
    overflow: "hidden",
  },
  hxSortRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  hxSortChip: {
    borderWidth: 1,
    borderColor: "#c9c2b1",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
  },
  hxSortChipOn: { backgroundColor: "#10261c", borderColor: "#10261c" },
  hxSortChipText: { fontSize: 12, fontWeight: "800", color: "#657069" },
  hxActionButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  hxActionButtonText: { fontSize: 13, fontWeight: "900", textAlign: "center" },
  hxSectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#657069",
  },
  hxComp: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#8a8375",
    marginTop: 2,
  },
  hxArenaRow: {
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "#fffdf8",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  hxArenaName: { fontSize: 17, fontWeight: "900", color: "#17221c" },
  hxArenaClub: { fontSize: 13, fontWeight: "600", color: "#657069", marginTop: 2 },
  hxArenaVisits: {
    marginLeft: 12,
    alignItems: "center",
    backgroundColor: "#f0ead9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hxArenaVisitsNumber: { fontSize: 18, fontWeight: "900", color: "#10261c" },
  hxArenaVisitsLabel: { fontSize: 9, fontWeight: "800", color: "#657069" },
  hxStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#fffdf8",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  hxStatNumber: {
    fontSize: 24,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    color: "#17221c",
  },
  hxFormLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#8a8375",
    marginBottom: 6,
    marginTop: 4,
  },
  hxFormRow: { flexDirection: "row", gap: 8 },
  hxFormBar: { flexDirection: "row", gap: 10, marginTop: 16 },
});
