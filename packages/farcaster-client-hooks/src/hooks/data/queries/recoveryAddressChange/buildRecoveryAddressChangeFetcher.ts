import {
  ApiGetRecoveryAddressChangeQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildRecoveryAddressChangeFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetRecoveryAddressChangeQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getRecoveryAddressChange(params);
    return response.data;
  };

export { buildRecoveryAddressChangeFetcher };
