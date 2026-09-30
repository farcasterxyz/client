import {
  ApiGetPrimaryAddressQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildPrimaryAddressFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetPrimaryAddressQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getPrimaryAddress(params);
    return response.data.result;
  };

export { buildPrimaryAddressFetcher };
