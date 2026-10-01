// Ticket Frame comprehensive guided Demo Mode.
//
// ISOLATION CONTRACT:
// - receives no live collection state or setters
// - performs no AsyncStorage reads or writes
// - uses display-only demo data
// - cannot mutate tickets, attendance, grounds, statistics or memories
// - exiting discards all demo playback state

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";

import {
  DEMO_CHAPTERS,
  DEMO_OWNER_NAME,
  DEMO_SCENES,
  type DemoChapterId,
} from "@/lib/demoGuide";
import {
  demoMatches,
  demoTicketById,
} from "@/lib/demoTickets";
import {
  FramedTicket,
  ONBOARDING_CREAM,
  ONBOARDING_GOLD_DEEP,
  ONBOARDING_INK,
  ONBOARDING_SHELL,
} from "../onboarding/FrameArtwork";

type Props = {
  onExit: () => void;
  onAddFirstTicket: () => void;
};

type PlayerMode = "menu" | "playing" | "finished";

const DEMO_PRIMARY = "#0f4c3a";
const DEMO_SECONDARY = "#f0dfb1";

function sceneIndexesForChapter(chapter: DemoChapterId): number[] {
  return DEMO_SCENES.map((scene, index) =>
    scene.chapter === chapter ? index : -1,
  ).filter((index) => index >= 0);
}

export default function DemoMode({ onExit, onAddFirstTicket }: Props) {
  const [mode, setMode] = useState<PlayerMode>("menu");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scene = DEMO_SCENES[sceneIndex];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopSpeech = useCallback(() => {
    void Speech.stop();
  }, []);

  const stopPlayback = useCallback(() => {
    clearTimer();
    stopSpeech();
  }, [clearTimer, stopSpeech]);

  useEffect(() => {
    return () => {
      clearTimer();
      void Speech.stop();
    };
  }, [clearTimer]);

  const goToScene = useCallback((nextIndex: number) => {
    const safeIndex = Math.max(
      0,
      Math.min(DEMO_SCENES.length - 1, nextIndex),
    );
    stopPlayback();
    setSceneIndex(safeIndex);
    setMode("playing");
    setPlaying(true);
  }, [stopPlayback]);

  const goNext = useCallback(() => {
    if (sceneIndex >= DEMO_SCENES.length - 1) {
      stopPlayback();
      setMode("finished");
      setPlaying(false);
      return;
    }
    goToScene(sceneIndex + 1);
  }, [goToScene, sceneIndex, stopPlayback]);

  const goPrevious = useCallback(() => {
    goToScene(Math.max(0, sceneIndex - 1));
  }, [goToScene, sceneIndex]);

  useEffect(() => {
    if (mode !== "playing" || !playing || !scene) {
      stopPlayback();
      return;
    }

    stopPlayback();

    if (narrationEnabled) {
      Speech.speak(scene.narration, {
        language: "en-GB",
        rate: 0.93,
        pitch: 1,
      });
    }

    timerRef.current = setTimeout(() => {
      if (sceneIndex >= DEMO_SCENES.length - 1) {
        stopPlayback();
        setPlaying(false);
        setMode("finished");
      } else {
        setSceneIndex((current) => current + 1);
      }
    }, scene.durationMs);

    return stopPlayback;
  }, [
    mode,
    narrationEnabled,
    playing,
    scene,
    sceneIndex,
    stopPlayback,
  ]);

  const startFullDemo = () => {
    stopPlayback();
    setSceneIndex(0);
    setMode("playing");
    setPlaying(true);
  };

  const startChapter = (chapter: DemoChapterId) => {
    const indexes = sceneIndexesForChapter(chapter);
    if (!indexes.length) return;
    goToScene(indexes[0]);
  };

  const togglePlayback = () => {
    if (mode !== "playing") return;
    if (playing) {
      stopPlayback();
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  };

  const toggleNarration = () => {
    stopSpeech();
    setNarrationEnabled((current) => !current);
  };

  const progress =
    mode === "finished"
      ? 1
      : (sceneIndex + 1) / Math.max(1, DEMO_SCENES.length);

  const demoTicket = demoTicketById("demo-pl");
  const demoMatch = demoMatches.find(
    (match) => match.ticketId === "demo-pl",
  );

  const visual = useMemo(() => {
    if (!scene) return null;

    if (
      scene.chapter === "tickets" &&
      demoTicket
    ) {
      return (
        <View style={styles.ticketVisual}>
          <FramedTicket
            homeTeam={demoTicket.homeTeam}
            awayTeam={demoTicket.awayTeam}
            competition={demoTicket.competition}
            venue={demoTicket.venue}
            dateLabel={demoTicket.dateLabel}
            kickoffLabel={demoTicket.kickoffLabel}
            gateTime={demoTicket.gateTime}
            season={demoTicket.season}
            seat={demoTicket.seat}
            ticketNo={demoTicket.ticketNo}
            category={demoTicket.category}
            price={demoTicket.price}
            club={demoTicket.club}
          />
          {demoMatch ? (
            <Text style={styles.resultText}>
              Final score: {demoMatch.homeTeam} {demoMatch.scoreHome}–
              {demoMatch.scoreAway} {demoMatch.awayTeam}
            </Text>
          ) : null}
        </View>
      );
    }

    const tabRows = [
      ["albums-outline", "Home"],
      ["book-outline", "History"],
      ["football-outline", "My Club"],
      ["location-outline", "Stadiums"],
      ["calendar-outline", "Fixtures"],
    ] as const;

    return (
      <View style={styles.phonePanel}>
        <View style={styles.phoneHeader}>
          <View>
            <Text style={styles.phoneBrand}>TICKET FRAME</Text>
            <Text style={styles.phoneOwner}>{DEMO_OWNER_NAME}</Text>
          </View>
          <Ionicons
            name={scene.icon}
            size={30}
            color={DEMO_PRIMARY}
          />
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureKicker}>
            {scene.chapterLabel.toUpperCase()}
          </Text>
          <Text style={styles.featureTitle}>{scene.title}</Text>
          <Text style={styles.featureBody}>
            {scene.caption}
          </Text>
        </View>

        <View style={styles.demoStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>MATCHES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>11</Text>
            <Text style={styles.statLabel}>STADIUMS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>SEASONS</Text>
          </View>
        </View>

        <View style={styles.fakeNav}>
          {tabRows.map(([icon, label]) => {
            const active =
              (scene.chapter === "home" && label === "Home") ||
              (scene.chapter === "history" && label === "History") ||
              (scene.chapter === "club" && label === "My Club") ||
              (scene.chapter === "stadiums" && label === "Stadiums") ||
              (scene.chapter === "fixtures" && label === "Fixtures");

            return (
              <View
                key={label}
                style={[
                  styles.fakeNavItem,
                  active && styles.fakeNavItemActive,
                ]}
              >
                <Ionicons
                  name={icon}
                  size={17}
                  color={active ? "#ffffff" : ONBOARDING_INK}
                />
                <Text
                  style={[
                    styles.fakeNavLabel,
                    active && styles.fakeNavLabelActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }, [demoMatch, demoTicket, scene]);

  if (mode === "menu") {
    return (
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.badge}>GUIDED DEMO</Text>
            <Text style={styles.topTitle}>Ticket Frame</Text>
          </View>
          <Pressable
            onPress={onExit}
            hitSlop={12}
            accessibilityLabel="Exit demo"
            style={styles.iconButton}
          >
            <Ionicons
              name="close"
              size={23}
              color={ONBOARDING_INK}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.menuContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heroKicker}>MEET {DEMO_OWNER_NAME.toUpperCase()}</Text>
          <Text style={styles.heroTitle}>
            See the complete Ticket Frame journey.
          </Text>
          <Text style={styles.heroBody}>
            A read-only guided tour using isolated demo information.
            Nothing here can change your real Ticket Frame collection.
          </Text>

          <Pressable
            onPress={startFullDemo}
            accessibilityLabel="Watch full demo"
            style={styles.watchButton}
          >
            <Ionicons
              name="play"
              size={21}
              color="#ffffff"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.watchTitle}>WATCH FULL DEMO</Text>
              <Text style={styles.watchSubtitle}>
                Automatic playback with captions and optional narration
              </Text>
            </View>
          </Pressable>

          <View style={styles.optionRow}>
            <Pressable
              onPress={toggleNarration}
              style={[
                styles.optionButton,
                narrationEnabled && styles.optionButtonActive,
              ]}
            >
              <Ionicons
                name={
                  narrationEnabled
                    ? "volume-high-outline"
                    : "volume-mute-outline"
                }
                size={18}
                color={ONBOARDING_INK}
              />
              <Text style={styles.optionText}>
                Narration {narrationEnabled ? "On" : "Off"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setCaptionsEnabled((current) => !current)
              }
              style={[
                styles.optionButton,
                captionsEnabled && styles.optionButtonActive,
              ]}
            >
              <Ionicons
                name="text-outline"
                size={18}
                color={ONBOARDING_INK}
              />
              <Text style={styles.optionText}>
                Captions {captionsEnabled ? "On" : "Off"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.chapterHeading}>
            OR CHOOSE A CHAPTER
          </Text>

          <View style={styles.chapterGrid}>
            {DEMO_CHAPTERS.filter(
              (chapter) =>
                chapter.id !== "welcome" &&
                chapter.id !== "finish",
            ).map((chapter) => (
              <Pressable
                key={chapter.id}
                onPress={() => startChapter(chapter.id)}
                style={({ pressed }) => [
                  styles.chapterCard,
                  pressed && { opacity: 0.65 },
                ]}
              >
                <Text style={styles.chapterCardText}>
                  {chapter.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={DEMO_PRIMARY}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.privacyNote}>
            Demo Mode is display-only and never reads or writes the
            supporter collection, attendance history, stadium history,
            photos, videos or statistics.
          </Text>
        </ScrollView>
      </View>
    );
  }

  if (mode === "finished") {
    return (
      <View style={styles.shell}>
        <View style={styles.finishPanel}>
          <Ionicons
            name="checkmark-circle"
            size={64}
            color={DEMO_PRIMARY}
          />
          <Text style={styles.finishKicker}>DEMO COMPLETE</Text>
          <Text style={styles.finishTitle}>
            Your football life, framed.
          </Text>
          <Text style={styles.finishBody}>
            You can replay the complete demonstration, revisit any
            chapter, or return to Ticket Frame.
          </Text>

          <Pressable
            onPress={startFullDemo}
            style={styles.watchButton}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#ffffff"
            />
            <Text style={styles.watchTitle}>REPLAY FULL DEMO</Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("menu")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              CHOOSE A CHAPTER
            </Text>
          </Pressable>

          <Pressable
            onPress={onAddFirstTicket}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              ADD MY FIRST TICKET
            </Text>
          </Pressable>

          <Pressable
            onPress={onExit}
            style={styles.exitButton}
          >
            <Text style={styles.exitButtonText}>
              RETURN TO TICKET FRAME
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <View style={styles.playerTopBar}>
        <Pressable
          onPress={() => {
            stopPlayback();
            setPlaying(false);
            setMode("menu");
          }}
          hitSlop={12}
          style={styles.iconButton}
        >
          <Ionicons
            name="grid-outline"
            size={21}
            color={ONBOARDING_INK}
          />
        </Pressable>

        <View style={styles.playerHeading}>
          <Text style={styles.playerKicker}>
            {scene.chapterLabel.toUpperCase()}
          </Text>
          <Text
            style={styles.playerTitle}
            numberOfLines={1}
          >
            {scene.title}
          </Text>
        </View>

        <Pressable
          onPress={onExit}
          hitSlop={12}
          style={styles.iconButton}
        >
          <Ionicons
            name="close"
            size={23}
            color={ONBOARDING_INK}
          />
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.playerContent}
        showsVerticalScrollIndicator={false}
      >
        {visual}

        {captionsEnabled ? (
          <View style={styles.captionPanel}>
            <Text style={styles.captionText}>
              {scene.caption}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.controls}>
        <Pressable
          onPress={goPrevious}
          disabled={sceneIndex === 0}
          style={[
            styles.controlButton,
            sceneIndex === 0 && styles.controlDisabled,
          ]}
        >
          <Ionicons
            name="play-skip-back"
            size={19}
            color={ONBOARDING_INK}
          />
        </Pressable>

        <Pressable
          onPress={togglePlayback}
          style={styles.playButton}
        >
          <Ionicons
            name={playing ? "pause" : "play"}
            size={24}
            color="#ffffff"
          />
        </Pressable>

        <Pressable
          onPress={goNext}
          style={styles.controlButton}
        >
          <Ionicons
            name="play-skip-forward"
            size={19}
            color={ONBOARDING_INK}
          />
        </Pressable>

        <Pressable
          onPress={toggleNarration}
          style={[
            styles.controlButton,
            narrationEnabled && styles.controlActive,
          ]}
        >
          <Ionicons
            name={
              narrationEnabled
                ? "volume-high-outline"
                : "volume-mute-outline"
            }
            size={19}
            color={ONBOARDING_INK}
          />
        </Pressable>

        <Pressable
          onPress={() =>
            setCaptionsEnabled((current) => !current)
          }
          style={[
            styles.controlButton,
            captionsEnabled && styles.controlActive,
          ]}
        >
          <Ionicons
            name="text-outline"
            size={19}
            color={ONBOARDING_INK}
          />
        </Pressable>
      </View>

      <Text style={styles.sceneCounter}>
        {sceneIndex + 1} of {DEMO_SCENES.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: ONBOARDING_SHELL,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#d8d1c2",
  },
  badge: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: DEMO_PRIMARY,
  },
  topTitle: {
    marginTop: 2,
    fontSize: 19,
    fontWeight: "900",
    color: ONBOARDING_INK,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9d1c2",
  },
  menuContent: {
    padding: 20,
    paddingBottom: 42,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: DEMO_PRIMARY,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 31,
    lineHeight: 35,
    fontWeight: "900",
    color: ONBOARDING_INK,
  },
  heroBody: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#4d4a43",
  },
  watchButton: {
    marginTop: 22,
    minHeight: 66,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: DEMO_PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  watchTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  watchSubtitle: {
    marginTop: 3,
    color: "#e5eee9",
    fontSize: 11,
    lineHeight: 15,
  },
  optionRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 9,
  },
  optionButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#cfc6b7",
    borderRadius: 11,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  optionButtonActive: {
    borderColor: DEMO_PRIMARY,
    backgroundColor: "#edf5f1",
  },
  optionText: {
    fontSize: 11,
    fontWeight: "800",
    color: ONBOARDING_INK,
  },
  chapterHeading: {
    marginTop: 26,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "#625e55",
  },
  chapterGrid: {
    gap: 8,
  },
  chapterCard: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#d5cdbf",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chapterCardText: {
    fontSize: 14,
    fontWeight: "800",
    color: ONBOARDING_INK,
  },
  privacyNote: {
    marginTop: 20,
    fontSize: 11,
    lineHeight: 16,
    color: "#6b675f",
  },
  playerTopBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playerHeading: {
    flex: 1,
    alignItems: "center",
  },
  playerKicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: DEMO_PRIMARY,
  },
  playerTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: ONBOARDING_INK,
  },
  progressTrack: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#ded8cc",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: ONBOARDING_GOLD_DEEP,
  },
  playerContent: {
    padding: 16,
    paddingBottom: 20,
  },
  phonePanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cfc7b9",
    backgroundColor: ONBOARDING_CREAM,
    padding: 14,
    overflow: "hidden",
  },
  phoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d7cfbf",
  },
  phoneBrand: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: DEMO_PRIMARY,
  },
  phoneOwner: {
    marginTop: 3,
    fontSize: 19,
    fontWeight: "900",
    color: ONBOARDING_INK,
  },
  featureCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9d1c4",
  },
  featureKicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: DEMO_PRIMARY,
  },
  featureTitle: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "900",
    color: ONBOARDING_INK,
  },
  featureBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#555149",
  },
  demoStats: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    minHeight: 68,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9d1c4",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: DEMO_PRIMARY,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: "#625e56",
  },
  fakeNav: {
    marginTop: 14,
    flexDirection: "row",
    gap: 5,
  },
  fakeNavItem: {
    flex: 1,
    minHeight: 52,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: DEMO_PRIMARY,
    backgroundColor: DEMO_SECONDARY,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  fakeNavItemActive: {
    backgroundColor: DEMO_PRIMARY,
  },
  fakeNavLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: ONBOARDING_INK,
  },
  fakeNavLabelActive: {
    color: "#ffffff",
  },
  ticketVisual: {
    gap: 12,
  },
  resultText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    color: ONBOARDING_INK,
  },
  captionPanel: {
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#171914",
  },
  captionText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  controls: {
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 5,
    flexDirection: "row",
    justifyContent: "center",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: "#d8d1c2",
  },
  controlButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbc3b6",
    alignItems: "center",
    justifyContent: "center",
  },
  controlActive: {
    borderColor: DEMO_PRIMARY,
    backgroundColor: "#eaf3ef",
  },
  controlDisabled: {
    opacity: 0.3,
  },
  playButton: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: DEMO_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -3,
  },
  sceneCounter: {
    paddingBottom: 7,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "800",
    color: "#777168",
  },
  finishPanel: {
    flex: 1,
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  finishKicker: {
    marginTop: 18,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: DEMO_PRIMARY,
  },
  finishTitle: {
    marginTop: 7,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
    color: ONBOARDING_INK,
  },
  finishBody: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#565149",
  },
  secondaryButton: {
    marginTop: 10,
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DEMO_PRIMARY,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: DEMO_PRIMARY,
    letterSpacing: 0.5,
  },
  exitButton: {
    marginTop: 10,
    minHeight: 42,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  exitButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#69645b",
  },
});
