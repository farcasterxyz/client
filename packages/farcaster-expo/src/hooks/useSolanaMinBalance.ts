import * as React from 'react';

import { solanaConnection } from '../utils';

export function useSolanaMinBalance({
  enabled = true,
  ata = true,
}: {
  enabled?: boolean;
  ata?: boolean;
}) {
  const [minimumSolanaBalance, setMinimumSolanaBalance] =
    React.useState<bigint>(ata ? 2039280n : 890880n);
  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    (async () => {
      const minBalance =
        await solanaConnection.getMinimumBalanceForRentExemption(ata ? 165 : 0);
      setMinimumSolanaBalance(BigInt(Math.floor(minBalance)));
    })();
  }, [enabled, ata]);
  return minimumSolanaBalance;
}
