import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import React, { memo } from 'react';
import { View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/ThemeContext';
import { useSafeFocusEffect } from '../../../../hooks';
import { sizes } from './utils';

const width = sizes.width;
const height = sizes.height + 16;

export const LoadingChart = memo(() => {
  const t = useTheme();
  const offset = useSharedValue(0);
  const path = useSharedValue(Skia.Path.Make());

  const centerY = height / 2;
  const amplitude = 20;
  const frequency = 4;
  const numPoints = 100;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    points.push({ x: (i / (numPoints - 1)) * width, y: 0 });
  }

  useSafeFocusEffect(
    React.useCallback(() => {
      offset.value = withRepeat(
        withTiming(width, {
          duration: 3000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );

      return () => {
        cancelAnimation(offset);
        offset.value = 0;
      };
    }, [offset]),
  );

  useAnimatedReaction(
    () => offset.value,
    (currentOffset) => {
      'worklet';
      const p = Skia.Path.Make();

      for (let i = 0; i < numPoints; i++) {
        const waveX = (points[i].x + currentOffset) % width;
        points[i].y =
          centerY + Math.sin((waveX / width) * frequency * Math.PI) * amplitude;
      }

      if (!points.length) {
        path.value = p;
        return;
      }

      p.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        p.quadTo(prev.x, prev.y, midX, midY);
      }

      path.value = p;
    },
    [width, height],
  );

  return (
    <View style={[t.absolute, { width, height }]}>
      <Canvas style={{ flex: 1 }}>
        <Path
          path={path}
          color={t.colors.border.tertiary}
          style="stroke"
          strokeWidth={2.5}
          opacity={0.5}
        />
      </Canvas>
    </View>
  );
});
