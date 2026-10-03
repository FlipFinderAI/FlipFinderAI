import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadAttendanceHistory } from "@/lib/attendanceHistory";
import { AVATARS, OFF, attendanceSummary, type Avatar, type CommunityState } from "@/lib/community/model";
import { communityAvailable, communityRequest } from "@/lib/community/api";
import { Action, styles } from "@/components/community/Controls";

const DRAFT_KEY = "ticket-frame.community-profile-draft.v1";
export default function CommunityScreen() {
  const { clubId, clubName, colour } = useLocalSearchParams<{ clubId: string; clubName: string; colour: string }>();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<Avatar>("⚽");
  const [summary, setSummary] = useState({ gamesAttended: 0, groundsVisited: [] as string[] });
  const [state, setState] = useState<CommunityState>({ profile: null, preferences: OFF, serverNow: 0 });
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const connected = communityAvailable();
  const sameClub = state.profile?.clubId === clubId;
  const active = connected && sameClub && state.preferences.enabled;
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await task(); } catch (error) { Alert.alert("Community", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [draft, records] = await Promise.all([AsyncStorage.getItem(DRAFT_KEY), loadAttendanceHistory()]);
      if (cancelled) return;
      setSummary(attendanceSummary(records));
      if (draft) { const d = JSON.parse(draft); setName(typeof d.name === "string" ? d.name : ""); if (AVATARS.includes(d.avatar)) setAvatar(d.avatar); }
      if (connected) {
        const current = await communityRequest<CommunityState>("/me");
        if (cancelled) return;
        setState(current);
        if (current.profile) { setName(current.profile.displayName); setAvatar(current.profile.avatar); }
      }
    })().catch(error => { if (!cancelled) setStatus(error.message || "Could not load Community."); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [connected]);
  async function saveProfile() {
    if (!name.trim() || name.trim().length > 40) throw new Error("Choose a display name of 1–40 characters.");
    if (!clubId || !clubName || clubName === "Your Club") throw new Error("Choose your favourite club on Home first.");
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ name: name.trim(), avatar }));
    if (connected) {
      setState(await communityRequest<CommunityState>("/profile", { displayName: name.trim(), avatar, clubId, ...summary }));
      setStatus("Public profile saved. Any previous matchday visibility has ended.");
    } else setStatus("Profile draft saved on this iPhone. Nothing has been shared.");
  }
  async function privacy(enabled: boolean, locationVisible: boolean) {
    setState(await communityRequest<CommunityState>("/preferences", { enabled, locationVisible }));
    setStatus("Privacy choices saved. Matchday presence has ended; check eligibility to appear again.");
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Action title="Back to Ticket Frame" onPress={() => router.back()} colour={colour} />
      <Text accessibilityRole="header" style={[styles.title, { color: colour || "#17221c" }]}>COMMUNITY</Text>
      <Text>{clubName || "Choose a favourite club"} supporters</Text>
      {!connected && <Text style={styles.copy}>Community sign-in and the online service are not connected yet. You can prepare your profile here. Discovery, friends and messages stay unavailable until they are connected.</Text>}
      <Text style={styles.copy}>Only your chosen name, avatar, favourite club, games attended and grounds visited are public when you join. Your tickets, Ticket Frame photos and account details stay private.</Text>
      <Text style={styles.heading}>Your public profile</Text>
      <TextInput accessibilityLabel="Community display name" placeholder="Choose a display name" value={name} maxLength={40} onChangeText={setName} style={styles.input} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{AVATARS.map(a => <Action key={a} title={`${a}${avatar === a ? " ✓" : ""}`} onPress={() => setAvatar(a)} colour={colour} />)}</View>
      <Text>{summary.gamesAttended} games attended · {summary.groundsVisited.length} grounds visited</Text>
      <Text>{summary.groundsVisited.join(" · ") || "No confirmed grounds yet"}</Text>
      <Action title={connected ? "Save public profile" : "Save profile draft"} disabled={busy || !loaded} onPress={() => void run(saveProfile)} colour={colour} />
      <Text style={styles.heading}>Privacy</Text>
      {!sameClub && state.profile && <Text>Save your profile with your current favourite club before using Community.</Text>}
      <Text>Join Community — off by default</Text>
      <Switch accessibilityLabel="Join Community" value={state.preferences.enabled} disabled={busy || !connected || !sameClub}
        onValueChange={enabled => void run(() => privacy(enabled, enabled && state.preferences.locationVisible))} />
      <Text>Visible to eligible same-club supporters on matchday</Text>
      <Switch accessibilityLabel="Matchday location visibility" value={state.preferences.locationVisible} disabled={busy || !active}
        onValueChange={visible => void run(() => privacy(true, visible))} />
      <Text style={styles.copy}>Location is checked only when you ask, while the app is open. Joining Community does not add you to the Matchday Map.</Text>
      {/* COMMUNITY_FEATURES */}
      {!!status && <Text accessibilityLiveRegion="polite">{status}</Text>}
    </ScrollView>
  </SafeAreaView>;
}
