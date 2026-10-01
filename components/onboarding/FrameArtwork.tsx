/* eslint-disable react-hooks/immutability */
// V3.7 — Shared artwork primitives for the first-launch experience.
// Pure React Native views: no image assets, no engine coupling.

import { useEffect, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";

export const ONBOARDING_INK = "#17221c";
export const ONBOARDING_CREAM = "#f5f1e8";
export const ONBOARDING_SHELL = "#10261c";
export const ONBOARDING_GOLD = "#b88d36";
export const ONBOARDING_GOLD_DEEP = "#8b6b24";

function readableTextColour(background: string): string {
  const hex = background.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 168 ? "#10261c" : "#ffffff";
}

export function Appear({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 280 }),
    );
  }, [delay, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const BAR_PATTERN = [3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 1];

function Barcode({ seed }: { seed: string }) {
  const bars = [];
  let acc = seed.length;
  for (let i = 0; i < 28; i += 1) {
    acc = (acc * 31 + seed.charCodeAt(i % seed.length)) % 997;
    bars.push(BAR_PATTERN[(acc + i) % BAR_PATTERN.length]);
  }
  return (
    <View style={art.barcode}>
      {bars.map((width, index) => (
        <View
          key={index}
          style={{
            width,
            height: 30,
            backgroundColor: ONBOARDING_INK,
            marginRight: 1,
          }}
        />
      ))}
    </View>
  );
}

export function DemoTicketView({
  homeTeam,
  awayTeam,
  competition,
  venue,
  dateLabel,
  kickoffLabel,
  gateTime,
  season,
  seat,
  ticketNo,
  category,
  price,
  club,
}: {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  venue: string;
  dateLabel: string;
  kickoffLabel: string;
  gateTime: string;
  season: string;
  seat: { stand: string; block: string; row: string; seat: string };
  ticketNo: string;
  category: string;
  price: string;
  club: { name: string; primary: string; secondary: string };
}) {
  const headerText = readableTextColour(club.primary);
  const infoRows: Array<[string, string]> = [
    ["DATE", dateLabel],
    ["KICK OFF", kickoffLabel],
    ["COMPETITION", competition],
    ["VENUE", venue],
    ["GATE OPENS", gateTime],
  ];
  return (
    <View style={art.ticket}>
      <View style={[art.ticketHeader, { backgroundColor: club.primary }]}>
        <Text
          numberOfLines={1}
          style={[art.ticketHeaderText, { color: headerText }]}
        >
          OFFICIAL MATCH TICKET
        </Text>
        <Text style={[art.ticketHeaderSeason, { color: headerText }]}>
          {season}
        </Text>
      </View>

      <View style={art.ticketBody}>
        <Text numberOfLines={1} style={art.teamLine}>
          {homeTeam}
        </Text>
        <Text style={art.vsLine}>VERSUS</Text>
        <Text numberOfLines={1} style={art.teamLine}>
          {awayTeam}
        </Text>

        <View style={art.infoGrid}>
          {infoRows.map(([label, value]) => (
            <View key={label} style={art.infoRow}>
              <Text style={art.infoLabel}>{label}</Text>
              <Text numberOfLines={1} style={art.infoValue}>
                {value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={art.perforation}>
        {Array.from({ length: 34 }).map((_, index) => (
          <View key={index} style={art.perforationDot} />
        ))}
      </View>

      <View style={art.stubRow}>
        <View style={{ flex: 1 }}>
          <Text style={art.seatStand} numberOfLines={1}>
            {seat.stand}
          </Text>
          <Text style={art.seatDetails}>
            BLOCK {seat.block} · ROW {seat.row} · SEAT {seat.seat}
          </Text>
          <Text style={art.stubMeta}>
            {category} · {price}
          </Text>
        </View>
        <Barcode seed={ticketNo} />
      </View>

      <View style={[ art.ticketFooter, { backgroundColor: club.primary } ]}>
        <Text
          numberOfLines={1}
          style={[art.ticketFooterText, { color: headerText }]}
        >
          {ticketNo}
        </Text>
      </View>
    </View>
  );
}

export function FramedTicket(props: Parameters<typeof DemoTicketView>[0]) {
  return (
    <View>
      <View
        style={[
          art.frameOuter,
          { backgroundColor: props.club.primary },
        ]}
      >
        <View style={art.frameMat}>
          <DemoTicketView {...props} />
          <Text style={art.frameCaption}>
            {props.venue} · {props.dateLabel} · {props.kickoffLabel}
          </Text>
          <Text style={art.frameCompetition}>{props.competition}</Text>
        </View>
      </View>
      <View style={art.seasonChip}>
        <Text style={art.seasonChipText}>SEASON {props.season}</Text>
      </View>
    </View>
  );
}

const art = StyleSheet.create({
  frameOuter: {
    borderRadius: 6,
    padding: 9,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  frameMat: {
    backgroundColor: "#faf6ec",
    borderRadius: 3,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2dac4",
  },
  frameCaption: {
    fontFamily: "Georgia",
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 13,
    color: ONBOARDING_INK,
    marginTop: 10,
  },
  frameCompetition: {
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
    color: ONBOARDING_GOLD_DEEP,
    marginTop: 3,
  },
  seasonChip: {
    alignSelf: "center",
    marginTop: -9,
    backgroundColor: ONBOARDING_SHELL,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ONBOARDING_GOLD,
  },
  seasonChipText: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "800",
    color: ONBOARDING_GOLD,
  },

  ticket: {
    backgroundColor: "#fffdf7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ded5bd",
    overflow: "hidden",
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ticketHeaderText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    flexShrink: 1,
  },
  ticketHeaderSeason: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginLeft: 8,
  },
  ticketBody: { paddingHorizontal: 14, paddingTop: 13, paddingBottom: 11 },
  teamLine: {
    fontFamily: "Georgia",
    fontSize: 19,
    fontWeight: "700",
    color: ONBOARDING_INK,
    textAlign: "center",
  },
  vsLine: {
    textAlign: "center",
    fontSize: 8,
    letterSpacing: 3,
    color: ONBOARDING_GOLD_DEEP,
    fontWeight: "800",
    marginVertical: 3,
  },
  infoGrid: { marginTop: 11, gap: 3 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoLabel: {
    width: 86,
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: "#8b8578",
  },
  infoValue: { flex: 1, fontSize: 11, fontWeight: "600", color: ONBOARDING_INK },
  perforation: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginVertical: 7,
  },
  perforationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ded5bd",
  },
  stubRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
  },
  seatStand: { fontSize: 11, fontWeight: "800", color: ONBOARDING_INK },
  seatDetails: { fontSize: 9, letterSpacing: 1, color: "#555044", marginTop: 2 },
  stubMeta: { fontSize: 9, color: "#8b8578", marginTop: 2 },
  barcode: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingRight: 2,
  },
  ticketFooter: { paddingVertical: 5, paddingHorizontal: 12 },
  ticketFooterText: { fontSize: 8, letterSpacing: 1.5, fontWeight: "700" },
});

export { readableTextColour };
