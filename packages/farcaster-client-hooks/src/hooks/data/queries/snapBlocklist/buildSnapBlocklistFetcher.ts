import { FarcasterApiClient } from 'farcaster-client-data';

export const buildSnapBlocklistFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getSnapBlocklist({});
    return response.data.result;
  };
