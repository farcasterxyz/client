/**
 * Grace-period guard for the global 401 → sign-out handler in
 * AuthTokenProvider.
 *
 * Two windows, both starting when the handler is wired up (i.e. once the
 * user is fully signed in):
 *
 * - Fresh-token path (10s): absorbs spurious 401s from in-flight/stale
 *   requests issued before a newly minted auth token fully propagated
 *   server-side.
 * - Restored-persisted-token path (5s): the token restored at cold start is
 *   old, so server-side propagation isn't a concern — but transient
 *   edge/proxy 401s and clock-skew blips right after relaunch are. Before
 *   this guard existed the restored path bypassed grace entirely (#9788,
 *   which wanted genuinely revoked persisted tokens detected immediately),
 *   so a single transient 401 at relaunch signed the user out on the spot.
 *   The shorter window keeps revoked-token detection fast while tolerating
 *   momentary blips. Genuinely revoked tokens are additionally caught,
 *   independent of this guard, by initSafe's refreshOnboardingState catch.
 */

const FRESH_TOKEN_GRACE_MS = 10_000;
const RESTORED_TOKEN_GRACE_MS = 5_000;

type ShouldSignOutInput = {
  responseStatus: number | undefined;
  endpointName: string | undefined;
  hasRestoredPersistedAuthToken: boolean;
};

type RevokedTokenGraceGuard = {
  shouldSignOut: (input: ShouldSignOutInput) => boolean;
  dispose: () => void;
};

function createRevokedTokenGraceGuard(): RevokedTokenGraceGuard {
  let armed = false;
  let restoredArmed = false;

  const graceTimer = setTimeout(() => {
    armed = true;
  }, FRESH_TOKEN_GRACE_MS);
  const restoredGraceTimer = setTimeout(() => {
    restoredArmed = true;
  }, RESTORED_TOKEN_GRACE_MS);

  return {
    shouldSignOut: ({
      responseStatus,
      endpointName,
      hasRestoredPersistedAuthToken,
    }) => {
      if (responseStatus !== 401) {
        return false;
      }

      // Don't loop on the deleteAuthToken call inside signOut itself
      if (endpointName === 'deleteAuthToken') {
        return false;
      }

      if (armed) {
        return true;
      }

      return restoredArmed && hasRestoredPersistedAuthToken;
    },
    dispose: () => {
      clearTimeout(graceTimer);
      clearTimeout(restoredGraceTimer);
    },
  };
}

export {
  createRevokedTokenGraceGuard,
  FRESH_TOKEN_GRACE_MS,
  RESTORED_TOKEN_GRACE_MS,
  type RevokedTokenGraceGuard,
};
