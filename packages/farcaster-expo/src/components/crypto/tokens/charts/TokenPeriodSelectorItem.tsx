import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiOnchainTokenChartPeriod } from 'farcaster-client-data';
import React, { memo, useCallback } from 'react';

import { WALLET_PREFETCH_CONFIG } from '../../../../constants';
import { useSharedTelemetry, useTheme } from '../../../../contexts';
import { AnimatedPressable, Text2 } from '../../../design-system';
import { useTokenChart } from './TokenChartProvider';

type TokenPeriodSelectorItemProps = {
  period: ApiOnchainTokenChartPeriod;
  label: string;
};

const TokenPeriodSelectorItem = memo(
  ({ period, label }: TokenPeriodSelectorItemProps) => {
    const t = useTheme();
    const {
      lineChartPeriod,
      candlestickPeriod,
      setPeriod,
      onPreSetPeriod,
      chartType,
    } = useTokenChart();
    const selectedPeriod =
      chartType === 'line' ? lineChartPeriod : candlestickPeriod;
    const { trackEvent } = useSharedTelemetry();

    const onPress = useCallback(() => {
      trackEvent(AnalyticsEvent.ChangeTokenChartResolution, {
        chartType,
        fromResolution: period,
        toResolution: period,
      });
      setPeriod(period);
    }, [period, setPeriod, chartType, trackEvent]);

    const onPressIn = useCallback(() => {
      onPreSetPeriod(period);
    }, [onPreSetPeriod, period]);

    return (
      <AnimatedPressable
        key={period}
        onPress={onPress}
        onPressIn={
          WALLET_PREFETCH_CONFIG.PREFETCH_ON_TOKEN_PERIOD_CHANGE
            ? onPressIn
            : undefined
        }
        style={[
          t.roundedFull,
          period === selectedPeriod ? t.backgrounds.secondary : undefined,
          t.pY1,
          t.pX2,
          t.itemsCenter,
        ]}
      >
        <Text2
          size="sm"
          weight="medium"
          color={period === selectedPeriod ? 'secondary' : 'tertiary'}
        >
          {label}
        </Text2>
      </AnimatedPressable>
    );
  },
);

TokenPeriodSelectorItem.displayName = 'TokenPeriodSelectorItem';

export { TokenPeriodSelectorItem };
