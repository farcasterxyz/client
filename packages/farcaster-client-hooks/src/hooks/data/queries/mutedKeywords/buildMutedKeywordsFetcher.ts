import { FarcasterApiClient } from 'farcaster-client-data';

const buildMutedKeywordsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getMutedKeywords();
    return response.data;
  };

export { buildMutedKeywordsFetcher };
