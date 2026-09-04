import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

export type MatchPhotoViewerItem = {
  key: string;
  uri: string;
  loading?: boolean;
  error?: string | null;
};

export function MatchPhotoViewer({
  items,
  initialIndex = 0,
  onIndexChange,
  onClose,
  onRetry,
  onImageError,
}: {
  items: MatchPhotoViewerItem[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onClose: () => void;
  onRetry?: (index: number) => void;
  onImageError?: (index: number) => void;
}) {
  const width = Dimensions.get("window").width;
  const safeInitialIndex = Math.max(
    0,
    Math.min(initialIndex, Math.max(0, items.length - 1)),
  );

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!width) return;
    const nextIndex = Math.max(
      0,
      Math.min(
        Math.round(event.nativeEvent.contentOffset.x / width),
        Math.max(0, items.length - 1),
      ),
    );
    onIndexChange?.(nextIndex);
  };

  return (
    <View style={styles.photoViewer}>
      <ScrollView
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: safeInitialIndex * width, y: 0 }}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        style={styles.photoPager}
      >
        {items.map((item, index) => (
          <View key={item.key} style={[styles.photoPage, { width }]}>
            <ScrollView
              style={styles.photoZoom}
              contentContainerStyle={styles.photoZoomContent}
              minimumZoomScale={1}
              maximumZoomScale={5}
              bouncesZoom
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image
                alt="Enlarged match memory"
                source={{ uri: item.uri }}
                resizeMode="contain"
                style={[styles.photo, { width }]}
                onError={() => onImageError?.(index)}
              />
            </ScrollView>

            {item.loading ? (
              <View style={styles.photoLoadingPill} pointerEvents="none">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.photoLoadingPillText}>Loading full quality…</Text>
              </View>
            ) : null}

            {item.error ? (
              <View style={styles.photoError}>
                <Text style={styles.photoErrorTitle}>Photo could not open</Text>
                <Text style={styles.photoErrorText}>{item.error}</Text>
                {onRetry ? (
                  <Pressable
                    onPress={() => onRetry(index)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>TRY AGAIN</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.photoCounter} pointerEvents="none">
          <Text style={styles.photoCounterText}>
            {safeInitialIndex + 1} / {items.length}
          </Text>
        </View>
      ) : null}

      <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
        <Ionicons name="close-circle" size={38} color="#ffffff" />
      </Pressable>
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
  photoPager: {
    flex: 1,
  },
  photoPage: {
    height: "100%",
    justifyContent: "center",
  },
  photoZoom: {
    flex: 1,
  },
  photoZoomContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    height: "88%",
  },
  photoLoadingPill: {
    position: "absolute",
    bottom: 54,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  photoLoadingPillText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  photoCounter: {
    position: "absolute",
    top: 68,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 3,
  },
  photoCounterText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
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
