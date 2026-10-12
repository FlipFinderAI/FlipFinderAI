import { Image, StyleSheet, Text, View } from "react-native";
import { fixtureClubBadgeForName } from "@/lib/fixtureClubBadges";

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
  const badge = fixtureClubBadgeForName(name);

  return (
    <View
      style={[styles.badge, { backgroundColor, borderColor }]}
      accessibilityLabel={badge ? `${name} club badge` : `${name} initials`}
    >
      {badge ? (
        <Image
          source={badge}
          resizeMode="contain"
          style={styles.image}
          accessible={false}
        />
      ) : (
        <Text style={[styles.fallback, { color: textColor }]}>
          {initials}
        </Text>
      )}
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
    overflow: "hidden",
  },
  image: {
    width: "85%",
    height: "85%",
  },
  fallback: {
    fontSize: 17,
    fontWeight: "900",
  },
});
