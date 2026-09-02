import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

export const MATCH_CHECKIN_TASK = "ticket-frame-match-checkin-geofence.v1";
export const MATCH_CHECKIN_ENABLED_KEY = "ticket-frame.match-checkin-enabled.v1";
export const MATCH_CHECKIN_FIXTURES_KEY = "ticket-frame.match-checkin-fixtures.v1";
export const MATCH_CHECKIN_ACK_KEY = "ticket-frame.match-checkin-ack.v1";

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
  return stored !== "false";
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
  return kickoff != null && now >= kickoff - 60 * 60 * 1000 && now <= kickoff + 60 * 60 * 1000;
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
      return kickoff != null && kickoff + 60 * 60 * 1000 >= now && !acknowledged.has(fixture.key);
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
      radius: 450,
      notifyOnEnter: true,
      notifyOnExit: false,
    })),
  );
}

TaskManager.defineTask(MATCH_CHECKIN_TASK, async ({ data, error }) => {
  if (error || !data || !(await isMatchCheckInEnabled())) return;
  const event = data as { eventType?: Location.GeofencingEventType; region?: { identifier?: string } };
  if (event.eventType !== Location.GeofencingEventType.Enter || !event.region?.identifier) return;
  const raw = await AsyncStorage.getItem(MATCH_CHECKIN_FIXTURES_KEY);
  const fixtures: MatchCheckInFixture[] = raw ? JSON.parse(raw) : [];
  const fixture = fixtures.find((item) => item.key === event.region?.identifier);
  if (!fixture || !isInCheckInWindow(fixture)) return;
  const acknowledgedRaw = await AsyncStorage.getItem(MATCH_CHECKIN_ACK_KEY);
  const acknowledged: string[] = acknowledgedRaw ? JSON.parse(acknowledgedRaw) : [];
  if (acknowledged.includes(fixture.key)) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Did you attend this match?",
      body: `${fixture.club} ${fixture.homeAway === "home" ? "v" : "at"} ${fixture.opponent}`,
      categoryIdentifier: "MATCH_ATTENDANCE",
      data: { matchCheckIn: fixture },
    },
    trigger: null,
  });
  // Record delivery immediately. Tapping the delivered notification still
  // processes its embedded fixture, but re-entering the region cannot send a
  // second notification for the same match.
  await acknowledgeMatchCheckIn(fixture.key);
});
