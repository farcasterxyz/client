import { ApiChain } from 'farcaster-client-data';
import React, { memo } from 'react';
import { View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { TokenCandlestickChart } from './candlestick/TokenCandlestickChart';
import { TokenLineChart } from './line/TokenLineChart';
import { NoDataChart } from './NoDataChart';
import { TokenChartHeader } from './TokenChartHeader';
import { TokenChartProvider, useTokenChart } from './TokenChartProvider';
import { TokenChartTypeToggle } from './TokenChartTypeToggle';
import { TokenPeriodSelector } from './TokenPeriodSelector';
import { sizes } from './utils';

export const TokenChart = memo(
  ({
    fid,
    chain,
    ca,
    animationEnabled,
    withinNavigationContext = false,
  }: {
    fid: number | undefined;
    chain: ApiChain;
    ca: string;
    animationEnabled: SharedValue<boolean>;
    withinNavigationContext?: boolean;
  }) => {
    return (
      <TokenChartProvider fid={fid} chain={chain} ca={ca}>
        <TokenChartInner
          animationEnabled={animationEnabled}
          withinNavigationContext={withinNavigationContext}
        />
      </TokenChartProvider>
    );
  },
);

const TokenChartInner = memo(
  ({
    animationEnabled,
    withinNavigationContext,
  }: {
    animationEnabled: SharedValue<boolean>;
    withinNavigationContext: boolean;
  }) => {
    const { candlestickChart, isLoading, chartType } = useTokenChart();

    const chartRef = React.useRef<View>(null);

    // React.useEffect(() => {
    //   if (isTransitioning && chartType === 'candlestick' && chartRef.current) {
    //     // Capture current chart as image snapshot
    //     makeImageFromView(chartRef).then((snapshot) => {
    //       frozenSnapshotRef.current = snapshot;
    //       setFrozenSnapshot(snapshot);
    //     });
    //   } else if (!isTransitioning) {
    //     // Clear and dispose snapshot when transition ends
    //     if (frozenSnapshotRef.current) {
    //       frozenSnapshotRef.current.dispose();
    //       frozenSnapshotRef.current = null;
    //     }
    //     setFrozenSnapshot(null);
    //   }
    // }, [isTransitioning, chartType]);

    // Cleanup on unmount
    // React.useEffect(() => {
    //   return () => {
    //     if (frozenSnapshotRef.current) {
    //       frozenSnapshotRef.current.dispose();
    //     }
    //   };
    // }, []);

    const showCandlestickEmptyState =
      chartType === 'candlestick' &&
      !isLoading &&
      candlestickChart.length === 0;

    const chartOpacityStyle = useAnimatedStyle(() => {
      let targetOpacity = 1;
      // if (isTransitioning && chartType === 'candlestick') {
      //   targetOpacity = 0;
      // }
      if (isLoading && chartType === 'line') {
        targetOpacity = 0;
      }
      return {
        opacity: withTiming(targetOpacity, {
          duration:
            targetOpacity === 0 && chartType === 'candlestick' ? 0 : 200,
        }),
      };
    });

    return (
      <View style={[{ gap: 16 }]}>
        <TokenChartHeader />
        <View style={[{ gap: 16 }]}>
          <View style={{ position: 'relative' }}>
            {/* Active chart */}
            <Animated.View
              ref={chartRef}
              style={[
                chartOpacityStyle,
                { width: sizes.width, height: sizes.height },
              ]}
            >
              {chartType === 'candlestick' ? (
                <TokenCandlestickChart
                  withinNavigationContext={withinNavigationContext}
                />
              ) : (
                <TokenLineChart
                  animationEnabled={animationEnabled}
                  withinNavigationContext={withinNavigationContext}
                />
              )}
            </Animated.View>
          </View>
          {showCandlestickEmptyState ? <NoDataChart /> : null}
        </View>
        <View style={[{ position: 'relative' }]}>
          <TokenPeriodSelector />
          <TokenChartTypeToggle />
        </View>
      </View>
    );
  },
);
