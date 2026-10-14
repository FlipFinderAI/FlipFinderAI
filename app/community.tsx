import Friends from "@/components/community/Friends";
import Messages from "@/components/community/Messages";
import Matchday from "@/components/community/Matchday";
import { useEffect, useState, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, AppState, Image, Modal, useWindowDimensions, Pressable, ScrollView, KeyboardAvoidingView, Platform, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { homeStadiumForClub } from "@/lib/homeStadiumIdentity";
import { stadiumPhotoForId } from "@/lib/homeStadiumPhotos";
import { loadAttendanceHistory } from "@/lib/attendanceHistory";
import { AVATARS, OFF, attendanceSummary, type Avatar, type CommunityState } from "@/lib/community/model";
import {
  communityAvailable,
  communityRequest,
  communityCheckUsername,
  communityCheckSignupUsername,
  communityRegisterUsername,
  communityGetRegisteredUsername,
  communityRestoreSession,
  communityConfirmEligibility,
  communitySignIn,
  communitySignOut,
  communitySignUp,
  communityRequestPasswordReset,
  communityRequestEmailVerification,
  communityDeleteAccount,
} from "@/lib/community/api";
import type { CommunitySession } from "@/lib/community/session";
import {
  getRememberedCommunityAccount,
  rememberCommunityAccount,
  clearRememberedCommunityAccount,
} from "@/lib/community/session";
import {
  communityUnlockCapability,
  unlockCommunityLocally,
  type CommunityUnlockCapability,
} from "@/lib/community/localLock";
import { Action, styles } from "@/components/community/Controls";

const DRAFT_KEY = "ticket-frame.community-profile-draft.v1";
const AVATAR_PHOTO_KEY = "ticket-frame.community-avatar-photo.v1";
const COMMUNITY_BACKGROUND_KEY = "ticket-frame.community-background.v1";
const COMMUNITY_BACKGROUND_PHOTO_KEY = "ticket-frame.community-background-photo.v1";

type CommunityBackgroundChoice = "club" | "mine" | "none";

function CommunityBackgroundImage({
  choice,
  clubPhoto,
  personalPhoto,
}: {
  choice: CommunityBackgroundChoice;
  clubPhoto: ReturnType<typeof stadiumPhotoForId>;
  personalPhoto: string | null;
}) {
  const source =
    choice === "club"
      ? clubPhoto
      : choice === "mine" && personalPhoto
        ? { uri: personalPhoto }
        : null;

  if (!source) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Image
        source={source}
        resizeMode="cover"
        style={{ width: "100%", height: "100%" }}
      />
      <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(248,245,236,0.62)" }} />
    </View>
  );
}

const SETUP_KEY = "ticket-frame.community-setup.v1:";
const setupKey = (email: string) => SETUP_KEY + email.trim().toLowerCase();

const autoUnlockKey = (email: string) => "ticket-frame.community-auto-unlock.v1:" + email.trim().toLowerCase();

const BIOMETRIC_KEY = "ticket-frame.community-biometric-enabled.v1";

type CommunityLoginMode = "stay" | "biometric" | "password";

const loginModeKey = (email: string) =>
  "ticket-frame.community-login-mode.v1:" + email.trim().toLowerCase();



function CircularPhotoEditor({
  uri,
  onCancel,
  onSave,
}: {
  uri: string;
  onCancel: () => void;
  onSave: (uri: string) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 48, 340);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    Image.getSize(
      uri,
      (width, height) => {
        if (active) setDimensions({ width, height });
      },
      () => {
        if (active) {
          Alert.alert("Photo error", "Could not read photo dimensions.");
        }
      }
    );

    return () => {
      active = false;
    };
  }, [uri]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const baseScale = Math.max(
    size / dimensions.width,
    size / dimensions.height
  );

  const imageWidth = dimensions.width * baseScale;
  const imageHeight = dimensions.height * baseScale;

  const clampX = (value: number, zoom: number) =>
    Math.max(
      -(imageWidth * zoom - size) / 2,
      Math.min((imageWidth * zoom - size) / 2, value)
    );

  const clampY = (value: number, zoom: number) =>
    Math.max(
      -(imageHeight * zoom - size) / 2,
      Math.min((imageHeight * zoom - size) / 2, value)
    );

  const pan = Gesture.Pan()
    .onUpdate(e => {
      const limitX = (imageWidth * scale.value - size) / 2;
      const limitY = (imageHeight * scale.value - size) / 2;
      x.value = Math.max(-limitX, Math.min(limitX, savedX.value + e.translationX));
      y.value = Math.max(-limitY, Math.min(limitY, savedY.value + e.translationY));
    })
    .onEnd(() => {
      savedX.value = x.value;
      savedY.value = y.value;
    });

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      const zoom = Math.max(1, Math.min(5, savedScale.value * e.scale));
      scale.value = zoom;
      const limitX = (imageWidth * zoom - size) / 2;
      const limitY = (imageHeight * zoom - size) / 2;
      x.value = Math.max(-limitX, Math.min(limitX, x.value));
      y.value = Math.max(-limitY, Math.min(limitY, y.value));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedX.value = x.value;
      savedY.value = y.value;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const zoom = scale.value;
      const visibleWidth = size / (baseScale * zoom);
      const visibleHeight = size / (baseScale * zoom);

      const originX =
        dimensions.width / 2 -
        visibleWidth / 2 -
        x.value / (baseScale * zoom);

      const originY =
        dimensions.height / 2 -
        visibleHeight / 2 -
        y.value / (baseScale * zoom);

      const cropSize = Math.max(
        1,
        Math.floor(Math.min(visibleWidth, visibleHeight))
      );

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: Math.max(0, Math.min(dimensions.width - cropSize, Math.round(originX))),
              originY: Math.max(0, Math.min(dimensions.height - cropSize, Math.round(originY))),
              width: cropSize,
              height: cropSize,
            },
          },
          { resize: { width: 512, height: 512 } },
        ],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      await onSave(result.uri);
    } catch (error) {
      Alert.alert("Photo error", error instanceof Error ? error.message : "Could not crop photo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#101510", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: "white", fontSize: 23, fontWeight: "800", textAlign: "center", marginBottom: 12 }}>
          Position Your Photo
        </Text>
        <Text style={{ color: "#ddd", textAlign: "center", marginBottom: 24 }}>
          Drag to reposition. Pinch to zoom.
        </Text>

        <View style={{ width: size, height: size, alignSelf: "center", overflow: "hidden", borderRadius: size / 2, borderWidth: 3, borderColor: "white" }}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
              <Animated.Image
                source={{ uri }}

                style={[
                  { width: imageWidth, height: imageHeight },
                  animatedStyle,
                ]}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        <Text style={{ color: "#aaa", textAlign: "center", marginTop: 18 }}>
          Everything inside the circle becomes your profile photo.
        </Text>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 30 }}>
          <Pressable
            onPress={onCancel}
            disabled={saving}
            style={{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#aaa" }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => void save()}
            disabled={saving}
            style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: "#e9e3ce" }}
          >
            <Text style={{ color: "#17221c", textAlign: "center", fontWeight: "800" }}>
              {saving ? "Saving..." : "Use Photo"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

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
  const communityStadium = homeStadiumForClub(clubId, clubName || "");
  const communityClubPhoto = stadiumPhotoForId(communityStadium?.id);
  const openedFromMatchdayExperience =
    experience === "active" && Boolean(experienceId) && Boolean(fixtureId);
  const [name, setName] = useState("");
  // The emoji value remains an internal server-compatibility fallback until
  // Community private image storage is added. It is no longer shown as the UI avatar.
  const [avatar, setAvatar] = useState<Avatar>("⚽");
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [communityBackground, setCommunityBackground] =
    useState<"club" | "mine" | "none">("none");
  const [communityBackgroundPhoto, setCommunityBackgroundPhoto] =
    useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricChoiceMade, setBiometricChoiceMade] = useState(false);
  const [automaticSignIn, setAutomaticSignIn] = useState(false);

  const [loginMode, setLoginMode] = useState<CommunityLoginMode>("password");

  const [needsSetup, setNeedsSetup] = useState(true);
  const [age16Declared, setAge16Declared] = useState(false);
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
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationSentAt, setVerificationSentAt] = useState(0);
  const [verificationNow, setVerificationNow] = useState(Date.now());

  useEffect(() => {
    if (!verificationSentAt) return;
    const timer = setInterval(() => setVerificationNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [verificationSentAt]);

  const verificationCooldown =
    Math.max(0, Math.ceil((verificationSentAt + 60000 - verificationNow) / 1000));
  const [session, setSession] = useState<CommunitySession | null>(null);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("");
  const [signupUsernameCheck, setSignupUsernameCheck] = useState<{
    username: string;
    status: "checking" | "available" | "taken" | "error";
  } | null>(null);
  const [registeredUsername, setRegisteredUsername] = useState("");
  const [usernameLookupFailed, setUsernameLookupFailed] = useState(false);

  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "create">("create");
  const [rememberedAccount, setRememberedAccount] = useState<string | null>(null);
  const [communityTab, setCommunityTab] =
    useState<"chats" | "supporters" | "map">("chats");
  const [showCommunitySettings, setShowCommunitySettings] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const attemptedAutomaticUnlock = useRef(false);
  const lockGeneration = useRef(0);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [unlockCapability, setUnlockCapability] = useState<CommunityUnlockCapability>({
    available: false,
    label: "Biometrics",
  });
  const serviceConfigured = communityAvailable();
  const connected = serviceConfigured && unlocked && Boolean(session?.emailVerified) && Boolean(session?.communityEligible);
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
      const [draft, records, storedAvatarPhoto, storedBiometric, storedBackground, storedBackgroundPhoto] = await Promise.all([
        AsyncStorage.getItem(DRAFT_KEY),
        loadAttendanceHistory(),
        AsyncStorage.getItem(AVATAR_PHOTO_KEY),
        AsyncStorage.getItem(BIOMETRIC_KEY),
        AsyncStorage.getItem(COMMUNITY_BACKGROUND_KEY),
        AsyncStorage.getItem(COMMUNITY_BACKGROUND_PHOTO_KEY),
      ]);

      if (cancelled) return;

      setSummary(attendanceSummary(records));
      setAvatarPhoto(storedAvatarPhoto);
      setCommunityBackground(
        storedBackground === "club" || storedBackground === "mine"
          ? storedBackground
          : "none"
      );
      setCommunityBackgroundPhoto(storedBackgroundPhoto);

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
        const remembered = await getRememberedCommunityAccount();
        if (cancelled) return;

        setRememberedAccount(remembered);
        if (remembered) {
          setEmail(remembered);
          setAuthMode("signin");
        }

        const restored = await communityRestoreSession();
        if (cancelled) return;
        setSession(restored);
        setAge16Declared(Boolean(restored?.communityEligible));
        if (restored?.email) {
          await rememberCommunityAccount(restored.email);
          if (cancelled) return;
          setRememberedAccount(restored.email.toLowerCase());
          setEmail(restored.email);
          const savedAutomatic = await AsyncStorage.getItem(autoUnlockKey(restored.email));
          if (cancelled) return;
          setAutomaticSignIn(savedAutomatic === "1");
          const restoredMode = await getCommunityLoginMode(restored.email);
          if (cancelled) return;
          setLoginMode(restoredMode);
        }

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

  async function getCommunityLoginMode(
    accountEmail: string
  ): Promise<CommunityLoginMode> {
    const stored = await AsyncStorage.getItem(loginModeKey(accountEmail));

    if (
      stored === "stay" ||
      stored === "biometric" ||
      stored === "password"
    ) {
      return stored;
    }

    const legacy = await AsyncStorage.getItem(BIOMETRIC_KEY);

    return legacy === "1" ? "biometric" : "password";
  }

  async function selectCommunityLoginMode(
    nextMode: CommunityLoginMode
  ) {
    if (!session?.email) {
      throw new Error("Sign in before changing your login method.");
    }

    if (nextMode === "biometric" && !unlockCapability.available) {
      throw new Error("Face ID or Touch ID is unavailable.");
    }

    await AsyncStorage.setItem(loginModeKey(session.email), nextMode);

    setLoginMode(nextMode);
    setStatus(
      nextMode === "stay"
        ? "Stay Signed In selected."
        : nextMode === "biometric"
          ? "Biometric login selected."
          : "Password Every Time selected."
    );
  }

  async function loadUnlockedCommunity(next: CommunitySession, generation = lockGeneration.current) {
    // Keep protected content locked until both the server and local setup state load.
    setSession(next);
    setAge16Declared(Boolean(next.communityEligible));

    // The server is authoritative for permanent Community usernames.
    setRegisteredUsername("");
    setUsernameLookupFailed(false);

    try {
      const usernameRecord = await communityGetRegisteredUsername();

      if (usernameRecord.registered && usernameRecord.username) {
        setRegisteredUsername(usernameRecord.username);
        setUsername(usernameRecord.username);
      }
    } catch {
      // Do not allow username changes when registration state is unknown.
      setUsernameLookupFailed(true);
    }
    const current = next.communityEligible
      ? await communityRequest<CommunityState>("/me")
      : { profile: null, preferences: OFF, safetyId: null, serverNow: 0 };
    const [savedSetup, savedMethod, savedAutomatic] = await Promise.all([
      AsyncStorage.getItem(setupKey(next.email)),
      AsyncStorage.getItem(BIOMETRIC_KEY),
      AsyncStorage.getItem(autoUnlockKey(next.email)),
    ]);
    const choiceMade = savedMethod === "1" || savedMethod === "0";
    // A pending marker takes precedence over a profile saved partway through setup.
    // Preserve established profiles when upgrading from the previous workflow.
    const complete = Boolean(current.profile) &&
      (savedSetup === "complete" || (savedSetup === null && choiceMade));
    await AsyncStorage.setItem(setupKey(next.email), complete ? "complete" : "pending");
    setState(current);
    if (current.profile) {
      setName(current.profile.displayName);
      setAvatar(current.profile.avatar);
    }
    setBiometricChoiceMade(choiceMade);
    setBiometricEnabled(savedMethod === "1");
    setAutomaticSignIn(savedAutomatic === "1");
    setLoginMode(await getCommunityLoginMode(next.email));
    setNeedsSetup(!complete);
    setShowCommunitySettings(!complete || !next.communityEligible);
    setCommunityTab("chats");
    if (generation === lockGeneration.current) setUnlocked(true);
  }

  async function unlockWithDevice() {
    const generation = lockGeneration.current;
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
    await loadUnlockedCommunity(session, generation);
    setStatus(`Community unlocked with ${unlockCapability.label}.`);
  }

  useEffect(() => {
    if (
      !foreground ||
      !loaded ||
      !session ||
      unlocked ||
      busy ||
      attemptedAutomaticUnlock.current
    ) return;

    if (loginMode === "stay") {
      attemptedAutomaticUnlock.current = true;
      const generation = lockGeneration.current;
      void run(async () => {
        await loadUnlockedCommunity(session, generation);
      });
      return;
    }

    if (
      loginMode === "biometric" &&
      unlockCapability.available
    ) {
      attemptedAutomaticUnlock.current = true;
      void run(unlockWithDevice);
    }
  }, [
    loginMode,
    automaticSignIn,
    foreground,
    loaded,
    session,
    unlocked,
    busy,
    unlockCapability.available
  ]);

  async function unlockWithPassword() {
    const generation = lockGeneration.current;
    if (!session) return;
    if (!password) throw new Error("Enter your Community password.");

    const next = await communitySignIn(session.email, password);
    setPassword("");
    await loadUnlockedCommunity(next, generation);
    setStatus("Community unlocked.");
  }

  async function signIn() {
    const generation = lockGeneration.current;
    if (!email.trim()) throw new Error("Enter your registered email address.");
    if (!password) throw new Error("Enter your Community password.");

    const existing = await getRememberedCommunityAccount();
    if (existing && existing.toLowerCase() !== email.trim().toLowerCase()) {
      throw new Error("This device already has a Community account. Sign in using the remembered email.");
    }

    const next = await communitySignIn(email.trim(), password);
    await rememberCommunityAccount(next.email);
    setRememberedAccount(next.email.toLowerCase());
    setPassword("");
    await loadUnlockedCommunity(next, generation);

    const capability = await communityUnlockCapability();
    setUnlockCapability(capability);


    if (next.communityEligible) {
      setStatus("Signed in to Community.");
    } else {
      setStatus("Signed in. Community eligibility still needs to be confirmed.");
    }
  }

  useEffect(() => {
    if (authMode !== "create" || session) return;

    const candidate = username.trim().replace(/^@/, "");

    if (!/^[A-Za-z0-9_]{3,20}$/.test(candidate)) {
      setSignupUsernameCheck(null);
      return;
    }

    let cancelled = false;

    setSignupUsernameCheck({
      username: candidate,
      status: "checking",
    });

    const timer = setTimeout(async () => {
      try {
        const result = await communityCheckSignupUsername(candidate);

        if (!cancelled) {
          setSignupUsernameCheck({
            username: candidate,
            status: result.available ? "available" : "taken",
          });
        }
      } catch {
        if (!cancelled) {
          setSignupUsernameCheck({
            username: candidate,
            status: "error",
          });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, authMode, session]);

  async function signUp() {
    const candidate = username.trim().replace(/^@/, "");

    if (
      signupUsernameCheck?.username !== candidate ||
      signupUsernameCheck?.status !== "available"
    ) {
      throw new Error(
        "Please choose an available @username before creating your account."
      );
    }

    const generation = lockGeneration.current;
    const displayName = username.trim().replace(/^@/, "");

    if (!/^[A-Za-z0-9_]{3,20}$/.test(displayName)) {
      throw new Error("Choose a unique username of 3–20 letters, numbers or underscores.");
    }

    if (!firstName.trim() || firstName.trim().length > 80) {
      throw new Error("Enter your first name.");
    }

    if (!surname.trim() || surname.trim().length > 80) {
      throw new Error("Enter your surname.");
    }

    const formattedPhone = phoneNumber.trim().replace(/[^+0-9]/g, "");

    if (!/^\+[1-9][0-9]{7,14}$/.test(formattedPhone)) {
      throw new Error("Enter your phone number with country code, for example +447123456789.");
    }

    if (!age16Declared) {
      throw new Error("Confirm that you are aged 16 or over.");
    }

    if (!displayName || displayName.length > 40) {
      throw new Error("Choose a Community name of 1–40 characters.");
    }

    if (!email.trim()) {
      throw new Error("Enter your email address.");
    }

    if (password.length < 6 || password.length > 128) {
      throw new Error("Use a password between 6 and 128 characters.");
    }

    await AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ name: displayName, avatar }),
    );

    const existing = await getRememberedCommunityAccount();
    if (existing) {
      setRememberedAccount(existing);
      setEmail(existing);
      setAuthMode("signin");
      throw new Error("A Community account is already registered on this device. Please sign in.");
    }

    const signup = await communitySignUp({
      username: displayName,
      firstName: firstName.trim(),
      surname: surname.trim(),
      email: email.trim(),
      phoneNumber: formattedPhone,
      password,
      age16Declared,
    });
    await rememberCommunityAccount(signup.session.email);
    setRememberedAccount(signup.session.email.toLowerCase());
    setAuthMode("signin");
    setPassword("");
    await AsyncStorage.setItem(setupKey(signup.session.email), "pending");
    await AsyncStorage.setItem(BIOMETRIC_KEY, "");
    await AsyncStorage.setItem(autoUnlockKey(signup.session.email), "0");
    await AsyncStorage.setItem(loginModeKey(signup.session.email), "stay");
    setLoginMode("stay");
    await loadUnlockedCommunity(signup.session, generation);

    if (signup.verificationEmailSent) {
      const sentAt = Date.now();
      setVerificationSentAt(sentAt);
      setVerificationNow(sentAt);
    }

    const capability = await communityUnlockCapability();
    setUnlockCapability(capability);


    setStatus(
      signup.verificationEmailSent
        ? "Account created. Verification email sent — check your inbox and spam folder. Complete your Community Settings to get started."
        : "Account created, but the verification email could not be sent. Please request another email. Complete your Community Settings to get started.",
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

  async function selectCommunityBackground(
    choice: "club" | "none"
  ) {
    await AsyncStorage.setItem(COMMUNITY_BACKGROUND_KEY, choice);
    setCommunityBackground(choice);
  }

  async function chooseCommunityBackgroundPhoto() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error("Photo access is needed to choose a Community background.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const prepared = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1080 } }],
      {
        compress: 0.65,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!prepared.base64) {
      throw new Error("Could not prepare the Community background photo.");
    }

    const dataUri = `data:image/jpeg;base64,${prepared.base64}`;

    await AsyncStorage.setItem(COMMUNITY_BACKGROUND_PHOTO_KEY, dataUri);
    await AsyncStorage.setItem(COMMUNITY_BACKGROUND_KEY, "mine");

    setCommunityBackgroundPhoto(dataUri);
    setCommunityBackground("mine");
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
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setPendingAvatar(result.assets[0].uri);
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
      allowsEditing: false,
      quality: 0.9,
      cameraType: ImagePicker.CameraType.front,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setPendingAvatar(result.assets[0].uri);
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

  // Refresh email verification when returning from Safari.
  useEffect(() => {
    if (!session || session.emailVerified || !serviceConfigured) {
      return;
    }

    let refreshing = false;

    const refreshVerification = async () => {
      if (refreshing) return;
      refreshing = true;

      try {
        const refreshed = await communityRestoreSession();

        if (refreshed?.emailVerified) {
          setSession(refreshed);
          setStatus("Email verified ✓");
        }
      } catch {
        // Keep the existing session if refresh fails.
      } finally {
        refreshing = false;
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      state => {
        if (state === "active") {
          void refreshVerification();
        }
      },
    );

    return () => subscription.remove();
  }, [session?.emailVerified, session?.email, serviceConfigured]);

  async function checkEmailVerification() {
    const refreshed = await communityRestoreSession();

    if (!refreshed) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    setSession(refreshed);

    if (refreshed.emailVerified) {
      setStatus("Email verified ✓ You can now finish Community setup.");
    } else {
      setStatus(
        "Email is not verified yet. Open the verification link in your email, then try again."
      );
    }
  }

  async function requestEmailVerification() {
    setVerificationSending(true);
    setStatus("Sending verification email…");

    try {
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

      setVerificationSentAt(Date.now());
      setVerificationNow(Date.now());
      setStatus("Email sent ✓ Please check your inbox and spam folder.");
    } catch (error) {
      setStatus("Unable to send verification email.");
      throw error;
    } finally {
      setVerificationSending(false);
    }
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

    await clearRememberedCommunityAccount();
    setRememberedAccount(null);
    setEmail("");
    setAuthMode("signin");

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
      setForeground(nextState === "active");
      if (nextState === "background") {
        lockGeneration.current += 1;
        attemptedAutomaticUnlock.current = false;
        if (loginMode !== "stay") {
          setUnlocked(false);
        }
        setPassword("");
      }
    });

    return () => subscription.remove();
  }, [session, loginMode]);

  async function saveProfile() {
    if (!name.trim() || name.trim().length > 40) throw new Error("Choose a display name of 1–40 characters.");
    if (!clubId || !clubName || clubName === "Your Club") throw new Error("Choose your favourite club on Home first.");
    await AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ name: name.trim(), avatar }),
    );
    if (connected) {
      await communityRequest<CommunityState>("/profile", { displayName: name.trim(), avatar, clubId, ...summary });
      setStatus("Public profile saved. Any previous matchday visibility has ended.");
    } else setStatus("Profile draft saved on this iPhone. Nothing has been shared.");
  }
  async function finishSetup() {
    if (!session?.emailVerified) {
      throw new Error(
        "Please verify your email address before entering Community Chats."
      );
    }
    if (!session || !unlocked) throw new Error("Unlock Community before finishing setup.");
    if (!age16Declared) throw new Error("Confirm that you are aged 16 or over.");

    const confirmed = session.communityEligible
      ? session
      : await communityConfirmEligibility();

    setSession(confirmed);

    if (!name.trim() || name.trim().length > 40) {
      throw new Error("Choose a display name of 1–40 characters.");
    }
    if (!clubId || !clubName || clubName === "Your Club") {
      throw new Error("Choose your favourite club on Home first.");
    }

    await communityRequest<CommunityState>("/profile", {
      displayName: name.trim(), avatar, clubId, ...summary,
    });
    // First-time privacy choices remain local until the profile exists. Only mark
    // setup complete after the service has saved both profile and privacy.
    const current = await communityRequest<CommunityState>("/preferences", state.preferences);
    if (!current.profile || current.profile.clubId !== clubId) {
      throw new Error("Save your public profile before finishing setup.");
    }
    await AsyncStorage.setItem(autoUnlockKey(session.email), automaticSignIn && biometricEnabled ? "1" : "0");
    await AsyncStorage.setItem(setupKey(session.email), "complete");
    setState(current);
    setNeedsSetup(false);
    setShowCommunitySettings(false);
    setCommunityTab("chats");
    setStatus("Community settings saved.");
  }

  async function privacy(patch: Partial<CommunityState["preferences"]>) {
    const preferences = { ...state.preferences, ...patch };

    if (!preferences.enabled) {
      preferences.locationVisible = false;
      preferences.shareGames = false;
      preferences.shareGrounds = false;
      preferences.photoSharing = false;
    }

    if (needsSetup) {
      setState(current => ({ ...current, preferences }));
      return;
    }
    setState(await communityRequest<CommunityState>("/preferences", preferences));
    setStatus("Community privacy choices saved. Matchday presence has ended.");
  }
  if (serviceConfigured && !loaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading Community account...</Text>
      </SafeAreaView>
    );
  }

  if (serviceConfigured && !session) {
    const creating = authMode === "create" && !rememberedAccount;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
        <CommunityBackgroundImage
          choice={communityBackground}
          clubPhoto={communityClubPhoto}
          personalPhoto={communityBackgroundPhoto}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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

              width: "100%",
              maxWidth: 520,
              alignSelf: "center",
              paddingVertical: 28,
            }}
          >
            <View
              style={{
                height: 300,
                marginBottom: 24,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: colour || "#17221c",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 24,
              }}
            >
              {communityClubPhoto ? (
                <Image
                  source={communityClubPhoto}
                  resizeMode="cover"
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  }}
                />
              ) : null}

              <View
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  backgroundColor: "rgba(0,0,0,0.48)",
                }}
              />

              <Text
                accessibilityRole="header"
                style={{
                  color: "#FFFFFF",
                  fontSize: 30,
                  fontWeight: "900",
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                COMMUNITY
              </Text>

              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 21,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {clubName || "Your club"} supporters
              </Text>

              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 27,
                  fontWeight: "800",
                  textAlign: "center",
                  marginTop: 28,
                }}
              >
                {creating ? "Create your Community account" : "Welcome back"}
              </Text>
            </View>

            {!rememberedAccount && (
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

              {!rememberedAccount && (
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
              )}
            </View>
            )}



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
                ? "Choose your unique public @username and enter your private account details."
                : "Sign in to your private Community account."}
            </Text>

            {creating ? (
              <>
                <TextInput
                  accessibilityLabel="Community signup username"
                  placeholder="@UniqueName"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={21}
                  value={username}
                  onChangeText={setUsername}
                  style={[styles.input, { marginBottom: 10 }]}
                />
                {signupUsernameCheck?.username ===
                  username.trim().replace(/^@/, "") && (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={{
                      marginBottom: 10,
                      color:
                        signupUsernameCheck.status === "available"
                          ? "#18753c"
                          : signupUsernameCheck.status === "checking"
                            ? "#555555"
                            : "#b42318",
                    }}
                  >
                    {signupUsernameCheck.status === "checking"
                      ? "Checking username availability…"
                      : signupUsernameCheck.status === "available"
                        ? "✓ Username available"
                        : signupUsernameCheck.status === "taken"
                          ? "Username already used. Please choose another."
                          : "Unable to check username. Please try again."}
                  </Text>
                )}

                <TextInput
                  accessibilityLabel="Community signup first name"
                  placeholder="First Name"
                  autoCapitalize="words"
                  maxLength={80}
                  value={firstName}
                  onChangeText={setFirstName}
                  style={[styles.input, { marginBottom: 10 }]}
                />
                <TextInput
                  accessibilityLabel="Community signup surname"
                  placeholder="Surname"
                  autoCapitalize="words"
                  maxLength={80}
                  value={surname}
                  onChangeText={setSurname}
                  style={[styles.input, { marginBottom: 10 }]}
                />
              </>
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

            {creating ? (
              <TextInput
                accessibilityLabel="Phone number required"
                placeholder="Phone Number (required, e.g. +447123456789)"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={24}
                style={[styles.input, { marginBottom: 10 }]}
              />
            ) : null}

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

            {creating && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Switch
                  accessibilityLabel="I confirm I am aged 16 or over"
                  value={age16Declared}
                  disabled={busy}
                  onValueChange={setAge16Declared}
                />
                <Text style={[styles.copy, { flex: 1 }]}>
                  I confirm that I am aged 16 or over.
                </Text>
              </View>
            )}

            <Action
              title={creating ? "Create Community account" : "Sign in"}
              disabled={
                busy ||
                !email.trim() ||
                !password ||
                (creating && (
                    signupUsernameCheck?.username !==
                      username.trim().replace(/^@/, "") ||
                    signupUsernameCheck?.status !== "available" ||
                    !/^[A-Za-z0-9_]{3,20}$/.test(username.trim().replace(/^@/, "")) ||
                    !firstName.trim() ||
                    !surname.trim() ||
                    !phoneNumber.trim() ||
                    !age16Declared
                  ))
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
        </KeyboardAvoidingView>

      {pendingAvatar ? (
        <CircularPhotoEditor
          uri={pendingAvatar}
          onCancel={() => setPendingAvatar(null)}
          onSave={async (uri) => {
            await storeAvatarPhoto(uri);
            setPendingAvatar(null);
            setStatus("Community profile photo updated.");
          }}
        />
      ) : null}
</SafeAreaView>
    );
  }

  if (serviceConfigured && session && !unlocked) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
      <CommunityBackgroundImage choice={communityBackground} clubPhoto={communityClubPhoto} personalPhoto={communityBackgroundPhoto} />
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

        {loginMode === "biometric" && unlockCapability.available && (
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

      {pendingAvatar ? (
        <CircularPhotoEditor
          uri={pendingAvatar}
          onCancel={() => setPendingAvatar(null)}
          onSave={async (uri) => {
            await storeAvatarPhoto(uri);
            setPendingAvatar(null);
            setStatus("Community profile photo updated.");
          }}
        />
      ) : null}
</SafeAreaView>;
  }

  const bottomTabs = connected && session?.emailVerified === true && !needsSetup ? (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", backgroundColor: "#f8f5ec", borderTopWidth: 1, borderTopColor: "#d8d3c7" }}>
      {(["chats", "supporters", "map", "settings"] as const).map(id => {
        const selected = id === "settings" ? showCommunitySettings : !showCommunitySettings && communityTab === id;
        return <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected, disabled: busy }}
          disabled={busy}
          onPress={() => {
            if (!session?.communityEligible || !session?.emailVerified || needsSetup) {
              setShowCommunitySettings(true);
              return;
            }
            setShowCommunitySettings(id === "settings");
            if (id !== "settings") setCommunityTab(id);
          }}
          style={{ flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", borderTopWidth: 3, borderTopColor: selected ? colour || "#17221c" : "transparent" }}>
          <Text style={{ color: selected ? colour || "#17221c" : "#6f756f", fontWeight: selected ? "900" : "600", fontSize: 13 }}>
            {id === "chats" ? "Chats" : id === "supporters" ? "Supporters" : id === "map" ? "Map" : "Settings"}
          </Text>
        </Pressable>;
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ticket Frame Home"
        disabled={busy}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/");
          }
        }}
        style={{
          flex: 1,
          minHeight: 52,
          alignItems: "center",
          justifyContent: "center",
          borderTopWidth: 3,
          borderTopColor: "transparent",
        }}
      >
        <Text style={{
          color: "#17221c",
          fontWeight: "900",
          fontSize: 13,
        }}>
          Home
        </Text>
      </Pressable>
    </View>
  ) : null;

  if (connected && session?.emailVerified === true && sameClub && !needsSetup && !showCommunitySettings) {
    const tabColour = colour || "#17221c";
    const avatarLetter =
      state.profile?.displayName?.trim().slice(0, 1).toUpperCase() ||
      name.trim().slice(0, 1).toUpperCase() ||
      "?";

    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f8f5ec",
        }}
      >
      <CommunityBackgroundImage choice={communityBackground} clubPhoto={communityClubPhoto} personalPhoto={communityBackgroundPhoto} />
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


        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1 }}>
          {!active && <Text style={[styles.copy, { padding: 20 }]}>
            Community is off. Open Settings and turn on Join Community when you are ready.
          </Text>}
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

      {bottomTabs}
        </KeyboardAvoidingView>
      {pendingAvatar ? (
        <CircularPhotoEditor
          uri={pendingAvatar}
          onCancel={() => setPendingAvatar(null)}
          onSave={async (uri) => {
            await storeAvatarPhoto(uri);
            setPendingAvatar(null);
            setStatus("Community profile photo updated.");
          }}
        />
      ) : null}
</SafeAreaView>
    );
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
      <CommunityBackgroundImage choice={communityBackground} clubPhoto={communityClubPhoto} personalPhoto={communityBackgroundPhoto} />
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      contentContainerStyle={{
        padding: 20,
        gap: 14,
        paddingBottom: 180,
      }}
    >
      {connected && !needsSetup && showCommunitySettings ? (
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
        {session ? "COMMUNITY SETTINGS" : "COMMUNITY"}
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

      <Text style={styles.copy}>
        Your chosen name, avatar and favourite club identify you in Community.
        Games attended and grounds visited are shared only if you choose to share them.
        Your tickets, Ticket Frame photos and account details stay private.
      </Text>
      <Text style={styles.heading}>YOUR PUBLIC PROFILE</Text>
      {!!state.profile?.friendId && (
        <Text accessibilityLabel="Your Community Friend ID">
          Your Friend ID: {state.profile.friendId}
        </Text>
      )}
      <Text style={styles.heading}>YOUR @USERNAME</Text>

      {usernameLookupFailed ? (
        <Text style={styles.copy}>
          Unable to confirm your permanent username.
          Please reconnect and sign in again.
          Username changes are disabled until verification succeeds.
        </Text>
      ) : registeredUsername ? (
        <>
          <TextInput
            accessibilityLabel="Permanent Community username"
            value={`@${registeredUsername}`}
            editable={false}
            selectTextOnFocus={false}
            style={[
              styles.input,
              {
                backgroundColor: "#e5e5e5",
                color: "#666666",
                opacity: 0.8,
              },
            ]}
          />

          <Text style={styles.copy}>
            Your username is permanent and cannot be changed.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.copy}>
            Register your permanent username. You can only do this once.
          </Text>

          <TextInput
            accessibilityLabel="Community username"
            placeholder="@YourUsername"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={21}
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              setUsernameStatus("");
            }}
            style={styles.input}
          />

          <Action
            title="Check Username Availability"
            disabled={busy || !username.trim()}
            onPress={() => void run(async () => {
              const result = await communityCheckUsername(username);

              setUsernameStatus(
                result.yours
                  ? "This username is already yours."
                  : result.available
                    ? "Username available."
                    : "Username already taken."
              );
            })}
            colour={colour}
          />

          <Action
            title="Register My Username"
            disabled={busy || !username.trim()}
            onPress={() => void run(async () => {
              const result = await communityRegisterUsername(username);

              if (!result.registered) {
                throw new Error("Username registration was not confirmed.");
              }

              setRegisteredUsername(result.username);
              setUsername(result.username);
              setUsernameStatus("");
            })}
            colour={colour}
          />

          {!!usernameStatus && (
            <Text style={styles.copy}>{usernameStatus}</Text>
          )}
        </>
      )}

        <Text style={{ fontWeight: "700" }}>Name:</Text>
      <TextInput accessibilityLabel="Community display name" placeholder="Choose a display name" value={name} maxLength={40} onChangeText={setName} style={styles.input} />
      <Text style={{ fontWeight: "700" }}>Photo:</Text>
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
            title="Choose New Photo"
            disabled={busy}
            onPress={() => void run(chooseAvatarPhoto)}
            colour={colour}
          />
        </View>
      </View>
      <Text>{summary.gamesAttended} games attended · {summary.groundsVisited.length} grounds visited</Text>

      <Text style={styles.heading}>Community Background</Text>

      <Text style={styles.copy}>
        Choose the background for Community sign-in, chats, settings, supporters and map.
        The sign-in welcome card will still show your club stadium.
      </Text>

      <Action
        title={communityBackground === "club" ? "✓ Club Photo" : "Club Photo"}
        disabled={busy}
        onPress={() => void run(() => selectCommunityBackground("club"))}
        colour={colour}
      />

      <Action
        title={communityBackground === "mine" ? "✓ My Photo" : "My Photo"}
        disabled={busy}
        onPress={() => void run(chooseCommunityBackgroundPhoto)}
        colour={colour}
      />

      <Action
        title={communityBackground === "none" ? "✓ No Photo" : "No Photo"}
        disabled={busy}
        onPress={() => void run(() => selectCommunityBackground("none"))}
        colour={colour}
      />

      <Text style={styles.heading}>Community & Privacy</Text>

      <View style={{ gap: 8, paddingVertical: 12 }}>
        <Text style={styles.heading}>Community Age Requirement — 16+</Text>
        <Text style={styles.copy}>
          Ticket Frame Community is available to supporters aged 16 or over.
          Users under 16 cannot access Community.
        </Text>
        <Text style={styles.copy}>
          Junior Apple Accounts identified as under 16 will be blocked.
        </Text>
        <Text style={styles.copy}>
          {session?.communityEligible
            ? "Community eligibility confirmed by the service."
            : "Eligibility pending. Community remains locked until eligibility is confirmed."}
        </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Switch
              accessibilityLabel="I confirm I am aged 16 or over"
              value={Boolean(session?.communityEligible) || age16Declared}
              disabled={busy || Boolean(session?.communityEligible)}
              onValueChange={setAge16Declared}
            />
            <Text style={[styles.copy, { flex: 1 }]}>
              I confirm that I am aged 16 or over.
            </Text>
          </View>
        <Text style={styles.copy}>
          Age declaration alone does not verify your age.
        </Text>
      </View>

      {!sameClub && state.profile && (
        <Text>Save your profile with your current favourite club before using Community.</Text>
      )}

      <Text style={styles.heading}>Accept All Community Settings</Text>
      <Text style={styles.copy}>
        Enable Community, matchday information, grounds visited,
        matchday location and photo sharing together.
        Your 16+ declaration must still be selected manually.
      </Text>
      <Switch
        accessibilityLabel="Accept All Community Settings"
        value={
          state.preferences.enabled &&
          state.preferences.shareGames &&
          state.preferences.shareGrounds &&
          state.preferences.locationVisible &&
          state.preferences.photoSharing
        }
        disabled={busy || !connected || (!needsSetup && !sameClub)}
        onValueChange={acceptAll =>
          void run(() =>
            privacy({
              enabled: acceptAll,
              shareGames: acceptAll,
              shareGrounds: acceptAll,
              locationVisible: acceptAll,
              photoSharing: acceptAll,
            })
          )
        }
      />

      <Text>Join Community — off by default</Text>
      <Switch
        accessibilityLabel="Join Community"
        value={state.preferences.enabled}
        disabled={busy || !connected || (!needsSetup && !sameClub)}
        onValueChange={enabled => void run(() => privacy({ enabled }))}
      />

      <Text>Share my games-attended total</Text>
      <Switch
        accessibilityLabel="Share games attended"
        value={state.preferences.shareGames}
        disabled={busy || !connected || !state.preferences.enabled || (!needsSetup && !sameClub)}
        onValueChange={shareGames => void run(() => privacy({ shareGames }))}
      />

      <Text>Share the grounds I have visited</Text>
      <Switch
        accessibilityLabel="Share grounds visited"
        value={state.preferences.shareGrounds}
        disabled={busy || !connected || !state.preferences.enabled || (!needsSetup && !sameClub)}
        onValueChange={shareGrounds => void run(() => privacy({ shareGrounds }))}
      />

      <Text>Allow matchday location features</Text>
      <Switch
        accessibilityLabel="Matchday location visibility"
        value={state.preferences.locationVisible}
        disabled={busy || !connected || !state.preferences.enabled || (!needsSetup && !sameClub)}
        onValueChange={locationVisible => void run(() => privacy({ locationVisible }))}
      />

      <Text>Allow eligible matchday photo sharing</Text>
      <Switch
        accessibilityLabel="Eligible matchday photo sharing"
        value={state.preferences.photoSharing}
        disabled={busy || !connected || !state.preferences.enabled || (!needsSetup && !sameClub)}
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
      {session && (
        <View style={{ gap: 10 }}>
          <Text style={styles.heading}>Community Login Security</Text>
          <Text style={styles.copy}>
            Choose how this account unlocks Community on this iPhone.
            Your age eligibility and privacy preferences remain unchanged.
          </Text>
          <Action
            title={`${loginMode === "stay" ? "✓ " : ""}Stay Signed In (No Extra Lock)`}
            disabled={busy}
            onPress={() => void run(() => selectCommunityLoginMode("stay"))}
            colour={colour}
          />
          <Text style={styles.copy}>
            No extra unlock while your saved session remains valid.
          </Text>
          {unlockCapability.available ? (
            <Action
              title={`${loginMode === "biometric" ? "✓ " : ""}${unlockCapability.label}`}
              disabled={busy}
              onPress={() => void run(() => selectCommunityLoginMode("biometric"))}
              colour={colour}
            />
          ) : (
            <Text style={styles.copy}>
              Face ID or Touch ID is unavailable on this device.
            </Text>
          )}
          <Action
            title={`${loginMode === "password" ? "✓ " : ""}Password Every Time`}
            disabled={busy}
            onPress={() => void run(() => selectCommunityLoginMode("password"))}
            colour={colour}
          />
            <>
              <Text style={styles.copy}>
                Your profile and privacy choices are saved together below.
                Joining Community is optional.
              </Text>
              <Action title={needsSetup ? "Finish Setup" : "Save Settings & Open Chats"} disabled={busy || !unlocked || !session?.emailVerified || !age16Declared}
                onPress={() => void run(finishSetup)} colour={colour} />
            </>
        </View>
      )}

      {serviceConfigured && session && (
        <View style={{ gap: 8 }}>
          <Text style={styles.heading}>Community account</Text>
          <Text>{session.email}</Text>

          {!session.emailVerified ? (
            <>
              <Text style={styles.copy}>
                Verify your email address before finishing setup and entering Community Chats.
                Check your inbox and spam folder for the verification link.
              </Text>
              <Action
                  title="I've Verified My Email"
                  disabled={busy}
                  onPress={() => void run(checkEmailVerification)}
                  colour={colour}
                />

                <Action
                title={
                  verificationSending
                    ? "Sending…"
                    : verificationCooldown > 0
                      ? `Email sent ✓ (${verificationCooldown}s)`
                      : "Resend verification email"
                }
                disabled={busy || verificationCooldown > 0}
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

          <Action
            title="Sign out of Community"
            disabled={busy}
            onPress={() => void run(signOut)}
            colour={colour}
          />
        </View>
      )}


      {/* Social Community lives in the messaging-style Chats / Supporters / Map home. */}
      {/* COMMUNITY_FEATURES */}
      {!!status && <Text accessibilityLiveRegion="polite">{status}</Text>}
    </ScrollView>

      {bottomTabs}
      {pendingAvatar ? (
        <CircularPhotoEditor
          uri={pendingAvatar}
          onCancel={() => setPendingAvatar(null)}
          onSave={async (uri) => {
            await storeAvatarPhoto(uri);
            setPendingAvatar(null);
            setStatus("Community profile photo updated.");
          }}
        />
      ) : null}
</SafeAreaView>;
}
