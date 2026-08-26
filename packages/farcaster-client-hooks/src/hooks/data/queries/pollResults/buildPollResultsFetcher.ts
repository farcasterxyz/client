import { FarcasterApiClient } from 'farcaster-client-data';

const buildPollResultsFetcher =
  ({ apiClient, url }: { apiClient: FarcasterApiClient; url: string }) =>
  async () => {
    const response = await apiClient.getPollResults({ url });
    return response.data;
  };

export { buildPollResultsFetcher };
