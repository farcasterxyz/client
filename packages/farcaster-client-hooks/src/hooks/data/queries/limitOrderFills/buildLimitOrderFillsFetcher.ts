import { FarcasterApiClient } from 'farcaster-client-data';

const buildLimitOrderFillsFetcher =
  ({
    apiClient,
    orderId,
  }: {
    apiClient: FarcasterApiClient;
    orderId: string;
  }) =>
  async () => {
    const response = await apiClient.getLimitOrderFills({ orderId });

    return response.data.result;
  };

export { buildLimitOrderFillsFetcher };
