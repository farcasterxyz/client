import { FarcasterApiClient } from 'farcaster-client-data';

const buildUserAppContextFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const { data } = await apiClient.getUserAppContext();
    return data.result.context;
  };

export { buildUserAppContextFetcher };
