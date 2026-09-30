import { FarcasterApiClient } from 'farcaster-client-data';

const buildOnchainYieldDepositFetcher =
  ({
    apiClient,
    address,
    amount,
  }: {
    apiClient: FarcasterApiClient;
    address: string;
    amount: string;
  }) =>
  async () => {
    const response = await apiClient.getOnchainYieldDeposit({
      address,
      amount,
    });
    return response.data.result;
  };

export { buildOnchainYieldDepositFetcher };
