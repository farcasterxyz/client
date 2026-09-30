import { useEmbeddedWalletsQuery } from 'farcaster-client-hooks';

import { useCurrentUserFid } from './useCurrentUser';
import { useSecondaryWalletsEnabled } from './useSecondaryWalletsEnabled';

// True if the user owns a secondary ("private") embedded wallet, read from the
// embedded-wallets list (fetched only when the feature flag is on). Drives
// switcher visibility for owners regardless of Pro.
export function useHasSecondaryWallet(): boolean {
  const fid = useCurrentUserFid();
  const enabled = useSecondaryWalletsEnabled();
  const { data } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: fid,
    enabled: enabled && !!fid,
  });
  return (data?.wallets ?? []).some(
    (wallet) => wallet.privyAppNamespace === 'secondary',
  );
}
