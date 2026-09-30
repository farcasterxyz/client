import { FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsGetMiniAppManifestFetcher =
  ({ apiClient, id }: { apiClient: FarcasterApiClient; id: string }) =>
  async () => {
    const response = await apiClient.devToolsGetMiniAppManifest({
      id,
    });

    return response.data.result.manifest;
  };

export { buildDevToolsGetMiniAppManifestFetcher };
