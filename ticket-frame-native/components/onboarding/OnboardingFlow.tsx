// V3.7.1 — First-launch experience.
//
// Three beats: hero → club selection → first ticket.
// The interactive sample experience lives in components/demo/DemoMode.tsx
// (launched via onLaunchDemo). This component never touches sample data:
// demoTickets/demoMatches/demoGrounds are consumed only inside Demo Mode,
// fully isolated from the user's collection.

import { useMemo, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Appear,
  ONBOARDING_CREAM,
  ONBOARDING_GOLD,
  ONBOARDING_GOLD_DEEP,
  ONBOARDING_INK,
  ONBOARDING_SHELL,
} from "./FrameArtwork";

export type OnboardingClub = {
  id: string;
  name: string;
  league: string;
  stadium: string;
  stadiumLocation: string;
  primary: string;
  secondary: string;
};

type Props = {
  clubs: OnboardingClub[];
  onComplete: (club: OnboardingClub, options: { openScanner: boolean }) => void;
  /** Opens the isolated Demo Mode experience. */
  onLaunchDemo: () => void;
  /**
   * When true the flow opens directly on the club picker (used when
   * Demo Mode finishes with "Add My First Ticket"). Consumed once at
   * mount — pair with a changing React key to re-enter mid-flow.
   */
  startAtClub?: boolean;
};

type Step = "hero" | "club" | "first";

const LEAGUE_ORDER = [
  "Premier League",
  "Championship",
  "League One",
  "League Two",
  "National League",
  "Scottish Premiership",
  "Scottish Championship",
  "Scottish League One",
  "Scottish League Two",
];

function readableOnCream(background: string): string {
  const hex = background.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#10261c";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 168 ? "#10261c" : "#ffffff";
}

export default function OnboardingFlow({
  clubs,
  onComplete,
  onLaunchDemo,
  startAtClub = false,
}: Props) {
  const [step, setStep] = useState<Step>(startAtClub ? "club" : "hero");

  // Club picker
  const [clubSearch, setClubSearch] = useState("");
  const [chosenClub, setChosenClub] = useState<OnboardingClub | null>(null);
  const [openLeague, setOpenLeague] = useState<string>("Premier League");

  const groupedClubs = useMemo(() => {
    const query = clubSearch.trim().toLowerCase();
    const matches = query
      ? clubs.filter((club) => club.name.toLowerCase().includes(query))
      : clubs;
    const groups = new Map<string, OnboardingClub[]>();
    for (const club of matches) {
      const list = groups.get(club.league) ?? [];
      list.push(club);
      groups.set(club.league, list);
    }
    const orderedLeagues = [
      ...LEAGUE_ORDER.filter((league) => groups.has(league)),
      ...Array.from(groups.keys())
        .filter((league) => !LEAGUE_ORDER.includes(league))
        .sort(),
    ];
    return orderedLeagues.map((league) => ({
      league,
      items: (groups.get(league) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
  }, [clubs, clubSearch]);

  // ---------- chrome ----------
  const stepNumber = { hero: 1, club: 2, first: 3 }[step];
  const goBack = () => {
    if (step === "first") setStep("club");
    else if (step === "club") setStep("hero");
  };
  const showBack = step !== "hero";

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {showBack ? (
        <Pressable hitSlop={12} onPress={goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={ONBOARDING_GOLD} />
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View style={styles.dots}>
        {(["hero", "club", "first"] as Step[]).map((item, index) => (
          <View
            key={item}
            style={[styles.dot, index + 1 <= stepNumber && styles.dotActive]}
          />
        ))}
      </View>
      <View style={styles.backPlaceholder} />
    </View>
  );

  // ---------- HERO ----------
  if (step === "hero") {
    return (
      <Shell header={renderHeader()}>
        <View style={styles.heroBody}>
          <Appear delay={80}>
            <Text style={styles.heroKicker}>TICKET FRAME</Text>
          </Appear>
          <Appear delay={240}>
            <Text style={styles.heroTitle}>Your football{"\n"}story</Text>
          </Appear>
          <Appear delay={420}>
            <View style={styles.heroRule} />
          </Appear>
          <Appear delay={520}>
            <Text style={styles.heroSubtitle}>
              Every ticket.{"\n"}Every match.{"\n"}Every memory.
            </Text>
          </Appear>
          <Appear delay={700}>
            <Text style={styles.heroBodyCopy}>
              Turn the tickets in your drawer, wallet and camera roll into a
              beautiful archive — recognised, verified and framed.
            </Text>
          </Appear>

          <Appear delay={880}>
            <View style={{ marginTop: 34 }}>
              <PrimaryButton label="SEE HOW IT WORKS" onPress={onLaunchDemo} />
              <Text style={styles.heroFinePrint}>
                No sign-up. Nothing is saved until you say so.
              </Text>
            </View>
          </Appear>
        </View>
      </Shell>
    );
  }

  // ---------- CLUB ----------
  if (step === "club") {
    return (
      <Shell header={renderHeader()}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Text style={styles.clubTitle}>Which club tells your story?</Text>
          <Text style={styles.clubSubtitle}>
            Your colours shape every frame in your collection.
          </Text>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={17} color="#8b8578" />
            <TextInput
              placeholder="Search clubs…"
              placeholderTextColor="#a39c8d"
              value={clubSearch}
              onChangeText={setClubSearch}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {clubSearch.length > 0 && (
              <Pressable hitSlop={10} onPress={() => setClubSearch("")}>
                <Ionicons name="close-circle" size={19} color="#a39c8d" />
              </Pressable>
            )}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 18 }}
            keyboardShouldPersistTaps="handled"
          >
            {groupedClubs.map(({ league, items }) => {
              const open =
                clubSearch.trim().length > 0 || openLeague === league;
              return (
                <View key={league}>
                  {clubSearch.trim().length === 0 && (
                    <Pressable
                      onPress={() =>
                        setOpenLeague(openLeague === league ? "" : league)
                      }
                    >
                      <Text style={styles.leagueTitle}>
                        {league.toUpperCase()}
                        <Text style={styles.leagueChevron}>
                          {" "}
                          {open ? "▲" : "▼"}
                        </Text>
                      </Text>
                    </Pressable>
                  )}
                  {open &&
                    items.map((club) => {
                      const selected = chosenClub?.id === club.id;
                      return (
                        <Pressable
                          key={club.id}
                          onPress={() => setChosenClub(club)}
                          style={[
                            styles.clubRow,
                            selected && {
                              borderColor: club.primary,
                              backgroundColor: "#ffffff",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.colourDot,
                              { backgroundColor: club.primary },
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.clubName}>{club.name}</Text>
                            <Text style={styles.clubLeague}>
                              {club.stadiumLocation}
                            </Text>
                          </View>
                          {selected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={21}
                              color={ONBOARDING_GOLD_DEEP}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                </View>
              );
            })}
            {groupedClubs.length === 0 && (
              <Text style={styles.searchEmpty}>
                No match here. Choose any club now — worldwide search is
                available any time under My Club.
              </Text>
            )}
          </ScrollView>

          {chosenClub && (
            <View style={styles.chosenChipRow}>
              <View
                style={[
                  styles.colourDot,
                  { backgroundColor: chosenClub.primary, width: 16, height: 16 },
                ]}
              />
              <Text numberOfLines={1} style={styles.chosenChipText}>
                {chosenClub.name}
              </Text>
            </View>
          )}
          <PrimaryButton
            label="CONTINUE"
            disabled={!chosenClub}
            onPress={() => chosenClub && setStep("first")}
          />
        </KeyboardAvoidingView>
      </Shell>
    );
  }

  // ---------- FIRST TICKET ----------
  return (
    <Shell header={renderHeader()}>
      <View style={styles.firstBody}>
        <Text style={styles.firstTitle}>Find your first memory</Text>
        <Text style={styles.firstCopy}>
          There&apos;s a ticket in a coat pocket, a wallet or a drawer from
          2019. Go get it — we&apos;ll wait.
        </Text>

        <View style={styles.firstSteps}>
          {[
            ["📷", "Photograph or import it"],
            ["🔍", "We read it and find the exact fixture"],
            ["✅", "You confirm — then it's framed"],
          ].map(([icon, text]) => (
            <View key={text} style={styles.firstStepRow}>
              <Text style={{ fontSize: 16 }}>{icon}</Text>
              <Text style={styles.firstStepText}>{text}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          label="SCAN MY TICKET"
          accent={chosenClub?.primary ?? ONBOARDING_SHELL}
          onPress={() =>
            chosenClub && onComplete(chosenClub, { openScanner: true })
          }
        />
        <GhostButton
          label="I'LL ADD ONE LATER"
          onPress={() =>
            chosenClub && onComplete(chosenClub, { openScanner: false })
          }
        />
        <Text style={styles.firstFinePrint}>
          Your collection stays private and offline unless you share a frame.
        </Text>
      </View>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */

function Shell({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.shell}>
      <View style={{ height: 46 }} />
      {header}
      <View style={styles.sheet}>{children}</View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  accent,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accent?: string;
}) {
  const background = accent ?? ONBOARDING_SHELL;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: background,
          opacity: disabled ? 0.35 : pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.primaryButtonText,
          { color: readableOnCream(background) },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghostButton, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.ghostButtonText}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: ONBOARDING_SHELL },
  sheet: {
    flex: 1,
    backgroundColor: ONBOARDING_CREAM,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3a5246",
  },
  backPlaceholder: { width: 34 },
  dots: { flexDirection: "row", gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#3a5246" },
  dotActive: { backgroundColor: ONBOARDING_GOLD, width: 18 },
  skipText: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "800",
    color: "#7d9488",
  },

  heroBody: { flex: 1, justifyContent: "center" },
  heroKicker: {
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: "800",
    color: ONBOARDING_GOLD_DEEP,
  },
  heroTitle: {
    fontFamily: "Georgia",
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    color: ONBOARDING_INK,
    marginTop: 10,
  },
  heroRule: {
    width: 64,
    height: 3,
    backgroundColor: ONBOARDING_GOLD,
    marginTop: 18,
    borderRadius: 2,
  },
  heroSubtitle: {
    fontFamily: "Georgia",
    fontStyle: "italic",
    fontSize: 19,
    lineHeight: 27,
    color: "#4c554e",
    marginTop: 18,
  },
  heroBodyCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: "#555044",
    marginTop: 14,
    maxWidth: 300,
  },
  heroFinePrint: {
    textAlign: "center",
    fontSize: 11,
    color: "#8b8578",
    marginTop: 10,
  },

  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 14,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  ghostButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#cfc6ae",
  },
  ghostButtonText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: ONBOARDING_GOLD_DEEP,
  },

  clubTitle: {
    fontFamily: "Georgia",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: ONBOARDING_INK,
  },
  clubSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#555044",
    marginTop: 8,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8cfb8",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: ONBOARDING_INK, padding: 0 },
  leagueTitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
    color: ONBOARDING_GOLD_DEEP,
    marginTop: 12,
    marginBottom: 6,
  },
  leagueChevron: { color: "#a39c8d" },
  clubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  colourDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  clubName: { fontSize: 15, fontWeight: "700", color: ONBOARDING_INK },
  clubLeague: { fontSize: 11, color: "#8b8578", marginTop: 1 },
  searchEmpty: {
    fontSize: 13,
    lineHeight: 19,
    color: "#555044",
    textAlign: "center",
    marginTop: 24,
  },
  chosenChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  chosenChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: ONBOARDING_INK,
    maxWidth: 260,
  },

  firstBody: { flex: 1, justifyContent: "center" },
  firstTitle: {
    fontFamily: "Georgia",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: ONBOARDING_INK,
  },
  firstCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: "#555044",
    marginTop: 12,
  },
  firstSteps: { marginVertical: 24, gap: 12 },
  firstStepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  firstStepText: { fontSize: 14, fontWeight: "600", color: ONBOARDING_INK },
  firstFinePrint: {
    textAlign: "center",
    fontSize: 11,
    color: "#8b8578",
    marginTop: 12,
  },
});
