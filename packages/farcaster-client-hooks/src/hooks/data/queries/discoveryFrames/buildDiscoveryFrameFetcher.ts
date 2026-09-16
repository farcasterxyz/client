import {
  ApiGetDiscoveryFrameQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildDiscoveryFrameFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetDiscoveryFrameQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getDiscoveryFrame(params);
    return response.data;
  };

export { buildDiscoveryFrameFetcher };
