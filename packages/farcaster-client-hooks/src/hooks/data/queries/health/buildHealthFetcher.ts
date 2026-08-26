import { FarcasterApiClient } from 'farcaster-client-data';

const buildHealthFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getHealth();
    return response.data;
  };

export { buildHealthFetcher };
