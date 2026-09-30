import { AnalyticsEvent } from 'farcaster-analytics';
import React, { memo, startTransition, useCallback } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useSharedTelemetry } from '../../../../contexts';
import { useTheme } from '../../../../contexts/ThemeContext';
import { AnimatedPressable } from '../../../design-system';
import { useTokenChart } from './TokenChartProvider';

const TokenChartTypeToggle = memo(() => {
  const t = useTheme();
  const { chartType, setChartType } = useTokenChart();
  const { trackEvent } = useSharedTelemetry();

  const handleToggle = useCallback(() => {
    const nextType = chartType === 'line' ? 'candlestick' : 'line';

    trackEvent(AnalyticsEvent.ToggleTokenChartType, {
      fromType: chartType,
      toType: nextType,
    });

    startTransition(() => {
      setChartType(nextType);
    });
  }, [chartType, setChartType, trackEvent]);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[t.absolute, { right: 12, top: -2 }]}
    >
      <AnimatedPressable
        onPress={handleToggle}
        hitSlop={12}
        style={[
          t.border,
          t.borders.secondary,
          t.itemsCenter,
          t.justifyCenter,
          { borderRadius: t.borderRadiuses.$12, width: 30, height: 30 },
        ]}
      >
        {chartType === 'line' ? <CandlestickIcon /> : <LineIcon />}
      </AnimatedPressable>
    </Animated.View>
  );
});

TokenChartTypeToggle.displayName = 'TokenChartTypeToggle';

export { TokenChartTypeToggle };

function CandlestickIcon() {
  return (
    <Svg width={14} height={16} viewBox="0 0 12 14" fill="none">
      <Path fill="#439758" d="M3.25 3H1v9h3V3z" />
      <Path stroke="#439758" d="M2.5 2.5V0m0 12H4V3H1v9zm0 0v2" />
      <Path fill="#ff4747" d="M10.25 4.143H8v6.428h3V4.143z" />
      <Path
        stroke="#ff4747"
        d="M9.5 3.786V2m0 8.571H11V4.143H8v6.428zm0 0V12"
      />
    </Svg>
  );
}

function LineIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 12 10" fill="none">
      <Path
        stroke="#28d02c"
        strokeWidth={1.3}
        d="M0 5.249h1.87a.5.5 0 0 1 .45.28l1.502 3.06a.5.5 0 0 0 .924-.064L7.211.995a.5.5 0 0 1 .938-.033l1.906 4.715a.5.5 0 0 0 .464.313H12"
        fill="none"
      />
    </Svg>
  );
}
