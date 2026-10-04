import Friends from "@/components/community/Friends";
import Messages from "@/components/community/Messages";
import Matchday from "@/components/community/Matchday";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, AppState, Image, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { loadAttendanceHistory } from "@/lib/attendanceHistory";
import { AVATARS, OFF, attendanceSummary, type Avatar, type CommunityState } from "@/lib/community/model";
import {
  communityAvailable,
  communityRequest,
  communityRestoreSession,
  communitySignIn,
  communitySignOut,
  communitySignUp,
  communityRequestPasswordReset,
  communityRequestEmailVerification,
  communityDeleteAccount,
} from "@/lib/community/api";
import type { CommunitySession } from "@/lib/community/session";
import {
  communityUnlockCapability,
  unlockCommunityLocally,
  type CommunityUnlockCapability,
} from "@/lib/community/localLock";
import { Action, styles } from "@/components/community/Controls";

const DRAFT_KEY = "ticket-frame.community-profile-draft.v1";
const AVATAR_PHOTO_KEY = "ticket-frame.community-avatar-photo.v1";
const BIOMETRIC_KEY = "ticket-frame.community-biometric-enabled.v1";
export default function CommunityScreen() {
  const {
    clubId,
    clubName,
    colour,
    experience,
    experienceId,
    fixtureId,
  } = useLocalSearchParams<{
    clubId: string;
    clubName: string;
    colour: string;
    experience?: string;
    experienceId?: string;
    fixtureId?: string;
  }>();
  const openedFromMatchdayExperience =
    experience === "active" && Boolean(experienceId) && Boolean(fixtureId);
  const [name, setName] = useState("");
  // The emoji value remains an internal server-compatibility fallback until
  // Community private image storage is added. It is no longer shown as the UI avatar.
  const [avatar, setAvatar] = useState<Avatar>("⚽");
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricChoiceMade, setBiometricChoiceMade] = useState(false);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
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
  const [authMode, setAuthMode] = useState<"signin" | "create">("signin");
  const [communityTab, setCommunityTab] =
    useState<"chats" | "supporters" | "map">("chats");
  const [showCommunitySettings, setShowCommunitySettings] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
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

  // "Active now" means the supporter is genuinely using Community
  // in the foreground. It is deliberately independent of matchday
  // GPS, presence leases and map visibility.
  useEffect(() => {
    if (!active) return;

    let foreground = AppState.currentState === "active";
    let timer: ReturnType<typeof setInterval> | null = null;

    const markActive = () => {
      if (!foreground) return;

      void communityRequest("/activity", {}).catch(() => {
        // Activity is best-effort presence for friends only.
        // It must never interrupt Community use.
      });
    };

    const stopHeartbeat = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startHeartbeat = () => {
      if (!foreground) return;

      markActive();

      if (!timer) {
        timer = setInterval(markActive, 2 * 60 * 1000);
      }
    };

    startHeartbeat();

    const subscription = AppState.addEventListener(
      "change",
      nextState => {
        foreground = nextState === "active";

        if (foreground) {
          startHeartbeat();
        } else {
          stopHeartbeat();
        }
      },
    );

    return () => {
      foreground = false;
      stopHeartbeat();
      subscription.remove();
    };
  }, [active]);
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await task(); } catch (error) { Alert.alert("Community", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [draft, records, storedAvatarPhoto, storedBiometric] = await Promise.all([
        AsyncStorage.getItem(DRAFT_KEY),
        loadAttendanceHistory(),
        AsyncStorage.getItem(AVATAR_PHOTO_KEY),
        AsyncStorage.getItem(BIOMETRIC_KEY),
      ]);

      if (cancelled) return;

      setSummary(attendanceSummary(records));
      setAvatarPhoto(storedAvatarPhoto);

      if (storedBiometric === "1" || storedBiometric === "0") {
        setBiometricChoiceMade(true);
        setBiometricEnabled(storedBiometric === "1");
      }

      if (draft) {
        const d = JSON.parse(draft);
        setName(typeof d.name === "string" ? d.name : "");
        if (AVATARS.includes(d.avatar)) setAvatar(d.avatar);
      }
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

    const capability = await communityUnlockCapability();
    setUnlockCapability(capability);

    if (!biometricChoiceMade) {
      setShowSecuritySetup(true);
    }

    if (next.communityEligible) {
      setStatus("Signed in to Community.");
    } else {
      setStatus("Signed in. Community eligibility still needs to be confirmed.");
    }
  }

  async function signUp() {
    const displayName = name.trim();

    if (!displayName || displayName.length > 40) {
      throw new Error("Choose a Community name of 1–40 characters.");
    }

    if (!email.trim()) {
      throw new Error("Enter your email address.");
    }

    if (password.length < 12 || password.length > 128) {
      throw new Error("Use a password between 12 and 128 characters.");
    }

    await AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ name: displayName, avatar }),
    );

    const next = await communitySignUp(email.trim(), password);
    setPassword("");
    await loadUnlockedCommunity(next);

    const capability = await communityUnlockCapability();
    setUnlockCapability(capability);
    setShowSecuritySetup(true);

    setStatus(
      "Community account created. Choose how you want to unlock Community on this iPhone.",
    );
  }

  async function storeAvatarPhoto(uri: string) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 512, height: 512 } }],
      {
        compress: 0.72,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    if (!result.base64) {
      throw new Error("Could not prepare that avatar photo.");
    }

    const dataUri = `data:image/jpeg;base64,${result.base64}`;

    await AsyncStorage.setItem(AVATAR_PHOTO_KEY, dataUri);
    setAvatarPhoto(dataUri);
  }

  async function chooseAvatarPhoto() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error(
        "Photo access is needed to choose a Community avatar.",
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    await storeAvatarPhoto(result.assets[0].uri);
    setStatus("Avatar photo selected.");
  }

  async function takeAvatarPhoto() {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      throw new Error(
        "Camera access is needed to take a Community avatar photo.",
      );
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      cameraType: ImagePicker.CameraType.front,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    await storeAvatarPhoto(result.assets[0].uri);
    setStatus("Avatar photo taken.");
  }

  async function removeAvatarPhoto() {
    await AsyncStorage.removeItem(AVATAR_PHOTO_KEY);
    setAvatarPhoto(null);
    setStatus("Avatar photo removed.");
  }

  async function finishSecuritySetup(useBiometrics: boolean) {
    if (useBiometrics && !unlockCapability.available) {
      throw new Error(
        "Face ID or Touch ID is not currently available on this iPhone.",
      );
    }

    await AsyncStorage.setItem(
      BIOMETRIC_KEY,
      useBiometrics ? "1" : "0",
    );

    setBiometricEnabled(useBiometrics);
    setBiometricChoiceMade(true);
    setShowSecuritySetup(false);

    setStatus(
      useBiometrics
        ? `${unlockCapability.label} will be offered for future Community unlocks.`
        : "Community password will be used for future Community unlocks.",
    );
  }

  async function requestPasswordReset(
    targetEmail = email,
  ) {
    const normalized = targetEmail.trim();

    if (!normalized) {
      throw new Error(
        "Enter your registered Community email address.",
      );
    }

    const result =
      await communityRequestPasswordReset(normalized);

    setStatus(
      result.message ||
        "If the account can be recovered, password reset instructions will be available when email delivery is configured.",
    );
  }

  async function requestEmailVerification() {
    const result =
      await communityRequestEmailVerification();

    if (result.emailVerified) {
      if (session) {
        setSession({
          ...session,
          emailVerified: true,
        });
      }

      setStatus("Your Community email is already verified.");
      return;
    }

    setStatus(
      result.message ||
        "Verification was requested. Email delivery still needs to be configured.",
    );
  }

  async function deleteCommunityAccount() {
    if (!deletePassword) {
      throw new Error(
        "Enter your Community password before deleting your account.",
      );
    }

    if (deleteConfirmation !== "DELETE") {
      throw new Error(
        'Type DELETE exactly to confirm permanent Community account deletion.',
      );
    }

    const result = await communityDeleteAccount(
      deletePassword,
      deleteConfirmation,
    );

    if (!result.deleted) {
      throw new Error(
        "Community account deletion was not completed.",
      );
    }

    setSession(null);
    setUnlocked(false);
    setPassword("");
    setDeletePassword("");
    setDeleteConfirmation("");
    setState({
      profile: null,
      preferences: OFF,
      safetyId: null,
      serverNow: 0,
    });

    setStatus(
      "Your Community account and associated Community data have been deleted.",
    );
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
    await AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ name: name.trim(), avatar }),
    );
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
  if (
    serviceConfigured &&
    session &&
    unlocked &&
    showSecuritySetup
  ) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 520,
              alignSelf: "center",
              gap: 14,
            }}
          >
            <Text
              accessibilityRole="header"
              style={[
                styles.title,
                {
                  color: colour || "#17221c",
                  textAlign: "center",
                  fontSize: 30,
                },
              ]}
            >
              COMMUNITY
            </Text>

            {avatarPhoto ? (
              <Image
                source={{ uri: avatarPhoto }}
                accessibilityLabel="Your Community avatar"
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  borderWidth: 3,
                  borderColor: colour || "#17221c",
                  alignSelf: "center",
                }}
              />
            ) : null}

            <Text
              style={[
                styles.heading,
                {
                  textAlign: "center",
                  marginTop: 8,
                },
              ]}
            >
              Future Community login
            </Text>

            <Text
              style={[
                styles.copy,
                {
                  textAlign: "center",
                  marginBottom: 6,
                },
              ]}
            >
              Choose how you want to unlock Community on this iPhone.
              Your Community password is never saved on the phone.
            </Text>

            {unlockCapability.available ? (
              <Action
                title={`Use ${unlockCapability.label}`}
                disabled={busy}
                onPress={() =>
                  void run(() => finishSecuritySetup(true))
                }
                colour={colour}
              />
            ) : (
              <Text
                style={[
                  styles.copy,
                  {
                    textAlign: "center",
                  },
                ]}
              >
                Face ID or Touch ID is not currently available.
              </Text>
            )}

            <Action
              title="Use Community Password"
              disabled={busy}
              onPress={() =>
                void run(() => finishSecuritySetup(false))
              }
              colour={colour}
            />

            {!!status ? (
              <Text
                accessibilityLiveRegion="polite"
                style={{ textAlign: "center" }}
              >
                {status}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (serviceConfigured && !session) {
    const creating = authMode === "create";

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 36,
          }}
        >
          <Action
            title="Back to Ticket Frame"
            onPress={() => router.back()}
            colour={colour}
          />

          <View
            style={{
              flex: 1,
              justifyContent: "center",
              width: "100%",
              maxWidth: 520,
              alignSelf: "center",
              paddingVertical: 28,
            }}
          >
            <Text
              accessibilityRole="header"
              style={[
                styles.title,
                {
                  color: colour || "#17221c",
                  textAlign: "center",
                  fontSize: 30,
                  marginBottom: 4,
                },
              ]}
            >
              COMMUNITY
            </Text>

            <Text
              style={[
                styles.copy,
                {
                  textAlign: "center",
                  marginBottom: 24,
                },
              ]}
            >
              {clubName || "Your club"} supporters
            </Text>

            <View
              style={{
                flexDirection: "row",
                borderWidth: 1,
                borderColor: colour || "#17221c",
                borderRadius: 12,
                padding: 3,
                marginBottom: 22,
              }}
            >
              <Text
                accessibilityRole="button"
                onPress={() => {
                  setAuthMode("signin");
                  setStatus("");
                }}
                style={{
                  flex: 1,
                  textAlign: "center",
                  paddingVertical: 11,
                  borderRadius: 9,
                  overflow: "hidden",
                  fontWeight: "900",
                  backgroundColor:
                    authMode === "signin"
                      ? colour || "#17221c"
                      : "transparent",
                  color:
                    authMode === "signin"
                      ? "#ffffff"
                      : colour || "#17221c",
                }}
              >
                SIGN IN
              </Text>

              <Text
                accessibilityRole="button"
                onPress={() => {
                  setAuthMode("create");
                  setStatus("");
                }}
                style={{
                  flex: 1,
                  textAlign: "center",
                  paddingVertical: 11,
                  borderRadius: 9,
                  overflow: "hidden",
                  fontWeight: "900",
                  backgroundColor:
                    authMode === "create"
                      ? colour || "#17221c"
                      : "transparent",
                  color:
                    authMode === "create"
                      ? "#ffffff"
                      : colour || "#17221c",
                }}
              >
                CREATE ACCOUNT
              </Text>
            </View>

            <Text style={[styles.heading, { textAlign: "center" }]}>
              {creating ? "Create your Community account" : "Welcome back"}
            </Text>

            <Text
              style={[
                styles.copy,
                {
                  textAlign: "center",
                  marginBottom: 16,
                },
              ]}
            >
              {creating
                ? "Choose the name other supporters will know you by."
                : "Sign in to your private Community account."}
            </Text>

            {creating ? (
              <TextInput
                accessibilityLabel="Community name"
                placeholder="Community name"
                value={name}
                maxLength={40}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                style={[styles.input, { marginBottom: 10 }]}
              />
            ) : null}

            {creating ? (
              <View
                style={{
                  alignItems: "center",
                  marginBottom: 18,
                  gap: 10,
                }}
              >
                {avatarPhoto ? (
                  <Image
                    source={{ uri: avatarPhoto }}
                    accessibilityLabel="Your Community avatar"
                    style={{
                      width: 116,
                      height: 116,
                      borderRadius: 58,
                      borderWidth: 3,
                      borderColor: colour || "#17221c",
                    }}
                  />
                ) : (
                  <View
                    accessibilityLabel="No Community avatar photo selected"
                    style={{
                      width: 116,
                      height: 116,
                      borderRadius: 58,
                      borderWidth: 3,
                      borderColor: colour || "#17221c",
                      backgroundColor: "#eee9dd",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 36,
                        fontWeight: "900",
                        color: colour || "#17221c",
                      }}
                    >
                      {name.trim().slice(0, 1).toUpperCase() || "?"}
                    </Text>
                  </View>
                )}

                <Text
                  style={[
                    styles.copy,
                    {
                      textAlign: "center",
                      fontWeight: "800",
                    },
                  ]}
                >
                  PROFILE PHOTO
                </Text>

                <View
                  style={{
                    width: "100%",
                    gap: 8,
                  }}
                >
                  <Action
                    title="Take Photo"
                    disabled={busy}
                    onPress={() => void run(takeAvatarPhoto)}
                    colour={colour}
                  />

                  <Action
                    title="Choose Photo"
                    disabled={busy}
                    onPress={() => void run(chooseAvatarPhoto)}
                    colour={colour}
                  />

                  {avatarPhoto ? (
                    <Action
                      title="Remove Photo"
                      disabled={busy}
                      onPress={() => void run(removeAvatarPhoto)}
                      colour={colour}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}

            <TextInput
              accessibilityLabel="Community email"
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { marginBottom: 10 }]}
            />

            <TextInput
              accessibilityLabel="Community password"
              placeholder={creating ? "Create password" : "Password"}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={creating ? "newPassword" : "password"}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { marginBottom: 14 }]}
            />

            <Action
              title={creating ? "Create Community account" : "Sign in"}
              disabled={
                busy ||
                !email.trim() ||
                !password ||
                (creating && !name.trim())
              }
              onPress={() =>
                void run(creating ? signUp : signIn)
              }
              colour={colour}
            />

            {!creating ? (
              <View style={{ marginTop: 8 }}>
                <Action
                  title="Forgot password?"
                  disabled={busy || !email.trim()}
                  onPress={() =>
                    void run(() => requestPasswordReset())
                  }
                  colour={colour}
                />
              </View>
            ) : (
              <Text
                style={[
                  styles.copy,
                  {
                    textAlign: "center",
                    marginTop: 12,
                  },
                ]}
              >
                Your email is private account information. Other supporters see your Community name, not your email address.
              </Text>
            )}

            {!!status ? (
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  textAlign: "center",
                  marginTop: 16,
                }}
              >
                {status}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
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

        {biometricEnabled && unlockCapability.available && (
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
          title="Forgot Community password"
          disabled={busy}
          onPress={() =>
            void run(() =>
              requestPasswordReset(session.email)
            )
          }
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

  if (active && !showCommunitySettings) {
    const tabColour = colour || "#17221c";
    const avatarLetter =
      state.profile?.displayName?.trim().slice(0, 1).toUpperCase() ||
      name.trim().slice(0, 1).toUpperCase() ||
      "?";

    const Tab = ({
      id,
      title,
    }: {
      id: "chats" | "supporters" | "map";
      title: string;
    }) => {
      const selected = communityTab === id;

      return (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          onPress={() => setCommunityTab(id)}
          style={{
            flex: 1,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            borderBottomWidth: 3,
            borderBottomColor: selected ? tabColour : "transparent",
          }}
        >
          <Text
            style={{
              color: selected ? tabColour : "#6f756f",
              fontWeight: selected ? "900" : "700",
              fontSize: 15,
            }}
          >
            {title}
          </Text>
        </Pressable>
      );
    };

    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f8f5ec",
        }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
            borderBottomWidth: 1,
            borderBottomColor: "#e3ded2",
            backgroundColor: "#f8f5ec",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            {avatarPhoto ? (
              <Image
                source={{ uri: avatarPhoto }}
                accessibilityLabel="Your Community avatar"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  borderWidth: 2,
                  borderColor: tabColour,
                }}
              />
            ) : (
              <View
                accessibilityLabel="Your Community avatar"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  borderWidth: 2,
                  borderColor: tabColour,
                  backgroundColor: "#eee9dd",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: tabColour,
                    fontSize: 19,
                    fontWeight: "900",
                  }}
                >
                  {avatarLetter}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text
                accessibilityRole="header"
                style={{
                  color: tabColour,
                  fontSize: 24,
                  fontWeight: "900",
                }}
              >
                Community
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  color: "#687069",
                  fontSize: 13,
                  marginTop: 1,
                }}
              >
                {state.profile?.displayName || name} · {clubName}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Community settings"
              onPress={() => setShowCommunitySettings(true)}
              style={({ pressed }) => ({
                minWidth: 44,
                minHeight: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#d8d3c7",
                backgroundColor: pressed ? "#ebe6da" : "#ffffff",
              })}
            >
              <Text
                style={{
                  color: tabColour,
                  fontSize: 22,
                  fontWeight: "900",
                }}
              >
                ⚙
              </Text>
            </Pressable>
          </View>

          <View
            accessibilityRole="tablist"
            style={{
              flexDirection: "row",
              marginTop: 10,
            }}
          >
            <Tab id="chats" title="Chats" />
            <Tab id="supporters" title="Supporters" />
            <Tab id="map" title="Map" />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {communityTab === "chats" && (
            <Messages
              enabled={active}
              busy={busy}
              run={run}
            />
          )}

          {communityTab === "supporters" && (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 36,
                gap: 12,
              }}
            >
              <Friends
                enabled={active}
                busy={busy}
                run={run}
                experienceActive={openedFromMatchdayExperience}
              />
            </ScrollView>
          )}

          {communityTab === "map" && (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 36,
                gap: 12,
              }}
            >
              <Matchday
                enabled={active && state.preferences.locationVisible}
                clubId={clubId}
                busy={busy}
                run={run}
              />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
      {active && showCommunitySettings ? (
        <Action
          title="Back to Community"
          onPress={() => setShowCommunitySettings(false)}
          colour={colour}
        />
      ) : (
        <Action
          title="Back to Ticket Frame"
          onPress={() => router.back()}
          colour={colour}
        />
      )}
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colour || "#17221c" }]}
      >
        {active && showCommunitySettings ? "COMMUNITY SETTINGS" : "COMMUNITY"}
      </Text>
      <Text>{clubName || "Choose a favourite club"} supporters</Text>
      {openedFromMatchdayExperience ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colour || "#17221c",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <Text style={{ fontWeight: "900", color: "#17221c" }}>
            MATCHDAY EXPERIENCE COMMUNITY
          </Text>
          <Text style={[styles.copy, { marginTop: 4 }]}>
            Your original Matchday Experience is active. Community uses that
            Experience window until you close it or it automatically ends.
          </Text>
        </View>
      ) : null}
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
            title="Forgot password"
            disabled={busy || !email.trim()}
            onPress={() =>
              void run(() => requestPasswordReset())
            }
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

          {!session.emailVerified ? (
            <>
              <Text style={styles.copy}>
                Your Community email has not been verified yet.
                Verification is separate from Community eligibility.
              </Text>
              <Action
                title="Request email verification"
                disabled={busy}
                onPress={() =>
                  void run(requestEmailVerification)
                }
                colour={colour}
              />
            </>
          ) : (
            <Text style={styles.copy}>
              Email verified.
            </Text>
          )}
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

          <Text style={styles.heading}>
            Delete Community account
          </Text>
          <Text style={styles.copy}>
            This permanently deletes your Community account and
            associated Community profile, friendships, messages,
            blocks, reports and presence data. It does not delete
            Football Ticket Frame or your football history.
          </Text>

          <TextInput
            accessibilityLabel="Community password for account deletion"
            placeholder="Community password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            style={styles.input}
          />

          <TextInput
            accessibilityLabel="Type DELETE to confirm Community account deletion"
            placeholder="Type DELETE to confirm"
            autoCapitalize="characters"
            autoCorrect={false}
            value={deleteConfirmation}
            onChangeText={setDeleteConfirmation}
            style={styles.input}
          />

          <Action
            title="Permanently delete Community account"
            disabled={
              busy ||
              !deletePassword ||
              deleteConfirmation !== "DELETE"
            }
            onPress={() =>
              void run(deleteCommunityAccount)
            }
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
      <View style={{ alignItems: "center", gap: 8 }}>
        {avatarPhoto ? (
          <Image
            source={{ uri: avatarPhoto }}
            accessibilityLabel="Your Community avatar"
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              borderWidth: 3,
              borderColor: colour || "#17221c",
            }}
          />
        ) : (
          <View
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              borderWidth: 3,
              borderColor: colour || "#17221c",
              backgroundColor: "#eee9dd",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "900",
                color: colour || "#17221c",
              }}
            >
              {name.trim().slice(0, 1).toUpperCase() || "?"}
            </Text>
          </View>
        )}

        <View style={{ width: "100%", gap: 8 }}>
          <Action
            title="Take New Photo"
            disabled={busy}
            onPress={() => void run(takeAvatarPhoto)}
            colour={colour}
          />
          <Action
            title="Choose Photo"
            disabled={busy}
            onPress={() => void run(chooseAvatarPhoto)}
            colour={colour}
          />
        </View>
      </View>
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

      <Text>Allow eligible matchday photo sharing</Text>
      <Switch
        accessibilityLabel="Eligible matchday photo sharing"
        value={state.preferences.photoSharing}
        disabled={busy || !active}
        onValueChange={photoSharing => void run(() => privacy({ photoSharing }))}
      />

      <Text style={styles.copy}>
        Photo permission does not make your photo library public.
        Photo sharing will be available during normal eligible matchday Community
        (within 2 miles, from 2 hours before kickoff until 4 hours after) or during
        your active Matchday Experience. Camera Roll photos will have to prove they
        were taken during the qualifying matchday window.
      </Text>

      <Text style={styles.copy}>
        Location is checked only when you deliberately use a matchday feature.
        Joining Community does not automatically put you on a map.
      </Text>

      {!!state.safetyId && (
        <Text style={styles.copy}>Community Safety ID: {state.safetyId}</Text>
      )}
      {/* Social Community lives in the messaging-style Chats / Supporters / Map home. */}
      {/* COMMUNITY_FEATURES */}
      {!!status && <Text accessibilityLiveRegion="polite">{status}</Text>}
    </ScrollView>
  </SafeAreaView>;
}
