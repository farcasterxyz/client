import {
  ApiGetWalletChainNativeAssetQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildWalletChainNativeAssetFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetWalletChainNativeAssetQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getWalletChainNativeAsset(params);
    return response.data.result;
  };

export { buildWalletChainNativeAssetFetcher };
