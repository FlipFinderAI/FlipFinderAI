import { useEffect, useState } from "react";
import { Alert, AppState, Image, Linking, Platform, Pressable, ScrollView, Text, UIManager, View } from "react-native";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useRef } from "react";
import { communityRequest } from "@/lib/community/api";
import type { Preferences } from "@/lib/community/model";
import { Action, styles } from "./Controls";
import type { useMapSharing } from "@/lib/community/useMapSharing";
import type { FootballGround } from "@/lib/grounds";

type Person = { profile: { id: string; displayName: string; avatar: string }; latitude: number; longitude: number; expiresAt: number; self: boolean; matchdayTicket: { fixtureId: string; stadium: string } | null };
type Props = { enabled: boolean; busy: boolean; colour: string; avatarPhoto: string | null; avatarInitial: string; stadium: FootballGround | null | undefined; preferences: Preferences; onStop(): Promise<void>; sharing: ReturnType<typeof useMapSharing>; run(task: () => Promise<void>): Promise<void> };
export default function CommunityMap({ enabled, busy, colour, avatarPhoto, avatarInitial, stadium, preferences, onStop, sharing, run }: Props) {
  const [mode, setMode] = useState<"normal" | "cartoon" | "satellite">("normal");
  const [panelOpen, setPanelOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const mapRef = useRef<any>(null);
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
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
  async function centreOnMyLocation() {
    if (locating) return;
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Location unavailable", "Allow location access in iPhone Settings to centre the map on your position.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setMyLocation(coordinate);
      mapRef.current?.animateToRegion({
        ...coordinate,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 650);
    } catch {
      Alert.alert("Location unavailable", "Could not determine your current position. Please try again.");
    } finally {
      setLocating(false);
    }
  }

  const accent = /^#[\da-f]{6}$/i.test(colour) ? colour : "#2354a5";
  return <View style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
    <View style={{ flex: 1 }}>
    {enabled && Maps ? <Maps.default ref={mapRef} provider={google ? Maps.PROVIDER_GOOGLE : undefined}
      style={{ flex: 1 }} showsUserLocation={false}
      initialRegion={{ latitude: stadium?.latitude ?? 54, longitude: stadium?.longitude ?? -2, latitudeDelta: stadium ? 0.15 : 8, longitudeDelta: stadium ? 0.15 : 8 }}
      mapType={mode === "satellite" ? "satellite" : "standard"}
      customMapStyle={mode === "cartoon" ? [
        { elementType: "geometry", stylers: [{ color: "#f5efd9" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#8ed7ed" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#b6e3a1" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: accent }, { weight: 2 }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#253147" }] },
      ] : []}>
      {myLocation && <Maps.Marker coordinate={myLocation} title="You are here">
          <View style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            borderWidth: 4,
            borderColor: "#2684ff",
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {avatarPhoto ? (
              <Image
                source={{ uri: avatarPhoto }}
                style={{ width: 42, height: 42, borderRadius: 21 }}
              />
            ) : (
              <Text style={{ fontSize: 22, fontWeight: "900", color: accent }}>
                {avatarInitial}
              </Text>
            )}
          </View>
        </Maps.Marker>}
      {stadium && <Maps.Marker coordinate={stadium} title={stadium.stadium} pinColor={accent} />}
      {people.map(person => <Maps.Marker key={person.profile.id} coordinate={person} onPress={() => setSelected(person)} title={person.profile.displayName} description="Approximate area">
        <View style={{ borderRadius: 24, borderWidth: 3, borderColor: accent, padding: 7, backgroundColor: "white" }}><Text style={{ fontSize: 25 }}>{person.profile.avatar}</Text></View>
      </Maps.Marker>)}
    </Maps.default> : <Text style={styles.copy}>{enabled ? "The map needs the updated native app build and map provider configuration. Friend location controls are available below." : "Enable Join Community in Settings to browse the map."}</Text>}


      <View style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
      }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Map layers"
          accessibilityState={{ expanded: layersOpen }}
          onPress={() => setLayersOpen(value => !value)}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#dddddd",
          }}
        >
          <Text style={{ fontSize: 25 }}>🗺️</Text>
        </Pressable>

        {layersOpen && (
          <View style={{
            padding: 8,
            borderRadius: 18,
            backgroundColor: "#ffffff",
            gap: 6,
          }}>
            {(["normal", "cartoon", "satellite"] as const).map(value => (
              <Pressable
                key={value}
                accessibilityRole="button"
                disabled={!enabled || (value === "cartoon" && !google)}
                onPress={() => {
                  setMode(value);
                  setLayersOpen(false);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: mode === value ? accent : "#f5f5f5",
                  opacity: value === "cartoon" && !google ? 0.5 : 1,
                }}
              >
                <Text style={{
                  color: mode === value ? "#ffffff" : "#17221c",
                  fontWeight: "800",
                }}>
                  {value === "normal" ? "Normal" : value === "cartoon" ? "Team Cartoon" : "Satellite"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Friends and privacy"
          accessibilityState={{ expanded: panelOpen }}
          onPress={() => setPanelOpen(value => !value)}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#dddddd",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 25 }}>👥</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Centre map on my location"
        disabled={!enabled || !Maps || locating}
        onPress={() => void centreOnMyLocation()}
        style={{
          position: "absolute",
          right: 14,
          top: 12,
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#dddddd",
          opacity: locating ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: 25 }}>📍</Text>
      </Pressable>


      <View style={{
        position: "absolute",
        bottom: 12,
        left: 12,
        right: 12,
        alignItems: "flex-start",
      }}>


        {panelOpen && (
          <ScrollView
            style={{ maxHeight: 290, width: "100%", backgroundColor: "#ffffff", borderRadius: 18, marginTop: 8 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 14, gap: 12 }}
          >
            <Text style={styles.copy}>
              Opening this map never shares your location. Friends appear only when they choose to share.
            </Text>
            {!google && (
              <Text style={styles.copy}>
                Team Cartoon requires a separate map renderer on iPhone.
              </Text>
            )}
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
          </ScrollView>
        )}
      </View>
    </View>
  </View>;
}
