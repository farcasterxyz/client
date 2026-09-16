import { FarcasterApiClient } from 'farcaster-client-data';

const buildAccountVerificationsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getAccountVerifications();
    return response.data.result;
  };

export { buildAccountVerificationsFetcher };
