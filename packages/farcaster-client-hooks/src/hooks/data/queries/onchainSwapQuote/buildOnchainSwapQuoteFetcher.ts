import {
  ApiChain,
  ApiOnchainSwapSource,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildOnchainSwapQuoteFetcher =
  ({
    apiClient,
    source,
    sellChain,
    sellToken,
    sellAmount,
    sellDecimals,
    buyChain,
    buyToken,
    buyDecimals,
    slippageBps,
    taker,
    recipient,
    sellPriceUsd,
    nativePriceUsd,
  }: {
    apiClient: FarcasterApiClient;
    source: ApiOnchainSwapSource;
    sellChain: ApiChain;
    sellToken: string;
    sellAmount: string;
    sellDecimals: number;
    buyChain: ApiChain;
    buyToken: string;
    buyDecimals: number;
    slippageBps?: number;
    taker: string;
    recipient: string;
    sellPriceUsd: number;
    nativePriceUsd: number;
  }) =>
  async () => {
    const response = await apiClient.getOnchainSwapQuote({
      source,
      sellChain,
      sellToken,
      sellAmount,
      sellDecimals,
      buyChain,
      buyToken,
      buyDecimals,
      slippageBps,
      taker,
      recipient,
      sellPriceUsd,
      nativePriceUsd,
    });

    return response.data.result;
  };

export { buildOnchainSwapQuoteFetcher };
