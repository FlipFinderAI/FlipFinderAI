import { useEffect, useState } from "react";
import { Linking, Text, TextInput, View } from "react-native";
import { communityRequest } from "@/lib/community/api";
import type { PublicProfile, Relationship } from "@/lib/community/model";
import { Action, styles } from "./Controls";
export default function Friends({ enabled, busy, run }: { enabled: boolean; busy: boolean; run(task: () => Promise<void>): Promise<void> }) {
 const [relationships, setRelationships] = useState<Relationship[]>([]);
 const [people, setPeople] = useState<PublicProfile[]>([]);
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
 function profile(p: PublicProfile) {
   return <View key={p.id} style={{ gap: 10 }}>
     <Text style={{ fontWeight: "700" }}>{p.avatar} {p.displayName}</Text>
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
   <Action title="Find visible supporters" disabled={!enabled || busy} onPress={() => void run(async () => {
     const result = await communityRequest<{ people: { profile: PublicProfile }[] }>("/discover");
     setPeople(result.people.map(p => p.profile)); setNotice(result.people.length ? "Only eligible same-club supporters are shown." : "No supporters are visible. Check matchday eligibility first.");
   })} />
   {enabled && people.map(p => <View key={p.id} style={{ gap: 10 }}>{profile(p)}
     <Action title={`Add ${p.displayName} as a friend`} disabled={busy} onPress={() => void run(async () => {
       await communityRequest("/friend-request", { target: p.id }); setNotice("Friend request sent."); await refresh();
     })} />
   </View>)}
   <Action title="Refresh friends and pending requests" disabled={!enabled || busy} onPress={() => void run(refresh)} />
   {enabled && <><Text style={styles.heading}>Pending requests</Text>
   {relationships.filter(r => r.status === "pending").map(r => <View key={r.id} style={{ gap: 10 }}>{profile(r.profile)}
     <Text>{r.incoming ? "Incoming request" : "Request sent"}</Text>
     {r.incoming && <Action title="Accept" disabled={busy} onPress={() => void run(() => relationship(r.id, "accept"))} />}
     <Action title={r.incoming ? "Decline" : "Cancel request"} disabled={busy} onPress={() => void run(() => relationship(r.id, "decline"))} />
   </View>)}
   <Text style={styles.heading}>Friends</Text>
   {relationships.filter(r => r.status === "accepted").map(r => <View key={r.id} style={{ gap: 10 }}>{profile(r.profile)}
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
