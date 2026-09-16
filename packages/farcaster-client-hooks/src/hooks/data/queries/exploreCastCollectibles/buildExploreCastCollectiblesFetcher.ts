import { FarcasterApiClient } from 'farcaster-client-data';

const buildExploreCastCollectiblesFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.exploreCastCollectibles();
    return response.data;
  };

export { buildExploreCastCollectiblesFetcher };
