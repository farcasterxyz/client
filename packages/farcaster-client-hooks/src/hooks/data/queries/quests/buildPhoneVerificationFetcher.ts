import { FarcasterApiClient } from 'farcaster-client-data';

const buildPhoneVerificationFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getPhoneVerificationStatus();
    return response.data.result;
  };

export { buildPhoneVerificationFetcher };
