import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { readableTextColour, visibleInkOnCream } from "@/lib/colorUtils";
import { useLanguage } from "@/lib/localization";

export type MainTab = "frames" | "history" | "club" | "grounds" | "fixtures";

const NAV_ITEMS = [
  ["frames", "albums", "Home"],
  ["history", "book-outline", "History"],
  ["club", "football-outline", "My Club"],
  ["grounds", "location-outline", "Stadiums"],
  ["fixtures", "calendar-outline", "Fixtures"],
] as const;

export function BottomNavigation({
  activeTab,
  primaryColour,
  secondaryColour,
  onOpenTab,
}: {
  activeTab: MainTab;
  primaryColour: string;
  secondaryColour: string;
  onOpenTab: (tab: MainTab) => void;
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.nav}>
      {NAV_ITEMS.map(([tab, icon, label]) => {
        const active = activeTab === tab;
        const backgroundColor = active ? primaryColour : secondaryColour;
        const foregroundColour = readableTextColour(backgroundColor);

        return (
          <Pressable
            key={tab}
            unstable_pressDelay={0}
            onPressIn={() => {
              if (tab === "frames" || !active) onOpenTab(tab);
            }}
            onPress={() => onOpenTab(tab)}
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor,
                borderColor: primaryColour,
                opacity: pressed ? 0.68 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Ionicons name={icon} size={20} color={foregroundColour} />
            <Text style={[styles.navButtonText, { color: foregroundColour }]}>
              {t(label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BackToHomeButton({
  primaryColour,
  onPress,
  marginBottom = 18,
}: {
  primaryColour: string;
  onPress: () => void;
  marginBottom?: number;
}) {
  const { t } = useLanguage();
  const inkColour = visibleInkOnCream(primaryColour);

  return (
    <Pressable
      unstable_pressDelay={0}
      onPressIn={onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor: inkColour,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: "#ffffff",
        opacity: pressed ? 0.65 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        marginBottom,
      })}
      accessibilityLabel="Back to home"
    >
      <Ionicons name="arrow-back" size={16} color={inkColour} />
      <Text style={[styles.backText, { color: inkColour }]}>{t("Back to Home")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: {
    marginTop: 26,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#d8d1c2",
    flexDirection: "row",
    gap: 7,
  },
  navButton: {
    flex: 1,
    minHeight: 58,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navButtonText: { fontSize: 10, fontWeight: "900" },
  backText: { marginLeft: 6, fontSize: 13, fontWeight: "800" },
});
