import { FarcasterApiClient } from 'farcaster-client-data';

const buildApiKeysFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getApiKeys();

    return response.data.result;
  };

export { buildApiKeysFetcher };
