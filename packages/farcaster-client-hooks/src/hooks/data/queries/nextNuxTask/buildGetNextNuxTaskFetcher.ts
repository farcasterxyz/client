import { FarcasterApiClient } from 'farcaster-client-data';

const buildGetNextNuxTaskFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getNextNuxTask();
    return response.data.result;
  };

export { buildGetNextNuxTaskFetcher };
