import { FarcasterApiClient } from 'farcaster-client-data';

const buildOnchainYieldOverviewFetcher =
  ({
    apiClient,
    address,
  }: {
    apiClient: FarcasterApiClient;
    address: string;
  }) =>
  async () => {
    const response = await apiClient.getOnchainYieldOverview({ address });
    return response.data.result;
  };

export { buildOnchainYieldOverviewFetcher };
