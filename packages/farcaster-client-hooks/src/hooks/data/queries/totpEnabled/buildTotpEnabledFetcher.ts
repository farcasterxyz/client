import { FarcasterApiClient } from 'farcaster-client-data';

const buildTotpEnabledFetcher =
  ({ apiClient, email }: { apiClient: FarcasterApiClient; email?: string }) =>
  async () => {
    if (email) {
      const response = await apiClient.getTotpEnabledForEmail({ email });
      return response.data;
    }
    const response = await apiClient.getTotpEnabled();
    return response.data;
  };

export { buildTotpEnabledFetcher };
