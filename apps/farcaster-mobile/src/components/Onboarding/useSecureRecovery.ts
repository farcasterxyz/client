import { useQueryClient } from '@tanstack/react-query';
import type { ApiRecoveryAddress } from 'farcaster-client-data';
import {
  buildRecoveryAddressFetcher,
  buildRecoveryAddressKey,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

/**
 * Whether the SecureRecovery onboarding step should be shown for this account.
 *
 * True only for accounts whose recovery address is set to something OTHER than
 * Farcaster's recovery proxy and can still be changed — i.e. FIDs registered
 * outside Warpcast (neynar-api, Base, etc.). Normal Warpcast users always have
 * Farcaster's proxy as their recovery address, so this is false for them and
 * they never see the step.
 *
 * The `!!address` guard also covers the brief window right after a normal user
 * registers, before their recovery address is indexed: with no address yet we
 * treat recovery as "not needing securing" rather than prompting them.
 */
export function recoveryNeedsSecuring(
  recovery: ApiRecoveryAddress | undefined,
): boolean {
  return (
    !!recovery?.address &&
    !recovery.isWarpcastRecoveryAddress &&
    recovery.canChange &&
    !recovery.pendingChangeId
  );
}

/**
 * Imperatively resolves whether the SecureRecovery step should be shown, so
 * step transitions can route into it before it mounts (no flash for the users
 * who should skip it). Only queries when the account has an FID — the
 * `/v2/recovery-address` endpoint requires one — and fails closed (skip the
 * optional step) if recovery state can't be determined.
 */
export function useResolveRecoveryNeedsSecuring() {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ hasFid }: { hasFid: boolean }): Promise<boolean> => {
      if (!hasFid) {
        return false;
      }

      try {
        const data = await queryClient.fetchQuery({
          queryKey: buildRecoveryAddressKey(),
          queryFn: buildRecoveryAddressFetcher({ apiClient }),
        });
        return recoveryNeedsSecuring(data.result.recoveryAddress);
      } catch {
        return false;
      }
    },
    [apiClient, queryClient],
  );
}
