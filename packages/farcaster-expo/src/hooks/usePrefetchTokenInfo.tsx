import { useQueryClient } from '@tanstack/react-query';
import type {
  ApiChain,
  ApiOnchainTokenChartPeriod,
} from 'farcaster-client-data';
import {
  prefetchOnchainTokenCandlestickChart,
  prefetchOnchainTokenLineChart,
  prefetchToken,
  prefetchTokenHolders,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { defaultTokenChartPeriod } from '../constants';
import {
  getCandlestickResolution,
  getCandleStickTimeRange,
} from '../utils/WalletUtils';
import {
  useCandlestickPeriodPreference,
  useChartTypePreference,
} from './useWalletPreferences';

export function usePrefetchTokenInfo() {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const [chartTypePreference] = useChartTypePreference();
  const [candlestickPeriodPreference] = useCandlestickPeriodPreference();
  return useCallback(
    ({ ca, chain }: { ca: string; chain: ApiChain }) => {
      prefetchToken(queryClient, apiClient, { params: { ca, chain } });
      prefetchTokenHolders(queryClient, apiClient, { params: { ca, chain } });
      if (chartTypePreference === 'candlestick') {
        const timeRange = getCandleStickTimeRange(
          candlestickPeriodPreference as ApiOnchainTokenChartPeriod,
          Date.now(),
        );
        prefetchOnchainTokenCandlestickChart(queryClient, apiClient, {
          params: {
            ca,
            chain,
            res:
              getCandlestickResolution(
                (candlestickPeriodPreference as ApiOnchainTokenChartPeriod) ??
                  'cs_5m',
              ) || 'cs_5m',
            from: timeRange.from,
            to: timeRange.to,
            countback: timeRange.countback,
          },
        });
      } else {
        prefetchOnchainTokenLineChart(queryClient, apiClient, {
          params: { ca, chain, period: defaultTokenChartPeriod },
        });
      }
    },
    [apiClient, queryClient, chartTypePreference, candlestickPeriodPreference],
  );
}
