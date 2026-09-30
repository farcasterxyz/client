import {
  DEFAULT_TIMEOUT_CLIENT_CONFIG,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildClientConfigFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getClientConfig({
      timeout: DEFAULT_TIMEOUT_CLIENT_CONFIG,
    });
    return response.data;
  };

export { buildClientConfigFetcher };
