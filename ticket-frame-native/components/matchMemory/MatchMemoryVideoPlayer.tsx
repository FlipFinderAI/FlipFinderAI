import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useEvent } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";

export default function MatchMemoryVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (createdPlayer) => {
    createdPlayer.play();
  });
  const { status, error: videoError } = useEvent(player, "statusChange", {
    status: player.status,
    error: undefined,
  });

  useEffect(() => {
    if (status !== "error") return;
    console.log(
      "[MATCH-VIDEO-ERROR]",
      JSON.stringify({
        uri,
        status,
        error: videoError?.message ?? String(videoError ?? "Unknown video error"),
      }),
    );
  }, [status, uri, videoError]);

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        // Fast refresh/navigation can dispose Expo's native shared player
        // immediately before React runs this cleanup.
      }
    };
  }, [player]);

  return (
    <View
      style={{
        width: "100%",
        aspectRatio: 16 / 9,
        backgroundColor: "#000",
        borderRadius: 12,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {status !== "error" ? (
        <VideoView
          player={player}
          nativeControls
          contentFit="contain"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {status === "loading" || status === "idle" ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : null}
      {status === "error" ? (
        <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center", padding: 16 }}>
          This copy could not play. Tap Video again to retry.
        </Text>
      ) : null}
    </View>
  );
}
