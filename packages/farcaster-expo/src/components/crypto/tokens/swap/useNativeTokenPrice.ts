import { ApiChain, ApiEthFungibleTokenPosition } from 'farcaster-client-data';
import { useFetchToken } from 'farcaster-client-hooks';
import React from 'react';

import { useWalletBalances } from '../../../../hooks/useWalletBalances';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  isNativeAsset,
  SOLANA_NATIVE_ASSET_ADDRESS,
} from '../../../../utils';

const getPriceFromBalances = (
  balances: ApiEthFungibleTokenPosition[],
  chain: ApiChain,
) => {
  const nativeToken = balances.find(
    (b) => b.chain === chain && isNativeAsset(b.address),
  );
  return nativeToken?.price ?? 0;
};

export function useNativeTokenPrice({ chain }: { chain: ApiChain }) {
  const { balances } = useWalletBalances();
  const fetchToken = useFetchToken();

  const [nativePriceUsd, setNativePriceUsd] = React.useState<number>(
    getPriceFromBalances(balances, chain),
  );

  React.useEffect(() => {
    const initialize = async () => {
      const fromBalances = getPriceFromBalances(balances, chain);
      if (fromBalances) {
        setNativePriceUsd(fromBalances);
        return;
      }

      const request = {
        chain,
        ca:
          chain === 'solana'
            ? SOLANA_NATIVE_ASSET_ADDRESS
            : EIP7528_NATIVE_ASSET_ADDRESS,
      };
      const token = await fetchToken(request);
      const priceUsd = token?.token?.priceUsd
        ? parseFloat(token.token.priceUsd)
        : 0;
      setNativePriceUsd(priceUsd);
    };

    initialize();
  }, [balances, chain, fetchToken]);

  return nativePriceUsd;
}
