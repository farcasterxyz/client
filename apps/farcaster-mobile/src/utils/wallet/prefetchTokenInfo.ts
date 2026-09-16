import type {
  ApiChain,
  ApiOnchainTokenChartPeriod,
} from 'farcaster-client-data';
import {
  prefetchOnchainTokenCandlestickChart,
  prefetchOnchainTokenLineChart,
  prefetchToken,
  prefetchTokenHolders,
} from 'farcaster-client-hooks';
import {
  defaultTokenChartPeriod,
  getCandlestickResolution,
  getCandleStickTimeRange,
} from 'farcaster-expo';

import { apiClient } from '~/apiClient';
import { queryClient } from '~/queryClient';
import {
  getCandlestickPeriodPreference,
  getChartTypePreference,
} from '~/utils/FastStorageUtils';

export function prefetchTokenInfo({
  ca,
  chain,
}: {
  ca: string;
  chain: ApiChain;
}) {
  const chartTypePreference = getChartTypePreference();
  const candlestickPeriodPreference = getCandlestickPeriodPreference();
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
        res: getCandlestickResolution(
          candlestickPeriodPreference as ApiOnchainTokenChartPeriod,
        ),
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
}
