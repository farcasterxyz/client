import { useSwapTokens } from './SwapTokensProvider';

export function useSwapWarnings() {
  const { warning } = useSwapTokens();
  return warning;
}
