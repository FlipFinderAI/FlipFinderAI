import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { visibleInkOnCream } from "@/lib/colorUtils";
import { CURRENT_SEASON } from "@/lib/fixtures";
import { useLanguage } from "@/lib/localization";

export type FixtureMode =
  | "fixtures"
  | "table"
  | "champions"
  | "europa"
  | "conference";

export default function FixturesHeader({
  clubName,
  league,
  primaryColour,
  updatedLabel,
  loading,
  mode,
  onRefresh,
  onModeChange,
  showChampionsLeague = false,
  showEuropaLeague = false,
  showConferenceLeague = false,
}: {
  clubName: string;
  league: string;
  primaryColour: string;
  updatedLabel: string | null;
  loading: boolean;
  mode: FixtureMode;
  onRefresh: () => void;
  onModeChange: (mode: FixtureMode) => void;
  showChampionsLeague?: boolean;
  showEuropaLeague?: boolean;
  showConferenceLeague?: boolean;
}) {
  const { t } = useLanguage();
  const inkColour = visibleInkOnCream(primaryColour);

  return (
    <View style={styles.header}>
      <Text style={styles.kicker}>{t("Fixtures").toUpperCase()}</Text>
      <View style={styles.titleRow}>
        <Text numberOfLines={1} style={styles.title}>
          {clubName}
        </Text>
        <Pressable
          onPress={onRefresh}
          disabled={loading}
          accessibilityLabel="Refresh fixtures and league table"
          style={styles.refreshButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color={inkColour} />
          ) : (
            <Ionicons name="refresh" size={20} color={inkColour} />
          )}
        </Pressable>
      </View>
      <Text style={styles.subtext}>
        {league} · Season {CURRENT_SEASON.replace("-", "/")}
        {updatedLabel ? ` · Last updated: ${updatedLabel}` : ""}
      </Text>
      <View style={styles.modeRow}>
        {([
          "fixtures",
          "table",
          ...(showChampionsLeague ? (["champions"] as const) : []),
          ...(showEuropaLeague ? (["europa"] as const) : []),
          ...(showConferenceLeague ? (["conference"] as const) : []),
        ] as FixtureMode[]).map((nextMode) => (
          <Pressable
            key={nextMode}
            unstable_pressDelay={0}
            onPressIn={() => onModeChange(nextMode)}
            onPress={() => onModeChange(nextMode)}
            style={({ pressed }) => [
              styles.modeTab,
              mode === nextMode && {
                borderColor: primaryColour,
                backgroundColor: `${primaryColour}12`,
              },
              {
                flex: 1,
                opacity: pressed ? 0.62 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text style={styles.modeText}>
              {nextMode === "fixtures"
                ? t("Fixtures").toUpperCase()
                : nextMode === "table"
                  ? t("League Table").toUpperCase()
                  : nextMode === "champions"
                    ? "CHAMPIONS LEAGUE"
                    : nextMode === "europa"
                      ? "EUROPA LEAGUE"
                      : "CONFERENCE LEAGUE"}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#f5f1e8",
    borderBottomWidth: 1,
    borderBottomColor: "#e2dccb",
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#8b6b24",
    fontWeight: "800",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  title: {
    flex: 1,
    fontFamily: "Georgia",
    fontSize: 42,
    lineHeight: 45,
    color: "#17221c",
    marginTop: 9,
    marginBottom: 0,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#cccccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  subtext: { marginTop: 4, fontSize: 12, color: "#657069" },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    width: "100%",
  },
  modeTab: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#cccccc",
    backgroundColor: "#ffffff",
  },
  modeText: {
    fontWeight: "800",
    fontSize: 13,
    textAlign: "center",
    width: "100%",
  },
});
