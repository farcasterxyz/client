import { FarcasterApiClient } from 'farcaster-client-data';

export const buildFrameBlocklistFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getFrameBlocklist();
    return response.data.result;
  };
