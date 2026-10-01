import { StyleSheet, Text, View } from "react-native";

type FavouriteClubBadgeProps = {
  name: string;
  initials: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

export default function FavouriteClubBadge({
  name,
  initials,
  backgroundColor,
  borderColor,
  textColor,
}: FavouriteClubBadgeProps) {
  return (
    <View
      style={[styles.badge, { backgroundColor, borderColor }]}
      accessibilityLabel={`${name} initials`}
    >
      <Text style={[styles.fallback, { color: textColor }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: "100%",
    height: "100%",
    borderRadius: 23,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    fontSize: 17,
    fontWeight: "900",
  },
});
