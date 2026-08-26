import { useWalletPositionsQuery } from 'farcaster-client-hooks';
import { useMemo, useRef } from 'react';

import { useActiveWallet } from './useActiveWallet';
import { useCurrentUserFid } from './useCurrentUser';
import { useWalletFidOverride } from './useWalletPreferences';

export const useWalletBalances = (
  fid?: number,
  options?: { walletId?: string; useActiveWallet?: boolean },
) => {
  const userFid = useCurrentUserFid();
  const [walletFidOverride] = useWalletFidOverride();
  const { activeWalletId } = useActiveWallet();

  const fidToUse = useMemo(
    () => fid ?? walletFidOverride ?? userFid,
    [fid, userFid, walletFidOverride],
  );

  const walletId = useMemo(() => {
    if (options?.walletId !== undefined) {
      return options.walletId;
    }
    if (options?.useActiveWallet === false) {
      return undefined;
    }
    // When viewing another user's wallet, let the API resolve the default wallet.
    if (fidToUse !== userFid) {
      return undefined;
    }
    return activeWalletId;
  }, [
    options?.walletId,
    options?.useActiveWallet,
    fidToUse,
    userFid,
    activeWalletId,
  ]);

  const { data, isPending, isError, refetch, isStale, dataUpdatedAt } =
    useWalletPositionsQuery({
      params: {
        fid: fidToUse,
        walletId,
      },
      enabled: !!fidToUse,
      keepPreviousData: true,
    });

  // Stabilize balances array to prevent unnecessary re-renders
  const lastBalancesRef = useRef(data?.positions ?? []);
  const stableBalances = useMemo(() => {
    const newBalances = data?.positions ?? [];

    if (newBalances.length !== lastBalancesRef.current.length) {
      lastBalancesRef.current = newBalances;
      return newBalances;
    }

    const hasChanges = newBalances.some((newPos, index) => {
      const oldPos = lastBalancesRef.current[index];
      if (!oldPos) {
        return true;
      }

      return (
        newPos.address !== oldPos.address ||
        newPos.chain !== oldPos.chain ||
        newPos.quantity?.float !== oldPos.quantity?.float ||
        newPos.value !== oldPos.value ||
        newPos.price !== oldPos.price ||
        newPos.hidden !== oldPos.hidden ||
        newPos.userHidden !== oldPos.userHidden
      );
    });

    if (hasChanges) {
      lastBalancesRef.current = newBalances;
      return newBalances;
    }

    return lastBalancesRef.current;
  }, [data?.positions]);

  return {
    ...data,
    balances: stableBalances,
    isPending,
    isError,
    isStale,
    dataUpdatedAt,
    refetch,
  };
};
