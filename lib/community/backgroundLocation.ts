import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { communityRequest } from "./api";
import type { CommunityState } from "./model";

const TASK = "ticket-frame-community-map-location-v1";
const OWNER = "ticket-frame.community-map-location-owner.v1";
export async function stopBackgroundMapLocation() {
  await AsyncStorage.removeItem(OWNER);
  if (await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK);
}
export async function startBackgroundMapLocation() {
  if (!(await Location.getBackgroundPermissionsAsync()).granted) return false;
  const state = await communityRequest<CommunityState>("/me");
  if (!state.profile || !state.preferences.enabled || !state.preferences.alwaysLocation) return false;
  await AsyncStorage.setItem(OWNER, state.profile.id);
  if (!(await Location.hasStartedLocationUpdatesAsync(TASK))) {
    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.Balanced, timeInterval: 45000, distanceInterval: 0,
      pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: "Ticket Frame location sharing", notificationBody: "Sharing your approximate area with Community friends. Turn off Always Show My Location to stop." },
    });
  }
  return true;
}
if (!TaskManager.isTaskDefined(TASK)) TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  try {
    const owner = await AsyncStorage.getItem(OWNER);
    const state = await communityRequest<CommunityState>("/me");
    if (!owner || state.profile?.id !== owner || !state.preferences.enabled || !state.preferences.alwaysLocation) {
      await stopBackgroundMapLocation(); return;
    }
    const position = data.locations[data.locations.length - 1];
    // Do not renew a lease from a stale OS-delivered location.
    if (Math.abs(Date.now() - position.timestamp) > 120000) return;
    if ((await AsyncStorage.getItem(OWNER)) !== owner) return;
    await communityRequest("/community-map/location", {
      latitude: position.coords.latitude, longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? 999999, mode: "always",
    });
  } catch {
    // Fail closed: no cached upload and no extended lease when auth/network fails.
  }
});
