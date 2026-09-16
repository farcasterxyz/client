import { FarcasterApiClient } from 'farcaster-client-data';

const buildAppsByAffinityFetcher =
  ({
    apiClient,
    fidOverride,
    limit,
  }: {
    apiClient: FarcasterApiClient;
    fidOverride?: number;
    limit?: number;
  }) =>
  async () => {
    const response = await apiClient.getRecentlyUsedAppsByUserAffinity({
      fidOverride,
      limit,
    });
    return response.data;
  };

export { buildAppsByAffinityFetcher };
