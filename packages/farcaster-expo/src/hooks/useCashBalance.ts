import { isUsdc } from 'farcaster-client-data';
import { useOnchainYieldOverview } from 'farcaster-client-hooks';
import React from 'react';

import { useEmbeddedWallet } from '../contexts';
import { useWalletBalances } from './useWalletBalances';

const isCash = isUsdc;

export const useCashBalance = () => {
  const { balances } = useWalletBalances();
  const { evmAddress } = useEmbeddedWallet();

  const { data: cashYieldOverview } = useOnchainYieldOverview({
    address: evmAddress!,
    enabled: !!evmAddress,
  });

  const cashBalances = React.useMemo(() => {
    return balances.filter((b) => isCash(b.address));
  }, [balances]);

  const yieldTokenPosition = React.useMemo(() => {
    return balances.find(
      (b) => b.token?.ca === '0xbeef010f9cb27031ad51e3333f9af9c6b1228183',
    );
  }, [balances]);

  const cashTotalUsd = React.useMemo(() => {
    const yielded = cashYieldOverview
      ? cashYieldOverview.amount.assets.quantity.float *
        cashYieldOverview.vault.token.priceUsd
      : 0;
    return cashBalances.reduce((acc, b) => acc + (b.value ?? 0), 0) + yielded;
  }, [cashBalances, cashYieldOverview]);

  return {
    yieldTokenPosition,
    cashBalances,
    cashTotalUsd,
    cashYieldOverview,
  };
};
