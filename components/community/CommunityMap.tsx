import { useEffect, useState } from "react";
import { Alert, AppState, Linking, Platform, Text, UIManager, View } from "react-native";
import Constants from "expo-constants";
import { communityRequest } from "@/lib/community/api";
import type { Preferences } from "@/lib/community/model";
import { Action, styles } from "./Controls";
import type { useMapSharing } from "@/lib/community/useMapSharing";
import type { FootballGround } from "@/lib/grounds";

type Person = { profile: { id: string; displayName: string; avatar: string }; latitude: number; longitude: number; expiresAt: number; self: boolean; matchdayTicket: { fixtureId: string; stadium: string } | null };
type Props = { enabled: boolean; busy: boolean; colour: string; stadium: FootballGround | null | undefined; preferences: Preferences; onStop(): Promise<void>; sharing: ReturnType<typeof useMapSharing>; run(task: () => Promise<void>): Promise<void> };
export default function CommunityMap({ enabled, busy, colour, stadium, preferences, onStop, sharing, run }: Props) {
  const [mode, setMode] = useState<"normal" | "cartoon" | "satellite">("normal");
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [error, setError] = useState("");
  const google = Platform.OS === "android" || Boolean(Constants.expoConfig?.extra?.communityGoogleMapsIOS);
  const configured = Platform.OS === "ios" || Boolean(Constants.expoConfig?.extra?.communityGoogleMapsAndroid);
  const nativeReady = Platform.OS !== "web" && Boolean(UIManager.getViewManagerConfig(google && Platform.OS === "ios" ? "AIRGoogleMap" : "AIRMap"));
  // Keep installed builds usable until the new native dependency is rebuilt.
  const Maps = nativeReady && configured ? require("react-native-maps") as typeof import("react-native-maps") : null;
  useEffect(() => {
    if (!enabled) { setPeople([]); setSelected(null); return; }
    let live = true;
    let requestNumber = 0;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      if (AppState.currentState !== "active") return;
      const number = ++requestNumber;
      try {
        const result = await communityRequest<{ people: Person[]; serverNow: number }>("/community-map");
        if (!live || number !== requestNumber) return;
        setPeople(result.people); setError("");
        setSelected(current => result.people.find(p => p.profile.id === current?.profile.id) || null);
        clearTimeout(expiry);
        if (result.people.length) expiry = setTimeout(() => { setPeople([]); setSelected(null); }, Math.max(0, Math.min(...result.people.map(p => p.expiresAt - result.serverNow))));
      } catch {
        if (live) { setPeople([]); setSelected(null); setError("Could not load friend locations. Please try again shortly."); }
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    const listener = AppState.addEventListener("change", value => {
      if (value === "active") void refresh();
      else { requestNumber++; setPeople([]); setSelected(null); }
    });
    return () => { live = false; clearInterval(timer); clearTimeout(expiry); listener.remove(); };
  }, [enabled]);
  async function navigate(person: Person, travel: "walking" | "driving") {
    // Revalidate consent and friendship immediately before handing off to navigation.
    const result = await communityRequest<{ people: Person[] }>("/community-map");
    const fresh = result.people.find(p => p.profile.id === person.profile.id && !p.self);
    if (!fresh) { setSelected(null); throw new Error("Your friend is no longer sharing a location."); }
    const destination = `${fresh.latitude},${fresh.longitude}`;
    const url = Platform.OS === "ios"
      ? `https://maps.apple.com/?daddr=${destination}&dirflg=${travel === "walking" ? "w" : "d"}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${travel}`;
    await Linking.openURL(url);
  }
  const accent = /^#[\da-f]{6}$/i.test(colour) ? colour : "#2354a5";
  return <View style={{ gap: 14 }}>
    <Text style={styles.heading}>Community Map</Text>
    <Text style={styles.copy}>Browse any time. Opening the map does not turn on location sharing. Friends appear only while they choose to share.</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {(["normal", "cartoon", "satellite"] as const).map(value => <Action key={value}
        title={`${mode === value ? "✓ " : ""}${value === "normal" ? "Normal" : value === "cartoon" ? "Team Cartoon" : "Satellite"}`}
        disabled={!enabled || (value === "cartoon" && !google)} onPress={() => setMode(value)} />)}
    </View>
    {!google && <Text style={styles.copy}>Team Cartoon needs Google Maps configured in the iPhone build. Normal and satellite use Apple Maps.</Text>}
    {enabled && Maps ? <Maps.default provider={google ? Maps.PROVIDER_GOOGLE : undefined}
      style={{ height: 380, borderRadius: 20 }} showsUserLocation={false}
      initialRegion={{ latitude: stadium?.latitude ?? 54, longitude: stadium?.longitude ?? -2, latitudeDelta: stadium ? 0.15 : 8, longitudeDelta: stadium ? 0.15 : 8 }}
      mapType={mode === "satellite" ? "satellite" : "standard"}
      customMapStyle={mode === "cartoon" ? [
        { elementType: "geometry", stylers: [{ color: "#f5efd9" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#8ed7ed" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#b6e3a1" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: accent }, { weight: 2 }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#253147" }] },
      ] : []}>
      {stadium && <Maps.Marker coordinate={stadium} title={stadium.stadium} pinColor={accent} />}
      {people.map(person => <Maps.Marker key={person.profile.id} coordinate={person} onPress={() => setSelected(person)} title={person.profile.displayName} description="Approximate area">
        <View style={{ borderRadius: 24, borderWidth: 3, borderColor: accent, padding: 7, backgroundColor: "white" }}><Text style={{ fontSize: 25 }}>{person.profile.avatar}</Text></View>
      </Maps.Marker>)}
    </Maps.default> : <Text style={styles.copy}>{enabled ? "The map needs the updated native app build and map provider configuration. Friend location controls are available below." : "Enable Join Community in Settings to browse the map."}</Text>}
    {!!error && <Text accessibilityLiveRegion="polite">{error}</Text>}
    <Text accessibilityLiveRegion="polite" style={styles.copy}>{sharing.status}</Text>
    {preferences.alwaysLocation && <Action title="Allow device location / resume sharing" disabled={!enabled || busy} onPress={() => void run(sharing.enableDeviceLocation)} />}
    <Action title="Accept location sharing for this Matchday Mode" disabled={!enabled || busy || !preferences.locationVisible}
      onPress={() => Alert.alert("Share for this Matchday?", "Share your approximate area with accepted friends until this Matchday session ends. You can stop at any time.", [
        { text: "Not now", style: "cancel" }, { text: "Accept", onPress: () => void run(sharing.acceptMatchday) },
      ])} />
    <Action title="Stop sharing now" disabled={!enabled || busy} onPress={() => void run(onStop)} />
    <Text style={styles.copy}>Directions lead to an approximate area, not your friend's exact position. Agree a meeting point with them in chat.</Text>
    {people.length === 0 && <Text style={styles.copy}>No friends are currently sharing a location.</Text>}
    {people.map(person => <Action key={person.profile.id} title={`${person.profile.avatar} ${person.profile.displayName}${person.self ? " (you)" : ""}`} disabled={busy} onPress={() => setSelected(person)} />)}
    {selected && <View style={{ padding: 16, borderRadius: 16, backgroundColor: "white", gap: 10 }}>
      <Text style={styles.heading}>{selected.profile.avatar} {selected.profile.displayName}</Text>
      <Text>Approximate shared area</Text>
      {selected.matchdayTicket && <Text>Matchday: {selected.matchdayTicket.stadium}</Text>}
      {!selected.self && <><Action title="Walk to friend's area" disabled={busy} onPress={() => void run(() => navigate(selected, "walking"))} />
      <Action title="Drive to friend's area" disabled={busy} onPress={() => void run(() => navigate(selected, "driving"))} /></>}
    </View>}
  </View>;
}
