import { FarcasterApiClient } from 'farcaster-client-data';

const buildGetSiweNonceFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getSiweNonce();

    return response.data.result;
  };

export { buildGetSiweNonceFetcher };
