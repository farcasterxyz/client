import { FarcasterApiClient } from 'farcaster-client-data';

const buildRecentlyUsedAppsFetcher =
  ({ apiClient, limit }: { apiClient: FarcasterApiClient; limit?: number }) =>
  async () => {
    const response = await apiClient.getRecentlyUsedApps({
      limit,
    });
    return response.data;
  };

export { buildRecentlyUsedAppsFetcher };
