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
  championsLeagueTableRows,
  championsLeagueTableSeason,
  europaLeagueTableRows,
  europaLeagueTableSeason,
  conferenceLeagueTableRows,
  conferenceLeagueTableSeason,
  updatedLabel,
  nextMatchCard,
  renderFixtureRow,
  renderTableRow,
  footer,
  onScrollBegin,
  onScrollEndDrag,
  onMomentumBegin,
  onMomentumEnd,
  onScrollActivity,
}: {
  mode: FixtureMode;
  loading: boolean;
  fixtures: FixtureRow[];
  tableRows: TableRow[];
  tableSeason: string;
  championsLeagueTableRows: TableRow[];
  championsLeagueTableSeason: string;
  europaLeagueTableRows: TableRow[];
  europaLeagueTableSeason: string;
  conferenceLeagueTableRows: TableRow[];
  conferenceLeagueTableSeason: string;
  updatedLabel: string | null;
  nextMatchCard: ReactElement | null;
  renderFixtureRow: ListRenderItem<FixtureRow>;
  renderTableRow: ListRenderItem<TableRow>;
  footer: ReactElement | null;
  onScrollBegin?: () => void;
  onScrollEndDrag?: () => void;
  onMomentumBegin?: () => void;
  onMomentumEnd?: () => void;
  onScrollActivity?: () => void;
}) {
  const hasFixtures = fixtures.length > 0;
  const hasTable = tableRows.length > 0;
  const hasChampionsLeagueTable = championsLeagueTableRows.length > 0;
  const hasEuropaLeagueTable = europaLeagueTableRows.length > 0;
  const hasConferenceLeagueTable = conferenceLeagueTableRows.length > 0;
  const hasCurrentContent =
    mode === "table"
      ? hasTable
      : mode === "champions"
        ? hasChampionsLeagueTable
        : mode === "europa"
          ? hasEuropaLeagueTable
          : mode === "conference"
            ? hasConferenceLeagueTable
            : hasFixtures;

  if (loading && !hasCurrentContent) {
    return <ActivityIndicator style={styles.loading} />;
  }

  if (mode === "fixtures") {
    return (
      <FlatList
        data={fixtures}
        keyExtractor={(row, index) => `${row.id || row.date}-${index}`}
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
        ListFooterComponent={footer}
        onScrollBeginDrag={onScrollBegin}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={onMomentumBegin}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={onScrollActivity}
        scrollEventThrottle={16}
      />
    );
  }

  const activeTableRows =
    mode === "champions"
      ? championsLeagueTableRows
      : mode === "europa"
        ? europaLeagueTableRows
        : mode === "conference"
          ? conferenceLeagueTableRows
          : tableRows;
  const activeTableSeason =
    mode === "champions"
      ? championsLeagueTableSeason
      : mode === "europa"
        ? europaLeagueTableSeason
        : mode === "conference"
          ? conferenceLeagueTableSeason
          : tableSeason;
  const hasActiveTable = activeTableRows.length > 0;

  if (hasActiveTable) {
    return (
      <FlatList
        data={activeTableRows}
        keyExtractor={(row, index) => row.teamId || row.name || String(index)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <LeagueTableHeader
            season={activeTableSeason}
            updatedLabel={updatedLabel}
          />
        }
        ListEmptyComponent={
          <FixturesEmpty>No league table published yet.</FixturesEmpty>
        }
        renderItem={renderTableRow}
        ListFooterComponent={footer}
        onScrollBeginDrag={onScrollBegin}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={onMomentumBegin}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={onScrollActivity}
        scrollEventThrottle={16}
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
