import { FarcasterApiClient } from 'farcaster-client-data';

const buildFarcasterProSubscribeWithUsdcDetailsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.farcasterProSubscribeWithUsdcDetails({
      ota: '20250605',
    });
    return response.data.result.details;
  };

export { buildFarcasterProSubscribeWithUsdcDetailsFetcher };
