import {
  ApiGetRecoveryQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildRecoveryFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetRecoveryQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getRecovery(params);
    return response.data;
  };

export { buildRecoveryFetcher };
