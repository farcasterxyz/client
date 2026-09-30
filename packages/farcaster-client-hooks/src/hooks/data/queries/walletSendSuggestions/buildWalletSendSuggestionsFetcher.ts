import {
  ApiVerificationProtocol,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildWalletSendSuggestionsFetcher =
  ({
    apiClient,
    protocol,
  }: {
    apiClient: FarcasterApiClient;
    protocol: ApiVerificationProtocol;
  }) =>
  async () => {
    const response = await apiClient.walletSendSuggestions({ protocol });
    return response.data.result.suggestions;
  };

export { buildWalletSendSuggestionsFetcher };
