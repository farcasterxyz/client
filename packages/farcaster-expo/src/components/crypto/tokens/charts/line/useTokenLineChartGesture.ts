import { NavigationContext } from '@react-navigation/native';
import React from 'react';
import { GestureResponderEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { useHaptics } from '../../../../../hooks';
import { useTokenChart } from '../TokenChartProvider';
import { sizes } from '../utils';

export const useTokenLineChartGesture = (
  withinNavigationContext: boolean = false,
) => {
  const isDown = useSharedValue(false);
  const navigation = React.useContext(NavigationContext);
  const { triggerImpactAsync, triggerMediumImpactAsync } = useHaptics();
  const { lineChart, touchPoint, annotations } = useTokenChart();

  const getTouchPoint = React.useCallback(
    ({ locationX, locationY }: { locationX: number; locationY: number }) => {
      const clamped = Math.max(0, Math.min(locationX, sizes.width));

      const minX = Math.min(...lineChart.map(({ timestamp }) => timestamp));
      const maxX = Math.max(...lineChart.map(({ timestamp }) => timestamp));
      const xPadding = (maxX - minX) * 0.06;
      const dx = Math.max(1, maxX + xPadding - minX);
      const sx = sizes.width / dx;

      const domainX = clamped / sx + minX;

      if (lineChart.length === 0) {
        return {
          timestamp: domainX,
          price: 0,
          volume: 0,
          x: locationX,
          y: locationY,
          index: 0,
        };
      }

      let nearest = lineChart[0];
      let minDist = Math.abs(nearest.timestamp - domainX);
      let initialIndex = 0;
      for (let i = 1; i < lineChart.length; i++) {
        const dist = Math.abs(lineChart[i].timestamp - domainX);
        if (dist < minDist) {
          nearest = lineChart[i];
          minDist = dist;
          initialIndex = i;
        }
      }

      let finalIndex = initialIndex;
      let annotation = annotations.find(
        (annotation) => annotation.timestamp === nearest.timestamp,
      );

      if (!annotation && initialIndex > 0) {
        annotation = annotations.find(
          (annotation) =>
            annotation.timestamp === lineChart[initialIndex - 1].timestamp,
        );
        finalIndex = initialIndex - 1;
      }
      if (!annotation && initialIndex < lineChart.length - 1) {
        annotation = annotations.find(
          (annotation) =>
            annotation.timestamp === lineChart[initialIndex + 1].timestamp,
        );
        finalIndex = initialIndex + 1;
      }

      return {
        timestamp: annotation?.timestamp ?? nearest.timestamp,
        price: nearest.price,
        volume: nearest.volume,
        x: locationX,
        y: locationY,
        index: finalIndex,
        annotation,
      };
    },
    [lineChart, annotations],
  );

  const handlePress = React.useCallback(
    (e: GestureResponderEvent) => {
      triggerMediumImpactAsync();
      if (withinNavigationContext) {
        navigation?.setOptions?.({ gestureEnabled: false });
      }

      isDown.value = true;
      const nextTouchPoint = getTouchPoint(e.nativeEvent);
      touchPoint.value = nextTouchPoint;
    },
    [
      getTouchPoint,
      navigation,
      triggerMediumImpactAsync,
      touchPoint,
      isDown,
      withinNavigationContext,
    ],
  );

  const handleMove = React.useCallback(
    (e: GestureResponderEvent) => {
      if (!isDown.value) {
        return;
      }

      const nextTouchPoint = getTouchPoint(e.nativeEvent);
      touchPoint.value = nextTouchPoint;

      // Trigger impact if the touch point has moved
      if (touchPoint.value.timestamp !== nextTouchPoint.timestamp) {
        triggerImpactAsync();
      }
    },
    [getTouchPoint, isDown, touchPoint, triggerImpactAsync],
  );

  const handleRelease = React.useCallback(() => {
    if (withinNavigationContext) {
      navigation?.setOptions?.({ gestureEnabled: true });
    }

    isDown.value = false;
    touchPoint.value = null;
  }, [navigation, touchPoint, isDown, withinNavigationContext]);

  const gesture = Gesture.Simultaneous(
    Gesture.LongPress()
      .minDuration(100)
      .onStart((e) => {
        'worklet';
        runOnJS(handlePress)({
          nativeEvent: { locationX: e.x, locationY: e.y },
        } as GestureResponderEvent);
      }),
    Gesture.Pan()
      .onUpdate((e) => {
        'worklet';
        runOnJS(handleMove)({
          nativeEvent: { locationX: e.x, locationY: e.y },
        } as GestureResponderEvent);
      })
      .onFinalize(() => {
        'worklet';
        runOnJS(handleRelease)();
      }),
  );

  return gesture;
};
