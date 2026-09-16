import {
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  SkPicture,
  StrokeCap,
} from '@shopify/react-native-skia';
import { ApiOnchainTokenCandlestickChartPoint } from 'farcaster-client-data';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  DerivedValue,
  Easing,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../../../contexts/ThemeContext';
import { TextColor } from '../../../../design-system';
import { FontWeight, Text2, TextSize } from '../../../../design-system/Text';
import { useTokenChart } from '../TokenChartProvider';
import { colors, sizes } from '../utils';
import { TokenCandlestickChartAnnotationLabel } from './TokenCandlestickChartAnnotationLabel';
import { useTokenCandlestickChartGesture } from './useTokenCandlestickChartGesture';
import { formatPrice, formatTimestamp } from './utils';

function createBlankPicture(width: number, height: number): SkPicture {
  'worklet';
  const recorder = Skia.PictureRecorder();
  recorder.beginRecording({ x: 0, y: 0, width, height });
  return recorder.finishRecordingAsPicture();
}

const cubicEasing = Easing.bezier(0.22, 1, 0.36, 1);

const AnimatedTimestampText = ({
  timestampData,
  color,
  size,
  weight,
}: {
  timestampData: DerivedValue<{ index: number; timestamp: number }>;
  color: TextColor;
  size: TextSize;
  weight: FontWeight;
}) => {
  const [displayText, setDisplayText] = useState('');
  const lastTimestamp = useSharedValue(-1);
  const updateGeneration = useSharedValue(0);

  const updateTimestamp = useCallback(
    (value: number, generation: number) => {
      // Skip stale queued updates - only process if generation matches
      if (value > 0 && generation === updateGeneration.value) {
        setDisplayText(formatTimestamp(value));
      }
    },
    [updateGeneration],
  );

  useFrameCallback(() => {
    'worklet';
    const data = timestampData.value;
    if (data.timestamp !== lastTimestamp.value) {
      lastTimestamp.value = data.timestamp;
      updateGeneration.value += 1;
      runOnJS(updateTimestamp)(data.timestamp, updateGeneration.value);
    }
  });

  return (
    <Text2 color={color} size={size} weight={weight}>
      {displayText}
    </Text2>
  );
};

const AnimatedPriceText = ({
  price,
  color,
  size,
  weight,
  showNA = false,
}: {
  price: DerivedValue<number>;
  color: TextColor;
  size: TextSize;
  weight: FontWeight;
  showNA?: boolean;
}) => {
  const [displayText, setDisplayText] = useState('');
  const hasInitialValue = useSharedValue(false);
  const lastPrice = useSharedValue(-1);
  const updateGeneration = useSharedValue(0);

  const updatePrice = useCallback(
    (value: number, generation: number) => {
      // Skip stale queued updates - only process if generation matches
      if (value > 0 && generation === updateGeneration.value) {
        setDisplayText(formatPrice(value));
      }
    },
    [updateGeneration],
  );

  useFrameCallback(() => {
    'worklet';
    if (showNA) return;
    const value = price.value;

    // On first valid value, set it immediately without threshold check
    if (!hasInitialValue.value && value > 0) {
      hasInitialValue.value = true;
      lastPrice.value = value;
      updateGeneration.value += 1;
      runOnJS(updatePrice)(value, updateGeneration.value);
      return;
    }

    // 0.05% threshold avoids overwhelming JS thread during spring animations
    const threshold = Math.abs(lastPrice.value) * 0.0005;
    if (Math.abs(value - lastPrice.value) > threshold) {
      lastPrice.value = value;
      updateGeneration.value += 1;
      runOnJS(updatePrice)(value, updateGeneration.value);
    }
  });

  return (
    <Text2
      color={color}
      size={size}
      weight={weight}
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {showNA ? 'N/A' : displayText}
    </Text2>
  );
};

const PriceLabels = memo(
  ({
    labelValues,
    highestPrice,
    middlePrice,
    lowestPrice,
    currentPrice,
    priceChangePct,
    showCurrentPrice,
    currentPriceOpacityStyle,
    showNA,
    t,
  }: {
    labelValues: DerivedValue<{
      highestPrice: number;
      lowestPrice: number;
      middlePrice: number;
      currentPrice: number;
      highestY: number;
      middleY: number;
      lowestY: number;
      currentY: number;
    }>;
    highestPrice: DerivedValue<number>;
    middlePrice: DerivedValue<number>;
    lowestPrice: DerivedValue<number>;
    currentPrice: number;
    priceChangePct: number | null;
    showCurrentPrice: boolean;
    currentPriceOpacityStyle?: StyleProp<ViewStyle>;
    showNA: boolean;
    t: ReturnType<typeof useTheme>;
  }) => {
    const highestStyle = useAnimatedStyle(() => ({
      top: labelValues.value.highestY - 9,
    }));

    const middleStyle = useAnimatedStyle(() => ({
      top: labelValues.value.middleY - 9,
    }));

    const lowestStyle = useAnimatedStyle(() => ({
      top: labelValues.value.lowestY - 9,
    }));

    const currentStyle = useAnimatedStyle(() => ({
      top: labelValues.value.currentY - 9,
    }));

    return (
      <View
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 4,
              backgroundColor: t.colors.background.secondary,
              borderWidth: 1,
              borderColor: t.colors.bgTransparent,
              paddingHorizontal: 5,
              paddingVertical: 0.5,
            },
            t.roundedFull,
            t.z0,
            highestStyle,
          ]}
        >
          <AnimatedPriceText
            price={highestPrice}
            color="tertiary"
            size="2xs"
            weight="semibold"
            showNA={showNA}
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 4,
              backgroundColor: t.colors.background.secondary,
              borderWidth: 1,
              borderColor: t.colors.bgTransparent,
              paddingHorizontal: 5,
              paddingVertical: 0.5,
            },
            t.roundedFull,
            t.z0,
            middleStyle,
          ]}
        >
          <AnimatedPriceText
            price={middlePrice}
            color="tertiary"
            size="2xs"
            weight="semibold"
            showNA={showNA}
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 4,
              backgroundColor: t.colors.background.secondary,
              borderWidth: 1,
              borderColor: t.colors.bgTransparent,
              paddingHorizontal: 5,
              paddingVertical: 0.5,
            },
            t.roundedFull,
            t.z0,
            lowestStyle,
          ]}
        >
          <AnimatedPriceText
            price={lowestPrice}
            color="tertiary"
            size="2xs"
            weight="semibold"
            showNA={showNA}
          />
        </Animated.View>

        {showCurrentPrice && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                right: 4,
                backgroundColor: t.colors.background.secondary,
                borderWidth: 1,
                borderColor: t.colors.border.secondary,
                paddingHorizontal: 5,
                paddingVertical: 0.5,
              },
              t.roundedFull,
              t.shadowLg,
              t.z10,
              currentStyle,
              currentPriceOpacityStyle,
            ]}
          >
            <Text2
              size="2xs"
              weight="semibold"
              style={{
                color:
                  priceChangePct && priceChangePct > 0
                    ? t.colors.green450
                    : t.colors.red450,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatPrice(currentPrice)}
            </Text2>
          </Animated.View>
        )}
      </View>
    );
  },
);

export const TokenCandlestickChart = memo(
  ({
    withinNavigationContext = false,
  }: {
    withinNavigationContext?: boolean;
  }) => {
    const {
      candlestickChart,
      lineChart,
      activeCandleData,
      annotations,
      token,
      isLoading,
      transitioningProgress,
      loadMoreHistoricalData,
      isLoadingMore,
      hasMoreHistoricalData,
    } = useTokenChart();
    const t = useTheme();

    const volumeAnimationProgress = useSharedValue(0);
    const isFirstRenderAfterTransition = React.useRef(false);
    const isViewingLatestShared = useSharedValue(true);
    const isInitialLoad = React.useRef(true);

    const barWidth = 9;
    const barGap = 4;
    const barSpacing = barWidth + barGap;
    const leftPadding = 10;
    const rightPadding = 70;

    const totalWidth = useMemo(() => {
      return leftPadding + candlestickChart.length * barSpacing + rightPadding;
    }, [candlestickChart.length, leftPadding, rightPadding, barSpacing]);

    const initialScrollX = useMemo(() => {
      return Math.max(0, totalWidth - sizes.width);
    }, [totalWidth]);

    const offsetX = useSharedValue(initialScrollX);
    const startOffsetX = useSharedValue(0);
    const [viewportOffset, setViewportOffset] = useState(initialScrollX);

    const isScrolling = useSharedValue(false);
    const lastOffsetX = useSharedValue(initialScrollX);

    const activeCandleIndex = useSharedValue(-1);
    const isLongPressing = useSharedValue(false);
    const opacityTransition = useSharedValue(0);
    const activeCandleAnnotations = useSharedValue<typeof annotations>([]);

    // Pre-compute annotation to candle index mapping to avoid recalculating on every frame
    // Use plain object instead of Map for Reanimated UI runtime compatibility
    const annotationIndexMap = useMemo(() => {
      const map: Record<number, number> = {}; // annotation timestamp -> candle index

      for (const annotation of annotations) {
        let minDist = Infinity;
        let closestIndex = -1;

        for (let i = 0; i < candlestickChart.length; i++) {
          const candle = candlestickChart[i];
          const dist = Math.abs(candle.timestamp - annotation.timestamp);
          if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
          }
        }

        if (closestIndex !== -1) {
          map[annotation.timestamp] = closestIndex;
        }
      }

      return map;
    }, [annotations, candlestickChart]);

    const prevCandleCount = React.useRef(candlestickChart.length);
    const isLoadingMoreRef = React.useRef(false);
    const loadMoreThreshold = 60; // Trigger load when within 60 candles of left edge

    useEffect(() => {
      offsetX.value = initialScrollX;
      setViewportOffset(initialScrollX);
    }, [initialScrollX, offsetX]);

    // Track transition state changes to detect when we just got new data

    // Animate volume bars from 0 on data change
    useEffect(() => {
      if (candlestickChart.length > 0 && !isLoading) {
        // Skip animation on initial load or first render after transition
        const shouldSkip =
          isInitialLoad.current || isFirstRenderAfterTransition.current;

        if (shouldSkip) {
          // Skip animation for initial render
          volumeAnimationProgress.value = 1;
          isFirstRenderAfterTransition.current = false;
          isInitialLoad.current = false;
        } else {
          // Normal animation for all other renders
          volumeAnimationProgress.value = 0;
          volumeAnimationProgress.value = withTiming(1, {
            duration: 150,
            easing: cubicEasing,
          });
        }
      }
    }, [candlestickChart.length, isLoading, volumeAnimationProgress]);

    // Handle scroll position adjustment after pagination loads
    useEffect(() => {
      const currentCount = candlestickChart.length;
      const prevCount = prevCandleCount.current;

      if (currentCount > prevCount && isLoadingMoreRef.current) {
        // Data was prepended - adjust scroll to maintain visual position
        const addedCount = currentCount - prevCount;
        const addedWidth = addedCount * barSpacing;

        // Shift scroll position to the right by the added width
        const newOffset = offsetX.value + addedWidth;
        offsetX.value = newOffset;
        setViewportOffset(Math.round(newOffset));

        // Reset the loading flag after successful pagination
        isLoadingMoreRef.current = false;
      }

      prevCandleCount.current = currentCount;
    }, [candlestickChart.length, barSpacing, offsetX]);

    // Trigger pagination when scrolling near left edge
    const checkAndLoadMore = React.useCallback(() => {
      if (candlestickChart.length === 0) {
        return;
      }

      if (isLoadingMoreRef.current || isLoadingMore || !hasMoreHistoricalData) {
        return;
      }

      // Calculate which candles are visible in the viewport
      const startVisibleIndex = Math.max(
        0,
        Math.floor((viewportOffset - leftPadding) / barSpacing),
      );
      const endVisibleIndex = Math.min(
        candlestickChart.length - 1,
        Math.ceil((viewportOffset + sizes.width - leftPadding) / barSpacing),
      );

      // Check if the threshold candle (60th from start) is visible in viewport
      const thresholdCandleIndex = loadMoreThreshold;
      const isThresholdVisible =
        thresholdCandleIndex >= startVisibleIndex &&
        thresholdCandleIndex <= endVisibleIndex;

      if (isThresholdVisible) {
        isLoadingMoreRef.current = true;

        loadMoreHistoricalData()
          .then(() => {
            // Always reset the flag after load completes
            setTimeout(() => {
              isLoadingMoreRef.current = false;
            }, 100);
          })
          .catch(() => {
            isLoadingMoreRef.current = false;
          });
      }
    }, [
      isLoadingMore,
      hasMoreHistoricalData,
      viewportOffset,
      loadMoreThreshold,
      barSpacing,
      loadMoreHistoricalData,
      candlestickChart.length,
      leftPadding,
    ]);

    // Monitor viewport changes for pagination trigger
    useEffect(() => {
      checkAndLoadMore();
    }, [checkAndLoadMore]);

    const visibleCandles = useMemo(() => {
      const startIndex = Math.max(
        0,
        Math.floor((viewportOffset - leftPadding) / barSpacing),
      );
      const endIndex = Math.min(
        candlestickChart.length,
        Math.ceil((viewportOffset + sizes.width - leftPadding) / barSpacing) +
          1,
      );
      return candlestickChart.slice(startIndex, endIndex);
    }, [candlestickChart, viewportOffset, barSpacing]);

    const currentPrice = useMemo(() => {
      return candlestickChart.length > 0
        ? candlestickChart[candlestickChart.length - 1].close
        : 0;
    }, [candlestickChart]);

    const priceRangeValues = useMemo(() => {
      if (visibleCandles.length === 0) {
        return { high: 0, low: 0 };
      }

      // Use actual high/low values to include wicks
      const wickHighs = visibleCandles.map((c) => c.high).sort((a, b) => a - b);
      const wickLows = visibleCandles.map((c) => c.low).sort((a, b) => a - b);

      const p99Index = Math.min(
        Math.floor(wickHighs.length * 0.99),
        wickHighs.length - 1,
      );
      const p1Index = Math.floor(wickLows.length * 0.01);

      const highestWick = wickHighs[p99Index];
      const lowestWick = wickLows[p1Index];

      const rawRange = highestWick - lowestWick;
      const padding = rawRange * 0.05;

      let high = highestWick + padding;
      let low = lowestWick - padding;

      // Always include current price in initial calculation
      // The worklet will determine dynamically if it should be included based on scroll position
      high = Math.max(high, currentPrice);
      low = Math.min(low, currentPrice);

      return {
        high,
        low,
      };
    }, [visibleCandles, currentPrice]);

    const targetPriceHigh = useSharedValue(priceRangeValues.high || 0);
    const targetPriceLow = useSharedValue(priceRangeValues.low || 0);
    const targetMaxVolume = useSharedValue(1);

    // CRITICAL: Animate normalized 0-1 progress instead of tiny decimals
    // Springs fail on extremely small values (e.g. 0.0000001 for 18-decimal tokens)
    // By animating 0?1 and interpolating, springs work for all price ranges
    const animatedProgress = useSharedValue(1);
    const animatedVolumeProgress = useSharedValue(1);

    const animationStartHigh = useSharedValue(priceRangeValues.high || 0);
    const animationStartLow = useSharedValue(priceRangeValues.low || 0);
    const animationStartVolume = useSharedValue(1);

    const hasInitialized = useSharedValue(false);

    const priceRangeHigh = useDerivedValue(() => {
      const progress = animatedProgress.value;
      return (
        animationStartHigh.value +
        (targetPriceHigh.value - animationStartHigh.value) * progress
      );
    });

    const priceRangeLow = useDerivedValue(() => {
      const progress = animatedProgress.value;
      return (
        animationStartLow.value +
        (targetPriceLow.value - animationStartLow.value) * progress
      );
    });

    const animatedMaxVolume = useDerivedValue(() => {
      const progress = animatedVolumeProgress.value;
      return (
        animationStartVolume.value +
        (targetMaxVolume.value - animationStartVolume.value) * progress
      );
    });

    // IMPORTANT: Delay clearing to allow overlay fade-out animation
    const clearHoldModeDelayed = useCallback(() => {
      runOnUI(() => {
        'worklet';
        opacityTransition.value = withTiming(0, { duration: 100 });
      })();
      setTimeout(() => {
        runOnUI(() => {
          'worklet';
          activeCandleIndex.value = -1;
          isLongPressing.value = false;
          activeCandleData.value = null;
          activeCandleAnnotations.value = [];
        })();
        // Force viewport recalc to update price ranges after scrubbing
        setViewportOffset(Math.round(offsetX.value));
      }, 150);
    }, [
      activeCandleIndex,
      isLongPressing,
      activeCandleData,
      offsetX,
      setViewportOffset,
      opacityTransition,
      activeCandleAnnotations,
    ]);

    const combinedGesture = useTokenCandlestickChartGesture({
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
      withinNavigationContext,
    });

    const firstTimestampData = useDerivedValue(() => {
      'worklet';
      const currentOffsetX = offsetX.value;
      const startIndex = Math.max(
        0,
        Math.floor((currentOffsetX - leftPadding) / barSpacing),
      );

      if (startIndex >= candlestickChart.length) {
        return { index: -1, timestamp: 0 };
      }

      return {
        index: startIndex,
        timestamp: candlestickChart[startIndex].timestamp,
      };
    }, [offsetX, candlestickChart, leftPadding, barSpacing]);

    const lastTimestampData = useDerivedValue(() => {
      'worklet';
      const currentOffsetX = offsetX.value;
      const endIndex = Math.min(
        candlestickChart.length - 1,
        Math.ceil((currentOffsetX + sizes.width - leftPadding) / barSpacing),
      );

      if (endIndex < 0 || endIndex >= candlestickChart.length) {
        return { index: -1, timestamp: 0 };
      }

      return {
        index: endIndex,
        timestamp: candlestickChart[endIndex].timestamp,
      };
    }, [offsetX, candlestickChart, leftPadding, barSpacing, sizes.width]);

    const timestampSpace = 20;
    const chartTopPadding = 10;
    const volumeGap = 4;
    const volumeHeightFactor = 0.175;

    const totalChartHeight = sizes.height - chartTopPadding - timestampSpace;

    const volumeRegionHeight = totalChartHeight * volumeHeightFactor;
    const candleRegionHeight =
      totalChartHeight - volumeRegionHeight - volumeGap;

    const volumeStartY = chartTopPadding + candleRegionHeight + volumeGap;

    const hasNoDataForLabels = candlestickChart.length === 0;

    const labelValues = useDerivedValue(() => {
      const high = priceRangeHigh.value;
      const low = priceRangeLow.value;
      const range = high - low;
      const middle = (high + low) / 2;

      const scalePriceWorklet = (price: number) => {
        'worklet';
        if (range === 0) return candleRegionHeight / 2;
        const normalized = (price - low) / range;
        return chartTopPadding + candleRegionHeight * (1 - normalized);
      };

      // If no data, position labels evenly spaced
      if (hasNoDataForLabels) {
        return {
          highestPrice: high,
          lowestPrice: low,
          middlePrice: middle,
          currentPrice,
          highestY: chartTopPadding,
          middleY: chartTopPadding + candleRegionHeight / 2,
          lowestY: chartTopPadding + candleRegionHeight,
          currentY: scalePriceWorklet(currentPrice),
        };
      }

      return {
        highestPrice: high,
        lowestPrice: low,
        middlePrice: middle,
        currentPrice,
        highestY: scalePriceWorklet(high),
        lowestY: scalePriceWorklet(low),
        middleY: scalePriceWorklet(middle),
        currentY: scalePriceWorklet(currentPrice),
      };
    }, [
      currentPrice,
      candleRegionHeight,
      chartTopPadding,
      hasNoDataForLabels,
      priceRangeHigh,
      priceRangeLow,
    ]);

    const highestPriceValue = useDerivedValue(() => {
      'worklet';
      return priceRangeHigh.value;
    }, [priceRangeHigh]);

    const lowestPriceValue = useDerivedValue(() => {
      'worklet';
      return priceRangeLow.value;
    }, [priceRangeLow]);

    const middlePriceValue = useDerivedValue(() => {
      'worklet';
      return (priceRangeHigh.value + priceRangeLow.value) / 2;
    }, [priceRangeHigh, priceRangeLow]);

    const priceChangePct = useMemo(() => {
      if (lineChart.length === 0) {
        return null;
      }
      const firstPrice = lineChart[0].price;
      const latestPrice = lineChart[lineChart.length - 1].price;
      const delta = (latestPrice - firstPrice) / firstPrice;
      return delta * 100;
    }, [lineChart]);

    const currentPriceColor = useMemo(() => {
      if (!priceChangePct) {
        return `${t.colors.red450}50`;
      }
      const baseColor =
        priceChangePct > 0 ? t.colors.green450 : t.colors.red450;
      return `${baseColor}50`;
    }, [priceChangePct, t.colors.green450, t.colors.red450]);

    const pictureRecorder = useMemo(() => Skia.PictureRecorder(), []);

    const chartPicture = useSharedValue<SkPicture>(
      createBlankPicture(sizes.width, sizes.height),
    );

    const buildChartPicture = useCallback(() => {
      'worklet';

      const currentOffsetX = offsetX.value;
      const hasNoData = candlestickChart.length === 0;

      if (hasNoData) {
        const canvas = pictureRecorder.beginRecording({
          x: 0,
          y: 0,
          width: sizes.width,
          height: sizes.height,
        });

        const fadeHeight = 10;
        const bgColor = Skia.Color(t.colors.background.primary);
        const bgTransparent = Skia.Color(`${t.colors.background.primary}00`);

        const topGradient = Skia.Shader.MakeLinearGradient(
          { x: 0, y: 0 },
          { x: 0, y: fadeHeight },
          [bgColor, bgTransparent],
          null,
          0,
        );
        const topFadePaint = Skia.Paint();
        topFadePaint.setShader(topGradient);
        canvas.drawRect(
          { x: 0, y: 0, width: sizes.width, height: fadeHeight },
          topFadePaint,
        );
        topFadePaint.dispose();
        topGradient.dispose();

        const bottomY = sizes.height - timestampSpace - fadeHeight + 10;
        const bottomGradient = Skia.Shader.MakeLinearGradient(
          { x: 0, y: bottomY },
          { x: 0, y: bottomY + fadeHeight },
          [bgTransparent, bgColor],
          null,
          0,
        );
        const bottomFadePaint = Skia.Paint();
        bottomFadePaint.setShader(bottomGradient);
        canvas.drawRect(
          { x: 0, y: bottomY, width: sizes.width, height: fadeHeight },
          bottomFadePaint,
        );
        bottomFadePaint.dispose();
        bottomGradient.dispose();

        const solidBgPaint = Skia.Paint();
        solidBgPaint.setColor(bgColor);
        const solidRectY = bottomY + fadeHeight;
        canvas.drawRect(
          {
            x: 0,
            y: solidRectY,
            width: sizes.width,
            height: sizes.height - solidRectY,
          },
          solidBgPaint,
        );
        solidBgPaint.dispose();

        const oldPicture = chartPicture.value;
        chartPicture.value = pictureRecorder.finishRecordingAsPicture();
        oldPicture.dispose();
        return;
      }

      const startIndex = Math.max(
        0,
        Math.floor((currentOffsetX - leftPadding) / barSpacing),
      );
      const endIndex = Math.min(
        candlestickChart.length - 1,
        Math.ceil((currentOffsetX + sizes.width - leftPadding) / barSpacing) +
          1,
      );

      const visibleSlice = candlestickChart.slice(startIndex, endIndex + 1);

      if (visibleSlice.length === 0) {
        return;
      }

      // Use actual high/low values to include wicks
      const wickHighs = visibleSlice.map((c) => c.high).sort((a, b) => a - b);
      const wickLows = visibleSlice.map((c) => c.low).sort((a, b) => a - b);

      const p99Index = Math.floor(wickHighs.length * 0.99);
      const p1Index = Math.floor(wickLows.length * 0.01);

      const highWithoutOutliers =
        wickHighs[Math.min(p99Index, wickHighs.length - 1)];
      const lowWithoutOutliers = wickLows[Math.max(0, p1Index)];

      const padding = (highWithoutOutliers - lowWithoutOutliers) * 0.1;
      const highWithPadding = highWithoutOutliers + padding;
      const lowWithPadding = lowWithoutOutliers - padding;

      // Check if the newest candle is in the visible viewport
      const isViewingLatest =
        visibleSlice.length > 0 &&
        visibleSlice[visibleSlice.length - 1] ===
          candlestickChart[candlestickChart.length - 1];

      // Always show current price line and label (don't hide it)
      isViewingLatestShared.value = true;

      // Only include current price in range when newest candle is visible
      // This prevents compressing the chart when scrolling to old data
      const targetHigh = isViewingLatest
        ? Math.max(highWithPadding, currentPrice)
        : highWithPadding;
      const targetLow = isViewingLatest
        ? Math.min(lowWithPadding, currentPrice)
        : lowWithPadding;

      if (targetHigh - targetLow === 0) {
        return;
      }

      const targetMaxVol = Math.max(...visibleSlice.map((c) => c.volume), 1);

      const targetHighChanged = targetPriceHigh.value !== targetHigh;
      const targetLowChanged = targetPriceLow.value !== targetLow;
      const targetVolumeChanged = targetMaxVolume.value !== targetMaxVol;

      // Skip animations on initial load with data
      const defaultOverride: boolean = true;
      const shouldSkipAnimation = defaultOverride || !hasInitialized.value;

      if (targetHighChanged || targetLowChanged) {
        cancelAnimation(animatedProgress);
        animationStartHigh.value = priceRangeHigh.value;
        animationStartLow.value = priceRangeLow.value;
        targetPriceHigh.value = targetHigh;
        targetPriceLow.value = targetLow;
        animatedProgress.value = 0;

        if (shouldSkipAnimation) {
          // Instant update during transition
          animatedProgress.value = 1;
          hasInitialized.value = true;
        } else {
          animatedProgress.value = withTiming(1, {
            duration: 150,
            easing: cubicEasing,
          });
        }
      }

      if (targetVolumeChanged) {
        cancelAnimation(animatedVolumeProgress);
        animationStartVolume.value = animatedMaxVolume.value;
        targetMaxVolume.value = targetMaxVol;
        animatedVolumeProgress.value = 0;

        if (shouldSkipAnimation) {
          // Instant update during transition
          animatedVolumeProgress.value = 1;
        } else {
          animatedVolumeProgress.value = withTiming(1, {
            duration: 150,
            easing: cubicEasing,
          });
        }
      }

      const high = priceRangeHigh.value;
      const low = priceRangeLow.value;
      const range = high - low;
      const maxVol = animatedMaxVolume.value;

      if (range === 0) {
        return;
      }

      const canvas = pictureRecorder.beginRecording({
        x: 0,
        y: 0,
        width: sizes.width,
        height: sizes.height,
      });

      const scalePrice = (price: number) => {
        'worklet';
        const normalized = (price - low) / range;
        return chartTopPadding + candleRegionHeight * (1 - normalized);
      };

      const gridPaint = Skia.Paint();
      gridPaint.setColor(Skia.Color(t.colors.background.secondary));
      gridPaint.setStrokeWidth(1);
      gridPaint.setStyle(PaintStyle.Stroke);

      // Dash phase creates animated dashed lines that move with scroll
      const dashPattern = [2, 2];
      const dashCycle = 4;
      const dashPhase = currentOffsetX % dashCycle;
      const dashEffect = Skia.PathEffect.MakeDash(dashPattern, dashPhase);
      gridPaint.setPathEffect(dashEffect);

      const middle = (high + low) / 2;

      // Calculate line end position - stop before labels when at/past newest data
      const maxOffset = Math.max(0, totalWidth - sizes.width);
      const isAtOrPastNewest = currentOffsetX >= maxOffset - 1;
      const lineEndX = isAtOrPastNewest
        ? sizes.width - (rightPadding - 4)
        : sizes.width;

      [high, middle, low].forEach((price) => {
        const y = scalePrice(price) + 0.5;
        canvas.drawLine(0, y, lineEndX, y, gridPaint);
      });

      // Always draw current price line
      const currentPaint = Skia.Paint();
      currentPaint.setColor(Skia.Color(currentPriceColor));
      currentPaint.setStrokeWidth(1);
      const currentDashEffect = Skia.PathEffect.MakeDash(
        dashPattern,
        dashPhase,
      );
      currentPaint.setPathEffect(currentDashEffect);
      const currentY = scalePrice(currentPrice) + 0.5;
      canvas.drawLine(0, currentY, lineEndX, currentY, currentPaint);
      currentDashEffect.dispose();
      currentPaint.dispose();

      dashEffect.dispose();
      gridPaint.dispose();

      const transitionProgress = opacityTransition.value;
      const activeIndexForVolume = activeCandleIndex.value;
      const volumeProgress = volumeAnimationProgress.value;

      const volumePaint = Skia.Paint();
      volumePaint.setColor(Skia.Color(t.colors.background.tertiary));
      volumePaint.setAntiAlias(true);

      for (
        let i = startIndex;
        i <= endIndex && i < candlestickChart.length;
        i++
      ) {
        const candle = candlestickChart[i];
        const isActive = i === activeIndexForVolume;
        const opacity = isActive ? 1 : 1 - transitionProgress * 0.7;

        volumePaint.setAlphaf(opacity);

        const x = leftPadding + i * barSpacing - currentOffsetX;

        const fullHeight = Math.min(
          (candle.volume / maxVol) * volumeRegionHeight,
          volumeRegionHeight,
        );
        const normalizedHeight = fullHeight * volumeProgress;
        const y = volumeStartY + (volumeRegionHeight - normalizedHeight);

        const rect = Skia.RRectXY(
          Skia.XYWHRect(x, y, barWidth, normalizedHeight),
          3,
          3,
        );

        canvas.drawRRect(rect, volumePaint);
      }

      // Reset alpha after volume bars
      volumePaint.setAlphaf(1);
      volumePaint.dispose();

      const wickPaint = Skia.Paint();
      wickPaint.setStrokeWidth(1);
      wickPaint.setStrokeCap(StrokeCap.Round);
      wickPaint.setAntiAlias(true);

      const bodyPaint = Skia.Paint();
      bodyPaint.setAntiAlias(true);
      bodyPaint.setStyle(PaintStyle.Fill);

      const greenCandles: Array<{
        candle: ApiOnchainTokenCandlestickChartPoint;
        index: number;
      }> = [];
      const redCandles: Array<{
        candle: ApiOnchainTokenCandlestickChartPoint;
        index: number;
      }> = [];

      for (
        let i = startIndex;
        i <= endIndex && i < candlestickChart.length;
        i++
      ) {
        const candle = candlestickChart[i];
        const isGreen = candle.close >= candle.open;

        if (isGreen) {
          greenCandles.push({ candle, index: i });
        } else {
          redCandles.push({ candle, index: i });
        }
      }

      const activeIndex = activeCandleIndex.value;

      wickPaint.setColor(Skia.Color(colors.green));
      bodyPaint.setColor(Skia.Color(colors.green));

      greenCandles.forEach(({ candle, index }) => {
        const isActive = index === activeIndex;
        const opacity = isActive ? 1 : 1 - transitionProgress * 0.7;

        wickPaint.setAlphaf(opacity);
        bodyPaint.setAlphaf(opacity);

        const x = leftPadding + index * barSpacing - currentOffsetX;
        const centerX = x + barWidth / 2;

        const highY = scalePrice(candle.high);
        const lowY = scalePrice(candle.low);
        const openY = scalePrice(candle.open);
        const closeY = scalePrice(candle.close);

        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

        // Draw wick segments that don't overlap with body
        if (highY < bodyTop) {
          canvas.drawLine(centerX, highY, centerX, bodyTop, wickPaint);
        }
        if (lowY > bodyBottom) {
          canvas.drawLine(centerX, bodyBottom, centerX, lowY, wickPaint);
        }

        const rect = Skia.RRectXY(
          Skia.XYWHRect(x, bodyTop, barWidth, bodyHeight),
          3,
          3,
        );

        canvas.drawRRect(rect, bodyPaint);
      });

      // Reset alpha after green candles
      wickPaint.setAlphaf(1);
      bodyPaint.setAlphaf(1);

      wickPaint.setColor(Skia.Color(colors.red));
      bodyPaint.setColor(Skia.Color(colors.red));

      redCandles.forEach(({ candle, index }) => {
        const isActive = index === activeIndex;
        const opacity = isActive ? 1 : 1 - transitionProgress * 0.7;

        wickPaint.setAlphaf(opacity);
        bodyPaint.setAlphaf(opacity);

        const x = leftPadding + index * barSpacing - currentOffsetX;
        const centerX = x + barWidth / 2;

        const highY = scalePrice(candle.high);
        const lowY = scalePrice(candle.low);
        const openY = scalePrice(candle.open);
        const closeY = scalePrice(candle.close);

        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

        // Draw wick segments that don't overlap with body
        if (highY < bodyTop) {
          canvas.drawLine(centerX, highY, centerX, bodyTop, wickPaint);
        }
        if (lowY > bodyBottom) {
          canvas.drawLine(centerX, bodyBottom, centerX, lowY, wickPaint);
        }

        const rect = Skia.RRectXY(
          Skia.XYWHRect(x, bodyTop, barWidth, bodyHeight),
          3,
          3,
        );

        canvas.drawRRect(rect, bodyPaint);
      });

      // Reset alpha after red candles
      wickPaint.setAlphaf(1);
      bodyPaint.setAlphaf(1);

      wickPaint.dispose();
      bodyPaint.dispose();

      // Draw annotation markers (buy/sell)
      const hasAnnotations = annotations.length > 0;

      if (hasAnnotations) {
        const markerRadius = 6.5; // 13px diameter
        const markerPadding = 8; // Distance from candle

        const markerFillPaint = Skia.Paint();
        markerFillPaint.setAntiAlias(true);
        markerFillPaint.setStyle(PaintStyle.Fill);

        const letterPaint = Skia.Paint();
        letterPaint.setColor(Skia.Color('#FFFFFF'));
        letterPaint.setAntiAlias(true);
        letterPaint.setStyle(PaintStyle.Fill);

        // SVG paths for letters
        const bPath = Skia.Path.MakeFromSVGString(
          'M0 5V0h1.875q.537 0 .891.173.354.171.53.467.176.295.176.664 0 .309-.118.525a.95.95 0 0 1-.31.346 1.3 1.3 0 0 1-.43.188v.05q.258.013.499.163.241.146.398.417.156.269.156.652 0 .385-.183.693a1.25 1.25 0 0 1-.56.484Q2.55 5 1.97 5zm.833-.7h1.03q.518 0 .744-.2a.65.65 0 0 0 .227-.506.79.79 0 0 0-.441-.718 1.1 1.1 0 0 0-.503-.11H.833zm0-2.156h.952q.243 0 .44-.09a.74.74 0 0 0 .31-.262.7.7 0 0 0 .114-.4q0-.3-.21-.498T1.804.696H.833z',
        );
        const sPath = Skia.Path.MakeFromSVGString(
          'M2.91 1.411a.69.69 0 0 0-.305-.515Q2.34.71 1.924.71q-.295 0-.51.09a.8.8 0 0 0-.33.25.6.6 0 0 0-.115.356.5.5 0 0 0 .076.288q.081.123.21.205.132.083.286.14.156.053.307.09l.479.122q.26.064.517.17.257.105.467.274.212.167.339.408.13.241.13.574 0 .43-.223.761-.22.333-.64.52-.417.189-1.013.188-.57 0-.99-.178a1.5 1.5 0 0 1-.658-.515A1.53 1.53 0 0 1 0 3.638h.825a.76.76 0 0 0 .166.444q.15.175.386.264.237.085.522.085.308 0 .545-.095a.9.9 0 0 0 .37-.269.63.63 0 0 0 .14-.398.5.5 0 0 0-.122-.344.86.86 0 0 0-.327-.224 3 3 0 0 0-.474-.16l-.58-.155q-.612-.162-.965-.481-.354-.32-.352-.85A1.26 1.26 0 0 1 .37.691a1.57 1.57 0 0 1 .647-.508Q1.423 0 1.936 0q.52 0 .916.183.394.18.622.5.227.318.237.728z',
        );

        // Group annotations by their closest candle to handle multiple on same candle
        // Use pre-computed index map from useMemo to avoid recalculating every frame
        const annotationsByCandle = new Map<
          number,
          { buys: typeof annotations; sells: typeof annotations }
        >();

        for (const annotation of annotations) {
          const closestIndex = annotationIndexMap[annotation.timestamp];

          if (closestIndex === undefined || closestIndex === -1) continue;

          // Only track if in visible range
          if (closestIndex < startIndex || closestIndex > endIndex) {
            continue;
          }

          // Group by candle and type
          if (!annotationsByCandle.has(closestIndex)) {
            annotationsByCandle.set(closestIndex, { buys: [], sells: [] });
          }
          const group = annotationsByCandle.get(closestIndex)!;
          if (annotation.type === 'self-buy') {
            group.buys.push(annotation);
          } else {
            group.sells.push(annotation);
          }
        }

        // Draw markers for each candle
        for (const [candleIndex, { buys, sells }] of annotationsByCandle) {
          const candle = candlestickChart[candleIndex];
          const x = leftPadding + candleIndex * barSpacing - currentOffsetX;
          const centerX = x + barWidth / 2;

          // Draw buy markers (above candle)
          if (buys.length > 0) {
            const referencePrice = candle.high;
            const priceY = scalePrice(referencePrice);
            const markerY = priceY - markerPadding - markerRadius;

            markerFillPaint.setColor(Skia.Color(t.colors.green600));
            canvas.drawCircle(centerX, markerY, markerRadius, markerFillPaint);

            // Draw B letter
            if (bPath) {
              const originalWidth = 4;
              const originalHeight = 5;
              const targetWidth = originalWidth + 1;
              const targetHeight = originalHeight + 1;
              const scale = targetWidth / originalWidth;

              const letterX = centerX - targetWidth / 2 + 0.5; // +0.5px x offset
              const letterY = markerY - targetHeight / 2;

              canvas.save();
              canvas.translate(letterX, letterY);
              canvas.scale(scale, scale);
              canvas.drawPath(bPath, letterPaint);
              canvas.restore();
            }
          }

          // Draw sell markers (below candle)
          if (sells.length > 0) {
            const referencePrice = candle.low;
            const priceY = scalePrice(referencePrice);
            const markerY = priceY + markerPadding + markerRadius;

            markerFillPaint.setColor(Skia.Color(t.colors.red600));
            canvas.drawCircle(centerX, markerY, markerRadius, markerFillPaint);

            // Draw S letter
            if (sPath) {
              const originalWidth = 4;
              const originalHeight = 6;
              const targetWidth = originalWidth + 1;
              const targetHeight = originalHeight + 1;
              const scale = targetWidth / originalWidth;

              const letterX = centerX - targetWidth / 2;
              const letterY = markerY - targetHeight / 2;

              canvas.save();
              canvas.translate(letterX, letterY);
              canvas.scale(scale, scale);
              canvas.drawPath(sPath, letterPaint);
              canvas.restore();
            }
          }
        }

        markerFillPaint.dispose();
        letterPaint.dispose();
      }

      const fadeHeight = 10;
      const bgColor = Skia.Color(t.colors.background.primary);
      const bgTransparent = Skia.Color(`${t.colors.background.primary}00`);

      const topGradient = Skia.Shader.MakeLinearGradient(
        { x: 0, y: 0 },
        { x: 0, y: fadeHeight },
        [bgColor, bgTransparent],
        null,
        0,
      );
      const topFadePaint = Skia.Paint();
      topFadePaint.setShader(topGradient);
      canvas.drawRect(
        { x: 0, y: 0, width: sizes.width, height: fadeHeight },
        topFadePaint,
      );
      topFadePaint.dispose();
      topGradient.dispose();

      const bottomY = sizes.height - timestampSpace - fadeHeight + 10;
      const bottomGradient = Skia.Shader.MakeLinearGradient(
        { x: 0, y: bottomY },
        { x: 0, y: bottomY + fadeHeight },
        [bgTransparent, bgColor],
        null,
        0,
      );
      const bottomFadePaint = Skia.Paint();
      bottomFadePaint.setShader(bottomGradient);
      canvas.drawRect(
        { x: 0, y: bottomY, width: sizes.width, height: fadeHeight },
        bottomFadePaint,
      );
      bottomFadePaint.dispose();
      bottomGradient.dispose();

      const solidBgPaint = Skia.Paint();
      solidBgPaint.setColor(bgColor);
      const solidRectY = bottomY + fadeHeight;
      canvas.drawRect(
        {
          x: 0,
          y: solidRectY,
          width: sizes.width,
          height: sizes.height - solidRectY,
        },
        solidBgPaint,
      );
      solidBgPaint.dispose();

      const oldPicture = chartPicture.value;
      chartPicture.value = pictureRecorder.finishRecordingAsPicture();
      oldPicture.dispose();
    }, [
      offsetX.value,
      candlestickChart,
      barSpacing,
      isViewingLatestShared,
      currentPrice,
      targetPriceHigh,
      targetPriceLow,
      targetMaxVolume,
      hasInitialized,
      priceRangeHigh.value,
      priceRangeLow.value,
      animatedMaxVolume.value,
      pictureRecorder,
      t.colors.background.secondary,
      t.colors.background.tertiary,
      t.colors.background.primary,
      t.colors.green600,
      t.colors.red600,
      totalWidth,
      currentPriceColor,
      opacityTransition.value,
      activeCandleIndex.value,
      volumeAnimationProgress.value,
      annotations,
      chartPicture,
      animatedProgress,
      animationStartHigh,
      animationStartLow,
      animatedVolumeProgress,
      animationStartVolume,
      candleRegionHeight,
      volumeRegionHeight,
      volumeStartY,
      annotationIndexMap,
    ]);

    const lastPriceHigh = useSharedValue(0);
    const lastPriceLow = useSharedValue(0);
    const lastVolume = useSharedValue(0);
    const lastHasData = useSharedValue(candlestickChart.length > 0);
    const lastIsLongPressing = useSharedValue(false);
    const lastOpacityTransition = useSharedValue(0);
    const lastVolumeAnimationProgress = useSharedValue(0);

    // CRITICAL: Rebuild every frame during scroll/hold for smooth spring animations
    useFrameCallback(() => {
      'worklet';

      const currentHasData = candlestickChart.length > 0;
      const hasDataChanged = currentHasData !== lastHasData.value;

      // Force rebuild when transitioning to/from empty state
      if (hasDataChanged) {
        lastHasData.value = currentHasData;
        buildChartPicture();
        return;
      }

      // Skip frame updates for empty state (no scrolling/animations needed)
      if (!currentHasData) {
        return;
      }

      // Force rebuild when hold mode ends (to reset opacity)
      const holdModeEnded = lastIsLongPressing.value && !isLongPressing.value;
      if (holdModeEnded) {
        lastIsLongPressing.value = false;
        buildChartPicture();
        return;
      }

      const opacityChanged =
        opacityTransition.value !== lastOpacityTransition.value;
      const volumeAnimationChanged =
        volumeAnimationProgress.value !== lastVolumeAnimationProgress.value;

      if (
        isScrolling.value ||
        isLongPressing.value ||
        opacityChanged ||
        volumeAnimationChanged
      ) {
        lastOffsetX.value = offsetX.value;
        lastPriceHigh.value = priceRangeHigh.value;
        lastPriceLow.value = priceRangeLow.value;
        lastVolume.value = animatedMaxVolume.value;
        lastIsLongPressing.value = isLongPressing.value;
        lastOpacityTransition.value = opacityTransition.value;
        lastVolumeAnimationProgress.value = volumeAnimationProgress.value;

        buildChartPicture();
        return;
      }

      const offsetChanged = offsetX.value !== lastOffsetX.value;
      const priceHighChanged = priceRangeHigh.value !== lastPriceHigh.value;
      const priceLowChanged = priceRangeLow.value !== lastPriceLow.value;
      const volumeChanged = animatedMaxVolume.value !== lastVolume.value;

      if (
        offsetChanged ||
        priceHighChanged ||
        priceLowChanged ||
        volumeChanged
      ) {
        lastOffsetX.value = offsetX.value;
        lastPriceHigh.value = priceRangeHigh.value;
        lastPriceLow.value = priceRangeLow.value;
        lastVolume.value = animatedMaxVolume.value;

        buildChartPicture();
      }
    });

    useEffect(() => {
      // Force rebuild on mount and when data changes
      runOnUI(() => {
        buildChartPicture();
      })();
    }, [buildChartPicture, candlestickChart.length, isLoading]);

    useEffect(() => {
      return () => {
        isScrolling.value = false;

        runOnUI(() => {
          chartPicture.value?.dispose();
        })();
      };
    }, [chartPicture, isScrolling]);

    const hasData = candlestickChart.length > 0;

    // Sync isViewingLatest from shared value to show/hide current price label
    const showCurrentPriceLabel = useAnimatedStyle(() => {
      return {
        opacity: isViewingLatestShared.value ? 1 : 0,
      };
    }, [isViewingLatestShared]);

    const containerStyle = useAnimatedStyle(() => {
      return {
        opacity: transitioningProgress.value,
      };
    }, [transitioningProgress]);

    return (
      <GestureDetector gesture={combinedGesture}>
        <Animated.View
          style={[
            {
              width: sizes.width,
              height: sizes.height,
              overflow: 'hidden',
            },
            containerStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                width: 3,
                backgroundColor: t.colors.background.secondary,
                borderRadius: 1.5,
              },
              useAnimatedStyle(() => {
                'worklet';
                const isActive =
                  isLongPressing.value && activeCandleIndex.value >= 0;

                if (!isActive) {
                  return { opacity: 0, left: -100, height: 0 };
                }

                const activeIndex = activeCandleIndex.value;
                const x =
                  leftPadding + activeIndex * barSpacing - offsetX.value;
                const centerX = x + barWidth / 2;

                // Calculate active volume bar top position
                const activeCandle = candlestickChart[activeIndex];
                if (!activeCandle) {
                  return { opacity: 0, left: -100, height: 0 };
                }

                const maxVol = Math.max(
                  ...visibleCandles.map((c) => c.volume),
                  1,
                );
                const normalizedHeight = Math.min(
                  (activeCandle.volume / maxVol) * volumeRegionHeight,
                  volumeRegionHeight,
                );
                const volumeBarTopY =
                  volumeStartY + (volumeRegionHeight - normalizedHeight);

                return {
                  left: centerX - 1.5,
                  opacity: 1,
                  height: volumeBarTopY - 8,
                };
              }),
            ]}
            pointerEvents="none"
          />

          <Canvas style={{ width: sizes.width, height: sizes.height }}>
            <Picture picture={chartPicture} />
          </Canvas>

          <PriceLabels
            labelValues={labelValues}
            highestPrice={highestPriceValue}
            middlePrice={middlePriceValue}
            lowestPrice={lowestPriceValue}
            currentPrice={currentPrice}
            priceChangePct={priceChangePct}
            showCurrentPrice={hasData && !isLoading}
            currentPriceOpacityStyle={
              showCurrentPriceLabel as unknown as StyleProp<ViewStyle>
            }
            showNA={!hasData}
            t={t}
          />

          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingTop: 8,
            }}
            pointerEvents="none"
          >
            <View style={{ position: 'absolute', left: 4, bottom: 0 }}>
              <AnimatedTimestampText
                color="tertiary"
                size="2xs"
                weight="semibold"
                timestampData={firstTimestampData}
              />
            </View>

            <Animated.View
              style={[
                { position: 'absolute', bottom: 0 },
                useAnimatedStyle(() => {
                  const scrollDelta = offsetX.value - initialScrollX;
                  const rightPosition = Math.max(4, rightPadding + scrollDelta);
                  return {
                    right: rightPosition,
                  };
                }),
              ]}
            >
              <AnimatedTimestampText
                color="tertiary"
                size="2xs"
                weight="semibold"
                timestampData={lastTimestampData}
              />
            </Animated.View>
          </View>

          {/* Annotation label for active candle */}
          {token?.ticker && (
            <TokenCandlestickChartAnnotationLabel
              symbol={token.ticker}
              activeCandleAnnotations={activeCandleAnnotations}
              _activeCandleIndex={activeCandleIndex}
            />
          )}
        </Animated.View>
      </GestureDetector>
    );
  },
);
