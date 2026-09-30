import { FarcasterApiClient } from 'farcaster-client-data';

const buildChannelCreationInfoFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getChannelCreationInfo();
    return response.data.result;
  };

export { buildChannelCreationInfoFetcher };
