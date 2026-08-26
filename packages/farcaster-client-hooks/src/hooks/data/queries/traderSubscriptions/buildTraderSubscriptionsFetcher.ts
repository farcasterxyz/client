import { FarcasterApiClient } from 'farcaster-client-data';

const buildTraderSubscriptionsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getTraderSubscriptions();

    return response.data.result;
  };

export { buildTraderSubscriptionsFetcher };
