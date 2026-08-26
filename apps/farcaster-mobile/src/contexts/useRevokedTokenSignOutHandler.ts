import type { FarcasterApiClient } from 'farcaster-client-data';
import { type MutableRefObject, useEffect, useRef } from 'react';

import { createRevokedTokenGraceGuard } from './revokedTokenGrace';

type GlobalHandlerSignOutTrigger = {
  source: 'global_handler';
  endpointName: string | undefined;
  responseStatus: number | undefined;
};

type UseRevokedTokenSignOutHandlerParams = {
  apiClient: FarcasterApiClient;
  isInitialized: boolean;
  isSignedIn: boolean | undefined;
  hasRestoredPersistedAuthTokenRef: MutableRefObject<boolean>;
  maybeSignOutAfterRevalidation: (
    trigger: GlobalHandlerSignOutTrigger,
  ) => unknown;
};

/**
 * Wires the global 401 → revalidate → sign-out handler onto the API client once
 * the user is fully signed in, guarded by a grace period (see
 * revokedTokenGrace.ts) that absorbs transient 401s right after sign-in / cold
 * start.
 *
 * `maybeSignOutAfterRevalidation` is intentionally NOT an effect dependency: it
 * is recreated on every navigation (its trackEvent dependency closes over the
 * current path), so depending on it would tear down and recreate the grace
 * guard on each screen change, restarting the grace timers and suppressing
 * post-grace 401s far longer than intended — delaying /v2/me revalidation and
 * confirmed sign-out after a revoked token. We mirror it into a ref so the
 * handler always calls the latest callback while the effect stays stable.
 */
function useRevokedTokenSignOutHandler({
  apiClient,
  isInitialized,
  isSignedIn,
  hasRestoredPersistedAuthTokenRef,
  maybeSignOutAfterRevalidation,
}: UseRevokedTokenSignOutHandlerParams): void {
  const maybeSignOutAfterRevalidationRef = useRef(
    maybeSignOutAfterRevalidation,
  );
  useEffect(() => {
    maybeSignOutAfterRevalidationRef.current = maybeSignOutAfterRevalidation;
  }, [maybeSignOutAfterRevalidation]);

  useEffect(() => {
    if (!isInitialized || isSignedIn !== true) {
      return;
    }

    const graceGuard = createRevokedTokenGraceGuard();

    apiClient.updateOptions({
      onError: ({ responseStatus, requestInfo }) => {
        if (
          graceGuard.shouldSignOut({
            responseStatus,
            endpointName: requestInfo.endpointName,
            hasRestoredPersistedAuthToken:
              hasRestoredPersistedAuthTokenRef.current,
          })
        ) {
          void maybeSignOutAfterRevalidationRef.current({
            source: 'global_handler',
            endpointName: requestInfo.endpointName,
            responseStatus,
          });
        }
      },
    });

    return () => {
      graceGuard.dispose();
      apiClient.updateOptions({ onError: undefined });
    };
  }, [apiClient, isInitialized, isSignedIn, hasRestoredPersistedAuthTokenRef]);
}

export {
  type GlobalHandlerSignOutTrigger,
  useRevokedTokenSignOutHandler,
  type UseRevokedTokenSignOutHandlerParams,
};
