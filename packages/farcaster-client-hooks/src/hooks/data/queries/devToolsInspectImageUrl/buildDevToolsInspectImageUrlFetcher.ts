import { FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsInspectImageUrlFetcher =
  ({ apiClient, url }: { apiClient: FarcasterApiClient; url: string }) =>
  async () => {
    const response = await apiClient.devToolsInspectImageUrl({
      url,
    });

    return response.data.result.facts;
  };

export { buildDevToolsInspectImageUrlFetcher };
