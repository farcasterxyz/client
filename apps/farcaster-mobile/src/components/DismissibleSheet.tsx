import { BlurView } from 'expo-blur';
import { useTheme } from 'farcaster-expo';
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { Dimensions, Platform, View, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureType,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 250;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
};

// Create context for the pan gesture
const DismissibleSheetContext = React.createContext<{
  panGestureRef: React.RefObject<unknown> | null;
  scrollOffset?: SharedValue<number>;
  isDismissing?: SharedValue<boolean>;
}>({ panGestureRef: null });

export const useDismissibleSheet = () => {
  const context = useContext(DismissibleSheetContext);
  if (!context.panGestureRef) {
    throw new Error(
      'useDismissibleSheet must be used within a DismissibleSheet',
    );
  }
  return context;
};

type DismissibleSheetProps = {
  slideProgress: SharedValue<number>;
  children: ReactNode;
  onDismiss: () => void;
  containerStyle?: ViewStyle;
  dismissThreshold?: number;
  scrollOffset?: SharedValue<number>;
  skipEntryAnimation?: boolean;
  solidBackground?: boolean;
};

export function DismissibleSheet({
  slideProgress,
  children,
  onDismiss,
  containerStyle,
  dismissThreshold = DISMISS_THRESHOLD,
  scrollOffset,
  skipEntryAnimation = false,
  solidBackground = false,
}: DismissibleSheetProps) {
  const t = useTheme();

  // Create a ref for the pan gesture
  const panGestureRef = React.useRef<GestureType | undefined>(undefined);

  // Track if we're actively dismissing
  const isDismissing = useSharedValue(false);

  // Entry animation
  useEffect(() => {
    if (skipEntryAnimation) {
      return;
    }
    slideProgress.value = withSpring(1, {
      ...SPRING_CONFIG,
      overshootClamping: true,
    });
  }, [slideProgress, skipEntryAnimation]);

  // Dismiss handler
  const handleDismiss = useCallback(
    (velocity: number) => {
      slideProgress.value = withSpring(
        0,
        {
          ...SPRING_CONFIG,
          velocity: velocity / SCREEN_HEIGHT,
          overshootClamping: true,
        },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(onDismiss)();
          }
        },
      );
    },
    [slideProgress, onDismiss],
  );

  // Pan gesture for dismiss
  const panGesture = Gesture.Pan()
    .activeOffsetY(5) // Only activate after 5 pixels of movement
    .failOffsetX([-10, 10]) // Fail if horizontal movement
    .onBegin(() => {
      'worklet';
      // Check if we're at the top of the scroll view
      const isAtTop = !scrollOffset || scrollOffset.value <= 0;
      isDismissing.value = isAtTop;
    })
    .onUpdate((event) => {
      'worklet';
      // Check if we're at the top of the scroll view
      const isAtTop = !scrollOffset || scrollOffset.value <= 0;

      // Only handle dismiss gesture if we're at the top and dragging down
      if (isAtTop && event.translationY > 0) {
        isDismissing.value = true;
        // Calculate progress based on translation
        const progress = 1 - event.translationY / SCREEN_HEIGHT;
        // Allow values between 0 and 1.1 (slightly over for bounce effect)
        slideProgress.value = Math.max(0, Math.min(1, progress));
      } else if (!isAtTop && slideProgress.value !== 1) {
        isDismissing.value = false;
        // If we're not at the top but the sheet was partially dismissed, spring back
        slideProgress.value = withSpring(1, {
          ...SPRING_CONFIG,
          overshootClamping: true,
        });
      } else {
        isDismissing.value = false;
      }
    })
    .onEnd((event) => {
      'worklet';
      // Check if we're at the top of the scroll view
      const isAtTop = !scrollOffset || scrollOffset.value <= 0;

      // Only dismiss on downward gestures when at the top
      if (isAtTop && event.translationY > 0) {
        const shouldDismiss =
          event.translationY > dismissThreshold || event.velocityY > 500;

        if (shouldDismiss) {
          runOnJS(handleDismiss)(event.velocityY);
        } else {
          // Spring back to fully open
          slideProgress.value = withSpring(1, {
            ...SPRING_CONFIG,
            velocity: -event.velocityY / SCREEN_HEIGHT,
            overshootClamping: true,
          });
        }
      } else {
        // Always spring back to fully open if not at top
        slideProgress.value = withSpring(1, {
          ...SPRING_CONFIG,
          overshootClamping: true,
        });
      }

      // Reset dismissing state
      isDismissing.value = false;
    })
    .withRef(panGestureRef);

  // Container style with slide animation
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          Math.min(slideProgress.value, 1),
          [0, 1],
          [SCREEN_HEIGHT, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
    borderRadius: slideProgress.value === 1 ? 0 : 32,
  }));

  const background = useMemo(() => {
    if (Platform.OS === 'ios' && !solidBackground) {
      return (
        <BlurView
          style={[t.absolute, t.top0, t.left0, t.right0, t.bottom0]}
          tint="systemMaterial"
          intensity={80}
        />
      );
    }
    return (
      <View
        style={[t.absolute, t.top0, t.left0, t.right0, t.bottom0, t.bgDefault]}
      />
    );
  }, [
    solidBackground,
    t.absolute,
    t.bgDefault,
    t.bottom0,
    t.left0,
    t.right0,
    t.top0,
  ]);

  const contextValue = useMemo(
    () => ({ panGestureRef, scrollOffset, isDismissing }),
    [scrollOffset, isDismissing],
  );

  return (
    <DismissibleSheetContext.Provider value={contextValue}>
      <View style={[t.flex1, t.bgTransparent]}>
        <Animated.View
          style={[
            t.flex1,
            t.overflowHidden,
            animatedContainerStyle,
            containerStyle,
          ]}
        >
          {background}
          <GestureDetector gesture={panGesture}>
            <View style={[t.flex1]}>{children}</View>
          </GestureDetector>
        </Animated.View>
      </View>
    </DismissibleSheetContext.Provider>
  );
}
