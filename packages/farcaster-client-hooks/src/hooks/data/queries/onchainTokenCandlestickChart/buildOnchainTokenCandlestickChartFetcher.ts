import {
  ApiGetOnchainTokenCandlestickChartQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { useTokenStore } from '../../../../stores/tokenStore';

const buildOnchainTokenCandlestickChartFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetOnchainTokenCandlestickChartQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getOnchainTokenCandlestickChart(params);

    if (response.data.result.chart) {
      const { points } = response.data.result.chart;
      const first = points[0]; // Codex returns the last bar at index 0

      if (first) {
        useTokenStore.getState().upsertPrice({
          ca: params.ca,
          chain: params.chain,
          priceUsd: first.close,
          // last.timestamp is rounded, use params.to which should be now or
          // the right most edge when fetching historical in which case it'll
          // be ignored
          timestamp: params.to,
        });
      }
    }

    return response.data.result;
  };

export { buildOnchainTokenCandlestickChartFetcher };
