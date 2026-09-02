import { memo, type ReactNode, type RefObject } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export type TileRect = { x: number; y: number; w: number; h: number };

const DraggableGridTile = memo(function DraggableGridTile({
  ticketId,
  tileWidth,
  tileHeight,
  boxScale,
  dragEnabled,
  anyDragging,
  selfDragging,
  layoutsRef,
  onRequestDragStart,
  onDragDrop,
  onDragRelease,
  onPress,
  baseStyle,
  children,
}: {
  ticketId: string;
  tileWidth: `${number}%`;
  tileHeight: `${number}%`;
  boxScale: number;
  dragEnabled: boolean;
  anyDragging: boolean;
  selfDragging: boolean;
  layoutsRef: RefObject<Record<string, TileRect>>;
  onRequestDragStart: (id: string) => void;
  onDragDrop: (id: string, tx: number, ty: number) => void;
  onDragRelease: (id: string) => void;
  onPress: (id: string) => void;
  baseStyle: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lift = useSharedValue(1);
  const longPressFired = useSharedValue(false);

  const pan = Gesture.Pan()
    .manualActivation(true)
    .enabled(dragEnabled)
    .onTouchesMove((_event, stateManager) => {
      if (longPressFired.value) stateManager.activate();
      else stateManager.fail();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (!longPressFired.value) return;
      runOnJS(onDragDrop)(ticketId, event.translationX, event.translationY);
      longPressFired.value = false;
      translateX.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      lift.value = withTiming(1, { duration: 180 });
    })
    .onFinalize(() => {
      translateX.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      lift.value = withTiming(1, { duration: 180 });
      longPressFired.value = false;
      runOnJS(onDragRelease)(ticketId);
    });

  const longPress = Gesture.LongPress()
    .minDuration(260)
    .maxDistance(18)
    .enabled(dragEnabled)
    .onStart(() => {
      longPressFired.value = true;
      lift.value = withSpring(1.06);
      runOnJS(onRequestDragStart)(ticketId);
    })
    .onFinalize(() => {
      translateX.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      lift.value = withTiming(1, { duration: 180 });
      longPressFired.value = false;
      runOnJS(onDragRelease)(ticketId);
    });

  const dragGesture = Gesture.Simultaneous(longPress, pan);
  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)(ticketId);
  });
  const tileGesture = Gesture.Exclusive(dragGesture, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: lift.value },
    ],
    zIndex: selfDragging ? 20 : anyDragging ? 1 : 0,
    opacity: selfDragging ? 1 : anyDragging ? 0.55 : 1,
    shadowOpacity: selfDragging ? 0.3 : 0,
    shadowRadius: selfDragging ? 12 : 0,
    shadowOffset: { width: 0, height: selfDragging ? 4 : 0 },
  }));

  return (
    <GestureDetector gesture={tileGesture}>
      <Reanimated.View
        style={[
          baseStyle,
          {
            width: tileWidth,
            height: tileHeight,
            position: "relative",
            transform: [{ scale: boxScale }],
          },
          animatedStyle,
        ]}
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          layoutsRef.current[ticketId] = { x, y, w: width, h: height };
        }}
      >
        {children}
      </Reanimated.View>
    </GestureDetector>
  );
});

export default DraggableGridTile;
