import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HistoryCompetitionSelector({
  label,
  options,
  selected,
  open,
  accent,
  onToggle,
  onSelect,
}: {
  label?: string;
  options: string[];
  selected: string;
  open: boolean;
  accent: string;
  onToggle: () => void;
  onSelect: (option: string) => void;
}) {
  return (
    <View style={styles.root}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.trigger,
          { borderColor: accent, opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <Text style={styles.selected} numberOfLines={1}>
          {label ? `${label}: ${selected}` : selected}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={22}
          color={accent}
        />
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          {options.map((option) => (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.option,
                pressed || option === selected ? styles.optionActive : null,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  option === selected ? styles.optionTextActive : null,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: 10 },
  trigger: {
    minHeight: 42,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selected: { flex: 1, fontSize: 14, fontWeight: "800", color: "#17221c" },
  menu: {
    borderWidth: 1,
    borderColor: "#c9c2b1",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    marginTop: 5,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d8d2c5",
  },
  optionActive: { backgroundColor: "#eee9df" },
  optionText: { fontSize: 16, fontWeight: "700", color: "#17221c" },
  optionTextActive: { fontWeight: "900" },
});
