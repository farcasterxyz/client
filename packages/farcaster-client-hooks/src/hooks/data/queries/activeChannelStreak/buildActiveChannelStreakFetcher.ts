import { FarcasterApiClient } from 'farcaster-client-data';

const buildActiveChannelStreakFetcher =
  ({ apiClient, fid }: { apiClient: FarcasterApiClient; fid: number }) =>
  async () => {
    const response = await apiClient.getActiveChannelStreak({
      fid: fid,
    });

    return response.data;
  };

export { buildActiveChannelStreakFetcher };
