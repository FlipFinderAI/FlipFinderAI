import HistoryStadiumNativeMap from "@/components/history/HistoryStadiumNativeMap";
import { useEffect, useState } from "react";
import { AppState, Text, View } from "react-native";
import * as Location from "expo-location";
import { communityRequest } from "@/lib/community/api";
import { eligible, type VerifiedFixture } from "@/lib/community/eligibility";
import type { Presence, PublicProfile } from "@/lib/community/model";
import { Action, styles } from "./Controls";
export default function Matchday({ enabled, clubId, busy, run }: {
 enabled: boolean; clubId: string; busy: boolean; run(task: () => Promise<void>): Promise<void>;
}) {
 const [people, setPeople] = useState<{ profile: PublicProfile; stadium: string; latitude: number; longitude: number; expiresAt: number }[]>([]);
 const [presence, setPresence] = useState<Presence | null>(null);
 const [leaseMs, setLeaseMs] = useState(0);
 const [message, setMessage] = useState("");
 useEffect(() => { if (!enabled) setPresence(null); }, [enabled]);
 useEffect(() => {
   const listener = AppState.addEventListener("change", state => {
     setPresence(null);
     // Best effort immediate withdrawal; server leases also expire within two minutes.
     if (state !== "active" && enabled) void communityRequest("/presence", undefined, "DELETE").catch(() => {});
   });
   return () => { listener.remove(); if (enabled) void communityRequest("/presence", undefined, "DELETE").catch(() => {}); };
 }, [enabled]);
 async function check() {
   setPresence(null);
   // Withdraw any old lease before checking anew, including denied permissions/errors.
   await communityRequest("/presence", undefined, "DELETE");
   const permission = await Location.requestForegroundPermissionsAsync();
   if (!permission.granted) throw new Error("Allow location while using the app to check matchday eligibility.");
   const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
   const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy ?? Infinity };
   const candidates = await communityRequest<{ fixtures: VerifiedFixture[]; serverNow: number }>("/fixtures");
   const fixture = candidates.fixtures.find(f => eligible(f, clubId, candidates.serverNow, coords));
   if (!fixture) throw new Error("No verified match is eligible here now. You must be within 2 miles, from 2 hours before kickoff until 4 hours after. Unresolved grounds or kickoff times cannot qualify.");
   const result = await communityRequest<{ presence: Presence; serverNow: number }>("/presence", { fixtureId: fixture.id, ...coords });
   setLeaseMs(Math.max(0, result.presence.expiresAt - result.serverNow));
   setPresence(result.presence);
   setMessage(`Visible at ${result.presence.stadium}. Recheck within two minutes to remain visible.`);
 }
 useEffect(() => {
   if (!presence) return;
   // Client expiry uses a monotonic elapsed lease, never a client wall-clock eligibility decision.
   const timer = setTimeout(() => { setPresence(null); setMessage("Visibility ended. Check eligibility again to rejoin."); }, leaseMs);
   return () => clearTimeout(timer);
 }, [presence, leaseMs]);
 return <>
   <Text style={styles.heading}>Matchday discovery</Text>
   <Text>Within 2 miles · kickoff −2 hours to +4 hours. Only same-club supporters who also qualify can see you. Visibility lasts at most two minutes per check.</Text>
   <Action title="Check matchday eligibility" disabled={!enabled || busy} onPress={() => void run(check)} />
   {!!message && <Text>{message}</Text>}
   <Text style={styles.heading}>Matchday Map</Text>
   <Text>The marker represents the stadium, never a supporter's GPS point. Joining this map is a separate choice.</Text>
   <Action title="Add Me to Matchday Map" disabled={!presence || !enabled || busy || presence.onMap} onPress={() => void run(async () => {
     await communityRequest("/map", {}); setPresence(p => p ? { ...p, onMap: true } : null);
   })} />
   <Action title="Leave Matchday Map" disabled={!enabled || busy} onPress={() => void run(async () => {
     await communityRequest("/map", undefined, "DELETE"); setPresence(p => p ? { ...p, onMap: false } : null); setPeople([]);
   })} />
   <Action title="Refresh Matchday Map" disabled={!presence || !enabled || busy} onPress={() => void run(async () => {
     const result = await communityRequest<{ people: typeof people }>("/map"); setPeople(result.people);
   })} />
   {presence && enabled && <View style={{ height: 260 }}>
     <HistoryStadiumNativeMap style={{ flex: 1 }} showUserLocation={false} mapType="standard"
       stadiums={[{ name: presence.stadium, latitude: presence.latitude, longitude: presence.longitude, club: "Matchday stadium presence", visits: 0 }]} />
   </View>}
   {presence && enabled && people.map(person => <Text key={person.profile.id}>{person.profile.avatar} {person.profile.displayName} · {person.stadium}</Text>)}
   <Action title="End live visibility" disabled={!enabled || busy} onPress={() => void run(async () => {
     await communityRequest("/presence", undefined, "DELETE"); setPresence(null); setPeople([]); setMessage("Live visibility ended.");
   })} />
 </>;
}
