import { useEffect, useState } from "react";
import {
  AppState,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { communityRequest } from "@/lib/community/api";
import type { FriendType, PublicProfile, Relationship } from "@/lib/community/model";
import { Action, styles } from "./Controls";
type BlockedContact = Pick<PublicProfile, "id" | "displayName" | "friendId">;

export default function Friends({
 enabled,
 busy,
 run,
 experienceActive = false,
}: {
 enabled: boolean;
 busy: boolean;
 run(task: () => Promise<void>): Promise<void>;
 experienceActive?: boolean;
}) {
 const [relationships, setRelationships] = useState<Relationship[]>([]);
 const [blocked, setBlocked] = useState<BlockedContact[]>([]);
 const [blockedLoaded, setBlockedLoaded] = useState(false);
 const [people, setPeople] = useState<PublicProfile[]>([]);
 const [knownQuery, setKnownQuery] = useState("");
 const [knownPeople, setKnownPeople] = useState<PublicProfile[]>([]);
 const [report, setReport] = useState<PublicProfile | null>(null);
 const [reason, setReason] = useState("");
 const [notice, setNotice] = useState("");
 const [knownNotice, setKnownNotice] = useState("");
 const [nearbyNotice, setNearbyNotice] = useState("");
 const [activeSupporterAction, setActiveSupporterAction] = useState<
   "known" | "nearby" | "blocked" | null
 >(null);

 const runSupporterAction = (
   action: "known" | "nearby" | "blocked",
   task: () => Promise<void>,
 ) => {
   if (busy || activeSupporterAction !== null) return;
   setActiveSupporterAction(action);
   void run(async () => {
     try {
       await task();
     } finally {
       setActiveSupporterAction(null);
     }
   });
 };
 const [submittedReport, setSubmittedReport] = useState<{
  reportId: string;
  reportedSafetyId: string | null;
  contact: string;
  displayName: string;
  reason: string;
 } | null>(null);
 useEffect(() => {
  setBlocked([]);
  setBlockedLoaded(false);
  setNotice("");
  setKnownNotice("");
  setNearbyNotice("");
  setPeople([]);
  setKnownQuery("");
  setKnownPeople([]);
  setRelationships([]);
  setReport(null);
  setSubmittedReport(null);
 }, [enabled]);
 useEffect(() => {
  if (!enabled) return;

  let alive = true;
  let refreshing = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const syncRelationships = async () => {
   if (
    !alive ||
    refreshing ||
    AppState.currentState !== "active"
   ) {
    return;
   }

   refreshing = true;

   try {
    await Promise.allSettled([
     communityRequest<{ relationships: Relationship[] }>("/friends").then(result => {
      if (alive) setRelationships(result.relationships);
     }),
     communityRequest<{ blocked: BlockedContact[] }>("/blocked").then(result => {
      if (alive) {
       setBlocked(result.blocked);
       setBlockedLoaded(true);
      }
     }),
    ]);
   } catch {
    // Passive foreground refresh is best effort.
   } finally {
    refreshing = false;
   }
  };

  const stopTimer = () => {
   if (timer) {
    clearInterval(timer);
    timer = null;
   }
  };

  const startTimer = () => {
   stopTimer();
   void syncRelationships();
   timer = setInterval(
    () => void syncRelationships(),
    15 * 1000,
   );
  };

  if (AppState.currentState === "active") {
   startTimer();
  }

  const subscription = AppState.addEventListener(
   "change",
   nextState => {
    if (nextState === "active") {
     startTimer();
    } else {
     stopTimer();
    }
   },
  );

  return () => {
   alive = false;
   stopTimer();
   subscription.remove();
  };
 }, [enabled]);

 async function refresh() {
  const result = await communityRequest<{ relationships: Relationship[] }>("/friends");
  setRelationships(result.relationships);
 }

 async function refreshBlocked() {
  const result = await communityRequest<{ blocked: BlockedContact[] }>("/blocked");
  setBlocked(result.blocked);
  setBlockedLoaded(true);
 }

 async function relationship(id: string, action: string) {
   await communityRequest("/relationship", { id, action }); await refresh();
 }
 async function requestFriend(
  person: PublicProfile,
  friendType: FriendType,
  lookup?: string,
 ) {
  await communityRequest("/friend-request", {
   target: person.id,
   friendType,
   ...(lookup ? { lookup } : {}),
  });

  setNotice(
   friendType === "full_time"
    ? `Full-Time Friend request sent to ${person.displayName}.`
    : `Matchday Friend request sent to ${person.displayName}.`
  );

  await refresh();
 }

 function friendTypeLabel(friendType: FriendType) {
  return friendType === "full_time" ? "Full-Time Friend" : "Matchday Friend";
 }

 function profile(p: PublicProfile) {
  const initial =
   p.displayName.trim().charAt(0).toUpperCase() ||
   p.avatar ||
   "?";

  return (
   <View
    key={p.id}
    style={{
     backgroundColor: "#ffffff",
     borderRadius: 18,
     borderWidth: 1,
     borderColor: "#e7e2d8",
     padding: 14,
     gap: 12,
    }}
   >
    <View
     style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
     }}
    >
     <View
      style={{
       width: 52,
       height: 52,
       borderRadius: 26,
       alignItems: "center",
       justifyContent: "center",
       backgroundColor: "#eee9dd",
      }}
     >
      <Text
       style={{
        fontSize: 21,
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
        fontSize: 17,
        fontWeight: "900",
        color: "#17221c",
       }}
       numberOfLines={1}
      >
       {p.displayName}
      </Text>

      {!!p.friendId && (
       <Text
        style={{
         marginTop: 2,
         fontSize: 12,
         color: "#777168",
        }}
       >
        Friend ID {p.friendId}
       </Text>
      )}
     </View>
    </View>

    <View
     style={{
      flexDirection: "row",
      gap: 8,
     }}
    >
     <View
      style={{
       flex: 1,
       backgroundColor: "#f6f3ec",
       borderRadius: 12,
       paddingHorizontal: 12,
       paddingVertical: 9,
      }}
     >
      <Text
       style={{
        fontSize: 17,
        fontWeight: "900",
        color: "#17221c",
       }}
      >
       {p.gamesAttended}
      </Text>
      <Text
       style={{
        marginTop: 1,
        fontSize: 11,
        color: "#777168",
       }}
      >
       games
      </Text>
     </View>

     <View
      style={{
       flex: 1,
       backgroundColor: "#f6f3ec",
       borderRadius: 12,
       paddingHorizontal: 12,
       paddingVertical: 9,
      }}
     >
      <Text
       style={{
        fontSize: 17,
        fontWeight: "900",
        color: "#17221c",
       }}
      >
       {p.groundsVisited.length}
      </Text>
      <Text
       style={{
        marginTop: 1,
        fontSize: 11,
        color: "#777168",
       }}
      >
       grounds
      </Text>
     </View>
    </View>

    {p.groundsVisited.length > 0 && (
     <Text
      style={{
       fontSize: 12,
       lineHeight: 17,
       color: "#68645c",
      }}
      numberOfLines={2}
     >
      {p.groundsVisited.join(" · ")}
     </Text>
    )}

    <View
     style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      paddingTop: 2,
     }}
    >
     <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Block ${p.displayName}`}
      disabled={busy}
      onPress={() => void run(async () => {
       await communityRequest("/block", {
        target: p.id,
       });
       setPeople(list =>
        list.filter(x => x.id !== p.id)
       );
       setKnownPeople(list => list.filter(x => x.id !== p.id));
       await refresh();
      })}
      style={({ pressed }) => ({
       opacity: busy ? 0.4 : pressed ? 0.55 : 1,
      })}
     >
      <Text
       style={{
        fontSize: 12,
        fontWeight: "700",
        color: "#777168",
       }}
      >
       Block
      </Text>
     </Pressable>

     <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Report ${p.displayName}`}
      disabled={busy}
      onPress={() => {
       setReport(p);
       setReason("");
      }}
      style={({ pressed }) => ({
       opacity: busy ? 0.4 : pressed ? 0.55 : 1,
      })}
     >
      <Text
       style={{
        fontSize: 12,
        fontWeight: "700",
        color: "#9a4c43",
       }}
      >
       Report
      </Text>
     </Pressable>
    </View>
   </View>
  );
 }

 return <>
   <View style={{ marginBottom: 4 }}>
   <Text
    accessibilityRole="header"
    style={{
     fontSize: 30,
     lineHeight: 36,
     fontWeight: "900",
     color: "#17221c",
    }}
   >
    Supporters
   </Text>
   <Text
    style={{
     marginTop: 2,
     fontSize: 13,
     color: "#777168",
    }}
   >
    Find and manage supporters from your club.
   </Text>
  </View>
   <Text
   style={{
    marginTop: 8,
    fontSize: 15,
    fontWeight: "800",
    color: "#17221c",
   }}
  >
   Find someone you know
  </Text>
  <Text
   style={{
    fontSize: 13,
    lineHeight: 18,
    color: "#777168",
   }}
  >
   Search by Friend ID, Community username or part of a name. Only supporters
   with your favourite club can be found.
  </Text>

  <TextInput
   style={styles.input}
   accessibilityLabel="Friend ID, username or supporter name"
   placeholder="Friend ID, username or name"
   autoCapitalize="none"
   maxLength={80}
   value={knownQuery}
   onChangeText={setKnownQuery}
  />

  <Action
   title="Find known supporter"
   disabled={!enabled || knownQuery.trim().length < 2}
   onPress={() => runSupporterAction("known", async () => {
    const query = knownQuery.trim();
    const result = await communityRequest<{ people: PublicProfile[] }>(
     `/friend-search?q=${encodeURIComponent(query)}`
    );
    setKnownPeople(result.people);
    setKnownNotice(
     result.people.length
      ? "Matching same-club supporters found."
      : "No matching same-club supporters found."
    );
   })}
  />

  {!!knownNotice && (
   <Text accessibilityLiveRegion="polite" style={styles.copy}>{knownNotice}</Text>
  )}
  {enabled && knownPeople.map(p => (
   <View key={`known-${p.id}`} style={{ gap: 10 }}>
    {profile(p)}
    <Action
     title={`Request ${p.displayName} as Matchday Friend`}
     disabled={busy}
     onPress={() => void run(() =>
      requestFriend(p, "matchday", knownQuery.trim())
     )}
    />
    <Action
     title={`Request ${p.displayName} as Full-Time Friend`}
     disabled={busy}
     onPress={() => void run(() =>
      requestFriend(p, "full_time", knownQuery.trim())
     )}
    />
   </View>
  ))}

  <View style={{ marginTop: 12 }}>
   <Text
    style={{
     fontSize: 20,
     fontWeight: "900",
     color: "#17221c",
    }}
   >
    Nearby Supporters
   </Text>
   <Text
    style={{
     marginTop: 3,
     fontSize: 13,
     lineHeight: 18,
     color: "#777168",
    }}
   >
    Discover eligible supporters from your club who are not already
    friends or waiting on a request.
   </Text>
  </View>

  <Action
   title={
     experienceActive
       ? "Find Experience supporters"
       : "Find nearby supporters"
   }
   disabled={!enabled}
   onPress={() => runSupporterAction("nearby", async () => {
     const result = await communityRequest<{
       people: { profile: PublicProfile }[];
     }>(
       experienceActive
         ? "/experience/supporters"
         : "/discover"
     );

     setPeople(result.people.map(p => p.profile));

     setNearbyNotice(
       result.people.length
         ? experienceActive
           ? "Same-club supporters in this active Matchday Experience are shown. Location sharing is not required."
           : "Only eligible nearby same-club supporters who are not already friends or pending are shown."
         : experienceActive
           ? "No new same-club supporters are currently in this Matchday Experience."
           : "No new nearby supporters are visible right now."
     );
   })}
 />
   {!!nearbyNotice && (
   <Text accessibilityLiveRegion="polite" style={styles.copy}>{nearbyNotice}</Text>
  )}
  {enabled && people.map(p => <View key={p.id} style={{ gap: 10 }}>{profile(p)}
     <Action
     title={`Request ${p.displayName} as Matchday Friend`}
     disabled={busy}
     onPress={() => void run(() => requestFriend(p, "matchday"))}
    />
    <Action
     title={`Request ${p.displayName} as Full-Time Friend`}
     disabled={busy}
     onPress={() => void run(() => requestFriend(p, "full_time"))}
    />
   </View>)}
    {enabled && <><Text
   style={{
    marginTop: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#17221c",
   }}
  >
   Pending Requests
  </Text>
   {relationships.filter(r => r.status === "pending").map(r => <View key={r.id} style={{ gap: 10 }}>{profile(r.profile)}
     <Text>
     {r.incoming ? "Incoming request" : "Request sent"} · {friendTypeLabel(r.friendType)}
    </Text>
     {r.incoming && <Action
     title={`Accept ${friendTypeLabel(r.friendType)}`}
     disabled={busy}
     onPress={() => void run(() => relationship(r.id, "accept"))}
    />}
     <Action title={r.incoming ? "Decline" : "Cancel request"} disabled={busy} onPress={() => void run(() => relationship(r.id, "decline"))} />
   </View>)}
   <Text
   style={{
    marginTop: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#17221c",
   }}
  >
   Friends
  </Text>
   {relationships.filter(r => r.status === "accepted").map(r => <View key={r.id} style={{ gap: 10 }}>{profile(r.profile)}
    <Text>{friendTypeLabel(r.friendType)}</Text>
     <Action title="Unfriend" disabled={busy} onPress={() => void run(() => relationship(r.id, "unfriend"))} />
   </View>)}</>}
   {enabled && <View style={{ gap: 10 }}>
    <Text accessibilityRole="header" style={styles.heading}>Blocked Contacts</Text>
    <Text style={styles.copy}>
     Unblocking lets you find a supporter and send a new friend request.
     It does not restore friendship or location sharing. Existing messages are kept.
    </Text>
    <Action
      title="Refresh blocked contacts"
      disabled={!enabled}
      onPress={() => runSupporterAction("blocked", refreshBlocked)}
    />
    {!blockedLoaded && <Text>Refresh to load blocked contacts if they do not appear.</Text>}
    {blockedLoaded && blocked.length === 0 && <Text>You have no blocked contacts.</Text>}
    {blocked.map(p => <View key={`blocked-${p.id}`} style={{ gap: 8 }}>
     <Text style={styles.copy}>{p.displayName}</Text>
     {!!p.friendId && <Text>Friend ID {p.friendId}</Text>}
     <Action
      title={`Unblock ${p.displayName}`}
      disabled={busy}
      onPress={() => void run(async () => {
       await communityRequest("/unblock", { target: p.id });
       setBlocked(list => list.filter(x => x.id !== p.id));
       setKnownQuery(p.friendId || p.displayName);
       setKnownPeople([]);
       setNotice(`${p.displayName} unblocked. Use Find known supporter above to send a fresh request if they are available. They will need to accept it.`);
       await refresh();
      })}
     />
    </View>)}
   </View>}
   {enabled && report && <><Text>Report {report.displayName}</Text>
     <TextInput style={styles.input} accessibilityLabel="Report reason" placeholder="What happened?" multiline maxLength={1000} value={reason} onChangeText={setReason} />
     <Action title="Submit report" disabled={busy || !reason.trim()} onPress={() => void run(async () => {
       const submittedReason = reason.trim();
       const submittedName = report.displayName;

       const result = await communityRequest<{
        ok: boolean;
        reportId: string;
        reportedSafetyId: string | null;
        contact: string;
       }>("/report", {
        target: report.id,
        reason: submittedReason,
        context: "Community supporter profile",
       });

       setSubmittedReport({
        reportId: result.reportId,
        reportedSafetyId: result.reportedSafetyId,
        contact: result.contact,
        displayName: submittedName,
        reason: submittedReason,
       });

       setReport(null);
       setReason("");
       setNotice(
        `Report submitted. Reference ${result.reportId}. You can also email Ticket Frame support.`
       );
     })} />
     <Action title="Cancel report" onPress={() => setReport(null)} />
   </>}
   {submittedReport && <>
     <Text style={styles.heading}>Report submitted</Text>
     <Text accessibilityLabel="Report reference">
       Report reference: {submittedReport.reportId}
     </Text>
     {!!submittedReport.reportedSafetyId && (
       <Text accessibilityLabel="Reported supporter safety ID">
         Supporter Safety ID: {submittedReport.reportedSafetyId}
       </Text>
     )}
     <Action
       title="Email report to Ticket Frame support"
       disabled={busy}
       onPress={() => void run(async () => {
         const subject = `Ticket Frame Community report ${submittedReport.reportId}`;

         const body = [
          "Ticket Frame Community safety report",
          "",
          `Report reference: ${submittedReport.reportId}`,
          `Reported supporter: ${submittedReport.displayName}`,
          `Supporter Safety ID: ${submittedReport.reportedSafetyId || "Unavailable"}`,
          "",
          "Reason:",
          submittedReport.reason,
          "",
          "This email intentionally contains no supporter location data.",
         ].join("\n");

         const url =
          `mailto:${encodeURIComponent(submittedReport.contact)}` +
          `?subject=${encodeURIComponent(subject)}` +
          `&body=${encodeURIComponent(body)}`;

         await Linking.openURL(url);
       })}
     />
     <Action
       title="Close report details"
       disabled={busy}
       onPress={() => setSubmittedReport(null)}
     />
   </>}

   {!!notice && <Text accessibilityLiveRegion="polite">{notice}</Text>}
 </>;
}
