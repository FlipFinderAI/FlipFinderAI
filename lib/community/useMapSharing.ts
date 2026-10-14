import { startBackgroundMapLocation, stopBackgroundMapLocation } from "./backgroundLocation";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { communityRequest } from "./api";
import type { Preferences } from "./model";

type Session = { fixtureId: string; startedAt: number };
export function useMapSharing(active: boolean, preferences: Preferences, accountKey: string) {
  const [acceptedSession, setAcceptedSession] = useState<Session | null>(null);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("Location is private.");
  const generation = useRef(0);
  useEffect(() => { setPaused(false); }, [preferences.alwaysLocation]);
  useEffect(() => {
    if (!active || !preferences.locationVisible) setAcceptedSession(null);
  }, [active, preferences.locationVisible]);
  useEffect(() => {
    const id = ++generation.current;
    let foreground = AppState.currentState === "active";
    let inFlight = false;
    const withdraw = () => communityRequest("/community-map/location", undefined, "DELETE").catch(() => {});
    const isCurrent = () => generation.current === id && foreground;
    async function update() {
      if (inFlight || !isCurrent() || !active || paused) return;
      const mode = preferences.alwaysLocation ? "always" : acceptedSession && preferences.locationVisible ? "matchday" : null;
      if (!mode) return;
      inFlight = true;
      try {
        if (mode === "matchday") {
          const { experience } = await communityRequest<{ experience: Session | null }>("/experience");
          if (!isCurrent()) return;
          if (!experience || experience.fixtureId !== acceptedSession?.fixtureId || experience.startedAt !== acceptedSession?.startedAt) {
            setAcceptedSession(null); setStatus("Matchday sharing ended."); await withdraw(); return;
          }
        }
        // Background renewals never prompt: permission is requested only by explicit controls.
        const permission = await Location.getForegroundPermissionsAsync();
        if (!isCurrent()) return;
        if (!permission.granted) { setStatus("Location permission is off. You can still browse the map."); await withdraw(); return; }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!isCurrent()) return;
        await communityRequest("/community-map/location", {
          latitude: position.coords.latitude, longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 999999, mode, accepted: mode === "matchday",
          sessionStartedAt: acceptedSession?.startedAt,
        });
        if (!isCurrent()) { await withdraw(); return; }
        setStatus(mode === "always" ? "Sharing your approximate area with friends. Background updates depend on device permission." : "Sharing your approximate area for this Matchday session.");
      } catch {
        if (isCurrent()) setStatus("Location could not be refreshed. Previous visibility expires within two minutes.");
      } finally { inFlight = false; }
    }
    if (!active || paused || (!preferences.alwaysLocation && !acceptedSession)) {
      setStatus("Location is private."); void withdraw();
    } else {
      if (preferences.alwaysLocation) void startBackgroundMapLocation().catch(() => {});
      void update();
    }
    if (active && (!preferences.alwaysLocation || paused)) void stopBackgroundMapLocation().catch(() => {});
    const timer = setInterval(() => void update(), 45000);
    const listener = AppState.addEventListener("change", value => {
      foreground = value === "active";
      if (foreground) void update();
      else if (!preferences.alwaysLocation) { void withdraw(); setStatus("Matchday sharing paused while the app is in the background."); }
    });
    return () => { generation.current++; clearInterval(timer); listener.remove(); if (!preferences.alwaysLocation) void withdraw(); };
  }, [active, preferences.alwaysLocation, preferences.locationVisible, acceptedSession, paused, accountKey]);
  async function enableDeviceLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) throw new Error("Location permission was not granted. Map browsing remains available.");
    if (preferences.alwaysLocation) {
      await Location.requestBackgroundPermissionsAsync();
      await startBackgroundMapLocation();
    }
    setPaused(false);
  }
  async function acceptMatchday() {
    if (!active || !preferences.locationVisible) throw new Error("Enable Matchday Location Features in Settings first.");
    const { experience } = await communityRequest<{ experience: Session | null }>("/experience");
    if (!experience) throw new Error("Activate Matchday Mode from Home first, then accept sharing here.");
    await enableDeviceLocation();
    setAcceptedSession(experience);
  }
  async function stop() {
    generation.current++; setPaused(true); setAcceptedSession(null);
    await stopBackgroundMapLocation();
    await communityRequest("/community-map/location", undefined, "DELETE");
    setStatus("Location sharing stopped.");
  }
  return { status, acceptMatchday, enableDeviceLocation, stop };
}
