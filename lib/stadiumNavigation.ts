import { Alert, Linking, Platform } from "react-native";

type StadiumNavigationOptions = {
  name: string;
  latitude: number;
  longitude: number;
};

export async function openStadiumNavigation({
  name,
  latitude,
  longitude,
}: StadiumNavigationOptions) {
  const encodedName = encodeURIComponent(name);

  const appleMaps = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedName}`;
  const googleMaps = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const waze = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  if (Platform.OS === "ios") {
    Alert.alert(
      "Navigate to stadium",
      name,
      [
        {
          text: "Apple Maps",
          onPress: () => Linking.openURL(appleMaps),
        },
        {
          text: "Google Maps",
          onPress: () => Linking.openURL(googleMaps),
        },
        {
          text: "Waze",
          onPress: () => Linking.openURL(waze),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
    );

    return;
  }

  await Linking.openURL(
    `geo:${latitude},${longitude}?q=${encodedName}`,
  );
}
