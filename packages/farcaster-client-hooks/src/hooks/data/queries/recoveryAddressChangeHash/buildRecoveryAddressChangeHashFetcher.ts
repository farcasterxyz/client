import {
  ApiGetRecoveryAddressChangeHashQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildRecoveryAddressChangeHashFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetRecoveryAddressChangeHashQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getRecoveryAddressChangeHash(params);
    return response.data;
  };

export { buildRecoveryAddressChangeHashFetcher };
