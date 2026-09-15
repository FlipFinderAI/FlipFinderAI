import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

export const MATCH_CHECKIN_TASK = "ticket-frame-match-checkin-geofence.v1";
export const MATCH_CHECKIN_ENABLED_KEY = "ticket-frame.match-checkin-enabled.v1";
export const MATCH_CHECKIN_FIXTURES_KEY = "ticket-frame.match-checkin-fixtures.v1";
export const MATCH_CHECKIN_ACK_KEY = "ticket-frame.match-checkin-ack.v1";
export const MATCH_CHECKIN_PRESENCE_KEY = "ticket-frame.match-checkin-presence.v1";
export const MATCH_CHECKIN_REMINDERS_KEY = "ticket-frame.match-checkin-reminders.v1";

const MATCH_CHECKIN_DETECTION_RADIUS_METRES = 966;
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

export async function isMatchCheckInEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(MATCH_CHECKIN_ENABLED_KEY);
  return stored === "true";
}

export async function setMatchCheckInEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(MATCH_CHECKIN_ENABLED_KEY, String(enabled));
  if (!enabled && (await Location.hasStartedGeofencingAsync(MATCH_CHECKIN_TASK)))
    await Location.stopGeofencingAsync(MATCH_CHECKIN_TASK);
}

export function matchKickoffMs(fixture: MatchCheckInFixture): number | null {
  const time = /^\d{1,2}:\d{2}$/.test(fixture.kickoff ?? "")
    ? fixture.kickoff
    : "15:00";
  const parsed = Date.parse(`${fixture.date}T${time}:00`);
  return Number.isFinite(parsed) ? parsed : null;
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

export async function acknowledgeMatchCheckIn(key: string): Promise<void> {
  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const keys: string[] = raw ? JSON.parse(raw) : [];
  if (!keys.includes(key)) keys.push(key);
  await AsyncStorage.setItem(MATCH_CHECKIN_ACK_KEY, JSON.stringify(keys.slice(-100)));
}

export async function isMatchCheckInAcknowledged(key: string): Promise<boolean> {
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

export async function recordMatchCheckInPresence(
  fixture: MatchCheckInFixture,
): Promise<void> {
  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_PRESENCE_KEY);
  const presence: Record<
    string,
    {
      fixture?: MatchCheckInFixture;
      detectedAt?: string;
      tentative?: boolean;
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
  const presenceRaw = await AsyncStorage.getItem(MATCH_CHECKIN_PRESENCE_KEY);
  if (!presenceRaw) return [];

  const presence: Record<
    string,
    { fixture?: MatchCheckInFixture; detectedAt?: string }
  > = JSON.parse(presenceRaw);

  const acknowledgedRaw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const acknowledged: string[] = acknowledgedRaw
    ? JSON.parse(acknowledgedRaw)
    : [];
  const acknowledgedSet = new Set(acknowledged);

  const now = Date.now();

  return Object.entries(presence)
    .filter(([key, item]) => {
      if (acknowledgedSet.has(key) || !item?.fixture) return false;

      const kickoff = matchKickoffMs(item.fixture);
      if (kickoff == null) return false;

      return (
        now >= kickoff - MATCH_CHECKIN_WINDOW_BEFORE_MS &&
        now <= kickoff + MATCH_CHECKIN_WINDOW_AFTER_MS
      );
    })
    .map(([, item]) => item.fixture!);
}

export async function configureMatchGeofences(
  fixtures: MatchCheckInFixture[],
): Promise<void> {
  await AsyncStorage.setItem(MATCH_CHECKIN_FIXTURES_KEY, JSON.stringify(fixtures));
  if (!(await isMatchCheckInEnabled())) return;
  const background = await Location.getBackgroundPermissionsAsync();
  if (!background.granted) return;
  const acknowledgedRaw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const acknowledged = new Set<string>(acknowledgedRaw ? JSON.parse(acknowledgedRaw) : []);
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
  if (!upcoming.length) {
    if (await Location.hasStartedGeofencingAsync(MATCH_CHECKIN_TASK))
      await Location.stopGeofencingAsync(MATCH_CHECKIN_TASK);
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
}

TaskManager.defineTask(MATCH_CHECKIN_TASK, async ({ data, error }) => {
  if (error || !data || !(await isMatchCheckInEnabled())) return;

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
      }
    > = presenceRaw ? JSON.parse(presenceRaw) : {};

    if (presence[key]?.tentative) {
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

    const content = {
      title: "Did you attend this match?",
      body: `${fixture.club} ${
        fixture.homeAway === "home" ? "v" : "at"
      } ${fixture.opponent}`,
      categoryIdentifier: "MATCH_ATTENDANCE",
      data: { matchCheckIn: fixture },
    };

    const promptTimes = [
      windowStart,
      kickoff + MATCH_CHECKIN_REMINDER_ONE_MS,
      kickoff + MATCH_CHECKIN_REMINDER_TWO_MS,
    ];

    const promptIds: string[] = [];

    for (const promptAt of promptTimes) {
      if (promptAt <= Date.now()) continue;

      const promptId = await Notifications.scheduleNotificationAsync({
        content,
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
    title: "Did you attend this match?",
    body: `${fixture.club} ${
      fixture.homeAway === "home" ? "v" : "at"
    } ${fixture.opponent}`,
    categoryIdentifier: "MATCH_ATTENDANCE",
    data: { matchCheckIn: fixture },
  };

  if (firstDetection) {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });
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
});
