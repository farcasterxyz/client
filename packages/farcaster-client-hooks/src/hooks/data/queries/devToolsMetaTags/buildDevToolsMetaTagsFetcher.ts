import { FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsMetaTagsFetcher =
  ({ apiClient, url }: { apiClient: FarcasterApiClient; url: string }) =>
  async () => {
    const response = await apiClient.devToolsMetaTags({
      url,
    });

    return response.data as unknown as Record<string, string | string[] | null>;
  };

export { buildDevToolsMetaTagsFetcher };
