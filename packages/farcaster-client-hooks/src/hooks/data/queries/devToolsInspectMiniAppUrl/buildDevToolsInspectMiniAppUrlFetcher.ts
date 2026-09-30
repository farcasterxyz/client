import { FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsInspectMiniAppUrlFetcher =
  ({ apiClient, url }: { apiClient: FarcasterApiClient; url: string }) =>
  async () => {
    const response = await apiClient.devToolsInspectMiniAppUrl({
      url,
    });

    return response.data.result.facts;
  };

export { buildDevToolsInspectMiniAppUrlFetcher };
