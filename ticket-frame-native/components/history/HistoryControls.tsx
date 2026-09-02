import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

export function HistoryBackButton({
  onPress,
  label = "Back to History",
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      unstable_pressDelay={0}
      onPress={onPress}
      style={({ pressed }) => [
        styles.back,
        {
          opacity: pressed ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
      hitSlop={8}
    >
      <Ionicons name="arrow-back" size={18} color="#17221c" />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

export function MatchPhotoViewer({
  uri,
  onClose,
  loading = false,
  error,
  onRetry,
  onLoadStart,
  onLoadEnd,
  onImageError,
}: {
  uri: string;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onImageError?: () => void;
}) {
  return (
    <View style={styles.photoViewer}>
      <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
        <Ionicons name="close-circle" size={38} color="#ffffff" />
      </Pressable>
      <Image
        alt="Enlarged match memory"
        source={{ uri }}
        resizeMode="contain"
        style={styles.photo}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onImageError}
      />
      {loading ? (
        <View style={styles.photoStatus} pointerEvents="none">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.photoStatusText}>Loading photo…</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.photoError}>
          <Text style={styles.photoErrorTitle}>Photo could not open</Text>
          <Text style={styles.photoErrorText}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>TRY AGAIN</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 14, fontWeight: "800", color: "#17221c" },
  photoViewer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: "rgba(0,0,0,0.94)",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 22,
    zIndex: 2,
    padding: 10,
  },
  photo: { width: "100%", height: "88%" },
  photoStatus: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  photoStatusText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  photoError: {
    position: "absolute", left: 28, right: 28, alignItems: "center",
    padding: 22, borderRadius: 18, backgroundColor: "rgba(25,25,25,0.96)",
  },
  photoErrorTitle: { color: "#ffffff", fontSize: 20, fontWeight: "900" },
  photoErrorText: { color: "#dddddd", fontSize: 15, lineHeight: 21, textAlign: "center", marginTop: 8 },
  retryButton: { marginTop: 18, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22, backgroundColor: "#ffffff" },
  retryText: { color: "#111111", fontSize: 14, fontWeight: "900" },
});
