import { useQueryClient } from '@tanstack/react-query';
import {
  ApiGetOnboardingState200Response,
  ApiToken,
  AuthToken,
  isFarcasterApiError,
} from 'farcaster-client-data';
import {
  buildOnboardingStateKey,
  RemovePersistentQueryStorageError,
  SignOutListenerError,
  useFarcasterApiClient,
  useRefreshOnboardingState,
} from 'farcaster-client-hooks';
import pull from 'lodash/pull';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { authTokenKey, getOnboardingStateKey } from '~/constants/storage';
import { useClearKeyTransport } from '~/hooks/useClearKeyTransport';
import { Analytics } from '~/utils/analyticsUtils';
import { trackError } from '~/utils/errorUtils';
import { getItem, setItem } from '~/utils/storageUtils';

import { authOnError401Ref, AuthOnError401Trigger } from './authOnError401Ref';
import { authSessionRecoveryRef } from './authSessionRecoveryRef';
import { authSignOutRef } from './authSignOutRef';
import { usePersistQueryClientInstance } from './PersistQueryClientInstanceProvider';

type OnSignOutListener = () => void;
type RemoveOnSignOutListener = () => void;
type AddSignOutListener = (
  listener: OnSignOutListener,
) => RemoveOnSignOutListener;

type AuthContextValue = {
  authToken: AuthToken | undefined;
  signIn: (params: { authToken: ApiToken; persist?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  addSignOutListener: AddSignOutListener;
};

const AuthContext = createContext<AuthContextValue>({
  authToken: undefined,
  signIn: async () => undefined,
  signOut: async () => undefined,
  addSignOutListener: () => () => undefined,
});

type AuthProviderProps = {
  children: ReactNode;
};

// Re-validation probe constants — mirror the mobile AuthTokenProvider.
const AUTH_REVALIDATION_MAX_ATTEMPTS = 3;
const AUTH_REVALIDATION_RETRY_DELAY_MS = 750;
const AUTH_REVALIDATION_TIMEOUT_MS = 8_000;

const AuthProvider: FC<AuthProviderProps> = memo(({ children }) => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const [isInitialized, setIsInitialized] = useState(false);
  const [authToken, setAuthToken] = useState<AuthToken>();
  const onSignOutListeners = useRef([] as OnSignOutListener[]).current;

  const { localStoragePersister } = usePersistQueryClientInstance();

  const refreshOnboardingState = useRefreshOnboardingState();

  const clearKeyTransport = useClearKeyTransport();

  const signOut = useCallback(async () => {
    onSignOutListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        trackError(new SignOutListenerError({ error }));
      }
    });

    // Clear cached onboardingState BEFORE clearing authToken (need token for the key)
    if (authToken) {
      const onboardingStateKey = await getOnboardingStateKey(authToken.secret); // clear cached onboardingState before clearing authToken
      await setItem({
        key: onboardingStateKey,
        value: undefined,
      });
    }

    setAuthToken(undefined);

    await clearKeyTransport();

    await setItem({ key: authTokenKey, value: undefined });

    // Wait a second before clearing the query cache.
    // This gives the navigator a chance to unmount the authed stacks
    // so we don't invalidate the cache and immediately refetch.
    setTimeout(async () => {
      queryClient.clear();

      try {
        if (localStoragePersister) {
          await localStoragePersister.removeClient();
        }
      } catch (error) {
        trackError(new RemovePersistentQueryStorageError({ error }));
      }

      location.reload();
    }, 750);
  }, [
    authToken,
    clearKeyTransport,
    localStoragePersister,
    onSignOutListeners,
    queryClient,
  ]);

  const resetSession = useCallback(
    async ({ existingToken }: { existingToken?: string }) => {
      if (existingToken) {
        const onboardingStateKey = await getOnboardingStateKey(existingToken);
        await setItem({ key: onboardingStateKey, value: undefined });
      }
      await signOut();
    },
    [signOut],
  );

  // Guards against re-entrant / stacked sign-outs and concurrent probes.
  // Declared before refreshAndPersistOnboardingState so both the global
  // onError handler and the onboarding-refresh catch block share them.
  const isSigningOutRef = useRef(false);
  const isRevalidatingRef = useRef(false);

  // Wrapper that persists onboardingState to localStorage after refresh
  const refreshAndPersistOnboardingState = useCallback(
    async (token: string) => {
      let result: ApiGetOnboardingState200Response | undefined;

      try {
        result = await refreshOnboardingState();
      } catch (error) {
        // Only act on 401 (token revoked/invalid); ignore network/timeout/5xx.
        if (isFarcasterApiError(error) && error.status === 401) {
          // Route through the shared probe (the same handler the global onError
          // delegate uses) so a transient 401 during cold-start init — before
          // onError is wired — is confirmed against /v2/me instead of signing
          // the user out immediately. The handler guards re-entry, so if the
          // global handler already started a probe for this 401 this is a
          // no-op; it also refetches onboarding on a 'valid' outcome.
          await authOnError401Ref.current?.({
            source: 'init_refresh',
            endpointName: 'onboardingState',
            responseStatus: 401,
          });
        } else {
          trackError(error);
        }
        return undefined;
      }

      if (!result) {
        return undefined;
      }

      const onboardingStateKey = await getOnboardingStateKey(token);
      await setItem({ key: onboardingStateKey, value: result });
      return result;
    },
    [refreshOnboardingState],
  );

  useEffect(() => {
    authSignOutRef.current = signOut;
    return () => {
      if (authSignOutRef.current === signOut) {
        authSignOutRef.current = null;
      }
    };
  }, [signOut]);

  const signIn = useCallback(
    async ({
      authToken: newAuthToken,
      persist = true,
    }: {
      authToken: AuthToken | undefined;
      persist?: boolean;
    }) => {
      setAuthToken(newAuthToken);

      apiClient.updateOptions({
        authToken: newAuthToken,
      });

      if (persist) {
        try {
          await setItem({ key: authTokenKey, value: newAuthToken });
        } catch (error) {
          trackError(error);
        }
      }
    },
    [apiClient],
  );

  const addSignOutListener: AddSignOutListener = useCallback(
    (listener: OnSignOutListener) => {
      onSignOutListeners.push(listener);
      return () => {
        pull(onSignOutListeners, listener);
      };
    },
    [onSignOutListeners],
  );

  // Stable refs so the onError closure always sees the latest values without
  // being re-registered on every render.
  const authTokenRef = useRef(authToken);
  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  const resetSessionRef = useRef(resetSession);
  useEffect(() => {
    resetSessionRef.current = resetSession;
  }, [resetSession]);

  // Re-check the token against the origin before signing out. A revoked token
  // 401s every attempt → 'invalid'. A transient edge 401 resolves on retry →
  // 'valid'. An unreachable origin → 'inconclusive' (fail safe, no sign-out).
  const revalidateAuthToken = useCallback(async (): Promise<
    'valid' | 'invalid' | 'inconclusive'
  > => {
    let sawUnauthorized = false;
    for (
      let attempt = 0;
      attempt < AUTH_REVALIDATION_MAX_ATTEMPTS;
      attempt += 1
    ) {
      if (attempt > 0) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, AUTH_REVALIDATION_RETRY_DELAY_MS),
        );
      }
      try {
        await apiClient.getAuthenticatedUser({
          timeout: AUTH_REVALIDATION_TIMEOUT_MS,
        });
        return 'valid';
      } catch (error) {
        if (isFarcasterApiError(error) && error.status === 401) {
          sawUnauthorized = true;
          continue;
        }
        // Network / timeout / offline — cannot determine revocation.
        return 'inconclusive';
      }
    }
    return sawUnauthorized ? 'invalid' : 'inconclusive';
  }, [apiClient]);

  // Shared 401 handler: probe /v2/me before signing out. Only a confirmed
  // revocation ('invalid') resets the session; a transient 401 ('valid') is
  // cleared and onboarding refetched; an unreachable origin ('inconclusive')
  // fails safe and stays signed in. Used by BOTH the global onError delegate
  // (WebFarcasterApiClientProvider) and the onboarding-refresh catch above.
  const revalidateAndResetIfInvalid = useCallback(
    async (trigger: AuthOnError401Trigger) => {
      // Re-entry guard: the probe's own /v2/me call also flows through onError,
      // and the onboarding-refresh catch can fire for the same 401.
      if (isSigningOutRef.current || isRevalidatingRef.current) {
        return;
      }
      // NB: session recovery is deliberately NOT started here. The global
      // handler forwards EVERY 401 (not just the old auth-endpoint allowlist),
      // and starting recovery is side-effectful — on failure it signs the user
      // out (authSignOutRef) with no probe. Probe FIRST and only defer to
      // recovery once the token is confirmed revoked, so an unrelated/transient
      // 401 can never kick off recovery or a probe-less sign-out. See the
      // 'invalid' branch below.
      const tokenAtProbeStart = authTokenRef.current;
      if (!tokenAtProbeStart) {
        return;
      }
      isRevalidatingRef.current = true;
      try {
        const result = await revalidateAuthToken();
        // Token cleared / rotated while the probe was in flight → stale, ignore.
        if (
          !authTokenRef.current ||
          authTokenRef.current !== tokenAtProbeStart
        ) {
          return;
        }

        // Diagnostics mirror the mobile AuthTokenProvider so the phantom-logout
        // rate (prevented / inconclusive / confirmed-unexpected) is measurable
        // on web too, and an unexpected logout is traceable to the endpoint /
        // status / source that triggered it. Emitted via the pre-auth-safe
        // logger so a cold-start ('init_refresh') event isn't dropped before
        // the user is identified.
        const diagnostics = {
          source: trigger.source,
          endpoint: trigger.endpointName ?? 'unknown',
          responseStatus: trigger.responseStatus ?? null,
          revalidationOutcome: result,
        };

        if (result === 'invalid') {
          // Token confirmed revoked — but before tearing the session down,
          // check whether ANOTHER tab/instance of this browser already
          // re-minted (login or session recovery persists the new token).
          // The backend's one-token-per-device dedup revokes this tab's older
          // token as part of that re-mint, so "our token is dead" often means
          // "a sibling tab holds a fresh one". Adopt it instead of resetting:
          // resetSession would clear the persisted token — the sibling's
          // VALID session — and log every tab of this browser out.
          try {
            const persistedAuthToken = await getItem<AuthToken | undefined>({
              key: authTokenKey,
              fallback: undefined,
            });
            if (
              persistedAuthToken &&
              persistedAuthToken.secret !== tokenAtProbeStart.secret
            ) {
              Analytics.dangerouslyLogPossiblyPreAuthEvent(
                'auth.rotated_token_adopted',
                diagnostics,
              );
              await signIn({ authToken: persistedAuthToken, persist: false });
              void refreshOnboardingState({ retry: 1 }).catch(() => {});
              return;
            }
          } catch (error) {
            // Best-effort: if storage is unreadable, fall through to the
            // normal recovery/reset path below.
            trackError(error);
          }
          // Prefer an in-progress / newly-started session-recovery flow
          // (silent custody re-sign) over tearing the session down; only
          // reset if recovery didn't start.
          if (authSessionRecoveryRef.current?.() ?? false) {
            // Not a sign-out — recovery will re-sign or, on its own failure,
            // sign out via authSignOutRef. Tracked distinctly so it doesn't
            // inflate the unexpected-logout metric.
            Analytics.dangerouslyLogPossiblyPreAuthEvent(
              'auth.session_recovery_started',
              diagnostics,
            );
            return;
          }
          Analytics.dangerouslyLogPossiblyPreAuthEvent(
            'auth.sign_out_unexpected',
            diagnostics,
          );
          isSigningOutRef.current = true;
          try {
            await resetSessionRef.current({
              existingToken: tokenAtProbeStart.secret,
            });
          } finally {
            isSigningOutRef.current = false;
          }
          return;
        }

        if (result === 'valid') {
          // Transient 401 the probe cleared — a phantom logout was PREVENTED.
          Analytics.dangerouslyLogPossiblyPreAuthEvent(
            'auth.sign_out_prevented',
            diagnostics,
          );
          // Refetch onboarding so a stale 401 error view doesn't persist even
          // though the token is fine.
          void refreshOnboardingState({ retry: 1 }).catch(() => {});
          return;
        }

        // 'inconclusive': unreachable origin (network / timeout / offline) —
        // revocation neither confirmed nor cleared. Fail safe (stay signed in)
        // but track separately so it doesn't over-count sign_out_prevented.
        Analytics.dangerouslyLogPossiblyPreAuthEvent(
          'auth.sign_out_inconclusive',
          diagnostics,
        );
      } finally {
        isRevalidatingRef.current = false;
      }
    },
    [revalidateAuthToken, refreshOnboardingState, signIn],
  );

  // Register the shared handler for WebFarcasterApiClientProvider (the single
  // onError owner) and the onboarding-refresh catch to delegate to. A ref keeps
  // the two providers from competing over apiClient.onError. Defined before the
  // init effect so it is populated before cold-start init runs.
  useEffect(() => {
    authOnError401Ref.current = revalidateAndResetIfInvalid;
    return () => {
      if (authOnError401Ref.current === revalidateAndResetIfInvalid) {
        authOnError401Ref.current = null;
      }
    };
  }, [revalidateAndResetIfInvalid]);

  useEffect(() => {
    const init = async () => {
      if (isInitialized) {
        return;
      }

      try {
        const persistedAuthToken = await getItem<AuthToken | undefined>({
          key: authTokenKey,
          fallback: undefined,
        });

        if (persistedAuthToken) {
          signIn({ authToken: persistedAuthToken, persist: false });

          // Read cached onboardingState (key includes auth token secret)
          const onboardingStateKey = await getOnboardingStateKey(
            persistedAuthToken.secret,
          );
          const cachedOnboardingState = await getItem<
            ApiGetOnboardingState200Response | undefined
          >({
            key: onboardingStateKey,
            fallback: undefined,
          });

          if (cachedOnboardingState) {
            // Seed React Query cache with stored data for instant render
            queryClient.setQueryData(
              buildOnboardingStateKey(),
              cachedOnboardingState,
            );
            // Refresh in background (non-blocking)
            refreshAndPersistOnboardingState(persistedAuthToken.secret);
          } else {
            // No cache - must block for first-time users
            await refreshAndPersistOnboardingState(persistedAuthToken.secret);
          }
        }
      } catch (error) {
        trackError(error);
      }

      setIsInitialized(true);
    };

    init();
  }, [
    isInitialized,
    queryClient,
    refreshAndPersistOnboardingState,
    refreshOnboardingState,
    setAuthToken,
    signIn,
  ]);

  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ authToken, signIn, signOut, addSignOutListener }}
    >
      {children}
    </AuthContext.Provider>
  );
});

AuthProvider.displayName = 'AuthProvider';

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
