import {
  Canvas,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import type { ApiOnchainTokenLineChartPoint } from 'farcaster-client-data';
import React, { useEffect, useRef } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { WALLET_ANIMATION_CONFIG } from '../../../../../constants';
import { useSkiaFont } from '../../../../../contexts';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { useTokenChart } from '../TokenChartProvider';
import { sizes } from '../utils';
import { TokenLineChartAnnotationLabel } from './TokenLineChartAnnotationLabel';
import { TokenLineChartAnnotationPoints } from './TokenLineChartAnnotationPoints';
import { TokenLineChartMaxLabel } from './TokenLineChartMaxLabel';
import { TokenLineChartMinLabel } from './TokenLineChartMinLabel';
import { TokenLineChartTimestampLabel } from './TokenLineChartTimestampLabel';
import { TokenLineChartTouchPoint } from './TokenLineChartTouchPoint';
import { useTokenLineChartColors } from './useTokenLineChartColors';
import { useTokenLineChartGesture } from './useTokenLineChartGesture';

export const TokenLineChart = ({
  animationEnabled,
  withinNavigationContext = false,
}: {
  animationEnabled: SharedValue<boolean>;
  withinNavigationContext: boolean;
}) => {
  const t = useTheme();
  const { touchPoint, lineChart, annotations, lineChartPeriod, token } =
    useTokenChart();

  const symbol = React.useMemo(() => {
    return token?.ticker ?? '';
  }, [token]);

  const prevDataRef = useRef<ApiOnchainTokenLineChartPoint[]>([]);
  const progress = useSharedValue(1);
  const currentDataRef = useSharedValue<ApiOnchainTokenLineChartPoint[]>([]);
  const prevProcessedRef = useSharedValue<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const prevData = prevDataRef.current;
    const hasLengthChanged = lineChart.length !== prevData.length;

    // Check if last item has changed (timestamp or price)
    const hasLastItemChanged =
      lineChart.length > 0 &&
      prevData.length > 0 &&
      (lineChart[lineChart.length - 1].timestamp !==
        prevData[prevData.length - 1].timestamp ||
        lineChart[lineChart.length - 1].price !==
          prevData[prevData.length - 1].price);
    if (hasLastItemChanged && !hasLengthChanged) {
      prevDataRef.current = lineChart;
      currentDataRef.value = lineChart;
    }
    if (hasLengthChanged) {
      if (WALLET_ANIMATION_CONFIG.LINE_CHART_ANIMATION_ENABLED) {
        progress.value = 0;
      }
      prevDataRef.current = lineChart;
      currentDataRef.value = lineChart;

      progress.value = withTiming(1, {
        duration: WALLET_ANIMATION_CONFIG.LINE_CHART_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [lineChart, progress, currentDataRef]);

  const animatedPoints = useDerivedValue(() => {
    'worklet';

    const data = currentDataRef.value;
    if (!data || data.length === 0) {
      return [];
    }

    // Calculate bounds
    let minX = data[0].timestamp;
    let maxX = data[0].timestamp;
    let minY = data[0].price;
    let maxY = data[0].price;

    for (let i = 1; i < data.length; i++) {
      const point = data[i];
      if (point.timestamp < minX) minX = point.timestamp;
      if (point.timestamp > maxX) maxX = point.timestamp;
      if (point.price < minY) minY = point.price;
      if (point.price > maxY) maxY = point.price;
    }

    const xPadding = (maxX - minX) * 0.06;
    const dx = Math.max(1, maxX + xPadding - minX);
    const yPadding = (maxY - minY) * 0.15;
    const dy = Math.max(0.000001, maxY + yPadding - (minY - yPadding));

    const availableHeight = sizes.height - 16;
    const sx = sizes.width / dx;
    const sy = availableHeight / dy;

    // Transform to screen coordinates
    const nextPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      nextPoints.push({
        x: (point.timestamp - minX) * sx,
        y: (maxY + yPadding - point.price) * sy,
      });
    }

    const prevPoints = prevProcessedRef.value;

    // Animate between previous and next points
    if (prevPoints.length === 0) {
      prevProcessedRef.value = nextPoints;
      return nextPoints;
    }

    const maxLength = Math.max(prevPoints.length, nextPoints.length);
    const result: { x: number; y: number }[] = [];

    for (let i = 0; i < maxLength; i++) {
      const nextPoint =
        nextPoints[Math.min(i, nextPoints.length - 1)] || nextPoints[0];
      const prevPoint =
        prevPoints[Math.min(i, prevPoints.length - 1)] || prevPoints[0];

      result.push({
        x: prevPoint.x + (nextPoint.x - prevPoint.x) * 1,
        y: prevPoint.y + (nextPoint.y - prevPoint.y) * 1,
      });
    }

    // // Store for next transition
    // if (progress.value === 1) {
    //   prevProcessedRef.value = nextPoints;
    // }

    return result.slice(0, nextPoints.length);
  }, [currentDataRef]);

  const touchLinePath = useDerivedValue(() => {
    const p = Skia.Path.Make();

    if (!animatedPoints.value.length) {
      return p;
    }

    p.moveTo(animatedPoints.value[0].x, animatedPoints.value[0].y);

    for (let i = 1; i < animatedPoints.value.length - 1; i++) {
      const c = animatedPoints.value[i];
      const n = animatedPoints.value[i + 1];
      const mx = (c.x + n.x) / 2;
      const my = (c.y + n.y) / 2;
      p.quadTo(c.x, c.y, mx, my);
    }

    const end = animatedPoints.value[animatedPoints.value.length - 1];
    p.lineTo(end.x, end.y);
    return p;
  }, [animatedPoints]);

  const areaPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!animatedPoints.value.length) {
      return p;
    }
    p.moveTo(animatedPoints.value[0].x, sizes.height);
    p.lineTo(animatedPoints.value[0].x, animatedPoints.value[0].y);
    for (let i = 1; i < animatedPoints.value.length - 1; i++) {
      const c = animatedPoints.value[i];
      const n = animatedPoints.value[i + 1];
      const mx = (c.x + n.x) / 2;
      const my = (c.y + n.y) / 2;
      p.quadTo(c.x, c.y, mx, my);
    }
    const l = animatedPoints.value[animatedPoints.value.length - 1];
    p.lineTo(l.x, l.y);
    p.lineTo(l.x, sizes.height);
    p.close();
    return p;
  }, [animatedPoints, sizes.height, sizes.width]);

  const dashedLinePath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (touchPoint.value === null) {
      return p;
    }

    if (!animatedPoints.value.length) {
      return p;
    }

    const point = animatedPoints.value[touchPoint.value.index];

    p.moveTo(point.x, 24);
    p.lineTo(point.x, sizes.height);
    return p;
  }, [touchPoint, sizes.height, animatedPoints]);

  const overlayPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (touchPoint.value === null) {
      return p;
    }

    if (!animatedPoints.value.length) {
      return p;
    }

    const point = animatedPoints.value[touchPoint.value.index];

    const xPaddingStart = 0;
    const end = animatedPoints.value[animatedPoints.value.length - 1];
    const endX = end.x;
    const xPaddingEnd = sizes.width - endX;
    const snappedX = Math.max(
      xPaddingStart,
      Math.min(point.x, sizes.width - xPaddingEnd),
    );
    p.addRect({
      x: snappedX,
      y: 0,
      width: sizes.width - snappedX,
      height: sizes.height,
    });
    return p;
  }, [touchPoint, sizes.width, sizes.height, animatedPoints]);

  const gesture = useTokenLineChartGesture(withinNavigationContext);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
    };
  }, [progress]);

  const chartColors = useTokenLineChartColors();
  const { fontManager } = useSkiaFont();

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[{ width: sizes.width, height: sizes.height }, animatedStyle]}
      >
        <Canvas style={{ flex: 1 }}>
          <Group transform={[{ translateY: 16 }]}>
            <Path path={areaPath}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: sizes.height - 16 }}
                colors={[
                  chartColors.bgChartAreaStart,
                  chartColors.bgChartAreaEnd,
                ]}
              />
            </Path>

            <Path
              path={touchLinePath}
              color={chartColors.touchLinePath}
              style="stroke"
              strokeWidth={2.5}
            />

            <Path path={overlayPath} color={chartColors.overlay} style="fill" />
          </Group>
          <TokenLineChartMaxLabel
            lineChart={lineChart}
            animatedPoints={animatedPoints}
            chartColors={chartColors}
            fontManager={fontManager}
          />
          <TokenLineChartMinLabel
            lineChart={lineChart}
            animatedPoints={animatedPoints}
            chartColors={chartColors}
            fontManager={fontManager}
          />
          <Group transform={[{ translateY: 6 }]}>
            <Path
              path={dashedLinePath}
              color={t.colors.border.tertiary}
              style="stroke"
              strokeWidth={1}
            >
              <DashPathEffect intervals={[4, 4]} />
            </Path>
            <TokenLineChartTimestampLabel
              period={lineChartPeriod}
              touchPoint={touchPoint}
              chartColors={chartColors}
              fontManager={fontManager}
            />
          </Group>
          <Group transform={[{ translateY: 16 }]}>
            <TokenLineChartAnnotationPoints
              annotations={annotations}
              animatedPoints={animatedPoints}
              lineChart={lineChart}
              chartColors={chartColors}
              skiaFontManager={fontManager}
            />
            <TokenLineChartTouchPoint
              animatedPoints={animatedPoints}
              touchPoint={touchPoint}
              chartColors={chartColors}
              animationEnabled={animationEnabled}
            />
          </Group>
          <Group transform={[{ translateY: -36 }]}>
            <TokenLineChartAnnotationLabel
              period={lineChartPeriod}
              touchPoint={touchPoint}
              chartColors={chartColors}
              symbol={symbol}
              skiaFontManager={fontManager}
            />
          </Group>
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
};
