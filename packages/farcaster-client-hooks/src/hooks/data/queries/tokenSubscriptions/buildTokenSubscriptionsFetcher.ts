import { FarcasterApiClient } from 'farcaster-client-data';

const buildTokenSubscriptionsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getTokenSubscriptions();

    return response.data.result;
  };

export { buildTokenSubscriptionsFetcher };
