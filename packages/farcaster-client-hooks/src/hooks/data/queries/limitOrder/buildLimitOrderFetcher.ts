import { FarcasterApiClient } from 'farcaster-client-data';

const buildLimitOrderFetcher =
  ({
    apiClient,
    orderId,
  }: {
    apiClient: FarcasterApiClient;
    orderId: string;
  }) =>
  async () => {
    const response = await apiClient.getLimitOrderById({ orderId });

    return response.data.result;
  };

export { buildLimitOrderFetcher };
