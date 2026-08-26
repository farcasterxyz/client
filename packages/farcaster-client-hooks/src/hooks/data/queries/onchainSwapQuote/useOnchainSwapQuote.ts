import { useQuery } from '@tanstack/react-query';
import { ApiChain, ApiOnchainSwapSource } from 'farcaster-client-data';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnchainSwapQuoteFetcher } from './buildOnchainSwapQuoteFetcher';
import { buildOnchainSwapQuoteKey } from './buildOnchainSwapQuoteKey';

const useOnchainSwapQuote = ({
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
  enabled = true,
  sellPriceUsd,
  nativePriceUsd,
}: {
  source?: ApiOnchainSwapSource;
  sellChain?: ApiChain;
  sellToken?: string;
  sellAmount?: string;
  sellDecimals?: number;
  buyChain?: ApiChain;
  buyToken?: string;
  buyDecimals?: number;
  slippageBps?: number;
  taker?: string;
  recipient?: string;
  sellPriceUsd?: number;
  nativePriceUsd?: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const isEnabled =
    !!source &&
    !!sellChain &&
    !!sellToken &&
    !!sellAmount &&
    !!sellDecimals &&
    !!buyChain &&
    !!buyToken &&
    !!buyDecimals &&
    !!taker &&
    !!recipient &&
    enabled;

  const args = {
    source: source!,
    sellChain: sellChain!,
    sellToken: sellToken!,
    sellAmount: sellAmount!,
    sellDecimals: sellDecimals!,
    buyChain: buyChain!,
    buyToken: buyToken!,
    buyDecimals: buyDecimals!,
    taker: taker!,
    recipient: recipient!,
    slippageBps: slippageBps,
    sellPriceUsd: sellPriceUsd ?? 0,
    nativePriceUsd: nativePriceUsd ?? 0,
  };

  return useQuery({
    queryKey: buildOnchainSwapQuoteKey(args),
    queryFn: buildOnchainSwapQuoteFetcher({ ...args, apiClient }),
    enabled: isEnabled,
    staleTime: 0,
    gcTime: MILLIS_PER_SECOND * 5, // quotes aren't useful after 5s
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
};

export { useOnchainSwapQuote };
