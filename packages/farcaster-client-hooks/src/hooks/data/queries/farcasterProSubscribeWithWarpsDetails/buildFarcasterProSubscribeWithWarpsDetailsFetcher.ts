import { FarcasterApiClient } from 'farcaster-client-data';

const buildFarcasterProSubscribeWithWarpsDetailsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.farcasterProSubscribeWithWarpsDetails({
      ota: '20250605',
    });
    return response.data.result.details;
  };

export { buildFarcasterProSubscribeWithWarpsDetailsFetcher };
