import { Pressable, StyleSheet, Text, View } from "react-native";

import { visibleInkOnCream } from "@/lib/colorUtils";
import { CURRENT_SEASON } from "@/lib/fixtures";

export function FixturesError({
  message,
  primaryColour,
  onRetry,
}: {
  message: string;
  primaryColour: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable onPress={onRetry}>
        <Text style={[styles.retryText, { color: visibleInkOnCream(primaryColour) }]}>
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

export function FixturesEmpty({ children }: { children: string }) {
  return <Text style={styles.emptyNote}>{children}</Text>;
}

export function LeagueTableHeader({
  season,
  updatedLabel,
}: {
  season: string;
  updatedLabel: string | null;
}) {
  return (
    <View style={styles.tableHeader}>
      <Text style={styles.tableDescription}>
        {season === CURRENT_SEASON
          ? `Live ${season.replace("-", "/")} table`
          : `${season.replace("-", "/")} final table`}
        {updatedLabel ? ` · Updated ${updatedLabel}` : ""}
      </Text>
      <View style={styles.tableHeadRow}>
        <Text style={[styles.tableHeadCell, styles.tableCellPos]}>#</Text>
        <Text style={[styles.tableHeadCell, styles.tableTeam]}>Club</Text>
        <Text style={[styles.tableHeadCell, styles.tableCell]}>P</Text>
        <Text style={[styles.tableHeadCell, styles.tableCell]}>W</Text>
        <Text style={[styles.tableHeadCell, styles.tableCell]}>D</Text>
        <Text style={[styles.tableHeadCell, styles.tableCell]}>L</Text>
        <Text style={[styles.tableHeadCell, styles.tableCellWide]}>GF</Text>
        <Text style={[styles.tableHeadCell, styles.tableCellWide]}>GA</Text>
        <Text style={[styles.tableHeadCell, styles.tableCellWide]}>GD</Text>
        <Text style={[styles.tableHeadCell, styles.tableCellPts]}>Pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fdecea",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  errorText: { flex: 1, color: "#8c2f24", lineHeight: 18 },
  retryText: { fontWeight: "800" },
  emptyNote: { textAlign: "center", color: "#657069", paddingVertical: 28 },
  tableHeader: { marginBottom: 6 },
  tableDescription: {
    color: "#657069",
    lineHeight: 20,
    marginBottom: 8,
  },
  tableHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: "#c9c2b1",
  },
  tableHeadCell: {
    fontWeight: "900",
    fontSize: 11,
    color: "#657069",
    textAlign: "right",
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
});
