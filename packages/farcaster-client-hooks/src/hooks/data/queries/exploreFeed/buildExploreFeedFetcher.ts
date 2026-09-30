import { FarcasterApiClient } from 'farcaster-client-data';

const buildExploreFeedFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getExploreFeed();

    return response.data.result;
  };

export { buildExploreFeedFetcher };
