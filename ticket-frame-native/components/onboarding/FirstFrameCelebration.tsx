/* eslint-disable react-hooks/immutability */
// V3.7 — "Your first memory is framed." celebration.
// Shown once, immediately after the first real ticket is saved following
// onboarding. Pure presentation: reads only the fields handed to it.

import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { FramedTicket } from "./FrameArtwork";

export type CelebrationTicket = Parameters<typeof FramedTicket>[0];

export default function FirstFrameCelebration({
  ticket,
  clubName,
  onContinue,
}: {
  ticket: CelebrationTicket;
  clubName: string;
  onContinue: () => void;
}) {
  const backdrop = useSharedValue(0);
  const card = useSharedValue(0);

  useEffect(() => {
    backdrop.value = withTiming(1, { duration: 260 });
    card.value = withSpring(1, { damping: 14, stiffness: 120, mass: 0.9 });
  }, [backdrop, card]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [
      { scale: 0.92 + card.value * 0.08 },
      { translateY: (1 - card.value) * 30 },
    ],
  }));

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.kicker}>FRAME №1</Text>
        <Text style={styles.title}>Your first memory{"\n"}is framed.</Text>

        <View style={styles.frameWrap}>
          <FramedTicket {...ticket} />
        </View>

        <Text style={styles.caption}>
          {ticket.homeTeam} vs {ticket.awayTeam} · {ticket.dateLabel}
          {"\n"}
          {clubName}&apos;s story starts here.
        </Text>

        <Pressable
          accessibilityLabel="Continue to your collection"
          onPress={onContinue}
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="albums" size={16} color="#f2d29b" />
          <Text style={styles.buttonText}>VIEW MY COLLECTION</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: 26,
    zIndex: 60,
    elevation: 60,
  },
  backdrop: {
    backgroundColor: "rgba(12,22,17,0.9)",
  },
  card: {
    backgroundColor: "#f5f1e8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d9cfb6",
    padding: 24,
    alignItems: "center",
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "800",
    color: "#8b6b24",
  },
  title: {
    fontFamily: "Georgia",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
    color: "#17221c",
    textAlign: "center",
    marginTop: 8,
  },
  frameWrap: { alignItems: "center", marginVertical: 20 },
  caption: {
    fontFamily: "Georgia",
    fontStyle: "italic",
    fontSize: 13,
    lineHeight: 19,
    color: "#555044",
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#10261c",
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 15,
    alignSelf: "stretch",
    justifyContent: "center",
    marginTop: 18,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "#f2d29b",
  },
});
