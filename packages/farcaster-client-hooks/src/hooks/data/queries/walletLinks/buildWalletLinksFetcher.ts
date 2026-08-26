import { FarcasterApiClient } from 'farcaster-client-data';

const buildWalletLinksFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getWalletLinks({});
    return response.data;
  };

export { buildWalletLinksFetcher };
