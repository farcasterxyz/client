import { FarcasterApiClient } from 'farcaster-client-data';

const buildGlobalFrameAnalyticsFetcher =
  ({
    apiClient,
    start,
    end,
  }: {
    apiClient: FarcasterApiClient;
    start?: string;
    end?: string;
  }) =>
  async () => {
    const response = await apiClient.getGlobalFrameAnalytics({ start, end });
    return response.data;
  };

export { buildGlobalFrameAnalyticsFetcher };
