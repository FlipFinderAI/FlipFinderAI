import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CommunityScreen() {
  const { clubName, colour } = useLocalSearchParams<{ clubName: string; colour: string }>();
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f5ec" }}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Pressable accessibilityRole="button" onPress={() => router.back()}><Text>Back to Ticket Frame</Text></Pressable>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colour || "#17221c" }}>COMMUNITY</Text>
      <Text>{clubName} supporters</Text>
      <Text>Community is off by default. Your tickets and Ticket Frame photos stay private.</Text>
    </ScrollView>
  </SafeAreaView>;
}
