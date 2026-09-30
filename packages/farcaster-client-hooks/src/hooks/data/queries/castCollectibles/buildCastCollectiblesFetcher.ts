import { FarcasterApiClient } from 'farcaster-client-data';

const buildCastCollectiblesFetcher =
  ({
    apiClient,
    castHashes,
  }: {
    apiClient: FarcasterApiClient;
    castHashes: string[];
  }) =>
  async () => {
    const response = await apiClient.getCastCollectibles({
      castHashes,
    });

    return response.data.result;
  };

export { buildCastCollectiblesFetcher };
