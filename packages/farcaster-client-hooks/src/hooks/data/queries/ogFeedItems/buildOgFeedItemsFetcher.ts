import { FarcasterApiClient } from 'farcaster-client-data';

const buildOgFeedItemsFetcher =
  ({
    apiClient,
    feedKey,
  }: {
    apiClient: FarcasterApiClient;
    feedKey: string;
  }) =>
  async () => {
    const response = await apiClient.getOgFeedItems({ feedKey });
    return response.data.result;
  };

export { buildOgFeedItemsFetcher };
