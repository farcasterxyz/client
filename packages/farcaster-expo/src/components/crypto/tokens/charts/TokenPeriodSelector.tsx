import { ApiOnchainTokenChartPeriod } from 'farcaster-client-data';
import { MILLIS_PER_DAY } from 'farcaster-client-hooks';
import React, { memo } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/ThemeContext';
import { useTokenChart } from './TokenChartProvider';
import { TokenPeriodSelectorItem } from './TokenPeriodSelectorItem';

const TokenPeriodSelector = memo(() => {
  const t = useTheme();
  const { token, chartType } = useTokenChart();

  const periods = React.useMemo(() => {
    const tokenOlderThan1Year =
      token?.source?.createdAt &&
      Date.now() - token.source.createdAt > MILLIS_PER_DAY * 365;

    if (chartType === 'candlestick') {
      return [
        { label: '1M', value: 'cs_1m' },
        { label: '5M', value: 'cs_5m' },
        { label: '15M', value: 'cs_15m' },
        { label: '1H', value: 'cs_1h' },
        { label: '4H', value: 'cs_4h' },
        { label: '1D', value: 'cs_1d' },
        // { label: '1W', value: 'cs_1w' },
        // cutting 1W for now to slim this down. might not be a useful resolution in general.
      ];
    }

    return [
      { label: '1H', value: 'h1' },
      {
        label: '6H',
        value: 'h6',
      },
      {
        label: '1D',
        value: 'd1',
      },
      {
        label: '1W',
        value: 'w1',
      },
      {
        label: '1M',
        value: 'm1',
      },
      { label: 'ALL', value: tokenOlderThan1Year ? 'max' : 'y1' },
    ];
  }, [token?.source?.createdAt, chartType]);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[t.flexRow, t.justifyCenter, { gap: 8 }]}
    >
      {periods.map((p) => (
        <TokenPeriodSelectorItem
          key={p.value}
          period={p.value as ApiOnchainTokenChartPeriod}
          label={p.label}
        />
      ))}
    </Animated.View>
  );
});

TokenPeriodSelector.displayName = 'TokenPeriodSelector';

export { TokenPeriodSelector };
