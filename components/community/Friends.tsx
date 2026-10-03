import { useEffect, useState } from "react";
import { Linking, Text, TextInput, View } from "react-native";
import { communityRequest } from "@/lib/community/api";
import type { FriendType, PublicProfile, Relationship } from "@/lib/community/model";
import { Action, styles } from "./Controls";
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
 const [people, setPeople] = useState<PublicProfile[]>([]);
 const [knownQuery, setKnownQuery] = useState("");
 const [knownPeople, setKnownPeople] = useState<PublicProfile[]>([]);
 const [report, setReport] = useState<PublicProfile | null>(null);
 const [reason, setReason] = useState("");
 const [notice, setNotice] = useState("");
 const [submittedReport, setSubmittedReport] = useState<{
  reportId: string;
  reportedSafetyId: string | null;
  contact: string;
  displayName: string;
  reason: string;
 } | null>(null);
 useEffect(() => {
  setPeople([]);
  setKnownQuery("");
  setKnownPeople([]);
  setRelationships([]);
  setReport(null);
  setSubmittedReport(null);
 }, [enabled]);
 async function refresh() {
   const result = await communityRequest<{ relationships: Relationship[] }>("/friends"); setRelationships(result.relationships);
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
   return <View key={p.id} style={{ gap: 10 }}>
     <Text style={{ fontWeight: "700" }}>{p.avatar} {p.displayName}</Text>
     {!!p.friendId && <Text>Friend ID: {p.friendId}</Text>}
     <Text>{p.gamesAttended} games · {p.groundsVisited.length} grounds</Text>
     <Text>{p.groundsVisited.join(" · ")}</Text>
     <Action title={`Block ${p.displayName}`} disabled={busy} onPress={() => void run(async () => {
       await communityRequest("/block", { target: p.id }); setPeople(list => list.filter(x => x.id !== p.id)); await refresh();
     })} />
     <Action title={`Report ${p.displayName}`} disabled={busy} onPress={() => { setReport(p); setReason(""); }} />
   </View>;
 }
 return <>
   <Text style={styles.heading}>Supporters and friends</Text>
   <Text style={styles.copy}>
   Know another supporter? Search their exact Friend ID or exact Community name.
   Only supporters with the same favourite club can be found.
  </Text>

  <TextInput
   style={styles.input}
   accessibilityLabel="Friend ID or exact Community name"
   placeholder="Friend ID or exact name"
   autoCapitalize="none"
   maxLength={80}
   value={knownQuery}
   onChangeText={setKnownQuery}
  />

  <Action
   title="Find known supporter"
   disabled={!enabled || busy || knownQuery.trim().length < 2}
   onPress={() => void run(async () => {
    const query = knownQuery.trim();
    const result = await communityRequest<{ people: PublicProfile[] }>(
     `/friend-search?q=${encodeURIComponent(query)}`
    );
    setKnownPeople(result.people);
    setNotice(
     result.people.length
      ? "Exact same-club supporter match found."
      : "No same-club supporter matched that exact Friend ID or name."
    );
   })}
  />

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

  <Text style={styles.heading}>Matchday supporters</Text>

  <Action
   title={
     experienceActive
       ? "Find Matchday Experience supporters"
       : "Find visible supporters"
   }
   disabled={!enabled || busy}
   onPress={() => void run(async () => {
     const result = await communityRequest<{
       people: { profile: PublicProfile }[];
     }>(
       experienceActive
         ? "/experience/supporters"
         : "/discover"
     );

     setPeople(result.people.map(p => p.profile));

     setNotice(
       result.people.length
         ? experienceActive
           ? "Same-club supporters in this active Matchday Experience are shown. Location sharing is not required."
           : "Only eligible same-club supporters are shown."
         : experienceActive
           ? "No other same-club supporters are currently in this Matchday Experience."
           : "No supporters are visible. Check matchday eligibility first."
     );
   })}
 />
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
   <Action title="Refresh friends and pending requests" disabled={!enabled || busy} onPress={() => void run(refresh)} />
   {enabled && <><Text style={styles.heading}>Pending requests</Text>
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
   <Text style={styles.heading}>Friends</Text>
   {relationships.filter(r => r.status === "accepted").map(r => <View key={r.id} style={{ gap: 10 }}>{profile(r.profile)}
    <Text>{friendTypeLabel(r.friendType)}</Text>
     <Action title="Unfriend" disabled={busy} onPress={() => void run(() => relationship(r.id, "unfriend"))} />
   </View>)}</>}
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
