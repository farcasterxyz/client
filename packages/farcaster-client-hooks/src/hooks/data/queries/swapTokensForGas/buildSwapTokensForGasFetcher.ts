import { FarcasterApiClient } from 'farcaster-client-data';

const buildSwapTokensForGasFetcher =
  ({
    chainId,
    sellAmountBaseUnits,
    sellToken,
    walletId,
    apiClient,
  }: {
    chainId?: number;
    sellAmountBaseUnits?: string;
    sellToken?: string;
    walletId?: string;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    if (!chainId) throw new Error('No chainId provided');
    const response = await apiClient.getSwapQuoteForGasSwap({
      chainId,
      sellAmountBaseUnits,
      sellToken,
      walletId,
    });

    return response.data.result;
  };

export { buildSwapTokensForGasFetcher };
