import Friends from "@/components/community/Friends";
import Messages from "@/components/community/Messages";
import Matchday from "@/components/community/Matchday";
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
  const [state, setState] = useState<CommunityState>({
    profile: null,
    preferences: OFF,
    safetyId: null,
    serverNow: 0,
  });
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
  async function privacy(patch: Partial<CommunityState["preferences"]>) {
    const preferences = { ...state.preferences, ...patch };

    if (!preferences.enabled) {
      preferences.locationVisible = false;
      preferences.shareGames = false;
      preferences.shareGrounds = false;
      preferences.photoSharing = false;
    }

    setState(await communityRequest<CommunityState>("/preferences", preferences));
    setStatus("Community privacy choices saved. Matchday presence has ended.");
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Action title="Back to Ticket Frame" onPress={() => router.back()} colour={colour} />
      <Text accessibilityRole="header" style={[styles.title, { color: colour || "#17221c" }]}>COMMUNITY</Text>
      <Text>{clubName || "Choose a favourite club"} supporters</Text>
      {!connected && <Text style={styles.copy}>Community sign-in and the online service are not connected yet. You can prepare your profile here. Discovery, friends and messages stay unavailable until they are connected.</Text>}
      <Text style={styles.copy}>
        Your chosen name, avatar and favourite club identify you in Community.
        Games attended and grounds visited are shared only if you choose to share them.
        Your tickets, Ticket Frame photos and account details stay private.
      </Text>
      <Text style={styles.heading}>Your public profile</Text>
      <TextInput accessibilityLabel="Community display name" placeholder="Choose a display name" value={name} maxLength={40} onChangeText={setName} style={styles.input} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{AVATARS.map(a => <Action key={a} title={`${a}${avatar === a ? " ✓" : ""}`} onPress={() => setAvatar(a)} colour={colour} />)}</View>
      <Text>{summary.gamesAttended} games attended · {summary.groundsVisited.length} grounds visited</Text>
      <Text>{summary.groundsVisited.join(" · ") || "No confirmed grounds yet"}</Text>
      <Action title={connected ? "Save public profile" : "Save profile draft"} disabled={busy || !loaded} onPress={() => void run(saveProfile)} colour={colour} />
      <Text style={styles.heading}>Community & Privacy</Text>

      {!sameClub && state.profile && (
        <Text>Save your profile with your current favourite club before using Community.</Text>
      )}

      <Text>Join Community — off by default</Text>
      <Switch
        accessibilityLabel="Join Community"
        value={state.preferences.enabled}
        disabled={busy || !connected || !sameClub}
        onValueChange={enabled => void run(() => privacy({ enabled }))}
      />

      <Text>Share my games-attended total</Text>
      <Switch
        accessibilityLabel="Share games attended"
        value={state.preferences.shareGames}
        disabled={busy || !active}
        onValueChange={shareGames => void run(() => privacy({ shareGames }))}
      />

      <Text>Share the grounds I have visited</Text>
      <Switch
        accessibilityLabel="Share grounds visited"
        value={state.preferences.shareGrounds}
        disabled={busy || !active}
        onValueChange={shareGrounds => void run(() => privacy({ shareGrounds }))}
      />

      <Text>Allow matchday location features</Text>
      <Switch
        accessibilityLabel="Matchday location visibility"
        value={state.preferences.locationVisible}
        disabled={busy || !active}
        onValueChange={locationVisible => void run(() => privacy({ locationVisible }))}
      />

      <Text>Allow me to send photos during Matchday Experience</Text>
      <Switch
        accessibilityLabel="Matchday Experience photo sharing"
        value={state.preferences.photoSharing}
        disabled={busy || !active}
        onValueChange={photoSharing => void run(() => privacy({ photoSharing }))}
      />

      <Text style={styles.copy}>
        Photo permission does not make your photo library public.
        Photos cannot be sent through normal Community or normal matchday discovery.
        Photo sending will require an active Matchday Experience.
      </Text>

      <Text style={styles.copy}>
        Location is checked only when you deliberately use a matchday feature.
        Joining Community does not automatically put you on a map.
      </Text>

      {!!state.safetyId && (
        <Text style={styles.copy}>Community Safety ID: {state.safetyId}</Text>
      )}
      <Matchday enabled={active && state.preferences.locationVisible} clubId={clubId} busy={busy} run={run} />
      <Friends enabled={active} busy={busy} run={run} />
      <Messages enabled={active} busy={busy} run={run} />
      {/* COMMUNITY_FEATURES */}
      {!!status && <Text accessibilityLiveRegion="polite">{status}</Text>}
    </ScrollView>
  </SafeAreaView>;
}
