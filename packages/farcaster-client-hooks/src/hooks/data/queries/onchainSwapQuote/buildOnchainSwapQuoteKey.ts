import { ApiChain, ApiOnchainSwapSource } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildOnchainSwapQuoteKey = ({
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
}: {
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
}) =>
  compactQueryKey([
    'onchainSwapQuote',
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
  ]) as string[];
