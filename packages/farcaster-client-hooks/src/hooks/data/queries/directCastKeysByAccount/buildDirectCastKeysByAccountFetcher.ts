import { FarcasterApiClient } from 'farcaster-client-data';

const buildDirectCastKeysByAccountFetcher =
  ({ apiClient, fid }: { apiClient: FarcasterApiClient; fid: number }) =>
  async () => {
    const response = await apiClient.getDirectCastKeysByAccount({
      fid,
    });

    return response.data;
  };

export { buildDirectCastKeysByAccountFetcher };
