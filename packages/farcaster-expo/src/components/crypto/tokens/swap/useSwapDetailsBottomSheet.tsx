import { useSwapTokens } from './SwapTokensProvider';

export function useSwapDetailsBottomSheet() {
  const { showDetailsSheet, setShowDetailsSheet } = useSwapTokens();
  return { showDetailsSheet, setShowDetailsSheet };
}
