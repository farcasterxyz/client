import { FarcasterApiClient } from 'farcaster-client-data';

const buildChannelDetailsFetcher =
  ({ apiClient, key }: { apiClient: FarcasterApiClient; key: string }) =>
  async () => {
    const response = await apiClient.getChannelDetails({ key });

    return response.data.result.details;
  };

export { buildChannelDetailsFetcher };
