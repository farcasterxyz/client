import { FarcasterApiClient } from 'farcaster-client-data';

const buildAMAFetcher =
  ({ fname, apiClient }: { fname: string; apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getAMA({
      fname,
    });

    return response.data.result;
  };

export { buildAMAFetcher };
