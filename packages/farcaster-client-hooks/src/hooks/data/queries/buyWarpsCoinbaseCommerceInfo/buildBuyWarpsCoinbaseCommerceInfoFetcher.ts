import { FarcasterApiClient } from 'farcaster-client-data';

const buildBuyWarpsCoinbaseCommerceInfoFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.buyWarpsCoinbaseCommerceInfo();
    return response.data.result;
  };

export { buildBuyWarpsCoinbaseCommerceInfoFetcher };
