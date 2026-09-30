import { FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsDomainsOwnedFetcher =
  ({ apiClient, fid }: { apiClient: FarcasterApiClient; fid?: number }) =>
  async () => {
    const response = await apiClient.devToolsDomainsOwned({
      fid,
    });

    return response.data.result.domains;
  };

export { buildDevToolsDomainsOwnedFetcher };
