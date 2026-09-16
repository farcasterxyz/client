import {
  ApiDevToolsDebugDomainManifestQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildDebugDomainManifestFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiDevToolsDebugDomainManifestQueryParams;
  }) =>
  async () => {
    const response = await apiClient.devToolsDebugDomainManifest(params);

    return response.data.result.debug;
  };

export { buildDebugDomainManifestFetcher };
