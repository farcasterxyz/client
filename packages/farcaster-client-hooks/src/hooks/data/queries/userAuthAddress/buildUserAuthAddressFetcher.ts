import { FarcasterApiClient } from 'farcaster-client-data';

const buildUserAuthAddressFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getUserAuthAddress();
    return response.data.result;
  };

export { buildUserAuthAddressFetcher };
