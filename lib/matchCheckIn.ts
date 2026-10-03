import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { clubNamesMatch, normaliseFixtureText } from "./ticketText";
import { footballGroundForName, findGroundForClub } from "./clubGroundMatching";

export const MATCH_CHECKIN_TASK = "ticket-frame-match-checkin-geofence.v1";
export const MATCH_CHECKIN_ENABLED_KEY = "ticket-frame.match-checkin-enabled.v1";
export const MATCH_CHECKIN_FIXTURES_KEY = "ticket-frame.match-checkin-fixtures.v1";
export const MATCH_CHECKIN_ACK_KEY = "ticket-frame.match-checkin-ack.v1";
export const MATCH_CHECKIN_PRESENCE_KEY = "ticket-frame.match-checkin-presence.v1";
export const MATCH_CHECKIN_REMINDERS_KEY = "ticket-frame.match-checkin-reminders.v1";
export const MATCH_CHECKIN_ATTENDANCE_DECISIONS_KEY =
  "ticket-frame.match-check-in-attendance-decisions.v1";

export type MatchCheckInAttendanceOutcome = "confirmed" | "rejected";

export type MatchCheckInAttendanceDecision = {
  outcome: MatchCheckInAttendanceOutcome;
  decidedAt: string;
};

const MATCH_CHECKIN_DETECTION_RADIUS_METRES = 500;
const MATCH_CHECKIN_WINDOW_BEFORE_MS = 60 * 60 * 1000;
const MATCH_CHECKIN_WINDOW_AFTER_MS = 3 * 60 * 60 * 1000;
const MATCH_CHECKIN_REMINDER_ONE_MS = 1.9 * 60 * 60 * 1000;
const MATCH_CHECKIN_REMINDER_TWO_MS = 2.9 * 60 * 60 * 1000;

export type MatchCheckInFixture = {
  key: string;
  club: string;
  opponent: string;
  date: string;
  kickoff: string | null;
  competition: string | null;
  ground: string;
  homeAway: "home" | "away";
  latitude: number;
  longitude: number;
};

export function matchCheckInFixtureKey(
  fixture: Pick<
    MatchCheckInFixture,
    "club" | "opponent" | "date" | "competition" | "homeAway"
  >,
): string {
  return [
    "match-v2",
    normaliseFixtureText(fixture.club),
    fixture.date,
    normaliseFixtureText(fixture.opponent),
    fixture.homeAway,
    normaliseFixtureText(fixture.competition),
  ].join("|");
}

type NativeFixture = MatchCheckInFixture & { kickoffMs: number | null };
const nativeFixture = (fixture: MatchCheckInFixture): NativeFixture =>
  ({ ...fixture, kickoffMs: matchKickoffMs(fixture) });
const iosCheckIn = Platform.OS === "ios";
function nativeCheckIn() {
  const module = NativeModules.MatchCheckInModule as {
    migrate(snapshot: Record<string, unknown>): Promise<void>;
    configure(fixtures: NativeFixture[]): Promise<void>;
    disable(): Promise<void>;
    acknowledge(key: string): Promise<void>;
    cancel(key: string): Promise<void>;
    record(fixture: NativeFixture): Promise<void>;
    unresolved(): Promise<MatchCheckInFixture[]>;
  } | undefined;
  if (!module) throw new Error("The native stadium check-in module is missing. Rebuild the iOS app.");
  return module;
}
let nativeMigration: Promise<void> | undefined;
function migrateNativeCheckIn(): Promise<void> {
  if (!nativeMigration) nativeMigration = (async () => {
    const values = await AsyncStorage.multiGet([
      MATCH_CHECKIN_ENABLED_KEY, MATCH_CHECKIN_FIXTURES_KEY, MATCH_CHECKIN_ACK_KEY,
      MATCH_CHECKIN_PRESENCE_KEY, MATCH_CHECKIN_REMINDERS_KEY,
    ]);
    const saved = Object.fromEntries(values);
    const fixtures: MatchCheckInFixture[] = JSON.parse(saved[MATCH_CHECKIN_FIXTURES_KEY] || "[]");
    const presence = JSON.parse(saved[MATCH_CHECKIN_PRESENCE_KEY] || "{}");
    for (const item of Object.values(presence) as Array<{ fixture?: MatchCheckInFixture }>) {
      if (item.fixture) item.fixture = nativeFixture(item.fixture);
    }
    await nativeCheckIn().migrate({
      enabled: saved[MATCH_CHECKIN_ENABLED_KEY] === "true",
      fixtures: fixtures.map(nativeFixture), presence,
      acknowledged: JSON.parse(saved[MATCH_CHECKIN_ACK_KEY] || "[]"),
      reminders: JSON.parse(saved[MATCH_CHECKIN_REMINDERS_KEY] || "{}"),
    });
  })().catch(error => { nativeMigration = undefined; throw error; });
  return nativeMigration;
}
async function stopMatchRegions(): Promise<void> {
  if (iosCheckIn) {
    await migrateNativeCheckIn();
    await nativeCheckIn().disable();
  } else if (await Location.hasStartedGeofencingAsync(MATCH_CHECKIN_TASK)) {
    await Location.stopGeofencingAsync(MATCH_CHECKIN_TASK);
  }
}

export async function isMatchCheckInEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(MATCH_CHECKIN_ENABLED_KEY);
  return stored === "true";
}

export async function setMatchCheckInEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(MATCH_CHECKIN_ENABLED_KEY, String(enabled));
  if (!enabled) {
    const run = configurationQueue.catch(() => {}).then(stopMatchRegions);
    configurationQueue = run;
    await run;
  }
}

export function matchKickoffMs(fixture: { date: string; kickoff: string | null }): number | null {
  if (fixture.kickoff?.includes("T")) {
    const parsed = Date.parse(fixture.kickoff);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const time = /^\d{1,2}:\d{2}$/.test(fixture.kickoff ?? "")
    ? fixture.kickoff
    : "15:00";
  const parsed = Date.parse(`${fixture.date}T${time}:00`);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchCheckInPrompt(
  fixture: MatchCheckInFixture,
  atMs = Date.now(),
): { title: string; body: string } {
  const kickoff = matchKickoffMs(fixture);

  const home = fixture.homeAway === "home"
    ? fixture.club
    : fixture.opponent;
  const away = fixture.homeAway === "home"
    ? fixture.opponent
    : fixture.club;

  const match = `${home} v ${away}`;

  if (kickoff != null && atMs < kickoff) {
    return {
      title: `Are you attending the fixture between ${match}?`,
      body: match,
    };
  }

  if (
    kickoff != null &&
    atMs <= kickoff + MATCH_CHECKIN_WINDOW_AFTER_MS
  ) {
    return {
      title: `Are you at the fixture between ${match}?`,
      body: match,
    };
  }

  return {
    title: `Did you attend the fixture between ${match}?`,
    body: match,
  };
}

export function isInCheckInWindow(
  fixture: MatchCheckInFixture,
  now = Date.now(),
): boolean {
  const kickoff = matchKickoffMs(fixture);
  return (
    kickoff != null &&
    now >= kickoff - MATCH_CHECKIN_WINDOW_BEFORE_MS &&
    now <= kickoff + MATCH_CHECKIN_WINDOW_AFTER_MS
  );
}

// Keep several upcoming regions armed so background detection does not depend
// on reopening a screen between matches. iOS supports at most 20 per app.
export function buildMatchCheckInFixtures(rows: Array<{
  date: string | null; kickoff: string | null; homeName: string;
  awayName: string; venue: string | null; competition: string | null;
  round?: string | null; status?: string;
}>, club: string, now = Date.now(), onMissingGround?: () => void): MatchCheckInFixture[] {
  const candidates: MatchCheckInFixture[] = [];
  for (const row of rows) {
    if (!row.date || ![row.homeName, row.awayName].some(name => clubNamesMatch(name, club))) continue;
    if (/postpon|cancel|abandon/i.test(row.status ?? "")) continue;
    const kickoff = matchKickoffMs({date: row.date, kickoff: row.kickoff});
    if (kickoff == null || kickoff + MATCH_CHECKIN_WINDOW_AFTER_MS < now) continue;
    const home = clubNamesMatch(row.homeName, club);
    const opponent = home ? row.awayName : row.homeName;
    const ground = row.venue ? footballGroundForName(row.venue) :
      /\b(?:semi[- ]?final|final)\b/i.test(row.round ?? "") ? undefined :
      findGroundForClub(row.homeName, row.date);
    if (!ground || !Number.isFinite(ground.latitude) || !Number.isFinite(ground.longitude)) {
      onMissingGround?.();
      continue;
    }
    const key = matchCheckInFixtureKey({
      club,
      opponent,
      date: row.date,
      competition: row.competition,
      homeAway: home ? "home" : "away",
    });
    if (candidates.some(item => item.key === key)) continue;
    candidates.push({key, club, opponent, date: row.date, kickoff: row.kickoff,
      competition: row.competition, ground: ground.stadium,
      homeAway: home ? "home" : "away", latitude: ground.latitude, longitude: ground.longitude});
  }
  return candidates.sort((a,b) => matchKickoffMs(a)! - matchKickoffMs(b)!);
}

export async function checkMatchCheckInPermissions(): Promise<void> {
  const [background, notifications, services] = await Promise.all([
    Location.getBackgroundPermissionsAsync(), Notifications.getPermissionsAsync(),
    Location.hasServicesEnabledAsync(),
  ]);
  if (!services) throw new Error("Turn on iPhone Location Services for automatic match check-ins.");
  if (!background.granted) throw new Error("Allow Always location access in iOS Settings for automatic match check-ins.");
  if (!notifications.granted) throw new Error("Allow notifications in iOS Settings to receive automatic match check-ins.");
}

let configurationQueue: Promise<void> = Promise.resolve();
let registeredSignature = "";

export async function matchCheckInAttendanceDecision(
  key: string,
): Promise<MatchCheckInAttendanceDecision | null> {
  const raw = await AsyncStorage.getItem(
    MATCH_CHECKIN_ATTENDANCE_DECISIONS_KEY,
  );
  if (!raw) return null;

  const decisions: Record<string, MatchCheckInAttendanceDecision> =
    JSON.parse(raw);

  return decisions[key] ?? null;
}

export async function recordMatchCheckInAttendanceDecision(
  key: string,
  outcome: MatchCheckInAttendanceOutcome,
): Promise<void> {
  const raw = await AsyncStorage.getItem(
    MATCH_CHECKIN_ATTENDANCE_DECISIONS_KEY,
  );

  const decisions: Record<string, MatchCheckInAttendanceDecision> =
    raw ? JSON.parse(raw) : {};

  // Re-answering must never silently reverse an already final decision.
  if (decisions[key]) return;

  decisions[key] = {
    outcome,
    decidedAt: new Date().toISOString(),
  };

  const trimmed = Object.fromEntries(
    Object.entries(decisions).slice(-200),
  );

  await AsyncStorage.setItem(
    MATCH_CHECKIN_ATTENDANCE_DECISIONS_KEY,
    JSON.stringify(trimmed),
  );
}

export async function acknowledgeMatchCheckIn(key: string): Promise<void> {
  if (iosCheckIn) {
    await migrateNativeCheckIn();
    await nativeCheckIn().acknowledge(key);
  }
  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const keys: string[] = raw ? JSON.parse(raw) : [];
  if (!keys.includes(key)) keys.push(key);
  await AsyncStorage.setItem(MATCH_CHECKIN_ACK_KEY, JSON.stringify(keys.slice(-100)));
}

export async function isMatchCheckInAcknowledged(key: string): Promise<boolean> {
  if (await matchCheckInAttendanceDecision(key)) return true;

  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const keys: string[] = raw ? JSON.parse(raw) : [];
  return keys.includes(key);
}

async function storeMatchCheckInReminderIds(
  key: string,
  ids: string[],
): Promise<void> {
  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_REMINDERS_KEY);
  const stored: Record<string, string[]> = raw ? JSON.parse(raw) : {};
  stored[key] = ids;
  await AsyncStorage.setItem(
    MATCH_CHECKIN_REMINDERS_KEY,
    JSON.stringify(stored),
  );
}

export async function cancelMatchCheckInReminders(
  key: string,
): Promise<void> {
  if (iosCheckIn) {
    await migrateNativeCheckIn();
    await nativeCheckIn().cancel(key);
  }
  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_REMINDERS_KEY);
  const stored: Record<string, string[]> = raw ? JSON.parse(raw) : {};
  const ids = stored[key] ?? [];

  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );

  if (stored[key]) {
    delete stored[key];
    await AsyncStorage.setItem(
      MATCH_CHECKIN_REMINDERS_KEY,
      JSON.stringify(stored),
    );
  }
}

export async function acknowledgeAndCancelMatchCheckIn(
  key: string,
): Promise<void> {
  await acknowledgeMatchCheckIn(key);
  await cancelMatchCheckInReminders(key);

  const presenceRaw = await AsyncStorage.getItem(MATCH_CHECKIN_PRESENCE_KEY);
  const presence: Record<string, unknown> = presenceRaw
    ? JSON.parse(presenceRaw)
    : {};

  if (presence[key]) {
    delete presence[key];
    await AsyncStorage.setItem(
      MATCH_CHECKIN_PRESENCE_KEY,
      JSON.stringify(presence),
    );
  }
}

export async function resolveMatchCheckInAttendance(
  key: string,
  outcome: MatchCheckInAttendanceOutcome,
): Promise<void> {
  // Persist the final Yes/No first. If cleanup is interrupted, the
  // decision still prevents the supporter being asked repeatedly.
  await recordMatchCheckInAttendanceDecision(key, outcome);
  await acknowledgeAndCancelMatchCheckIn(key);
}

export async function recordMatchCheckInPresence(
  fixture: MatchCheckInFixture,
): Promise<void> {
  if (iosCheckIn) {
    await migrateNativeCheckIn();
    await nativeCheckIn().record(nativeFixture(fixture));
    return;
  }
  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_PRESENCE_KEY);
  const presence: Record<
    string,
    {
      fixture?: MatchCheckInFixture;
      detectedAt?: string;
      tentative?: boolean;
      notifiedAt?: string;
    }
  > = raw ? JSON.parse(raw) : {};

  presence[fixture.key] = {
    fixture,
    detectedAt: new Date().toISOString(),
    tentative: false,
  };

  await AsyncStorage.setItem(
    MATCH_CHECKIN_PRESENCE_KEY,
    JSON.stringify(presence),
  );
}

export async function unresolvedMatchCheckInPresence(): Promise<
  MatchCheckInFixture[]
> {
  if (iosCheckIn) {
    await migrateNativeCheckIn();
    return nativeCheckIn().unresolved();
  }
  const presenceRaw = await AsyncStorage.getItem(MATCH_CHECKIN_PRESENCE_KEY);
  if (!presenceRaw) return [];

  const presence: Record<
    string,
    {
      fixture?: MatchCheckInFixture;
      detectedAt?: string;
      tentative?: boolean;
    }
  > = JSON.parse(presenceRaw);

  const acknowledgedRaw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const acknowledged: string[] = acknowledgedRaw
    ? JSON.parse(acknowledgedRaw)
    : [];
  const acknowledgedSet = new Set(acknowledged);

  const decisionsRaw = await AsyncStorage.getItem(
    MATCH_CHECKIN_ATTENDANCE_DECISIONS_KEY,
  );
  const decisions: Record<string, MatchCheckInAttendanceDecision> =
    decisionsRaw ? JSON.parse(decisionsRaw) : {};

  return Object.entries(presence)
    .filter(([key, item]) => {
      if (
        acknowledgedSet.has(key) ||
        decisions[key] ||
        !item?.fixture
      ) {
        return false;
      }

      // Genuine stadium evidence remains unresolved until the supporter
      // explicitly answers Yes or No, even after the normal check-in
      // window and after leaving the stadium.
      return item.tentative === false;
    })
    .map(([, item]) => item.fixture!);
}

export function configureMatchGeofences(fixtures: MatchCheckInFixture[]): Promise<void> {
  const run = configurationQueue.catch(() => {}).then(() => configureRegions(fixtures));
  configurationQueue = run;
  return run;
}

async function configureRegions(fixtures: MatchCheckInFixture[]): Promise<void> {
  if (!(await isMatchCheckInEnabled())) {
    registeredSignature = "";
    await stopMatchRegions();
    return;
  }
  if (iosCheckIn) await migrateNativeCheckIn();
  await checkMatchCheckInPermissions();
  const acknowledgedRaw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const acknowledged = new Set<string>(acknowledgedRaw ? JSON.parse(acknowledgedRaw) : []);
  // Migrate only legacy acknowledgements whose saved fixture proves the club.
  const previousRaw = await AsyncStorage.getItem(MATCH_CHECKIN_FIXTURES_KEY);
  const previous: MatchCheckInFixture[] = previousRaw ? JSON.parse(previousRaw) : [];
  for (const old of previous) {
    const replacement = fixtures.find(item => item.date === old.date &&
      clubNamesMatch(item.club, old.club) && clubNamesMatch(item.opponent, old.opponent) &&
      item.homeAway === old.homeAway && item.competition === old.competition);
    if (replacement && acknowledged.has(old.key)) acknowledged.add(replacement.key);
    if (!fixtures.some(item => item.key === old.key)) {
      await cancelMatchCheckInReminders(old.key);
      const raw = await AsyncStorage.getItem(MATCH_CHECKIN_PRESENCE_KEY);
      const presence = raw ? JSON.parse(raw) : {};
      delete presence[old.key];
      await AsyncStorage.setItem(MATCH_CHECKIN_PRESENCE_KEY, JSON.stringify(presence));
    }
  }
  await AsyncStorage.setItem(MATCH_CHECKIN_ACK_KEY, JSON.stringify([...acknowledged].slice(-100)));
  const now = Date.now();
  const upcoming = fixtures
    .filter((fixture) => {
      const kickoff = matchKickoffMs(fixture);
      return (
        kickoff != null &&
        kickoff + MATCH_CHECKIN_WINDOW_AFTER_MS >= now &&
        !acknowledged.has(fixture.key)
      );
    })
    .sort((a, b) => (matchKickoffMs(a) ?? 0) - (matchKickoffMs(b) ?? 0))
    .slice(0, 20);
  const signature = JSON.stringify(upcoming);
  if (!iosCheckIn && signature === registeredSignature && await Location.hasStartedGeofencingAsync(MATCH_CHECKIN_TASK)) return;
  // Store the event lookup before native monitoring can deliver an initial event.
  await AsyncStorage.setItem(MATCH_CHECKIN_FIXTURES_KEY, signature);
  if (!upcoming.length) {
    registeredSignature = "";
    await stopMatchRegions();
    return;
  }
  if (iosCheckIn) {
    await nativeCheckIn().configure(upcoming.map(nativeFixture));
    registeredSignature = signature;
    return;
  }
  await Location.startGeofencingAsync(
    MATCH_CHECKIN_TASK,
    upcoming.map((fixture) => ({
      identifier: fixture.key,
      latitude: fixture.latitude,
      longitude: fixture.longitude,
      radius: MATCH_CHECKIN_DETECTION_RADIUS_METRES,
      notifyOnEnter: true,
      notifyOnExit: true,
    })),
  );
  registeredSignature = signature;
}

// Multiple regions can report together; serialize shared presence/reminder writes.
let eventQueue: Promise<void> = Promise.resolve();
if (!iosCheckIn) TaskManager.defineTask(MATCH_CHECKIN_TASK, ({ data, error }) => {
  const run = eventQueue.catch(() => {}).then(() => handleGeofenceEvent(data, error));
  eventQueue = run;
  return run.catch(error => { console.warn("[match-check-in] event processing failed", error); throw error; });
});

async function handleGeofenceEvent(data: unknown, error: unknown): Promise<void> {
  if (error) { console.warn("[match-check-in] background task failed", error); return; }
  if (!data || !(await isMatchCheckInEnabled())) return;

  const event = data as {
    eventType?: Location.GeofencingEventType;
    region?: { identifier?: string };
  };
  const key = event.region?.identifier;
  if (!key) return;

  if (event.eventType === Location.GeofencingEventType.Exit) {
    await cancelMatchCheckInReminders(key);

    const presenceRaw = await AsyncStorage.getItem(MATCH_CHECKIN_PRESENCE_KEY);
    const presence: Record<
      string,
      {
        fixture?: MatchCheckInFixture;
        detectedAt?: string;
        tentative?: boolean;
        notifiedAt?: string;
      }
    > = presenceRaw ? JSON.parse(presenceRaw) : {};

    if (presence[key]) {
      delete presence[key];
      await AsyncStorage.setItem(
        MATCH_CHECKIN_PRESENCE_KEY,
        JSON.stringify(presence),
      );
    }

    return;
  }

  if (event.eventType !== Location.GeofencingEventType.Enter) return;

  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_FIXTURES_KEY);
  const fixtures: MatchCheckInFixture[] = raw ? JSON.parse(raw) : [];
  const fixture = fixtures.find((item) => item.key === key);
  if (!fixture) return;

  const kickoff = matchKickoffMs(fixture);
  if (kickoff == null) return;

  const now = Date.now();
  const windowStart = kickoff - MATCH_CHECKIN_WINDOW_BEFORE_MS;
  const windowEnd = kickoff + MATCH_CHECKIN_WINDOW_AFTER_MS;

  if (now > windowEnd) return;

  const acknowledgedRaw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const acknowledged: string[] = acknowledgedRaw
    ? JSON.parse(acknowledgedRaw)
    : [];
  if (acknowledged.includes(fixture.key)) return;

  const presenceRaw = await AsyncStorage.getItem(MATCH_CHECKIN_PRESENCE_KEY);
  const presence: Record<
    string,
    {
      fixture?: MatchCheckInFixture;
      detectedAt?: string;
      tentative?: boolean;
      notifiedAt?: string;
    }
  > = presenceRaw ? JSON.parse(presenceRaw) : {};

  const firstDetection = !presence[fixture.key];

  if (now < windowStart) {
    const reminderRaw = await AsyncStorage.getItem(MATCH_CHECKIN_REMINDERS_KEY);
    const reminders: Record<string, string[]> = reminderRaw
      ? JSON.parse(reminderRaw)
      : {};

    if ((reminders[fixture.key]?.length ?? 0) > 0) return;

    presence[fixture.key] = {
      fixture,
      detectedAt: new Date().toISOString(),
      tentative: true,
    };

    await AsyncStorage.setItem(
      MATCH_CHECKIN_PRESENCE_KEY,
      JSON.stringify(presence),
    );

    const promptTimes = [
      windowStart,
      kickoff + MATCH_CHECKIN_REMINDER_ONE_MS,
      kickoff + MATCH_CHECKIN_REMINDER_TWO_MS,
    ];

    const promptIds: string[] = [];

    for (const promptAt of promptTimes) {
      if (promptAt <= Date.now()) continue;

      const promptId = await Notifications.scheduleNotificationAsync({
        content: {
          ...matchCheckInPrompt(fixture, promptAt),
          categoryIdentifier: "MATCH_ATTENDANCE",
          data: { matchCheckIn: fixture },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(promptAt),
        },
      });

      promptIds.push(promptId);
    }

    await storeMatchCheckInReminderIds(fixture.key, promptIds);
    return;
  }

  if (firstDetection) {
    presence[fixture.key] = {
      fixture,
      detectedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      MATCH_CHECKIN_PRESENCE_KEY,
      JSON.stringify(presence),
    );
  }

  const reminderRaw = await AsyncStorage.getItem(MATCH_CHECKIN_REMINDERS_KEY);
  const reminders: Record<string, string[]> = reminderRaw
    ? JSON.parse(reminderRaw)
    : {};

  if (!firstDetection && (reminders[fixture.key]?.length ?? 0) > 0)
    return;

  const content = {
    ...matchCheckInPrompt(fixture, Date.now()),
    categoryIdentifier: "MATCH_ATTENDANCE",
    data: { matchCheckIn: fixture },
  };

  if (!presence[fixture.key]?.notifiedAt) {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });
    presence[fixture.key] = {...presence[fixture.key], notifiedAt: new Date().toISOString()};
    await AsyncStorage.setItem(MATCH_CHECKIN_PRESENCE_KEY, JSON.stringify(presence));
  }

  const reminderTimes = [
    kickoff + MATCH_CHECKIN_REMINDER_ONE_MS,
    kickoff + MATCH_CHECKIN_REMINDER_TWO_MS,
  ];

  const reminderIds: string[] = [];

  for (const reminderAt of reminderTimes) {
    if (reminderAt <= Date.now()) continue;

    const reminderId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminderAt),
      },
    });

    reminderIds.push(reminderId);
  }

  await storeMatchCheckInReminderIds(fixture.key, reminderIds);
}
