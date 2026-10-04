import HistoryStadiumNativeMap from "@/components/history/HistoryStadiumNativeMap";
import { useEffect, useState } from "react";
import { AppState, Text, View } from "react-native";
import * as Location from "expo-location";
import { communityRequest } from "@/lib/community/api";
import { eligible, type VerifiedFixture } from "@/lib/community/eligibility";
import type { Presence, PublicProfile } from "@/lib/community/model";
import { Action } from "./Controls";
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
 return (
  <View style={{ gap: 16 }}>
   <View>
    <Text
     accessibilityRole="header"
     style={{
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "900",
      color: "#17221c",
     }}
    >
     Matchday Map
    </Text>

    <Text
     style={{
      marginTop: 2,
      fontSize: 13,
      lineHeight: 18,
      color: "#777168",
     }}
    >
     Meet eligible supporters from your club around the stadium.
    </Text>
   </View>

   <View
    style={{
     backgroundColor: "#ffffff",
     borderRadius: 18,
     borderWidth: 1,
     borderColor: "#e7e2d8",
     padding: 15,
     gap: 12,
    }}
   >
    <View
     style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
     }}
    >
     <View style={{ flex: 1 }}>
      <Text
       style={{
        fontSize: 17,
        fontWeight: "900",
        color: "#17221c",
       }}
      >
       Matchday visibility
      </Text>

      <Text
       style={{
        marginTop: 3,
        fontSize: 12,
        lineHeight: 17,
        color: "#777168",
       }}
      >
       Within 2 miles · 2 hours before kickoff to 4 hours after
      </Text>
     </View>

     <View
      style={{
       paddingHorizontal: 10,
       paddingVertical: 6,
       borderRadius: 999,
       backgroundColor: presence
        ? "#e7f4e5"
        : "#f1eee6",
      }}
     >
      <Text
       style={{
        fontSize: 11,
        fontWeight: "900",
        color: presence
         ? "#35653a"
         : "#777168",
       }}
      >
       {presence ? "ELIGIBLE" : "PRIVATE"}
      </Text>
     </View>
    </View>

    <Text
     style={{
      fontSize: 13,
      lineHeight: 19,
      color: "#68645c",
     }}
    >
     Only same-club supporters who also qualify can discover you.
     A check lasts at most two minutes and does not continuously
     share your location.
    </Text>

    <Action
     title={
      presence
       ? "Recheck Matchday Eligibility"
       : "Check Matchday Eligibility"
     }
     disabled={!enabled || busy}
     onPress={() => void run(check)}
    />

    {!!message && (
     <View
      style={{
       borderRadius: 12,
       backgroundColor: "#f6f3ec",
       paddingHorizontal: 12,
       paddingVertical: 10,
      }}
     >
      <Text
       accessibilityLiveRegion="polite"
       style={{
        fontSize: 12,
        lineHeight: 17,
        color: "#68645c",
       }}
      >
       {message}
      </Text>
     </View>
    )}
   </View>

   {presence && enabled && (
    <View style={{ gap: 12 }}>
     <View
      style={{
       backgroundColor: "#ffffff",
       borderRadius: 18,
       borderWidth: 1,
       borderColor: "#e7e2d8",
       overflow: "hidden",
      }}
     >
      <View
       style={{
        paddingHorizontal: 15,
        paddingTop: 14,
        paddingBottom: 12,
       }}
      >
       <View
        style={{
         flexDirection: "row",
         alignItems: "center",
         justifyContent: "space-between",
         gap: 10,
        }}
       >
        <View style={{ flex: 1 }}>
         <Text
          style={{
           fontSize: 17,
           fontWeight: "900",
           color: "#17221c",
          }}
          numberOfLines={1}
         >
          {presence.stadium}
         </Text>

         <Text
          style={{
           marginTop: 2,
           fontSize: 12,
           color: "#777168",
          }}
         >
          Stadium meeting point
         </Text>
        </View>

        {presence.onMap && (
         <View
          style={{
           paddingHorizontal: 9,
           paddingVertical: 5,
           borderRadius: 999,
           backgroundColor: "#e7f4e5",
          }}
         >
          <Text
           style={{
            fontSize: 10,
            fontWeight: "900",
            color: "#35653a",
           }}
          >
           ON MAP
          </Text>
         </View>
        )}
       </View>
      </View>

      <View style={{ height: 280 }}>
       <HistoryStadiumNativeMap
        style={{ flex: 1 }}
        showUserLocation={false}
        mapType="standard"
        stadiums={[
         {
          name: presence.stadium,
          latitude: presence.latitude,
          longitude: presence.longitude,
          club: "Matchday stadium presence",
          visits: 0,
         },
        ]}
       />
      </View>

      <View
       style={{
        padding: 14,
        gap: 10,
       }}
      >
       <Text
        style={{
         fontSize: 12,
         lineHeight: 17,
         color: "#777168",
        }}
       >
        The pin is the stadium meeting point, never your exact GPS
        position. Joining the map is a separate choice.
       </Text>

       {!presence.onMap ? (
        <Action
         title="Add Me to Matchday Map"
         disabled={!presence || !enabled || busy}
         onPress={() => void run(async () => {
          await communityRequest("/map", {});
          setPresence(current =>
           current
            ? { ...current, onMap: true }
            : null
          );
         })}
        />
       ) : (
        <Action
         title="Leave Matchday Map"
         disabled={!enabled || busy}
         onPress={() => void run(async () => {
          await communityRequest(
           "/map",
           undefined,
           "DELETE",
          );
          setPresence(current =>
           current
            ? { ...current, onMap: false }
            : null
          );
          setPeople([]);
         })}
        />
       )}

       <Action
        title="Refresh Supporters on Map"
        disabled={!presence || !enabled || busy}
        onPress={() => void run(async () => {
         const result = await communityRequest<{
          people: typeof people;
         }>("/map");
         setPeople(result.people);
        })}
       />
      </View>
     </View>

     <View style={{ gap: 8 }}>
      <Text
       style={{
        fontSize: 20,
        fontWeight: "900",
        color: "#17221c",
       }}
      >
       Supporters Here
      </Text>

      {people.length === 0 ? (
       <View
        style={{
         backgroundColor: "#ffffff",
         borderRadius: 16,
         borderWidth: 1,
         borderColor: "#e7e2d8",
         padding: 16,
       }}
       >
        <Text
         style={{
          fontSize: 13,
          lineHeight: 19,
          color: "#777168",
          textAlign: "center",
         }}
        >
         No supporters are shown yet. Refresh the map to see eligible
         same-club supporters who have chosen to join.
        </Text>
       </View>
      ) : (
       people.map(person => {
        const initial =
         person.profile.displayName
          .trim()
          .charAt(0)
          .toUpperCase() ||
         person.profile.avatar ||
         "?";

        return (
         <View
          key={person.profile.id}
          style={{
           flexDirection: "row",
           alignItems: "center",
           backgroundColor: "#ffffff",
           borderRadius: 16,
           borderWidth: 1,
           borderColor: "#e7e2d8",
           padding: 12,
           gap: 11,
          }}
         >
          <View
           style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#eee9dd",
           }}
          >
           <Text
            style={{
             fontSize: 18,
             fontWeight: "900",
             color: "#17221c",
            }}
           >
            {initial}
           </Text>
          </View>

          <View style={{ flex: 1 }}>
           <Text
            style={{
             fontSize: 15,
             fontWeight: "900",
             color: "#17221c",
            }}
            numberOfLines={1}
           >
            {person.profile.displayName}
           </Text>

           <Text
            style={{
             marginTop: 2,
             fontSize: 12,
             color: "#777168",
            }}
            numberOfLines={1}
           >
            {person.stadium}
           </Text>
          </View>
         </View>
        );
       })
      )}
     </View>

     <Action
      title="End Live Visibility"
      disabled={!enabled || busy}
      onPress={() => void run(async () => {
       await communityRequest(
        "/presence",
        undefined,
        "DELETE",
       );
       setPresence(null);
       setPeople([]);
       setMessage("Live visibility ended.");
      })}
     />
    </View>
   )}

   {!presence && (
    <View
     style={{
      backgroundColor: "#f6f3ec",
      borderRadius: 16,
      padding: 15,
     }}
    >
     <Text
      style={{
       fontSize: 12,
       lineHeight: 18,
       color: "#777168",
       textAlign: "center",
      }}
     >
      You are not visible on the Matchday Map.
     </Text>
    </View>
   )}
  </View>
 );
}
