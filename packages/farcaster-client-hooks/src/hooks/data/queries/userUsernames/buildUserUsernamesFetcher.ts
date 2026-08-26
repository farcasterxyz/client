import { FarcasterApiClient } from 'farcaster-client-data';

const buildUserUsernamesFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getUserUsernames();

    return response.data.result;
  };

export { buildUserUsernamesFetcher };
