import {
  ApiOnchainTransactionType,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildWarpsOfferingFetcher =
  ({
    onchainTransactionType,
    apiClient,
  }: {
    onchainTransactionType: ApiOnchainTransactionType;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    const response = await apiClient.getWarpsOffering({
      onchainTransactionType,
    });

    return response.data.result;
  };

export { buildWarpsOfferingFetcher };
