import { FarcasterApiClient } from 'farcaster-client-data';

const buildTokensFetcher =
  ({ apiClient, ids }: { apiClient: FarcasterApiClient; ids: string[] }) =>
  async () => {
    const response = await apiClient.getTokens({
      ids: ids.join(','),
    });
    return response.data.result.tokens;
  };

export { buildTokensFetcher };
