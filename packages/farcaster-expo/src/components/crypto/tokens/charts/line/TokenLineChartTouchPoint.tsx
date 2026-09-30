import { Group, Path, Skia } from '@shopify/react-native-skia';
import React from 'react';
import {
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { sizes, TouchPoint } from '../utils';

export const TokenLineChartTouchPoint = React.memo(
  ({
    animatedPoints,
    touchPoint,
    chartColors,
    animationEnabled,
  }: {
    animatedPoints: SharedValue<{ x: number; y: number }[]>;
    touchPoint: SharedValue<TouchPoint | null>;
    chartColors: {
      outerCircle: string;
      innerCircle: string;
      background: string;
    };
    animationEnabled: SharedValue<boolean>;
  }) => {
    const opacity = useSharedValue(0.1);
    const scale = useSharedValue(0);

    useAnimatedReaction(
      () => [touchPoint.value, animationEnabled.value],
      ([value, shouldAnimate]) => {
        if (value || !shouldAnimate) {
          opacity.value = 0;
          scale.value = 0;
        } else {
          opacity.value = withRepeat(
            withSequence(
              withTiming(0.1, { duration: 750 }),
              withTiming(0, { duration: 750 }),
            ),
            -1, // Infinite repeat
            true,
          );
          scale.value = withRepeat(
            withSequence(withTiming(1, { duration: 1500 })),
            -1, // Infinite repeat
          );
        }
      },
      [touchPoint, opacity, scale],
    );

    const scaleTransform = useDerivedValue(() => {
      if (!animatedPoints.value.length) {
        return [];
      }

      const point = animatedPoints.value[animatedPoints.value.length - 1];
      return [
        { translateX: point.x },
        { translateY: point.y },
        { scale: scale.value },
        { translateX: -point.x },
        { translateY: -point.y },
      ];
    });

    const outerCirclePath = useDerivedValue(() => {
      const p = Skia.Path.Make();
      const outerRadius = 20;

      if (!animatedPoints.value.length) {
        return p;
      }

      const xPos = touchPoint.value?.x ?? sizes.width;
      const clamped = Math.max(0, Math.min(xPos, sizes.width));

      let closestPoint = animatedPoints.value[animatedPoints.value.length - 1];
      let minDist = Infinity;

      for (const point of animatedPoints.value) {
        const dist = Math.abs(point.x - clamped);
        if (dist < minDist) {
          minDist = dist;
          closestPoint = point;
        }
      }

      p.addCircle(closestPoint.x, closestPoint.y, outerRadius);
      return p;
    }, [touchPoint, sizes.width, animatedPoints]);

    const innerCirclePath = useDerivedValue(() => {
      const p = Skia.Path.Make();
      const innerRadius = 5;

      if (!animatedPoints.value.length) {
        return p;
      }

      const point =
        animatedPoints.value[
          touchPoint.value?.index ?? animatedPoints.value.length - 1
        ];

      p.addCircle(point.x, point.y, innerRadius);
      return p;
    }, [touchPoint, sizes.width, animatedPoints]);

    return (
      <Group>
        <Path
          path={outerCirclePath}
          color={chartColors.outerCircle}
          style="fill"
          opacity={opacity}
          transform={scaleTransform}
        />
        <Path
          path={innerCirclePath}
          color={chartColors.background}
          style="stroke"
          strokeWidth={5}
        />
        <Path
          path={innerCirclePath}
          color={chartColors.innerCircle}
          style="fill"
        />
      </Group>
    );
  },
);
