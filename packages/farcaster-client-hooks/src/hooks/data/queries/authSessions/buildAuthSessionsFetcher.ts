import { FarcasterApiClient } from 'farcaster-client-data';

const buildAuthSessionsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getAuthSessions();
    return response.data;
  };

export { buildAuthSessionsFetcher };
