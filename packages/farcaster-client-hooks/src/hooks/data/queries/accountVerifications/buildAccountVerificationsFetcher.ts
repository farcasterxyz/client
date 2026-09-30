import { FarcasterApiClient } from 'farcaster-client-data';

const buildAccountVerificationsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getAccountVerificationsV2();

    return response.data.result;
  };

export { buildAccountVerificationsFetcher };
