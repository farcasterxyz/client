import { useNonSuspenseUserByFid } from 'farcaster-client-hooks';
import { useMemo } from 'react';

import { isSolanaAddress } from '../utils/SolanaUtils';

export function useEmbeddedWalletsForFid({ fid }: { fid?: number }) {
  const { data: userProfile } = useNonSuspenseUserByFid({
    fid: fid || 0,
    enabled: !!fid,
  });

  return useMemo(() => {
    if (!fid) {
      return {
        evmAddress: undefined,
        solanaAddress: undefined,
      };
    }

    const evmTargetLabel = userProfile?.result.extras.walletLabels?.find(
      (label) =>
        label.labels.includes('warpcast') && !isSolanaAddress(label.address),
    );

    const solanaTargetLabel = userProfile?.result.extras.walletLabels?.find(
      (label) =>
        label.labels.includes('warpcast') && isSolanaAddress(label.address),
    );

    return {
      evmAddress: evmTargetLabel?.address,
      solanaAddress: solanaTargetLabel?.address,
    };
  }, [fid, userProfile]);
}
