import { FarcasterApiClient } from 'farcaster-client-data';

const buildOnchainActionFetcher =
  ({
    onchainActionId,
    apiClient,
  }: {
    onchainActionId: string;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    const response = await apiClient.getOnchainAction({
      onchainActionId,
    });

    return response.data.result;
  };

export { buildOnchainActionFetcher };
