import { FarcasterApiClient } from 'farcaster-client-data';

const buildOnchainYieldWithdrawFetcher =
  ({
    apiClient,
    address,
    amount,
  }: {
    apiClient: FarcasterApiClient;
    address: string;
    amount: string | undefined;
  }) =>
  async () => {
    const response = await apiClient.getOnchainYieldWithdraw({
      address,
      amount,
    });
    return response.data.result;
  };

export { buildOnchainYieldWithdrawFetcher };
