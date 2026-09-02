/* eslint-disable react-hooks/immutability */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  ImageManipulator,
  SaveFormat,
} from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { completeTicketEdit } from "@/lib/ticketEditChannel";

const PREVIEW_W = 138;
const PREVIEW_H = 92;
const MIN_BOX = 44;
const HANDLE_HIT = 30;

type Dims = { w: number; h: number };

type Variant = { uri: string; width: number; height: number };

type HandleId = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

function getImageSize(uri: string): Promise<Dims> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ w: width, h: height }),
      reject,
    );
  });
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

export default function TicketEditScreen() {
  const params = useLocalSearchParams<{
    uri?: string;
    primary?: string;
    secondary?: string;
    mode?: string;
    ticketId?: string;
    aspectRatio?: string;
  }>();

  const sourceUri = params.uri ? decodeURIComponent(params.uri) : "";
  const isEditMode = params.mode === "edit";
  const editAspect = params.aspectRatio ? Number(params.aspectRatio) : NaN;
  const clubPrimary = params.primary
    ? decodeURIComponent(params.primary)
    : "#174532";
  const clubSecondary = params.secondary
    ? decodeURIComponent(params.secondary)
    : "#e8e2d3";

  const [workingUri, setWorkingUri] = useState(sourceUri);
  const [dims, setDims] = useState<Dims>({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const angleRef = useRef(0);
  const variantCacheRef = useRef(new Map<number, Variant>());

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const svImgW = useSharedValue(0);
  const svImgH = useSharedValue(0);
  const svCanvasW = useSharedValue(0);
  const svCanvasH = useSharedValue(0);
  const svBase = useSharedValue(1);

  const bx = useSharedValue(0);
  const by = useSharedValue(0);
  const bw = useSharedValue(0);
  const bh = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startH = useSharedValue(0);

  const base =
    dims.w && svCanvasW.value
      ? Math.max(svCanvasW.value / dims.w, svCanvasH.value / dims.h)
      : 1;

  useEffect(() => {
    svImgW.value = dims.w;
    svImgH.value = dims.h;
    svBase.value = base || 1;
  }, [base, dims.h, dims.w, svBase, svImgH, svImgW]);

  useEffect(() => {
    console.log(
      "[open-editor]",
      isEditMode ? "edit" : "import",
      params.ticketId ?? "",
      sourceUri,
    );
    if (!sourceUri) return;
    variantCacheRef.current.set(0, {
      uri: sourceUri,
      width: 0,
      height: 0,
    });
    getImageSize(sourceUri)
      .then((size) => {
        variantCacheRef.current.set(0, {
          uri: sourceUri,
          width: size.w,
          height: size.h,
        });
        setDims(size);
      })
      .catch(() => setError("Could not read the photo."));
  }, [isEditMode, params.ticketId, sourceUri]);

  useEffect(
    () => () => {
      completeTicketEdit(null);
    },
    [],
  );

  const resetTransform = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

  function resetCropBox() {
    const cw = svCanvasW.value;
    const ch = svCanvasH.value;
    if (!cw || !ch) return;
    bw.value = Math.round(cw * 0.74);
    bh.value = Math.round(ch * 0.56);
    bx.value = Math.round((cw - bw.value) / 2);
    by.value = Math.round((ch - bh.value) / 2);
  }

  function defaultBoxIfNeeded(cw: number, ch: number) {
    if (ready || !cw || !ch) return;
    let w = Math.round(cw * 0.74);
    let h = Math.round(ch * 0.56);
    if (isEditMode && Number.isFinite(editAspect) && editAspect > 0) {
      const maxW = cw * 0.88;
      const maxH = ch * 0.88;
      w = Math.round(Math.min(maxW, maxH * editAspect));
      h = Math.round(w / editAspect);
      if (h > maxH) {
        h = Math.round(maxH);
        w = Math.round(h * editAspect);
      }
    }
    bw.value = w;
    bh.value = h;
    bx.value = Math.round((cw - w) / 2);
    by.value = Math.round((ch - h) / 2);
    setReady(true);
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.25, Math.min(8, savedScale.value * event.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const combined = Gesture.Simultaneous(pinchGesture, panGesture);

  function makeResizeGesture(handle: HandleId) {
    return Gesture.Pan()
      .onStart(() => {
        startX.value = bx.value;
        startY.value = by.value;
        startW.value = bw.value;
        startH.value = bh.value;
      })
      .onUpdate((event) => {
        const dx = event.translationX;
        const dy = event.translationY;
        if (handle === "n" || handle === "nw" || handle === "ne") {
          const rawY = startY.value + dy;
          const maxY = startY.value + startH.value - MIN_BOX;
          by.value = Math.max(0, Math.min(maxY, rawY));
          bh.value = startH.value - (by.value - startY.value);
        }
        if (handle === "s" || handle === "sw" || handle === "se") {
          const rawH = startH.value + dy;
          bh.value = Math.max(
            MIN_BOX,
            Math.min(rawH, svCanvasH.value - startY.value),
          );
        }
        if (handle === "w" || handle === "nw" || handle === "sw") {
          const rawX = startX.value + dx;
          const maxX = startX.value + startW.value - MIN_BOX;
          bx.value = Math.max(0, Math.min(maxX, rawX));
          bw.value = startW.value - (bx.value - startX.value);
        }
        if (handle === "e" || handle === "ne" || handle === "se") {
          const rawW = startW.value + dx;
          bw.value = Math.max(
            MIN_BOX,
            Math.min(rawW, svCanvasW.value - startX.value),
          );
        }
      });
  }

  const resizeGestures: Record<HandleId, ReturnType<typeof Gesture.Pan>> = {
    nw: makeResizeGesture("nw"),
    ne: makeResizeGesture("ne"),
    sw: makeResizeGesture("sw"),
    se: makeResizeGesture("se"),
    n: makeResizeGesture("n"),
    s: makeResizeGesture("s"),
    e: makeResizeGesture("e"),
    w: makeResizeGesture("w"),
  };

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const boxAnimStyle = useAnimatedStyle(() => ({
    left: bx.value,
    top: by.value,
    width: bw.value,
    height: bh.value,
  }));

  const dimTopStyle = useAnimatedStyle(() => ({
    left: 0,
    top: 0,
    width: "100%",
    height: Math.max(0, by.value),
  }));

  const dimBottomStyle = useAnimatedStyle(() => ({
    left: 0,
    right: 0,
    bottom: 0,
    top: by.value + bh.value,
  }));

  const dimLeftStyle = useAnimatedStyle(() => ({
    left: 0,
    top: by.value,
    width: Math.max(0, bx.value),
    height: bh.value,
  }));

  const dimRightStyle = useAnimatedStyle(() => ({
    left: bx.value + bw.value,
    top: by.value,
    right: 0,
    height: bh.value,
  }));

  const gridV1 = useAnimatedStyle(() => ({ left: bw.value / 3 }));
  const gridV2 = useAnimatedStyle(() => ({ left: (bw.value * 2) / 3 }));
  const gridH1 = useAnimatedStyle(() => ({ top: bh.value / 3 }));
  const gridH2 = useAnimatedStyle(() => ({ top: (bh.value * 2) / 3 }));

  const handleNW = useAnimatedStyle(() => ({
    left: bx.value - HANDLE_HIT / 2,
    top: by.value - HANDLE_HIT / 2,
  }));
  const handleNE = useAnimatedStyle(() => ({
    left: bx.value + bw.value - HANDLE_HIT / 2,
    top: by.value - HANDLE_HIT / 2,
  }));
  const handleSW = useAnimatedStyle(() => ({
    left: bx.value - HANDLE_HIT / 2,
    top: by.value + bh.value - HANDLE_HIT / 2,
  }));
  const handleSE = useAnimatedStyle(() => ({
    left: bx.value + bw.value - HANDLE_HIT / 2,
    top: by.value + bh.value - HANDLE_HIT / 2,
  }));
  const handleN = useAnimatedStyle(() => ({
    left: bx.value + bw.value / 2 - HANDLE_HIT / 2,
    top: by.value - HANDLE_HIT / 2,
  }));
  const handleS = useAnimatedStyle(() => ({
    left: bx.value + bw.value / 2 - HANDLE_HIT / 2,
    top: by.value + bh.value - HANDLE_HIT / 2,
  }));
  const handleE = useAnimatedStyle(() => ({
    left: bx.value + bw.value - HANDLE_HIT / 2,
    top: by.value + bh.value / 2 - HANDLE_HIT / 2,
  }));
  const handleW = useAnimatedStyle(() => ({
    left: bx.value - HANDLE_HIT / 2,
    top: by.value + bh.value / 2 - HANDLE_HIT / 2,
  }));

  const pfWorklet = () => {
    "worklet";
    const safeW = bw.value || PREVIEW_W;
    const safeH = bh.value || PREVIEW_H;
    return Math.min(PREVIEW_W / safeW, PREVIEW_H / safeH);
  };

  const previewAnimStyle = useAnimatedStyle(() => {
    const pf = pfWorklet();
    const dw = svImgW.value * svBase.value * scale.value;
    const dh = svImgH.value * svBase.value * scale.value;
    const left = (svCanvasW.value - dw) / 2 + translateX.value;
    const top = (svCanvasH.value - dh) / 2 + translateY.value;
    const ox = (PREVIEW_W - bw.value * pf) / 2;
    const oy = (PREVIEW_H - bh.value * pf) / 2;
    return {
      transform: [
        { translateX: ox + (left - bx.value) * pf },
        { translateY: oy + (top - by.value) * pf },
      ],
    };
  });

  async function rotate(direction: -1 | 1) {
    if (busy || !sourceUri) return;
    const nextAngle = normalizeAngle(angleRef.current + direction * 90);
    const cached = variantCacheRef.current.get(nextAngle);
    if (cached && cached.width > 0) {
      angleRef.current = nextAngle;
      setWorkingUri(cached.uri);
      setDims({ w: cached.width, h: cached.height });
      resetTransform();
      return;
    }
    setBusy(true);
    try {
      const context = ImageManipulator.manipulate(sourceUri);
      context.rotate(nextAngle === 270 ? -90 : nextAngle);
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 1,
        format: SaveFormat.JPEG,
      });
      const variant: Variant = {
        uri: saved.uri,
        width: rendered.width,
        height: rendered.height,
      };
      variantCacheRef.current.set(nextAngle, variant);
      angleRef.current = nextAngle;
      setWorkingUri(variant.uri);
      setDims({ w: variant.width, h: variant.height });
      resetTransform();
    } catch {
      setError("Rotation failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (busy || !workingUri || !dims.w || !ready) return;
    setBusy(true);
    try {
      const boxX = bx.value;
      const boxY = by.value;
      const boxW = bw.value;
      const boxH = bh.value;
      const total = base * scale.value;
      const dw = dims.w * total;
      const dh = dims.h * total;
      const left = (svCanvasW.value - dw) / 2 + translateX.value;
      const top = (svCanvasH.value - dh) / 2 + translateY.value;
      const kx = dims.w / dw;
      const ky = dims.h / dh;
      const x0 = Math.max(0, Math.ceil((boxX - left) * kx));
      const x1 = Math.min(dims.w, Math.floor((boxX + boxW - left) * kx));
      const y0 = Math.max(0, Math.ceil((boxY - top) * ky));
      const y1 = Math.min(dims.h, Math.floor((boxY + boxH - top) * ky));
      const width = x1 - x0;
      const height = y1 - y0;
      if (width < 20 || height < 20) {
        Alert.alert(
          "Ticket outside the frame",
          "Move or zoom the ticket so it fills the definition box.",
        );
        return;
      }
      const context = ImageManipulator.manipulate(workingUri);
      context.crop({ originX: x0, originY: y0, width, height });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 1,
        format: SaveFormat.JPEG,
      });
      completeTicketEdit({
        uri: saved.uri,
        width: rendered.width,
        height: rendered.height,
      });
      router.back();
    } catch {
      setError("Could not prepare the ticket. Try again.");
      setBusy(false);
    }
  }

  function cancel() {
    completeTicketEdit(null);
    router.back();
  }

  function resetAll() {
    resetTransform();
    resetCropBox();
  }

  const handleViews: {
    id: HandleId;
    style: typeof handleNW;
  }[] = [
    { id: "nw", style: handleNW },
    { id: "ne", style: handleNE },
    { id: "sw", style: handleSW },
    { id: "se", style: handleSE },
    { id: "n", style: handleN },
    { id: "s", style: handleS },
    { id: "e", style: handleE },
    { id: "w", style: handleW },
  ];

  const isCorner = (id: HandleId) =>
    id === "nw" || id === "ne" || id === "sw" || id === "se";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: clubPrimary }]}>
      <View style={s.decorLayer} pointerEvents="none">
        <View
          style={[
            s.decorCircleA,
            { backgroundColor: clubSecondary, opacity: 0.16 },
          ]}
        />
        <View
          style={[
            s.decorCircleB,
            { backgroundColor: clubSecondary, opacity: 0.12 },
          ]}
        />
      </View>

      <View style={s.header}>
        <Text style={s.headerTitle}>DEFINE YOUR TICKET</Text>
        <Text style={s.headerHint}>
          Drag the box corners to fit any shape · move the ticket underneath
        </Text>
      </View>

      <View
        style={[
          s.canvasOuter,
          { borderColor: clubSecondary, shadowColor: clubPrimary },
        ]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          svCanvasW.value = width;
          svCanvasH.value = height;
          defaultBoxIfNeeded(width, height);
        }}
      >
        {workingUri && dims.w && base ? (
          <GestureDetector gesture={combined}>
            <Reanimated.View style={s.canvasLayer}>
              <Reanimated.Image
                source={{ uri: workingUri }}
                alt="Ticket to adjust"
                style={[
                  {
                    width: dims.w * base,
                    height: dims.h * base,
                  },
                  imageAnimStyle,
                ]}
                resizeMode="stretch"
              />
            </Reanimated.View>
          </GestureDetector>
        ) : null}

        {ready ? (
          <>
            <Reanimated.View style={[s.dimStrip, dimTopStyle]} pointerEvents="none" />
            <Reanimated.View style={[s.dimStrip, dimBottomStyle]} pointerEvents="none" />
            <Reanimated.View style={[s.dimStrip, dimLeftStyle]} pointerEvents="none" />
            <Reanimated.View style={[s.dimStrip, dimRightStyle]} pointerEvents="none" />

            <Reanimated.View
              style={[s.boxBorder, boxAnimStyle, { borderColor: clubSecondary }]}
              pointerEvents="none"
            >
              <Reanimated.View style={[s.gridLineV, gridV1]} />
              <Reanimated.View style={[s.gridLineV, gridV2]} />
              <Reanimated.View style={[s.gridLineH, gridH1]} />
              <Reanimated.View style={[s.gridLineH, gridH2]} />
            </Reanimated.View>

            {handleViews.map(({ id, style }) => (
              <GestureDetector key={id} gesture={resizeGestures[id]}>
                <Reanimated.View
                  style={[
                    s.handle,
                    isCorner(id) ? s.handleCorner : s.handleEdge,
                    style,
                  ]}
                >
                  <View
                    style={
                      isCorner(id) ? s.handleGripCorner : s.handleGripEdge
                    }
                  />
                </Reanimated.View>
              </GestureDetector>
            ))}
          </>
        ) : null}

        {busy ? (
          <View style={s.busyLayer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : null}
      </View>

      <View style={s.previewRow}>
        <View>
          <Text style={s.previewLabel}>FRAME PREVIEW</Text>
          <View
            style={[
              s.previewTile,
              { borderColor: clubSecondary, backgroundColor: "#e8e2d3" },
            ]}
          >
            {workingUri && ready ? (
              <Reanimated.Image
                source={{ uri: workingUri }}
                alt="Ticket frame preview"
                style={[
                  s.previewImage,
                  previewAnimStyle,
                  {
                    width: dims.w * base,
                    height: dims.h * base,
                  },
                ]}
                resizeMode="stretch"
              />
            ) : null}
          </View>
        </View>
        <View style={s.toolColumn}>
          <Pressable
            style={[s.toolButton, { borderColor: clubPrimary }]}
            onPress={() => void rotate(-1)}
            disabled={busy}
          >
            <Ionicons name="sync-outline" size={20} color={clubPrimary} />
            <Text style={[s.toolButtonText, { color: clubPrimary }]}>
              Rotate L
            </Text>
          </Pressable>
          <Pressable
            style={[s.toolButton, { borderColor: clubPrimary }]}
            onPress={() => void rotate(1)}
            disabled={busy}
          >
            <Ionicons name="sync" size={20} color={clubPrimary} />
            <Text style={[s.toolButtonText, { color: clubPrimary }]}>
              Rotate R
            </Text>
          </Pressable>
          <Pressable
            style={[s.toolButton, { borderColor: "#b88d36" }]}
            onPress={resetAll}
            disabled={busy}
          >
            <Ionicons name="refresh-outline" size={20} color="#8b6b24" />
            <Text style={[s.toolButtonText, { color: "#8b6b24" }]}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {error || !sourceUri ? (
        <Text style={s.errorText}>
          {error || "No photo was passed to the editor."}
        </Text>
      ) : null}

      <View style={s.footer}>
        <Pressable
          style={[
            s.footerButton,
            s.cancelButton,
            { backgroundColor: clubSecondary },
          ]}
          onPress={cancel}
          disabled={busy}
        >
          <Text style={[s.cancelText, { color: "#17221c" }]}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[
            s.footerButton,
            s.addButton,
            { backgroundColor: clubPrimary, borderColor: clubSecondary },
          ]}
          onPress={() => void confirm()}
          disabled={busy || !dims.w || !ready}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={22}
            color={clubSecondary}
          />
          <Text style={[s.addButtonText, { color: clubSecondary }]}>
            Add to Frame
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  decorCircleA: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    top: -140,
    right: -120,
  },
  decorCircleB: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    bottom: -220,
    left: -160,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.5,
  },
  headerHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 4,
  },
  canvasOuter: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 5,
    overflow: "hidden",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  canvasLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  dimStrip: {
    position: "absolute",
    backgroundColor: "rgba(6,14,10,0.55)",
  },
  boxBorder: {
    position: "absolute",
    borderWidth: 2,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  handle: {
    position: "absolute",
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    alignItems: "center",
    justifyContent: "center",
  },
  handleCorner: {
    alignItems: "center",
    justifyContent: "center",
  },
  handleEdge: {
    alignItems: "center",
    justifyContent: "center",
  },
  handleGripCorner: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.45)",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  handleGripEdge: {
    width: 20,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
  },
  busyLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  previewLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  previewTile: {
    width: PREVIEW_W,
    height: PREVIEW_H,
    borderWidth: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  previewImage: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  toolColumn: { flex: 1, gap: 8 },
  toolButton: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#ffffff",
  },
  toolButtonText: { fontWeight: "800", fontSize: 13 },
  errorText: {
    color: "#ff9d9d",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
  },
  footerButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  cancelText: { fontWeight: "800", color: "#17221c" },
  addButton: {
    borderWidth: 2.5,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  addButtonText: { fontWeight: "900", fontSize: 16, letterSpacing: 0.3 },
});
