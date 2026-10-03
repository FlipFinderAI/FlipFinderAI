import Friends from "@/components/community/Friends";
import Messages from "@/components/community/Messages";
import Matchday from "@/components/community/Matchday";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, AppState, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadAttendanceHistory } from "@/lib/attendanceHistory";
import { AVATARS, OFF, attendanceSummary, type Avatar, type CommunityState } from "@/lib/community/model";
import {
  communityAvailable,
  communityRequest,
  communityRestoreSession,
  communitySignIn,
  communitySignOut,
  communitySignUp,
} from "@/lib/community/api";
import type { CommunitySession } from "@/lib/community/session";
import {
  communityUnlockCapability,
  unlockCommunityLocally,
  type CommunityUnlockCapability,
} from "@/lib/community/localLock";
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
  const [session, setSession] = useState<CommunitySession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [unlockCapability, setUnlockCapability] = useState<CommunityUnlockCapability>({
    available: false,
    label: "Biometrics",
  });
  const serviceConfigured = communityAvailable();
  const connected =
    serviceConfigured &&
    unlocked &&
    Boolean(session?.communityEligible);
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
      if (serviceConfigured) {
        const restored = await communityRestoreSession();
        if (cancelled) return;
        setSession(restored);
        if (restored?.email) setEmail(restored.email);

        if (restored) {
          const capability = await communityUnlockCapability();
          if (cancelled) return;
          setUnlockCapability(capability);
        }
      }
    })().catch(error => { if (!cancelled) setStatus(error.message || "Could not load Community."); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [serviceConfigured]);
  async function loadUnlockedCommunity(next: CommunitySession) {
    setSession(next);
    setUnlocked(true);

    if (next.communityEligible) {
      const current = await communityRequest<CommunityState>("/me");
      setState(current);
      if (current.profile) {
        setName(current.profile.displayName);
        setAvatar(current.profile.avatar);
      }
    }
  }

  async function unlockWithDevice() {
    const success = await unlockCommunityLocally();

    if (!success) {
      setStatus(
        unlockCapability.available
          ? "Community stayed locked."
          : "No enrolled biometric unlock is available. Use your Community password.",
      );
      return;
    }

    if (!session) return;
    await loadUnlockedCommunity(session);
    setStatus(`Community unlocked with ${unlockCapability.label}.`);
  }

  async function unlockWithPassword() {
    if (!session) return;
    if (!password) throw new Error("Enter your Community password.");

    const next = await communitySignIn(session.email, password);
    setPassword("");
    await loadUnlockedCommunity(next);
    setStatus("Community unlocked.");
  }

  async function signIn() {
    if (!email.trim()) throw new Error("Enter your registered email address.");
    if (!password) throw new Error("Enter your Community password.");

    const next = await communitySignIn(email.trim(), password);
    setPassword("");
    await loadUnlockedCommunity(next);

    if (next.communityEligible) {
      setStatus("Signed in to Community.");
    } else {
      setStatus("Signed in. Community eligibility still needs to be confirmed.");
    }
  }

  async function signUp() {
    if (!email.trim()) throw new Error("Enter your email address.");
    if (password.length < 12 || password.length > 128) {
      throw new Error("Use a password between 12 and 128 characters.");
    }

    const next = await communitySignUp(email.trim(), password);
    setPassword("");
    await loadUnlockedCommunity(next);
    setStatus("Account created securely. Community eligibility still needs to be confirmed.");
  }

  async function signOut() {
    await communitySignOut();
    setSession(null);
    setUnlocked(false);
    setPassword("");
    setState({
      profile: null,
      preferences: OFF,
      safetyId: null,
      serverNow: 0,
    });
    setStatus("Signed out of Community on this iPhone.");
  }

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState => {
      if (nextState !== "active" && session) {
        setUnlocked(false);
        setPassword("");
      }
    });

    return () => subscription.remove();
  }, [session]);

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
  if (serviceConfigured && session && !unlocked) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, gap: 14 }}
      >
        <Action title="Back to Ticket Frame" onPress={() => router.back()} colour={colour} />

        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colour || "#17221c" }]}
        >
          COMMUNITY
        </Text>

        <Text style={styles.heading}>Community locked</Text>
        <Text style={styles.copy}>
          Your Community session is remembered securely on this iPhone.
          Unlock it to see your Community profile, friends, messages and matchday features.
        </Text>

        <Text>{session.email}</Text>

        {unlockCapability.available && (
          <Action
            title={`Unlock with ${unlockCapability.label}`}
            disabled={busy}
            onPress={() => void run(unlockWithDevice)}
            colour={colour}
          />
        )}

        <Text style={styles.copy}>
          You can also unlock by entering your Community password.
          The password is checked by the Community service and is not saved on this iPhone.
        </Text>

        <TextInput
          accessibilityLabel="Community password to unlock"
          placeholder="Community password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <Action
          title="Unlock with Community password"
          disabled={busy || !password}
          onPress={() => void run(unlockWithPassword)}
          colour={colour}
        />

        <Action
          title="Sign out of Community"
          disabled={busy}
          onPress={() => void run(signOut)}
          colour={colour}
        />

        {!!status && (
          <Text accessibilityLiveRegion="polite">{status}</Text>
        )}
      </ScrollView>
    </SafeAreaView>;
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Action title="Back to Ticket Frame" onPress={() => router.back()} colour={colour} />
      <Text accessibilityRole="header" style={[styles.title, { color: colour || "#17221c" }]}>COMMUNITY</Text>
      <Text>{clubName || "Choose a favourite club"} supporters</Text>
      {!serviceConfigured && (
        <Text style={styles.copy}>
          Community online service is not configured yet. You can prepare your profile here, but nothing is sent online.
        </Text>
      )}

      {serviceConfigured && !session && (
        <View style={{ gap: 10 }}>
          <Text style={styles.heading}>Community sign in</Text>
          <Text style={styles.copy}>
            Community has its own private account. Football Ticket Frame itself does not require an account.
          </Text>
          <TextInput
            accessibilityLabel="Community email"
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Community password"
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Action
            title="Sign in to Community"
            disabled={busy}
            onPress={() => void run(signIn)}
            colour={colour}
          />
          <Action
            title="Create Community account"
            disabled={busy}
            onPress={() => void run(signUp)}
            colour={colour}
          />
          <Text style={styles.copy}>
            Your password is never saved on this iPhone. After sign-in, only the revocable Community session is stored securely.
          </Text>
        </View>
      )}

      {serviceConfigured && session && (
        <View style={{ gap: 8 }}>
          <Text style={styles.heading}>Community account</Text>
          <Text>{session.email}</Text>
          {!session.communityEligible && (
            <Text style={styles.copy}>
              You are signed in, but Community access is not active until eligibility has been confirmed.
            </Text>
          )}
          <Action
            title="Sign out of Community"
            disabled={busy}
            onPress={() => void run(signOut)}
            colour={colour}
          />
        </View>
      )}

      <Text style={styles.copy}>
        Your chosen name, avatar and favourite club identify you in Community.
        Games attended and grounds visited are shared only if you choose to share them.
        Your tickets, Ticket Frame photos and account details stay private.
      </Text>
      <Text style={styles.heading}>Your public profile</Text>
      {!!state.profile?.friendId && (
        <Text accessibilityLabel="Your Community Friend ID">
          Your Friend ID: {state.profile.friendId}
        </Text>
      )}
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
