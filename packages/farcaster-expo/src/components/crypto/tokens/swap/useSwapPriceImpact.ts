import { useSwapTokens } from './SwapTokensProvider';

export function useSwapPriceImpact() {
  const { priceImpact } = useSwapTokens();
  return priceImpact;
}
