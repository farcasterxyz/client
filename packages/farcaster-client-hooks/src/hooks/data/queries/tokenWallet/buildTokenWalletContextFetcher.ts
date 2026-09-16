import {
  ApiGetTokenWalletContextQueryParamsCamelCase,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildTokenWalletContextFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetTokenWalletContextQueryParamsCamelCase;
  }) =>
  async () => {
    const response = await apiClient.getTokenWalletContext(params);
    return response.data;
  };

export { buildTokenWalletContextFetcher };
