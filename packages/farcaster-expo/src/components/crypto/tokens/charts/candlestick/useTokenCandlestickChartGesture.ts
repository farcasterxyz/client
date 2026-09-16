import { NavigationContext } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiOnchainTokenCandlestickChartPoint,
  ApiOnchainTokenChartAnnotation,
} from 'farcaster-client-data';
import { useCallback, useContext } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  runOnJS,
  SharedValue,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';

import { useSharedTelemetry } from '../../../../../contexts';
import { useHaptics } from '../../../../../hooks';
import { sizes } from '../utils';

export const useTokenCandlestickChartGesture = ({
  candlestickChart,
  annotations,
  annotationIndexMap,
  barSpacing,
  leftPadding,
  totalWidth,
  offsetX,
  startOffsetX,
  activeCandleIndex,
  isLongPressing,
  isScrolling,
  activeCandleData,
  activeCandleAnnotations,
  opacityTransition,
  setViewportOffset,
  clearHoldModeDelayed,
  withinNavigationContext = false,
}: {
  candlestickChart: ApiOnchainTokenCandlestickChartPoint[];
  annotations: ApiOnchainTokenChartAnnotation[];
  annotationIndexMap: Record<number, number>;
  barSpacing: number;
  leftPadding: number;
  totalWidth: number;
  offsetX: SharedValue<number>;
  startOffsetX: SharedValue<number>;
  activeCandleIndex: SharedValue<number>;
  isLongPressing: SharedValue<boolean>;
  isScrolling: SharedValue<boolean>;
  activeCandleData: SharedValue<ApiOnchainTokenCandlestickChartPoint | null>;
  activeCandleAnnotations: SharedValue<ApiOnchainTokenChartAnnotation[]>;
  opacityTransition: SharedValue<number>;
  setViewportOffset: (offset: number) => void;
  clearHoldModeDelayed: () => void;
  withinNavigationContext?: boolean;
}) => {
  const navigation = useContext(NavigationContext);
  const { triggerHeavyImpactAsync, triggerLightImpactAsync } = useHaptics();
  const { trackEvent } = useSharedTelemetry();
  const recentlyScrolled = useSharedValue(false);
  const setNavigationGestureEnabled = useCallback(
    (enabled: boolean) => {
      navigation?.setOptions?.({ gestureEnabled: enabled });
    },
    [navigation],
  );

  const applyRubberBanding = useCallback(
    (value: number, min: number, max: number): number => {
      'worklet';
      if (value < min) {
        const distance = min - value;
        const damping = 0.4;
        return min - distance * damping;
      }
      if (value > max) {
        const distance = value - max;
        const damping = 0.4;
        return max + distance * damping;
      }
      return value;
    },
    [],
  );

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .maxDistance(999999)
    .shouldCancelWhenOutside(false)
    .onBegin(() => {
      'worklet';
      recentlyScrolled.value = false;
    })
    .onStart((e) => {
      'worklet';
      if (
        isScrolling.value ||
        recentlyScrolled.value ||
        candlestickChart.length === 0
      )
        return;

      if (withinNavigationContext) {
        runOnJS(setNavigationGestureEnabled)(false);
      }

      const currentOffsetX = offsetX.value;
      const touchX = e.x;
      const candleIndex = Math.round(
        (touchX + currentOffsetX - leftPadding) / barSpacing,
      );
      const clampedIndex = Math.max(
        0,
        Math.min(candlestickChart.length - 1, candleIndex),
      );

      if (candlestickChart[clampedIndex] === undefined) return;

      activeCandleIndex.value = clampedIndex;
      isLongPressing.value = true;
      opacityTransition.value = withTiming(1, { duration: 100 });
      activeCandleData.value = candlestickChart[clampedIndex];

      const candleAnnotations = annotations.filter((a) => {
        const closestIndex = annotationIndexMap[a.timestamp];
        return closestIndex === clampedIndex;
      });
      activeCandleAnnotations.value = candleAnnotations;

      runOnJS(triggerHeavyImpactAsync)();

      if (candleAnnotations.length > 0) {
        runOnJS(trackEvent)(AnalyticsEvent.HoldTokenCandlestickWithAnnotation, {
          annotationCount: candleAnnotations.length,
          annotationTypes: candleAnnotations.map((a) => a.type).join(','),
        });
      } else {
        runOnJS(trackEvent)(AnalyticsEvent.HoldTokenCandlestick, {});
      }
    })
    .onTouchesMove((e) => {
      'worklet';
      if (!isLongPressing.value || candlestickChart.length === 0) return;

      const currentOffsetX = offsetX.value;
      const touchX = e.allTouches[0]?.x;
      if (touchX === undefined) return;

      const candleIndex = Math.round(
        (touchX + currentOffsetX - leftPadding) / barSpacing,
      );
      const clampedIndex = Math.max(
        0,
        Math.min(candlestickChart.length - 1, candleIndex),
      );

      if (
        clampedIndex !== activeCandleIndex.value &&
        candlestickChart[clampedIndex] !== undefined
      ) {
        activeCandleIndex.value = clampedIndex;
        activeCandleData.value = candlestickChart[clampedIndex];

        const candleAnnotations = annotations.filter((a) => {
          const closestIndex = annotationIndexMap[a.timestamp];
          return closestIndex === clampedIndex;
        });
        activeCandleAnnotations.value = candleAnnotations;

        runOnJS(triggerLightImpactAsync)();
      }
    })
    .onTouchesUp(() => {
      'worklet';
      if (isLongPressing.value) {
        if (withinNavigationContext) {
          runOnJS(setNavigationGestureEnabled)(true);
        }

        runOnJS(clearHoldModeDelayed)();
      }
    })
    .onEnd(() => {
      'worklet';
      if (isLongPressing.value) {
        if (withinNavigationContext) {
          runOnJS(setNavigationGestureEnabled)(true);
        }

        runOnJS(clearHoldModeDelayed)();
      }
    })
    .onFinalize(() => {
      'worklet';
      if (isLongPressing.value) {
        if (withinNavigationContext) {
          runOnJS(setNavigationGestureEnabled)(true);
        }

        runOnJS(clearHoldModeDelayed)();
      }
    });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      'worklet';
      if (isLongPressing.value) {
        return;
      }
    })
    .onStart(() => {
      'worklet';
      if (isLongPressing.value) {
        return;
      }
      if (withinNavigationContext) {
        runOnJS(setNavigationGestureEnabled)(false);
      }

      startOffsetX.value = offsetX.value;
      isScrolling.value = true;
      recentlyScrolled.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      if (isLongPressing.value) {
        return;
      }

      const hasMovement = Math.abs(e.translationX) > 5;
      const hasVelocity = Math.abs(e.velocityX) > 50;

      if (hasMovement || hasVelocity) {
        recentlyScrolled.value = true;
      }

      const minOffset = 0;
      const maxOffset = Math.max(0, totalWidth - sizes.width);
      const proposed = startOffsetX.value - e.translationX;

      const newOffset = applyRubberBanding(proposed, minOffset, maxOffset);
      offsetX.value = newOffset;
    })
    .onEnd((e) => {
      'worklet';
      if (isLongPressing.value) {
        isScrolling.value = false;
        recentlyScrolled.value = false;
        return;
      }

      const minOffset = 0;
      const maxOffset = Math.max(0, totalWidth - sizes.width);
      const velocity = -e.velocityX;

      if (offsetX.value < minOffset || offsetX.value > maxOffset) {
        offsetX.value = withTiming(
          Math.max(minOffset, Math.min(maxOffset, offsetX.value)),
          {
            duration: 400,
            easing: Easing.out(Easing.cubic),
          },
          () => {
            isScrolling.value = false;
            if (withinNavigationContext) {
              runOnJS(setNavigationGestureEnabled)(true);
            }

            runOnJS(setViewportOffset)(Math.round(offsetX.value));
            recentlyScrolled.value = false;
          },
        );
        return;
      }

      if (Math.abs(velocity) > 100) {
        offsetX.value = withDecay(
          {
            velocity,
            deceleration: 0.998,
            clamp: [minOffset, maxOffset],
          },
          (finished) => {
            if (finished) {
              isScrolling.value = false;
              if (withinNavigationContext) {
                runOnJS(setNavigationGestureEnabled)(true);
              }

              runOnJS(setViewportOffset)(Math.round(offsetX.value));
              recentlyScrolled.value = false;
            }
          },
        );
      } else {
        isScrolling.value = false;
        if (withinNavigationContext) {
          runOnJS(setNavigationGestureEnabled)(true);
        }

        runOnJS(setViewportOffset)(Math.round(offsetX.value));
        recentlyScrolled.value = false;
      }
    })
    .onFinalize(() => {
      'worklet';
      isScrolling.value = false;
      recentlyScrolled.value = false;
    });

  return Gesture.Simultaneous(longPressGesture, panGesture);
};
