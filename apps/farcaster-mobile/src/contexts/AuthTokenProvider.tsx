import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  type ApiGetOnboardingState200Response,
  AppError,
  AuthToken,
  getApiTokenAuthError,
  getFirstApiErrorBody,
  isFarcasterApiError,
  isHandledFetchError,
} from 'farcaster-client-data';
import {
  BlockedDomainsProvider,
  ExternalUserSignerNotEligibleError,
  ExternalUserSignerPendingError,
  PrefetchAuthedResourcesError,
  useCreateExternalUserSigner,
  useDeleteAuthToken,
  useFallbackOnboardingState,
  useFarcasterApiClient,
  useGetOnboardingState,
  useOnboardingStateWithoutFallback,
  usePurgeOnboardingState,
  useRefreshOnboardingState,
  useRefreshOnboardingStateAndAuthToken,
  useSetOnboardingState,
} from 'farcaster-client-hooks';
import {
  getStoredPasskeys,
  isPasskeysSupported,
  updateStoredPasskey,
} from 'farcaster-cryptography';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Hex, isAddressEqual } from 'viem';

import { analyticsClient } from '~/analyticsClient';
import {
  buildMobileAnalyticsAppMetadata,
  syncMobileAnalyticsPersonState,
} from '~/analyticsClient/mobilePersonState';
import { FullScreenRetryableError } from '~/components/FullScreenRetryableError';
import { WrongCustodyAddressError } from '~/components/WrongCustodyAddressError';
import { authTokenKey } from '~/constants/Storage';
import { usePrefetchAuthedResources } from '~/hooks/data/usePrefetchAuthedResources';
import { usePrefetchUnauthedResources } from '~/hooks/data/usePrefetchUnauthedResources';
import {
  clearAllWebViewStorage,
  isWebViewStorageClearingSupported,
  webViewStorageClearErrorName,
} from '~/modules';
import { toHDAccountWithMnemonic } from '~/modules/farcaster-crypto';
import { UpdateStoredPassKeyError } from '~/types';
import { preloadedOnboardingStatePromise } from '~/utils/EarlyInitAuthTokenCheck';
import { trackError } from '~/utils/ErrorUtils';
import {
  getWebViewWipePending,
  setWebViewWipePending,
} from '~/utils/FastStorageUtils';
import { logInDevOnly } from '~/utils/LogUtils';
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from '~/utils/SecureStorageUtils';

import { useAnalytics } from './AnalyticsProvider';
import { useFarcasterCryptographyKeyStore } from './FarcasterCryptographyKeyStoreProvider';
import { decideRevalidationSignOut } from './revalidationSignOutDecision';
import { useRevokedTokenSignOutHandler } from './useRevokedTokenSignOutHandler';
import { useWallet } from './WalletProvider';

type SignOutListener = () => Promise<void>;
type RemoveSignOutListener = () => void;

type SignInWithMnemonicOptions = {
  mnemonic: string;
  passkeyDiscovery?: { credentialId: string; domain: string };
  onSuccess: ({ username }: { username: string | undefined }) => void;
  onUserDoesNotExist: () => void;
  /**
   * Called when the entered phrase belongs to an existing external FID (created
   * outside Warpcast, no signer on this client) for whom we just minted a free
   * Warpcast app signer and established an auth token. The user is now
   * authenticated but has not completed onboarding, so the caller should route
   * them into the existing onboarding completion flow.
   */
  onExternalUserNeedsOnboarding?: () => void;
  /**
   * Called when external-user signer creation was attempted but failed for a
   * transient/unexpected reason (not an eligibility rejection). The caller
   * should surface a retryable error.
   */
  onExternalUserSignerFailed?: () => void;
};

type AuthTokenContextValue = {
  /**
   * Whether there is an authenticated session established. An undefined
   * value indicates initialization is in progress.
   */
  isSignedIn: boolean | undefined;
  hasAuthToken: boolean | undefined;
  signInWithMnemonic: (options: SignInWithMnemonicOptions) => Promise<void>;
  signOut: (options?: { reason?: SignOutReason }) => Promise<void>;
  setAuthToken: ({
    authToken,
    persist,
  }: {
    authToken: AuthToken;
    persist?: boolean;
  }) => Promise<void>;
  addSignOutListener: (listener: SignOutListener) => RemoveSignOutListener;
  /**
   * True when a sign-out could not confirm the mini app WebView wipe (old
   * system WebView, timeout, or native failure), so a new account must not be
   * allowed to sign in yet — it would inherit the previous account's mini app
   * sessions. The app gates on this at the render level. Cleared by a
   * successful {@link retryWebViewWipe}.
   */
  wipePending: boolean;
  /**
   * Re-attempts the WebView wipe from the blocking gate. Resolves true and
   * clears {@link wipePending} on a complete wipe; resolves false if it is
   * still incomplete / failing.
   */
  retryWebViewWipe: () => Promise<boolean>;
};

const AuthTokenContext = createContext<AuthTokenContextValue>({
  isSignedIn: undefined,
  hasAuthToken: undefined,
  setAuthToken: async () => {
    throw new Error('setAuthToken must be called under AuthTokenProvider');
  },
  signInWithMnemonic: async () => {
    throw new Error(
      'signInWithMnemonic must be called under AuthTokenProvider',
    );
  },
  signOut: async () => {
    throw new Error('signOut must be called under AuthTokenProvider');
  },
  addSignOutListener: () => () => {
    throw new Error(
      'addSignOutListener must be called under AuthTokenProvider',
    );
  },
  wipePending: false,
  retryWebViewWipe: async () => {
    throw new Error('retryWebViewWipe must be called under AuthTokenProvider');
  },
});

type AuthTokenProviderProps = {
  children: ReactNode;
};

/** True when the API client classified the failure as offline / network / timeout. */
function isTransientFarcasterFetchError(error: unknown): boolean {
  return (
    isFarcasterApiError(error) &&
    (error.isNetworkError || error.isOffline || error.hasTimedOut)
  );
}

function isRevokedAuthTokenError(error: unknown): boolean {
  return isHandledFetchError(error) && error.status === 401;
}

type SignOutReason =
  | 'user_initiated'
  | 'revoked_token_confirmed'
  | 'wrong_custody_address'
  | 'unknown';

// Diagnostic context for an involuntary sign-out attempt, attached to the
// auth.sign_out_unexpected / auth.sign_out_prevented / auth.sign_out_inconclusive
// telemetry so a logout (or a skipped one) can be traced to the endpoint /
// status / source that triggered it.
type SignOutTrigger = {
  source: 'global_handler' | 'init_refresh';
  endpointName: string | undefined;
  responseStatus: number | undefined;
};

// Re-validation probe (see maybeSignOutAfterRevalidation). A single 401 is not
// proof the session was revoked: transient edge/proxy 401s, gateway blips
// during deploys, and business-logic 401s from unrelated endpoints all reach
// the same global handler. Before signing out we re-check the token directly
// against the origin — getAuthenticatedUser (GET /v2/me) 401s iff the token
// itself is invalid — retrying a few times so a momentary blip can't be
// mistaken for a revocation.
const AUTH_REVALIDATION_MAX_ATTEMPTS = 3;
const AUTH_REVALIDATION_RETRY_DELAY_MS = 750;
const AUTH_REVALIDATION_TIMEOUT_MS = 8_000;

let consumedPreloadedOnboardingState = false;

/**
 * Ideally this wouldn't be so reactive and work more explicitly on callbacks.
 * In the current architecture where the wallet state, onboarding state, and
 * auth token state can all vary independently and this component will detect
 * when they are out of sync and bring them back into sync.
 */
const AuthTokenProvider: FC<AuthTokenProviderProps> = memo(({ children }) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'AuthTokenProvider',
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<Error>();
  const [isPending, setIsPending] = useState(false);
  // Account-isolation gate. Raised when a sign-out cannot confirm the mini app
  // WebView wipe; the app renders a blocking screen while true so a new account
  // cannot sign in over the previous account's still-present mini app sessions.
  //
  // Seeded synchronously from persisted MMKV so a cold start after an unfinished
  // wipe renders the gate on the very first frame — there is no async window
  // where a new account could sign in before the gate is read.
  //
  // Gated on the native module being present. This is the backstop for the
  // invariant that wipePending is never true without the module: if this JS
  // reaches a binary that predates FarcasterWebViewStorage (a daily OTA over an
  // older runtime), the wipe can never run, so a raised gate would lock the
  // whole app with no way to clear it. Such binaries fall back to pre-fix
  // sign-out instead (see confirmWebViewWipe).
  const [wipePending, setWipePending] = useState(
    () => isWebViewStorageClearingSupported() && getWebViewWipePending(),
  );
  const [authToken, setAuthToken] = useState<AuthToken>();
  const hasRestoredPersistedAuthTokenRef = useRef(false);
  // Latch so overlapping sign-in attempts can't run concurrently. Seed-phrase
  // sign-in can now mint an external-user signer and poll a key transaction for
  // minutes, and some callers (device-pairing screens) fire it without
  // awaiting, so a retry / re-delivered channel message could otherwise start a
  // second mint mid-flight — duplicate signer work and conflicting callbacks.
  const signInWithMnemonicInFlightRef = useRef(false);

  const signOutListeners = useRef<Set<SignOutListener>>(null!);
  if (signOutListeners.current === null) {
    signOutListeners.current = new Set();
  }

  const addSignOutListener = useCallback(
    (listener: SignOutListener) => {
      signOutListeners.current.add(listener);
      return () => {
        signOutListeners.current.delete(listener);
      };
    },
    [signOutListeners],
  );

  const { trackEvent } = useAnalytics();
  const {
    isInitialized: isWalletInitialized,
    address,
    account,
    importWallet,
    clearWallet,
  } = useWallet();

  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const deleteAuthToken = useDeleteAuthToken();
  const prefetchUnauthedResources = usePrefetchUnauthedResources();
  const prefetchAuthedResources = usePrefetchAuthedResources();

  const {
    data: onboardingState,
    error: onboardingStateError,
    isError: isOnboardingStateError,
    isStale: isOnboardingStateStale,
  } = useOnboardingStateWithoutFallback({
    query: {
      enabled: !!authToken,
      refetchOnMount: 'always',
    },
  });

  const purgeOnboardingState = usePurgeOnboardingState();
  const refreshOnboardingState = useRefreshOnboardingState();
  const setOnboardingState = useSetOnboardingState();
  const getOnboardingState = useGetOnboardingState();
  const refreshOnboardingStateAndAuthToken =
    useRefreshOnboardingStateAndAuthToken();
  const createExternalUserSigner = useCreateExternalUserSigner();
  const { keyStore } = useFarcasterCryptographyKeyStore();
  const fallbackOnboardingState = useFallbackOnboardingState();

  const isSignedIn = React.useMemo(() => {
    if (!isWalletInitialized || !isInitialized || isPending) {
      return undefined;
    }

    const {
      result: {
        state: { user, hasCompletedRegistration },
      },
    } = onboardingState ?? fallbackOnboardingState;

    if (!user || !hasCompletedRegistration || !authToken) {
      return false;
    }

    return true;
  }, [
    authToken,
    fallbackOnboardingState,
    isInitialized,
    isPending,
    isWalletInitialized,
    onboardingState,
  ]);

  const setAuthTokenSafe = useCallback(
    async ({
      authToken: newAuthToken,
      persist = true,
    }: {
      authToken: AuthToken;
      persist?: boolean;
    }) => {
      try {
        // Ordering is important: setup auth token on our API client before
        // updating any state since after that's done components assume they
        // can make authenticated requests.
        apiClient.updateOptions({
          authToken: newAuthToken,
        });

        setAuthToken(newAuthToken);
        hasRestoredPersistedAuthTokenRef.current = !persist;

        if (persist) {
          try {
            await setSecureItem({ key: authTokenKey, value: newAuthToken });
          } catch (err) {
            trackError(
              new AppError('failed to persist authToken with setSecureItem', {
                location: 'AuthTokenProvider',
                name: 'PersistAuthTokenError',
              }),
            );
          }
        }
      } catch (err) {
        trackError(err);
      }
    },
    [apiClient],
  );

  const clearAuthToken = useCallback(async () => {
    if (authToken) {
      try {
        await deleteAuthToken();
      } catch (err) {
        trackError(
          new AppError('failed to delete auth token from server', {
            location: 'AuthTokenProvider',
            name: 'DeleteAuthTokenError',
          }),
        );
      }

      try {
        await deleteSecureItem(authTokenKey);
      } catch (err) {
        trackError(
          new AppError('failed to delete auth token from SecureStorage', {
            location: 'AuthTokenProvider',
            name: 'DeleteAuthTokenError',
          }),
        );
      }
    }

    // Ordering is important: clear React state before removing the token from
    // our API client so that any components depending on auth state can react
    // accordingly.
    setAuthToken(undefined);
    hasRestoredPersistedAuthTokenRef.current = false;

    apiClient.updateOptions({
      authToken: undefined,
    });
  }, [apiClient, authToken, deleteAuthToken]);

  const repairMobileAnalyticsPersonState = useCallback(
    (response: ApiGetOnboardingState200Response) => {
      try {
        syncMobileAnalyticsPersonState({
          address,
          analytics: analyticsClient,
          appMetadata: buildMobileAnalyticsAppMetadata(),
          identifyBeforeSet: true,
          onboardingState: response.result.state,
        });
      } catch (error) {
        trackError(
          new AppError('failed to repair mobile analytics person state', {
            cause: error,
            location: 'AuthTokenProvider',
            name: 'MobileAnalyticsPersonRepairError',
          }),
        );
      }
    },
    [address],
  );

  const establishAuthSessionSafe = useCallback(async () => {
    if (!isWalletInitialized) {
      throw new AppError(
        'establishAuthSessionSafe called with uninitialized wallet',
        {
          location: 'AuthTokenProvider',
          name: 'UnexpectedEstablishAuthStateError',
        },
      );
    }

    if (!address) {
      throw new AppError('establishAuthSessionSafe called without an address', {
        location: 'AuthTokenProvider',
        name: 'UnexpectedEstablishAuthStateError',
      });
    }

    try {
      const response = await refreshOnboardingStateAndAuthToken({
        account: account!,
      });
      repairMobileAnalyticsPersonState(response);

      if (response.result.token) {
        await setAuthTokenSafe({
          authToken: response.result.token,
          persist: true,
        });

        return true;
      }

      return false;
    } catch (err) {
      trackError(
        new AppError('failed to establish auth state', {
          cause: err,
          location: 'AuthTokenProvider',
          name: 'FailedToEstablishAuthStateError',
        }),
      );
    }
  }, [
    account,
    address,
    isWalletInitialized,
    repairMobileAnalyticsPersonState,
    refreshOnboardingStateAndAuthToken,
    setAuthTokenSafe,
  ]);

  const signInWithMnemonic = useCallback(
    async ({
      mnemonic,
      passkeyDiscovery,
      onSuccess,
      onUserDoesNotExist,
      onExternalUserNeedsOnboarding,
      onExternalUserSignerFailed,
    }: SignInWithMnemonicOptions) => {
      // Ignore overlapping attempts while one is still in flight (see ref decl).
      if (signInWithMnemonicInFlightRef.current) {
        return;
      }
      signInWithMnemonicInFlightRef.current = true;

      try {
        const signInAccount = await toHDAccountWithMnemonic({
          mnemonic,
        });

        const onboardingState = await refreshOnboardingStateAndAuthToken({
          account: signInAccount,
        });

        const {
          result: {
            state: {
              hasCompletedRegistration,
              user,
              hasConfirmedEmail,
              hasDelegatedSigner,
              hasFid,
            },
            token,
          },
        } = onboardingState;

        // Reject seed-phrase login only for truly empty accounts — i.e. no
        // email verification AND no completed registration. Allow through
        // accounts that ARE fully registered but whose email record was
        // orphaned by the backend's conflictingOnboarding path (post-recovery
        // email re-mapping). Keying solely on hasConfirmedEmail was locking out
        // real users whose backend email association had been corrupted.
        if (!hasConfirmedEmail && !hasCompletedRegistration) {
          // A custody address with no on-chain FID is a genuinely empty account
          // (unregistered wallet or a mistyped seed phrase). The backend issues
          // no session token for it and the external-user signer endpoints would
          // reject it (no_fid_for_custody -> 403), so there is nothing to mint.
          // Short-circuit to the existing "No account found" behavior instead of
          // attempting the external-user flow and surfacing a misleading,
          // non-retryable "couldn't finish setting up your account" error (and
          // polluting error tracking on every typo). Eligible external FIDs
          // always have hasFid=true and a token, so this never blocks them.
          if (!hasFid) {
            trackEvent(AnalyticsEvent.SignedInToEmptyAccount, {
              reason: 'no_fid',
            });
            onUserDoesNotExist();
            return;
          }

          // Before treating this as an empty account, check whether it's an
          // existing FID created OUTSIDE Warpcast (via neynar-api, Base, etc.).
          // Such accounts have no onboardings row and no Warpcast app signer on
          // this client, so the standard signed-key-request flow dead-ends. If
          // eligible, mint a free signer (backend pays gas), establish an auth
          // token, and route the user into the EXISTING onboarding completion
          // flow rather than showing the "account not found" error.
          // Establish the session from an already-usable auth token and resume
          // the existing onboarding flow. isSignedIn stays false (onboarding is
          // incomplete) so the app remains in the UnauthedStack.
          const resumeExternalOnboarding = async (authToken: AuthToken) => {
            await importWallet(signInAccount);
            await setAuthTokenSafe({ authToken });
            onExternalUserNeedsOnboarding?.();
          };

          // A usable Warpcast app signer may already exist for this FID — e.g.
          // minted on a previous attempt of this flow, or created on another
          // device. Don't try to mint again (the backend would reject it as
          // has_active_signer); just resume onboarding with the token the
          // backend already issued.
          if (hasDelegatedSigner && token) {
            // Existing usable signer (minted on a prior attempt or another
            // device) — resumed without a fresh mint. Tracked separately from a
            // fresh Success so the mint funnel isn't inflated by resumes.
            trackEvent(AnalyticsEvent.ExternalUserSignerResumed, {});
            await resumeExternalOnboarding(token);
            return;
          }

          try {
            trackEvent(AnalyticsEvent.ExternalUserSignerAttempt, {});

            // The key-transaction poll inside createExternalUserSigner needs the
            // user's standard session token (the custody bearer isn't accepted by
            // getKeyTransaction). An eligible external FID always gets one from
            // the refresh above; bail out to the retryable path if it's missing.
            if (!token) {
              throw new Error(
                'External user has no session token to poll the key transaction',
              );
            }

            await createExternalUserSigner({
              account: signInAccount,
              authToken: token,
            });

            // Re-establish onboarding state + auth token now that the signer
            // exists.
            const refreshed = await refreshOnboardingStateAndAuthToken({
              account: signInAccount,
            });
            const refreshedToken = refreshed.result.token;

            if (!refreshedToken) {
              throw new Error(
                'External user signer minted but backend returned no auth token',
              );
            }

            trackEvent(AnalyticsEvent.ExternalUserSignerSuccess, {
              recovered: false,
            });
            await resumeExternalOnboarding(refreshedToken);
            return;
          } catch (externalUserError) {
            // Whether the request was rejected as not-eligible (the FID already
            // has a signer or is already onboarded) or the mint failed mid-way
            // (the signer may have landed on-chain before a step-3 403 / poll
            // timeout), the account may already be usable. Re-check for a usable
            // signer + token before declaring the account empty.
            try {
              const recovered = await refreshOnboardingStateAndAuthToken({
                account: signInAccount,
              });
              const recoveredToken = recovered.result.token;

              if (recoveredToken && recovered.result.state.hasDelegatedSigner) {
                // Mint threw mid-way but the signer actually landed on-chain
                // (e.g. step-3 403 after the add, or a poll timeout) — recovered.
                trackEvent(AnalyticsEvent.ExternalUserSignerSuccess, {
                  recovered: true,
                });
                await resumeExternalOnboarding(recoveredToken);
                return;
              }
            } catch {
              // Recovery check failed — fall through to the handling below.
            }

            if (
              externalUserError instanceof ExternalUserSignerNotEligibleError
            ) {
              // No usable signer to recover and we can't mint one (feature off,
              // no on-chain FID, revoked key, etc.) — genuinely not an account we
              // can sign into. Fall back to the existing empty-account behavior.
              trackEvent(AnalyticsEvent.SignedInToEmptyAccount, {
                reason: 'not_eligible',
              });
              onUserDoesNotExist();
              return;
            }

            if (externalUserError instanceof ExternalUserSignerPendingError) {
              // A signer add for this FID is already landing on-chain (the mint
              // was started on a previous attempt). It just hasn't been indexed
              // yet, so the recovery re-check above didn't see hasDelegatedSigner.
              // This is transient, not an empty account and not an error to log —
              // surface a retryable message; retrying once it lands resumes
              // onboarding via the hasDelegatedSigner early-return above.
              trackEvent(AnalyticsEvent.ExternalUserSignerPending, {});
              if (onExternalUserSignerFailed) {
                onExternalUserSignerFailed();
              } else {
                onUserDoesNotExist();
              }
              return;
            }

            // Eligible, but the flow failed mid-way (signature/infra/timeout or
            // the key transaction failed). Surface a retryable error; the flow
            // is idempotent so the user can safely try again.
            trackEvent(AnalyticsEvent.ExternalUserSignerError, {
              // HTTP status when the failure was an API error (e.g. 400
              // signature, 429 rate limit, 503 infra); undefined for the
              // poll timeout / key-tx-failed / missing-token cases.
              status: isHandledFetchError(externalUserError)
                ? externalUserError.status
                : undefined,
              reason: isHandledFetchError(externalUserError)
                ? getFirstApiErrorBody(externalUserError)?.reason
                : undefined,
              // Distinguishes API failures (HandledFetchError) from the
              // poll/token errors thrown internally (plain Error).
              errorName:
                externalUserError instanceof Error
                  ? externalUserError.name
                  : 'unknown',
            });
            trackError(
              new AppError('failed to create external user signer', {
                cause: externalUserError,
                location: 'AuthTokenProvider',
                name: 'ExternalUserSignerError',
              }),
            );
            if (onExternalUserSignerFailed) {
              onExternalUserSignerFailed();
            } else {
              onUserDoesNotExist();
            }
            return;
          }
        }

        // Save passkey metadata before importWallet/setAuthTokenSafe, because
        // those trigger React state changes that navigate to HomeScreen. If the
        // passkey isn't saved yet, HomeScreen pushes PasskeysBackupExistingUser.
        if (hasCompletedRegistration) {
          try {
            if (await isPasskeysSupported({ keyStore })) {
              const passkeys = await getStoredPasskeys({ keyStore });
              if (
                passkeys.filter((p) => p.address === signInAccount.address)
                  .length > 0
              ) {
                const passkey = passkeys.filter(
                  ({ address }) => address === signInAccount.address,
                )[0];
                passkey.displayName = user!.displayName;
                passkey.pfpUrl = user!.pfp?.url || passkey.pfpUrl || '';
                passkey.username = user!.username || passkey.username;
                await updateStoredPasskey({
                  keyStore,
                  credentialId: passkey.credentialId,
                  storedPasskey: passkey,
                });
              } else if (passkeyDiscovery) {
                await updateStoredPasskey({
                  keyStore,
                  credentialId: passkeyDiscovery.credentialId,
                  storedPasskey: {
                    credentialId: passkeyDiscovery.credentialId,
                    address: signInAccount.address,
                    fid: user!.fid,
                    pfpUrl: user!.pfp?.url || '',
                    username: user!.username || '',
                    displayName: user!.displayName || '',
                    domain: passkeyDiscovery.domain,
                  },
                });
              }
            }
          } catch (error) {
            trackError(new UpdateStoredPassKeyError({ error }));
          }
        }

        await importWallet(signInAccount);

        trackEvent(AnalyticsEvent.SignedIn, {
          hasAuthToken: !!token,
          hasCompletedRegistration,
        });

        if (token) {
          await setAuthTokenSafe({ authToken: token });
        }

        if (hasCompletedRegistration) {
          try {
            await prefetchAuthedResources(
              {
                fid: user!.fid,
              },
              {
                invalidateBeforePrefetch: true,
              },
            );
          } catch (error) {
            trackError(
              new PrefetchAuthedResourcesError({
                error,
                fid: user?.fid,
              }),
            );
          }
        }

        onSuccess({
          username: user?.username,
        });
      } catch (err) {
        const error = new AppError('failed to sign in with mnemonic', {
          location: 'AuthTokenProvider',
          name: 'signInWithMnemonicError',
          cause: err,
        });

        trackError(error);
        throw error;
      } finally {
        signInWithMnemonicInFlightRef.current = false;
      }
    },
    [
      createExternalUserSigner,
      importWallet,
      keyStore,
      prefetchAuthedResources,
      refreshOnboardingStateAndAuthToken,
      setAuthTokenSafe,
      trackEvent,
    ],
  );

  // Runs the mini app WebView wipe and enforces the account-isolation boundary.
  // Returns true only when the wipe was complete; on an incomplete wipe (old
  // Android system WebView) or a failure it fails closed — persisting a flag
  // and raising wipePending so the next sign-in is gated. Never throws, so
  // sign-out always proceeds. Shared by signOut and the blocking-screen retry.
  const confirmWebViewWipe = useCallback(async (): Promise<boolean> => {
    // OTA over a binary that predates the native module: a wipe is impossible,
    // so the gate could never clear and would lock the whole app. Degrade to
    // pre-fix behavior — sign out with no wipe, tracked — rather than gate.
    // Binaries that ship the module enforce the boundary strictly. Returns
    // before any setWipePending / persist so no gate is raised.
    if (!isWebViewStorageClearingSupported()) {
      trackError(
        new AppError('WebView storage wipe unavailable in this binary', {
          location: 'AuthTokenProvider',
          name: 'ClearWebViewStorageUnsupportedError',
        }),
      );
      return false;
    }

    try {
      const { complete } = await clearAllWebViewStorage();
      if (complete) {
        // Only a confirmed complete wipe lowers the gate — persisted first so a
        // kill right after can't leave the gate stuck up on a wiped device.
        setWebViewWipePending({ pending: false });
        setWipePending(false);
        logInDevOnly('[auth] cleared WebView storage');
        return true;
      }

      // Partial wipe: deleteAllData does not guarantee IndexedDB / CacheStorage,
      // where a mini app may keep Quick Auth credentials. Treated as a failed
      // boundary, not a success.
      trackError(
        new AppError('WebView storage wipe incomplete', {
          location: 'AuthTokenProvider',
          name: 'ClearWebViewStorageIncompleteError',
        }),
      );
    } catch (err) {
      trackError(
        new AppError('failed to clear WebView storage', {
          location: 'AuthTokenProvider',
          name: webViewStorageClearErrorName(err),
          cause: err instanceof Error ? err : new Error(String(err)),
        }),
      );
    }

    // Incomplete / failed wipe: keep the gate raised, both persisted (survives a
    // cold start) and in-memory (drives the blocking screen). Idempotent — the
    // persisted flag was already written ahead of teardown in signOut.
    setWebViewWipePending({ pending: true });
    setWipePending(true);
    return false;
  }, []);

  const signOut = useCallback(
    async (options?: { reason?: SignOutReason }) => {
      try {
        trackEvent(AnalyticsEvent.SignedOut, {
          reason: options?.reason ?? 'user_initiated',
        });
        setIsPending(true);

        // Write-ahead the wipe gate BEFORE clearing the token below. If the
        // process is killed anywhere during teardown, the next launch finds no
        // token but a raised flag and gates sign-in — rather than treating an
        // interrupted sign-out (whose WebView wipe never ran) as clean. Only a
        // confirmed complete wipe in confirmWebViewWipe lowers it again. This is
        // an in-memory-free persist (no setWipePending) so a normal sign-out
        // does not flash the blocking screen.
        //
        // Skipped without the native module (OTA over an older binary): the
        // wipe can never run, so arming the flag would lock the app on the next
        // cold start. Keeps the wipePending-implies-module invariant intact.
        if (isWebViewStorageClearingSupported()) {
          setWebViewWipePending({ pending: true });
        }

        // Snapshot before iterating: setIsPending(true) unmounts the authed
        // subtree, and a listener registered by an unmounted component removes
        // itself from this Set in its effect cleanup — deleting from the live
        // Set mid-iteration can skip listeners. Array.from runs every listener
        // registered at sign-out regardless of unmount ordering.
        const signOutListenersSnapshot = Array.from(signOutListeners.current);
        for (const signOutListener of signOutListenersSnapshot) {
          await signOutListener().catch(() => {});
        }

        // Unmount navigation and show a spinner.
        //
        // A wallet-teardown failure (e.g. a SecureStore delete throwing) must
        // not abort sign-out. The write-ahead flag is already persisted, so
        // bailing here would leave the gate raised without ever clearing the
        // token or attempting the WebView wipe below — the boundary has to be
        // enforced regardless.
        try {
          await clearWallet();
        } catch (err) {
          trackError(
            new AppError('failed to clear wallet on sign out', {
              location: 'AuthTokenProvider',
              name: 'ClearWalletOnSignOutError',
              cause: err instanceof Error ? err : new Error(String(err)),
            }),
          );
        }
        await clearAuthToken();

        // Mini apps keep their own auth in WebView storage — SIWF / Quick Auth
        // tokens in local storage, backend sessions in cookies — none of it
        // keyed by FID. Left behind, the next account to sign in inherits those
        // sessions and can act as the previous user.
        //
        // Sequenced here rather than in a sign-out listener because the
        // listeners above can run while the mini app WebView is still mounted
        // (and able to re-persist its token). By this point clearWallet /
        // clearAuthToken have awaited long enough for setIsPending(true)'s
        // unmount to commit, so the WebView is gone before we wipe.
        //
        // confirmWebViewWipe never throws; on an incomplete/failed wipe it
        // raises wipePending so the app gates the next sign-in behind the
        // blocking screen instead of letting a new account inherit the leak.
        await confirmWebViewWipe();

        queryClient.clear();

        // We don't namespace our React Query keys with an
        // authed/unauthed qualifier (which is probably desirable,
        // because such a pattern could easily break if an
        // unauthed endpoint becomes authed). This creates an
        // issue where on sign-out, we completely nuke the React
        // Query cache, some still-mounted components relying on
        // that data may not rerender (because they're memoized),
        // and only after another state change (e.g. updating the
        // `AuthTokenContext`) triggers a re-render does it try to
        // refetch the data, resulting in the component falling
        // into suspense and us showing a loading indicator. To
        // mitigate these loading indicators, let's prefetch
        // unauthed data that we know will eventually be
        // referenced.
        prefetchUnauthedResources();
      } catch (err) {
        // It'd be an improvement to handle the UI for this error within the component.
        const error = new AppError('failed to sign out', {
          location: 'AuthTokenProvider',
          name: 'SignOutError',
          cause: err,
        });

        trackError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [
      trackEvent,
      clearWallet,
      clearAuthToken,
      confirmWebViewWipe,
      queryClient,
      prefetchUnauthedResources,
    ],
  );

  // Keep a stable ref to signOut to avoid stale closures in the API client callback
  const signOutRef = useRef(signOut);
  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  // Guard against re-entrant signout (e.g. deleteAuthToken itself returning 401)
  const isSigningOutRef = useRef(false);
  // Guard against stacked revalidation probes / racing an in-flight sign-out.
  const isRevalidatingRef = useRef(false);
  // Mirror the live auth token so an in-flight revalidation can detect a
  // concurrent sign-out / token rotation and abandon a now-stale result.
  const authTokenRef = useRef(authToken);
  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  const signOutForRevokedToken = useCallback(
    (reason: SignOutReason = 'revoked_token_confirmed') => {
      if (isSigningOutRef.current) {
        return;
      }

      isSigningOutRef.current = true;
      signOutRef
        .current({ reason })
        .finally(() => {
          isSigningOutRef.current = false;
        })
        .catch(() => {});
    },
    [],
  );

  // Re-check the token against the origin before signing out. A revoked token
  // 401s the /v2/me probe on every attempt → 'invalid'. A transient edge/proxy
  // 401 resolves on retry → 'valid'. An unreachable origin → 'inconclusive'.
  // A genuinely revoked token still fails the probe, so this never lets a
  // revoked session survive — it only removes the false-positive logouts where
  // the backend never actually revoked the token (no server "Authorization
  // failure" for the fid).
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
        await new Promise((resolve) =>
          setTimeout(resolve, AUTH_REVALIDATION_RETRY_DELAY_MS),
        );
      }
      try {
        await apiClient.getAuthenticatedUser({
          timeout: AUTH_REVALIDATION_TIMEOUT_MS,
        });
        // Any success proves the token is still valid — the 401 was transient.
        return 'valid';
      } catch (error) {
        if (isRevokedAuthTokenError(error)) {
          // Could still be a transient edge 401 — retry before concluding.
          sawUnauthorized = true;
          continue;
        }
        // Network / timeout / offline: we can't tell. Fail SAFE — do not sign
        // out. A genuinely revoked token re-triggers on the next real request.
        return 'inconclusive';
      }
    }
    return sawUnauthorized ? 'invalid' : 'inconclusive';
  }, [apiClient]);

  const maybeSignOutAfterRevalidation = useCallback(
    async (trigger: SignOutTrigger) => {
      // The probe below also flows through the global onError handler; this
      // guard makes that re-entry a no-op instead of a recursive revalidation,
      // and avoids stacking probes when several requests 401 at once.
      if (isSigningOutRef.current || isRevalidatingRef.current) {
        return;
      }

      // No token to revalidate (e.g. a user-initiated sign-out already cleared
      // it while in-flight requests were still finishing) — skip the probe
      // entirely rather than spend 3 attempts + backoff only to hit the stale
      // guard below.
      const tokenAtProbeStart = authTokenRef.current;
      if (!tokenAtProbeStart) {
        return;
      }

      isRevalidatingRef.current = true;
      try {
        const result = await revalidateAuthToken();

        // If the session was torn down (e.g. a user-initiated sign-out) or the
        // token was rotated while the probe was in flight, this result is about
        // a token we no longer hold — ignore it. Prevents a stale probe from
        // racing a manual sign-out into a duplicate, mislabeled
        // 'revoked_token_confirmed' sign-out (and stale telemetry).
        if (
          !authTokenRef.current ||
          authTokenRef.current !== tokenAtProbeStart
        ) {
          return;
        }

        const diagnostics = {
          source: trigger.source,
          endpoint: trigger.endpointName ?? 'unknown',
          responseStatus: trigger.responseStatus ?? null,
          revalidationOutcome: result,
          wasRestoredToken: hasRestoredPersistedAuthTokenRef.current,
        };

        // Map the probe outcome to its telemetry + sign-out action. 'valid' and
        // 'inconclusive' are kept DISTINCT: only 'valid' (a transient 401 the
        // probe actually cleared) is a PREVENTED phantom logout. 'inconclusive'
        // (network / timeout / offline — revocation neither confirmed nor
        // cleared) fails SAFE without signing out but must NOT emit
        // sign_out_prevented, or it would over-count that metric.
        const decision = decideRevalidationSignOut(result);

        // Emitted (PostHog + RUM) so the phantom-logout rate — prevented,
        // inconclusive, and confirmed-unexpected — is measurable. Record WHY
        // (endpoint / status / source / cold-start) so an unexpected logout is
        // diagnosable from the event or the RUM log even when there is no
        // matching backend record (edge-origin 401s).
        trackEvent(decision.analyticsEvent, diagnostics);
        DdRum.addAction(RumActionType.CUSTOM, decision.rumAction, diagnostics);

        if (decision.refreshOnboarding) {
          // A transient 401 can leave the onboarding-state query in a 401 error
          // state, which the provider renders as a blocking
          // FullScreenRetryableError (retry = signOut). The token is now
          // confirmed valid, so refetch to clear that stale error instead of
          // stranding the UI. Best-effort; on a valid token the refetch
          // succeeds and does not re-enter this path.
          void refreshOnboardingState({ retry: 1 }).catch(() => {});
        }

        if (decision.signOut) {
          signOutForRevokedToken('revoked_token_confirmed');
        }
      } finally {
        isRevalidatingRef.current = false;
      }
    },
    [
      revalidateAuthToken,
      signOutForRevokedToken,
      trackEvent,
      refreshOnboardingState,
    ],
  );

  // Wire up global 401 handler once the user is fully signed in.
  // Any authenticated request returning 401 (revoked token) triggers signOut,
  // sending the user back to the login/signup page.
  //
  // A grace period after the handler is installed prevents spurious
  // sign-outs from transient 401s — see revokedTokenGrace.ts for the
  // fresh-token vs restored-persisted-token window rationale. The handler is
  // deliberately isolated in a hook so it does NOT re-run (and restart the
  // grace timers) on every navigation-driven maybeSignOutAfterRevalidation
  // change — see useRevokedTokenSignOutHandler.ts.
  useRevokedTokenSignOutHandler({
    apiClient,
    isInitialized,
    isSignedIn,
    hasRestoredPersistedAuthTokenRef,
    maybeSignOutAfterRevalidation,
  });

  const initSafe = useCallback(async () => {
    try {
      setInitError(undefined);
      initializingRef.current = true;

      const start = Date.now();
      const result = await (async () => {
        const persistedAuthToken = await (async () => {
          try {
            return await getSecureItem<AuthToken | undefined>({
              key: authTokenKey,
              fallback: undefined,
            });
          } catch (err) {
            // Track and continue if we can't load a persisted token.
            trackError(
              new AppError(
                'getSecureItem failed when loading persisted auth token',
                {
                  cause: err,
                  name: 'RestorePersistedAuthTokenError',
                  location: 'AuthTokenProvider',
                },
              ),
            );
          }
        })();

        // First, attempt to initialize the session from a persisted auth token.
        if (persistedAuthToken) {
          await setAuthTokenSafe({
            authToken: persistedAuthToken,
            persist: false,
          });

          const existingOnboardingState = await getOnboardingState();
          const refreshedOnboardingStatePromise = (async () => {
            if (!consumedPreloadedOnboardingState) {
              try {
                const preloadedOnboardingState =
                  await preloadedOnboardingStatePromise;

                if (preloadedOnboardingState) {
                  consumedPreloadedOnboardingState = true;
                  setOnboardingState(preloadedOnboardingState);
                  repairMobileAnalyticsPersonState(preloadedOnboardingState);
                  return preloadedOnboardingState;
                }
              } catch (err) {
                trackError(
                  new AppError('failed to load preloaded onboarding state', {
                    cause: err,
                    name: 'PreloadedOnboardingStateError',
                    location: 'AuthTokenProvider',
                  }),
                );
              }
            }

            // refresh if we weren't able to get data from the preloaded state
            const refreshedOnboardingState = await refreshOnboardingState({
              // There isn't much we can do if this fails, so keep retrying.
              retry: 3,
            });
            repairMobileAnalyticsPersonState(refreshedOnboardingState);
            return refreshedOnboardingState;
          })();

          if (
            existingOnboardingState &&
            // No local custody wallet (email-only login) — skip address
            // comparison and trust the persisted token.
            (!address ||
              // Standard case: local wallet address matches the server-side address.
              (existingOnboardingState.result.state.address &&
                isAddressEqual(
                  existingOnboardingState.result.state.address as Hex,
                  address as Hex,
                )))
          ) {
            // continue but refresh the onboarding state in the background.
            refreshedOnboardingStatePromise.catch((error) => {
              if (isRevokedAuthTokenError(error)) {
                void maybeSignOutAfterRevalidation({
                  source: 'init_refresh',
                  endpointName: undefined,
                  responseStatus: 401,
                });
                return;
              }

              // assume the onboarding state couldn't be refreshed due to a
              // network error, no-op
            });

            return 'persisted_auth_session';
          }

          try {
            const fetchedOnboardingState =
              await refreshedOnboardingStatePromise;

            // No local custody wallet (email-only login) — skip address
            // comparison and trust the refreshed token.
            if (!address) {
              return 'refreshed_auth_session';
            }

            // Ensure the onboarding state matches the loaded Ethereum account
            if (
              fetchedOnboardingState.result.state.address &&
              isAddressEqual(
                fetchedOnboardingState.result.state.address as Hex,
                address as Hex,
              )
            ) {
              return 'refreshed_auth_session';
            }

            // The onboarding state doesn't match the signed in wallet, clear
            // it and continue with initialization.
            await clearAuthToken();
            purgeOnboardingState();
          } catch (err) {
            const apiError = getFirstApiErrorBody(err);

            // Track the error and then continue initialization.
            trackError(
              new AppError(
                'failed to initialize auth session from persisted auth token',
                {
                  cause: err,
                  location: 'AuthTokenProvider',
                  name: 'RestorePersistedAuthSessionError',
                },
              ),
            );

            if (apiError) {
              if (apiError.reason === 'address_potentially_obsolete') {
                // onboardingStateError will be set to this error and the user
                // will be shown the "wrong custody address screen"
                return 'no_session';
              }
            }
          }
        }

        if (address) {
          const established = await establishAuthSessionSafe();

          if (established === true) {
            return 'new_auth_session';
          } else if (established === false) {
            return 'address_no_auth_token';
          } else {
            return 'indeterminate';
          }
        }

        return 'no_address';
      })();

      DdRum.addAction(RumActionType.CUSTOM, 'initialized_auth_session', {
        via: result,
        timing: Date.now() - start,
      });

      setIsInitialized(true);
      setInitError(undefined);
    } catch (err) {
      setInitError(err as Error);

      trackError(
        new AppError('failed to initialize auth', {
          location: 'AuthTokenProvider',
          name: 'AuthInitError',
          cause: err,
        }),
      );
    } finally {
      initializingRef.current = false;
    }
  }, [
    address,
    clearAuthToken,
    establishAuthSessionSafe,
    getOnboardingState,
    purgeOnboardingState,
    repairMobileAnalyticsPersonState,
    refreshOnboardingState,
    setAuthTokenSafe,
    setOnboardingState,
    maybeSignOutAfterRevalidation,
  ]);

  const hasAuthToken = !!authToken;
  const user = onboardingState?.result.state.user;
  const fid = user?.fid;

  // Add auth information to our API client.
  useEffect(() => {
    apiClient.updateOptions({
      meta: {
        address,
        fid,
      },
    });
  }, [address, apiClient, fid]);

  useEffect(() => {
    DdRum.addViewAttributes({
      'auth.hasAuthToken': hasAuthToken,
      'auth.isInitialized': isInitialized,
      'auth.isOnboardingStateStale': isOnboardingStateStale,
      'auth.isOnboardingStateError': isOnboardingStateError,
    });
  }, [
    hasAuthToken,
    isInitialized,
    isOnboardingStateError,
    isOnboardingStateStale,
  ]);

  // Diagnostic.
  useEffect(() => {
    if (
      isInitialized &&
      !isSignedIn &&
      onboardingState?.result.state.hasCompletedRegistration
    ) {
      DdRum.addAction(
        RumActionType.CUSTOM,
        'mismatch_onboarding_state_is_signed_in',
      );
    }
  }, [
    isInitialized,
    isSignedIn,
    onboardingState?.result.state.hasCompletedRegistration,
  ]);

  // Diagnostic.
  useEffect(() => {
    if (onboardingStateError) {
      trackError(
        new AppError('Onboarding state error', {
          cause: onboardingStateError,
          location: 'AuthTokenProvider',
          name: 'OnboardingStateError',
        }),
      );
    }
  }, [onboardingStateError]);

  // Onboarding state will get loaded from persistent storage asynchronously.
  // If this happens before we've completed initialization we can optimistically
  // update isInitialized from the cached data. `safeInit` will still refresh the
  // onboarding state and react accordingly.
  useEffect(() => {
    if (
      !isInitialized &&
      authToken &&
      address &&
      onboardingState &&
      onboardingState.result.state.address &&
      isAddressEqual(
        onboardingState.result.state.address as Hex,
        address as Hex,
      )
    ) {
      setIsInitialized(true);
    }
  }, [address, authToken, isInitialized, onboardingState]);

  const initializingRef = useRef(false);

  // Initialize once on first load.
  useEffect(() => {
    if (isWalletInitialized && !isInitialized && !initializingRef.current) {
      initSafe();
    }
  }, [address, initSafe, isInitialized, isWalletInitialized]);

  const value = useMemo(
    () => ({
      authToken,
      setAuthToken: setAuthTokenSafe,
      signInWithMnemonic,
      signOut,
      addSignOutListener,
      isSignedIn,
      hasAuthToken,
      wipePending,
      retryWebViewWipe: confirmWebViewWipe,
    }),
    [
      authToken,
      setAuthTokenSafe,
      signInWithMnemonic,
      signOut,
      addSignOutListener,
      isSignedIn,
      hasAuthToken,
      wipePending,
      confirmWebViewWipe,
    ],
  );

  return (
    <AuthTokenContext.Provider value={value}>
      <BlockedDomainsProvider enabled={!!hasAuthToken}>
        {(() => {
          if (onboardingStateError) {
            const authError = getApiTokenAuthError(onboardingStateError);
            if (authError?.reason === 'address_potentially_obsolete') {
              return (
                <WrongCustodyAddressError
                  error={authError}
                  resetErrorBoundary={() => {
                    /* no-op */
                  }}
                />
              );
            }
          }

          if (initError || onboardingStateError) {
            const error = initError || onboardingStateError;
            const isRevokedToken =
              isHandledFetchError(error) && error.status === 401;

            // React Query can keep last successful onboarding `data` while refetch fails.
            // Only skip the blocking UI for API-classified transient failures (not 5xx /
            // parse bugs), and never when init failed or the token is revoked.
            // Also allow continuation when registration is incomplete (external-user
            // onboarding path): the cached state is valid even though state.user is null,
            // and the onboarding flow does not need a user to be pre-populated.
            const hasUsableCachedState =
              !!onboardingState?.result.state.user ||
              (!!onboardingState &&
                !onboardingState.result.state.hasCompletedRegistration);
            const canContinueWithCachedOnboardingState =
              !initError &&
              !isRevokedToken &&
              hasUsableCachedState &&
              isTransientFarcasterFetchError(onboardingStateError);

            if (!canContinueWithCachedOnboardingState) {
              return (
                <FullScreenRetryableError
                  resetErrorBoundary={
                    isRevokedToken
                      ? () =>
                          maybeSignOutAfterRevalidation({
                            source: 'init_refresh',
                            endpointName: 'onboardingState',
                            responseStatus: 401,
                          })
                      : initSafe
                  }
                  error={error}
                />
              );
            }
          }

          return children;
        })()}
      </BlockedDomainsProvider>
    </AuthTokenContext.Provider>
  );
});

AuthTokenProvider.displayName = 'AuthTokenProvider';

const useAuthToken = () => useContext(AuthTokenContext);

export { AuthTokenProvider, useAuthToken };
