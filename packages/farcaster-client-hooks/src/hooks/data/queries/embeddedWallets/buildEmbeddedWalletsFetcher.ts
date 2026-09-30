import {
  ApiListEmbeddedWallets200Response,
  ApiListEmbeddedWalletsQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

export type EmbeddedWalletsFetcherData =
  ApiListEmbeddedWallets200Response['result'];

const buildEmbeddedWalletsFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiListEmbeddedWalletsQueryParams;
  }) =>
  async (): Promise<EmbeddedWalletsFetcherData> => {
    const response = await apiClient.listEmbeddedWallets(params);
    return response.data.result;
  };

export { buildEmbeddedWalletsFetcher };
