import { FarcasterApiClient } from 'farcaster-client-data';

const buildStorageUtilizationFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getStorageUtilization();

    return response.data.result;
  };

export { buildStorageUtilizationFetcher };
