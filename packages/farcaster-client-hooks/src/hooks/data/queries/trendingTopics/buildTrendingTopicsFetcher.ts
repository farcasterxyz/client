import { FarcasterApiClient } from 'farcaster-client-data';

const buildTrendingTopicsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getTrendingTopics();

    return response.data.result;
  };

export { buildTrendingTopicsFetcher };
