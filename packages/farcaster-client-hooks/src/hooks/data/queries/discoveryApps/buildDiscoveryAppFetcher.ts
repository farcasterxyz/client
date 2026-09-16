import {
  ApiGetDiscoveryAppQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildDiscoveryAppFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetDiscoveryAppQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getDiscoveryApp(params);
    return response.data;
  };

export { buildDiscoveryAppFetcher };
