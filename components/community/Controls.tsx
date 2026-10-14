import { Pressable, StyleSheet, Text } from "react-native";
export const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "900", color: "#101c14" }, heading: { fontSize: 21, fontWeight: "900", color: "#101c14", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#778078", borderRadius: 10, padding: 12, backgroundColor: "white", color: "#17221c" },
  button: { borderWidth: 2, borderRadius: 12, padding: 15, alignItems: "center" },
  copy: { color: "#17251b", fontWeight: "600", lineHeight: 23 },
});
export function Action({ title, onPress, disabled = false, colour = "#174a38" }: {
 title: string; onPress(): void; disabled?: boolean; colour?: string;
}) {
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
   onPress={onPress} style={({ pressed }) => [styles.button, { borderColor: colour, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
   <Text style={{ color: colour, fontWeight: "900", fontSize: 16 }}>{title}</Text>
 </Pressable>;
}
