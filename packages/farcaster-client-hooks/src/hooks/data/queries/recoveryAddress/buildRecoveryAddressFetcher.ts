import { FarcasterApiClient } from 'farcaster-client-data';

export const buildRecoveryAddressFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const { data } = await apiClient.getRecoveryAddress();
    return data;
  };
