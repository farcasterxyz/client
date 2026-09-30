import {
  ApiOnchainTransactionType,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildOfferingFetcher =
  ({
    onchainTransactionType,
    apiClient,
  }: {
    onchainTransactionType: ApiOnchainTransactionType;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    const response = await apiClient.getOffering({
      onchainTransactionType,
    });

    return response.data.result;
  };

export { buildOfferingFetcher };
