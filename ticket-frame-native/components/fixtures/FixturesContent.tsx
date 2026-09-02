import type { ReactElement } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  type ListRenderItem,
} from "react-native";

import type { FixtureRow, TableRow } from "@/lib/fixtures";
import type { FixtureMode } from "./FixturesHeader";
import { FixturesEmpty, LeagueTableHeader } from "./FixturesStatus";

export default function FixturesContent({
  mode,
  loading,
  fixtures,
  tableRows,
  tableSeason,
  updatedLabel,
  nextMatchCard,
  renderFixtureRow,
  renderTableRow,
}: {
  mode: FixtureMode;
  loading: boolean;
  fixtures: FixtureRow[];
  tableRows: TableRow[];
  tableSeason: string;
  updatedLabel: string | null;
  nextMatchCard: ReactElement | null;
  renderFixtureRow: ListRenderItem<FixtureRow>;
  renderTableRow: ListRenderItem<TableRow>;
}) {
  const hasFixtures = fixtures.length > 0;
  const hasTable = tableRows.length > 0;
  const hasCurrentContent = mode === "table" ? hasTable : hasFixtures;

  if (loading && !hasCurrentContent) {
    return <ActivityIndicator style={styles.loading} />;
  }

  if (mode === "fixtures") {
    return (
      <FlatList
        data={fixtures}
        keyExtractor={(row, index) => row.id || `${row.date}-${index}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          nextMatchCard ??
          (hasFixtures ? (
            <FixturesEmpty>Season complete — no matches left.</FixturesEmpty>
          ) : null)
        }
        ListEmptyComponent={
          <FixturesEmpty>No fixtures found for this season yet.</FixturesEmpty>
        }
        renderItem={renderFixtureRow}
      />
    );
  }

  if (hasTable) {
    return (
      <FlatList
        data={tableRows}
        keyExtractor={(row, index) => row.teamId || row.name || String(index)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <LeagueTableHeader
            season={tableSeason}
            updatedLabel={updatedLabel}
          />
        }
        ListEmptyComponent={
          <FixturesEmpty>No league table published yet.</FixturesEmpty>
        }
        renderItem={renderTableRow}
      />
    );
  }

  return <Text style={styles.noTable}>No league table published yet.</Text>;
}

const styles = StyleSheet.create({
  loading: { marginTop: 32 },
  list: { backgroundColor: "#f5f1e8" },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#f5f1e8",
  },
  noTable: { color: "#657069", lineHeight: 20, paddingHorizontal: 16 },
});
