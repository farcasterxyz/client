import { useWalletUsdcDenominatedValues } from '../../../../hooks';

export function useUsdcDenominatedSwaps() {
  const [usdcDenominatedSwaps = true, setUsdcDenominatedSwaps] =
    useWalletUsdcDenominatedValues();

  return {
    usdcDenominatedSwaps,
    setUsdcDenominatedSwaps,
  };
}
