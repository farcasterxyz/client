import {
  ApiGetOnchainTokenLineChartQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { useTokenStore } from '../../../../stores/tokenStore';

const buildOnchainTokenLineChartFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetOnchainTokenLineChartQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getOnchainTokenLineChart(params);

    if (response.data.result.chart) {
      const { points } = response.data.result.chart;
      const last = points[points.length - 1];

      if (last) {
        useTokenStore.getState().upsertPrice({
          ca: params.ca,
          chain: params.chain,
          priceUsd: last.price,
          // the chart timestamps are rounded, assume fresh
          timestamp: Date.now(),
        });
      }
    }

    return response.data.result;
  };

export { buildOnchainTokenLineChartFetcher };
