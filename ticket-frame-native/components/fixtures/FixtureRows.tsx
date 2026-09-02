import { StyleSheet, Text, View } from "react-native";

import { readableTextColour, visibleInkOnCream } from "@/lib/colorUtils";
import {
  formatFixtureDay,
  formatKickoffTime,
} from "@/lib/matchDisplayFormatting";
import { CURRENT_SEASON, isFixturePlayed, type FixtureRow, type TableRow } from "@/lib/fixtures";
import { clubNamesMatch } from "@/lib/ticketText";

export function FixtureListRow({
  item,
  nextMatchId,
  clubName,
  primaryColour,
}: {
  item: FixtureRow;
  nextMatchId?: string;
  clubName: string;
  primaryColour: string;
}) {
  const played = isFixturePlayed(item);
  const isNext = nextMatchId != null && item.id === nextMatchId;
  const prior = item.season !== CURRENT_SEASON;
  const home = clubNamesMatch(item.homeName, clubName);
  const kickoffTime = formatKickoffTime(item.kickoff);

  return (
    <View
      style={[
        styles.fixtureCard,
        isNext && {
          borderColor: primaryColour,
          backgroundColor: `${primaryColour}12`,
          borderWidth: 2,
        },
        played && !isNext && { opacity: 0.72 },
      ]}
    >
      <View style={styles.fixtureMetaRow}>
        <Text style={styles.fixtureMeta}>
          {prior ? `${item.season.replace("-", "/")} · ` : ""}
          {formatFixtureDay(item.date)}
          {!played && kickoffTime ? ` · KO ${kickoffTime}` : ""}
        </Text>
        {isNext ? (
          <Text style={[styles.fixtureNextBadge, { color: visibleInkOnCream(primaryColour) }]}>
            NEXT MATCH
          </Text>
        ) : null}
      </View>
      <View style={styles.fixtureMainRow}>
        <View
          style={[
            styles.fixtureHomeAwayChip,
            { backgroundColor: home ? primaryColour : "#e5e0d5" },
          ]}
        >
          <Text
            style={[
              styles.homeAwayText,
              { color: home ? readableTextColour(primaryColour) : "#657069" },
            ]}
          >
            {home ? "H" : "A"}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.fixtureTeams}>
          <Text style={{ fontWeight: home ? "800" : "400" }}>
            {item.homeName || "?"}
          </Text>
          {" v "}
          <Text style={{ fontWeight: !home ? "800" : "400" }}>
            {item.awayName || "?"}
          </Text>
        </Text>
        {played ? (
          <Text style={styles.fixtureScore}>
            {item.homeScore} - {item.awayScore}
          </Text>
        ) : (
          <Text style={[styles.fixtureScore, { color: visibleInkOnCream(primaryColour) }]}>
            {kickoffTime ?? "TBC"}
          </Text>
        )}
      </View>
      {item.competition ? (
        <Text numberOfLines={1} style={styles.fixtureCompetition}>
          {item.competition}
        </Text>
      ) : null}
    </View>
  );
}

export function LeagueTableRow({
  item,
  index,
  selectedTeamId,
  selectedTeamName,
  primaryColour,
}: {
  item: TableRow;
  index: number;
  selectedTeamId: string;
  selectedTeamName: string;
  primaryColour: string;
}) {
  const mine =
    item.teamId === selectedTeamId || clubNamesMatch(item.name, selectedTeamName);
  const cellStyle = mine ? styles.tableCellMine : null;

  return (
    <View
      style={[
        styles.tableRow,
        mine && {
          backgroundColor: `${primaryColour}18`,
          borderLeftColor: primaryColour,
        },
      ]}
    >
      <Text style={[styles.tableCellPos, cellStyle]}>{index + 1}</Text>
      <Text numberOfLines={1} style={[styles.tableTeam, cellStyle]}>
        {item.name}
      </Text>
      <Text style={[styles.tableCell, cellStyle]}>{item.played}</Text>
      <Text style={[styles.tableCell, cellStyle]}>{item.win}</Text>
      <Text style={[styles.tableCell, cellStyle]}>{item.draw}</Text>
      <Text style={[styles.tableCell, cellStyle]}>{item.loss}</Text>
      <Text style={[styles.tableCellWide, cellStyle]}>{item.goalsFor}</Text>
      <Text style={[styles.tableCellWide, cellStyle]}>{item.goalsAgainst}</Text>
      <Text style={[styles.tableCellWide, cellStyle]}>
        {item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
      </Text>
      <Text style={[styles.tableCellPts, cellStyle]}>{item.points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fixtureCard: {
    borderWidth: 1,
    borderColor: "#e5e0d5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  fixtureMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fixtureMeta: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#657069",
    textTransform: "uppercase",
  },
  fixtureNextBadge: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  fixtureMainRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fixtureHomeAwayChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  homeAwayText: { fontSize: 11, fontWeight: "900" },
  fixtureTeams: { flex: 1, fontSize: 15, color: "#10261c" },
  fixtureScore: {
    marginLeft: 8,
    minWidth: 56,
    textAlign: "right",
    fontSize: 17,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    color: "#10261c",
  },
  fixtureCompetition: {
    marginTop: 6,
    fontSize: 11,
    color: "#8b6b24",
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: "#eee9dc",
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  tableCellPos: { width: 26, textAlign: "right", fontSize: 13, marginRight: 6 },
  tableTeam: { flex: 1 },
  tableCell: { width: 30, textAlign: "right", fontSize: 13 },
  tableCellWide: { width: 34, textAlign: "right", fontSize: 13 },
  tableCellPts: {
    width: 36,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "900",
  },
  tableCellMine: { fontWeight: "900", color: "#10261c" },
});
