import { FarcasterApiClient } from 'farcaster-client-data';

const buildStarterPackFetcher =
  ({ apiClient, id }: { id: string; apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getStarterPack({
      id,
    });

    return response.data.result;
  };

export { buildStarterPackFetcher };
