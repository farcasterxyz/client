import {
  ApiWalletResourceName,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildWalletResourceFetcher =
  ({
    name,
    apiClient,
  }: {
    name: ApiWalletResourceName;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    const response = await apiClient.walletResource({
      name,
    });

    return response.data.result;
  };

export { buildWalletResourceFetcher };
