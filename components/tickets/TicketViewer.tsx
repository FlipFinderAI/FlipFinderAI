/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { readableTextColour } from "@/lib/colorUtils";
import { fitTicketDisplaySize } from "@/lib/ticketDisplay";
import { currentTicketUri } from "@/lib/ticketFiles";
import type { SeasonTicket } from "@/lib/ticketTypes";
import {
  VIEWER_DOUBLE_TAP_SCALE,
  VIEWER_MAX_SCALE,
  VIEWER_MIN_SCALE,
  VIEWER_SPRING,
  viewerStyles,
} from "@/components/tickets/ticketViewerStyles";

export default function TicketViewer({
  ticket,
  accent,
  onClose,
  onActions,
}: {
  ticket: SeasonTicket;
  accent: string;
  onClose: () => void;
  onActions: () => void;
}) {
  const uri = currentTicketUri(ticket.uri) ?? ticket.uri;
  const [zoomed, setZoomed] = useState(false);
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const loadFailed = failedUri !== null && failedUri === uri;
  const viewSize = useSharedValue({ w: 0, h: 0 });
  const closingValue = useSharedValue(0);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const rootOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const fitSize = useMemo(
    () =>
      fitTicketDisplaySize(
        ticket.aspectRatio ? Number(ticket.aspectRatio) : undefined,
        layout.w,
        layout.h,
      ),
    [ticket.aspectRatio, layout.w, layout.h],
  );

  useEffect(() => {
    rootOpacity.value = withTiming(1, { duration: 180 });
  }, [rootOpacity]);

  const syncZoomState = (value: number) => {
    "worklet";
    runOnJS(setZoomed)(value > VIEWER_MIN_SCALE + 0.02);
  };

  const clampTranslate = (tx: number, ty: number, s: number) => {
    "worklet";
    const v = viewSize.value;
    const maxX = Math.max(0, (fitSize.width * s - v.w) / 2);
    const maxY = Math.max(0, (fitSize.height * s - v.h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, tx)),
      y: Math.min(maxY, Math.max(-maxY, ty)),
    };
  };

  const animateZoomTo = (
    targetScale: number,
    tx: number,
    ty: number,
  ) => {
    "worklet";
    const clamped = clampTranslate(tx, ty, targetScale);
    scale.value = withSpring(targetScale, VIEWER_SPRING);
    translateX.value = withSpring(clamped.x, VIEWER_SPRING);
    translateY.value = withSpring(clamped.y, VIEWER_SPRING);
    savedScale.value = targetScale;
    savedTranslateX.value = clamped.x;
    savedTranslateY.value = clamped.y;
    syncZoomState(targetScale);
  };

  const zoomToFocal = (targetScale: number, fx: number, fy: number) => {
    "worklet";
    const k = targetScale / scale.value;
    const cx = viewSize.value.w / 2;
    const cy = viewSize.value.h / 2;
    const tx = fx - cx - (fx - cx - translateX.value) * k;
    const ty = fy - cy - (fy - cy - translateY.value) * k;
    animateZoomTo(targetScale, tx, ty);
  };

  const resetZoom = (fx?: number, fy?: number) => {
    "worklet";
    if (fx !== undefined && fy !== undefined) {
      zoomToFocal(VIEWER_MIN_SCALE, fx, fy);
      return;
    }
    animateZoomTo(VIEWER_MIN_SCALE, 0, 0);
  };

  const closeAnimated = () => {
    "worklet";
    if (closingValue.value === 1) return;
    closingValue.value = 1;
    rootOpacity.value = withTiming(
      0,
      { duration: 160 },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const next = Math.min(
        VIEWER_MAX_SCALE,
        Math.max(VIEWER_MIN_SCALE, savedScale.value * event.scale),
      );
      const ratio = next / savedScale.value;
      const rawX =
        event.focalX - (event.focalX - savedTranslateX.value) * ratio;
      const rawY =
        event.focalY - (event.focalY - savedTranslateY.value) * ratio;
      const clamped = clampTranslate(rawX, rawY, next);
      scale.value = next;
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      const clamped = clampTranslate(
        translateX.value,
        translateY.value,
        scale.value,
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
      savedTranslateX.value = clamped.x;
      savedTranslateY.value = clamped.y;
      syncZoomState(scale.value);
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      const clamped = clampTranslate(
        translateX.value,
        translateY.value,
        scale.value,
      );
      translateX.value = withSpring(clamped.x, VIEWER_SPRING);
      translateY.value = withSpring(clamped.y, VIEWER_SPRING);
      savedTranslateX.value = clamped.x;
      savedTranslateY.value = clamped.y;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1.5) {
        resetZoom(event.x, event.y);
      } else {
        zoomToFocal(VIEWER_DOUBLE_TAP_SCALE, event.x, event.y);
      }
    });

  const singleTap = Gesture.Tap().onEnd(() => {
    if (scale.value > VIEWER_MIN_SCALE + 0.02) {
      resetZoom();
    } else {
      closeAnimated();
    }
  });

  const longPress = Gesture.LongPress()
    .minDuration(450)
    .onStart(() => {
      runOnJS(onActions)();
    });

  const gestures = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTap, singleTap),
    pinch,
    pan,
    longPress,
  );

  const rootStyle = useAnimatedStyle(() => ({
    opacity: rootOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: 0.94 + 0.06 * contentOpacity.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Reanimated.View style={[viewerStyles.backdrop, rootStyle]}>
      <GestureDetector gesture={gestures}>
        <View
          style={viewerStyles.canvas}
          onLayout={(event) => {
            const nextLayout = {
              w: event.nativeEvent.layout.width,
              h: event.nativeEvent.layout.height,
            };
            setLayout(nextLayout);
            viewSize.value = nextLayout;
          }}
        >
          <Reanimated.View
            style={[viewerStyles.stage, contentStyle]}
            collapsable={false}
          >
            {uri && !loadFailed ? (
              <Reanimated.Image
                source={{ uri }}
                style={[
                  viewerStyles.image,
                  {
                    width: fitSize.width || "100%",
                    height: fitSize.height || "100%",
                  },
                  imageStyle,
                ]}
                resizeMode="contain"
                alt={ticket.name}
                onLoad={() => {
                  contentOpacity.value = withTiming(1, { duration: 170 });
                }}
                onError={() => setFailedUri(uri)}
              />
            ) : (
              <View style={[viewerStyles.image, viewerStyles.fileTicket]}>
                <Ionicons name="ticket" size={26} color="#174a91" />
                <Text numberOfLines={2} style={viewerStyles.fileTicketText}>
                  {ticket.name}
                </Text>
              </View>
            )}
          </Reanimated.View>
        </View>
      </GestureDetector>

      <Pressable
        accessibilityLabel="Close ticket viewer"
        hitSlop={10}
        onPress={() => closeAnimated()}
        style={viewerStyles.closeButton}
      >
        <Ionicons name="close" size={26} color="#ffffff" />
      </Pressable>

      {zoomed ? (
        <Pressable
          accessibilityLabel="Reset zoom"
          onPress={() => resetZoom()}
          style={[viewerStyles.resetButton, { backgroundColor: accent }]}
        >
          <Text
            style={[
              viewerStyles.resetText,
              { color: readableTextColour(accent) },
            ]}
          >
            RESET ZOOM
          </Text>
        </Pressable>
      ) : null}

      <View style={viewerStyles.caption} pointerEvents="none">
        <Text style={viewerStyles.captionName} numberOfLines={1}>
          {(ticket.name || "TICKET").toUpperCase()}
        </Text>
        <Text style={viewerStyles.hint}>
          PINCH TO ZOOM · DOUBLE TAP · HOLD FOR OPTIONS · TAP TO CLOSE
        </Text>
      </View>
    </Reanimated.View>
  );
}
