import {
  DdRum,
  ErrorSource,
  RumActionType,
} from '@datadog/mobile-react-native';
import {
  SolanaCombinedTransaction,
  SolanaConnectRequestArguments,
  SolanaSignMessageRequestArguments,
  SolanaSignTransactionRequestArguments,
} from '@farcaster/miniapp-core';
import {
  addRpcUrlOverrideToChain,
  ConnectedEthereumWallet,
  getUserEmbeddedEthereumWallet,
  getUserEmbeddedSolanaWallet,
  PrivyConfig,
  PrivyProvider,
  useEmbeddedEthereumWallet,
  useEmbeddedSolanaWallet,
  useEmbeddedWallet as useEmbeddedPrivyWallet,
  useLoginWithFarcasterV2,
  usePrivy,
  usePrivyClient,
  useSetEmbeddedWalletRecovery,
} from '@privy-io/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  AppError,
  BaseError,
  // This will be exported from @privy-io/expo in an upcoming release. Use that one once it comes.
  WALLET_CHAINS,
} from 'farcaster-client-data';
import {
  useCachedOnboardingState,
  useFetchWalletResource,
  useOptimisticallyUpdateCurrentUserLevel,
  usePutWarpcastWalletAddress,
} from 'farcaster-client-hooks';
import {
  ActiveWalletNamespace,
  assertHex,
  ConnectionContext,
  createSolanaWalletProviderWithConn,
  EmbeddedWalletProvider,
  EvmWalletProvider,
  FARCASTER_PRO_IAP_PRODUCT_ID,
  FARCASTER_PRO_IAP_TRANSACTION_TYPE,
  GetWalletClient,
  pickRootEmbeddedWallet,
  SolanaRequestFnWithConn,
  SolanaSignAndSendTransactionRequestWithConnArguments,
  SolanaWalletProviderWithConn,
  useActiveWallet,
  useRootToast,
  useSharedTelemetry,
  useWalletBalances,
  useWalletGeoRestricted,
} from 'farcaster-expo';
import * as Provider from 'ox/Provider';
import * as Siwe from 'ox/Siwe';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  Chain,
  createWalletClient as createViemWalletClient,
  custom,
  withRetry,
} from 'viem';

import { analyticsClient } from '~/analyticsClient';
import { baseApiUrl } from '~/constants/Api';
import {
  PRIMARY_PRIVY_APP_ID,
  PRIMARY_PRIVY_CLIENT_ID,
} from '~/constants/Privy';
import { useConnectionStatus } from '~/contexts/ConnectionStatusProvider';
import { useNoSeedPhrasePrompt } from '~/contexts/NoSeedPhrasePromptProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { trackError } from '~/utils/ErrorUtils';
import { logErrorInDevOnly, logInDevOnly } from '~/utils/LogUtils';

import { useAuthToken } from './AuthTokenProvider';
import { useGlobalGate } from './GlobalGateProvider';
import { useInAppPurchases } from './InAppPurchasesProvider';
import {
  SecondaryEmbeddedWalletProvider,
  useSecondaryEmbeddedWallet,
} from './SecondaryEmbeddedWalletProvider';

/**
 * Resilient Privy storage adapter that wraps expo-secure-store with Android
 * Keystore error recovery. On some Android devices the Keystore becomes
 * temporarily unavailable (e.g. after changing the screen-lock method). When
 * Privy's startup test-write fails we:
 *   1. delete the corrupted key and retry the write, and
 *   2. if the retry also fails, fall back to AsyncStorage so the app keeps
 *      working (with a warning tracked to error monitoring).
 */
const PRIVY_SECURE_STORE_OPTIONS = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const PRIVY_ASYNC_FALLBACK_PREFIX = '__privy_ks_fallback_';

type PrivyFallbackEntry = {
  value: string;
  createdAt: number;
};

const FALLBACK_TTL_MS = 10 * 60 * 1000; // 10 minutes

const canUseAsyncFallbackForKey = (key: string) => {
  const deniedPatterns = [
    'private',
    'secret',
    'token',
    'mnemonic',
    'seed',
    'wallet',
    'auth',
    'key',
    'session',
    'email',
    'pii',
  ];

  return !deniedPatterns.some((pattern) => key.toLowerCase().includes(pattern));
};

function getMiniAppPermission(
  wallet:
    | {
        miniAppPolicy?:
          | { default: 'allowed' | 'blocked' }
          | 'allowed'
          | 'blocked';
      }
    | undefined,
) {
  const miniAppPolicy = wallet?.miniAppPolicy;
  return typeof miniAppPolicy === 'string'
    ? miniAppPolicy
    : (miniAppPolicy?.default ?? 'blocked');
}

const isAndroidKeystoreError = (error: unknown): boolean => {
  if (Platform.OS !== 'android') return false;

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const isKnown =
      msg.includes('keystore operation failed') ||
      msg.includes('could not encrypt') ||
      msg.includes('keystore encrypt failed');

    if (!isKnown && msg.includes('securestore')) {
      logInDevOnly(`[SecureStore] Unknown error encountered: ${msg}`);
    }

    return isKnown;
  }
  return false;
};

const privyStorage = {
  async get(key: string) {
    const fallbackKey = PRIVY_ASYNC_FALLBACK_PREFIX + key;

    const readFallbackValue = async () => {
      const rawFallbackValue = await AsyncStorage.getItem(fallbackKey);
      if (rawFallbackValue === null) {
        return null;
      }

      try {
        const parsed = JSON.parse(rawFallbackValue) as PrivyFallbackEntry;
        const isExpired = Date.now() - parsed.createdAt > FALLBACK_TTL_MS;

        if (isExpired) {
          await AsyncStorage.removeItem(fallbackKey);
          trackError(
            new Error('Expired Privy AsyncStorage fallback entry removed'),
          );
          return null;
        }

        try {
          await SecureStore.setItemAsync(
            key,
            parsed.value,
            PRIVY_SECURE_STORE_OPTIONS,
          );
          await AsyncStorage.removeItem(fallbackKey);
        } catch {
          // Promotion failed — leave fallback in place until a later retry.
        }

        return parsed.value;
      } catch (e) {
        await AsyncStorage.removeItem(fallbackKey);
        trackError(
          new Error('Invalid Privy AsyncStorage fallback entry removed', {
            cause: e,
          }),
        );
        return null;
      }
    };

    try {
      const fallbackValue = await readFallbackValue();
      if (fallbackValue !== null) {
        return fallbackValue;
      }

      return await SecureStore.getItemAsync(key, PRIVY_SECURE_STORE_OPTIONS);
    } catch {
      return await readFallbackValue();
    }
  },

  async put(key: string, value: unknown) {
    if (typeof value !== 'string') {
      trackError(
        new Error(`Privy storage error: Expected string, got ${typeof value}`),
      );
      throw new Error('privyStorage.put only accepts strings');
    }

    const stringValue = value;
    const fallbackKey = PRIVY_ASYNC_FALLBACK_PREFIX + key;

    try {
      await SecureStore.setItemAsync(
        key,
        stringValue,
        PRIVY_SECURE_STORE_OPTIONS,
      );

      try {
        await AsyncStorage.removeItem(fallbackKey);
      } catch (e) {
        trackError(
          new Error(
            'Failed to remove stale Privy AsyncStorage fallback entry',
            {
              cause: e,
            },
          ),
        );
      }
    } catch (firstError) {
      if (!isAndroidKeystoreError(firstError)) {
        throw firstError;
      }

      try {
        await SecureStore.deleteItemAsync(key, PRIVY_SECURE_STORE_OPTIONS);
        await SecureStore.setItemAsync(
          key,
          stringValue,
          PRIVY_SECURE_STORE_OPTIONS,
        );

        trackError(
          new Error('Android Keystore recovered after key deletion', {
            cause: firstError,
          }),
        );

        try {
          await AsyncStorage.removeItem(fallbackKey);
        } catch (e) {
          trackError(
            new Error(
              'Failed to remove stale Privy AsyncStorage fallback entry',
              {
                cause: e,
              },
            ),
          );
        }
      } catch (retryError) {
        if (!canUseAsyncFallbackForKey(key)) {
          trackError(
            new Error(
              'Android Keystore unavailable after retry and AsyncStorage fallback denied for sensitive Privy key',
              { cause: retryError },
            ),
          );
          throw retryError;
        }

        trackError(
          new Error(
            'Android Keystore unavailable after retry, falling back to AsyncStorage for Privy storage',
            { cause: retryError },
          ),
        );

        await AsyncStorage.setItem(
          fallbackKey,
          JSON.stringify({
            value: stringValue,
            createdAt: Date.now(),
          } satisfies PrivyFallbackEntry),
        );
      }
    }
  },

  async del(key: string) {
    try {
      await SecureStore.deleteItemAsync(key, PRIVY_SECURE_STORE_OPTIONS);
    } catch (e) {
      trackError(
        new Error('Failed to delete Privy SecureStore entry', {
          cause: e,
        }),
      );
    }

    try {
      await AsyncStorage.removeItem(PRIVY_ASYNC_FALLBACK_PREFIX + key);
    } catch (e) {
      trackError(
        new Error('Failed to delete Privy AsyncStorage fallback entry', {
          cause: e,
        }),
      );
    }
  },

  getKeys(): string[] {
    return [];
  },
};
// Privy does not expose this type
type ConnectedSolanaWallet = NonNullable<
  ReturnType<typeof useEmbeddedSolanaWallet>['wallets']
>[0];

const privyConfig: PrivyConfig = {
  embedded: {
    ethereum: {
      // We're going to set a recovery encryption key on the wallet so
      // we need to create the wallet manually.
      createOnLogin: 'off',
    },
    solana: {
      createOnLogin: 'off',
    },
  },
};

export const useSilentLoginWithFarcaster = () => {
  const currentUser = useCurrentUser();
  const { account: custodyAccount } = useWallet();
  const siwf2 = useLoginWithFarcasterV2();

  return useCallback(async () => {
    if (!custodyAccount) {
      throw new Error(
        'Attempted to silently login with Farcaster with no custody wallet',
      );
    }

    if (!currentUser) {
      throw new Error(
        'Attempted to silently login with Farcaster when user is not signed in',
      );
    }

    const { nonce } = await siwf2.init();
    const data = {
      version: '1',
      address: custodyAccount!.address,
      statement: 'Farcaster Auth',
      chainId: 10,
      resources: [`farcaster://fid/${currentUser.fid}`] as string[],
      domain: 'farcaster.xyz',
      // ensure valid RFC 3986 resource URI, a bit surprised this is needed
      // but URLs of origins without trailing slashes were throwing from ox
      uri: 'https://farcaster.xyz/login',
      nonce,
    } as const satisfies Siwe.Message;

    const message = Siwe.createMessage(data);
    const signature = await custodyAccount!.signMessage({ message });

    return await siwf2.login({
      message,
      signature,
      fid: currentUser.fid,
    });
  }, [currentUser, siwf2, custodyAccount]);
};

const disconnectedEmitter = Provider.createEmitter();

let didUpgradeRecoveryMethod = false;
let didAutoInit = false;

const PRIMARY_RECOVERY_TIMEOUT_MS = 45_000;
const PRIMARY_RECOVERY_KEY_TTL_MS = 5 * 60 * 1000;
// Settle delay before logging a signed-in user's missing mini-app EVM address
// (skips the normal cold-boot/connect window).
const MINI_APP_EVM_UNAVAILABLE_LOG_DELAY_MS = 8_000;

// RUM telemetry for embedded-wallet recovery — diagnoses the "User-owned
// recovery timed out" cohort. Context uses enums, booleans, counts, durations,
// HD indices, and the raw error message (which can embed the wallet address —
// acceptable). Never the recovery KEY value or a mnemonic.
const recoveryErrorKind = (e: unknown): string => {
  const msg = e instanceof Error ? e.message.toLowerCase() : '';
  if (msg.includes('not loaded on this device')) return 'not_loaded';
  if (msg.includes('timed out')) return 'timeout';
  if (msg.includes('proxy not initialized')) return 'proxy_uninitialized';
  if (msg.includes('must be logged in')) return 'not_logged_in';
  return 'other';
};
const recoveryErrorMessage = (e: unknown): string =>
  (e instanceof Error ? e.message : String(e)).slice(0, 256);
const accountHasRecoveryMethod = (wallet: unknown): boolean =>
  !!wallet &&
  typeof (wallet as { recovery_method?: unknown }).recovery_method !==
    'undefined';
const rumRecovery = (
  name: string,
  context: Record<string, string | number | boolean>,
): void => {
  try {
    DdRum.addAction(RumActionType.CUSTOM, name, context);
  } catch {
    // telemetry must never throw into the wallet flow
  }
};

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([p, timeout]).finally(() =>
    clearTimeout(timer),
  ) as Promise<T>;
}

const supportedChainsWithPersonalProvider = WALLET_CHAINS.map((chain) => {
  const rpcUrl = `${baseApiUrl}/${chain.id}/eth-rpc`;
  return addRpcUrlOverrideToChain(chain, rpcUrl);
});

export function MobileEmbeddedWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecondaryEmbeddedWalletProvider>
      <InnerMobileEmbeddedWalletProvider>
        {children}
      </InnerMobileEmbeddedWalletProvider>
    </SecondaryEmbeddedWalletProvider>
  );
}

// Mounted above <Suspense> (App.tsx) so the primary Privy WebView survives
// re-suspends/error-boundary retries instead of remounting and re-running a
// full user-owned recovery. InnerMobileEmbeddedWalletProvider stays deep and
// resolves usePrivy() from this root.
export function PrimaryPrivyProviderRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={PRIMARY_PRIVY_APP_ID}
      clientId={PRIMARY_PRIVY_CLIENT_ID}
      // @ts-expect-error - Privy is looking into it
      supportedChains={supportedChainsWithPersonalProvider}
      config={privyConfig}
      storage={privyStorage}
    >
      {children}
    </PrivyProvider>
  );
}

function InnerMobileEmbeddedWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSignedIn = useIsSignedIn();
  const currentUser = useCurrentUser();
  const putWarpcastWalletAddress = usePutWarpcastWalletAddress();
  const fetchWalletResource = useFetchWalletResource();
  const { setRecovery } = useSetEmbeddedWalletRecovery();
  const privyClient = usePrivyClient();
  const loginToPrivyWithFarcaster = useSilentLoginWithFarcaster();
  const { addSignOutListener } = useAuthToken();
  const { result: onboardingState } = useCachedOnboardingState();
  const secondaryEmbeddedWallet = useSecondaryEmbeddedWallet();
  const { account: custodyAccount } = useWallet();
  const hasCustodyWallet = !!custodyAccount;
  // INCIDENT-RELATED TEMPORARY CODE (no-custody-wallet restore prompt) — remove ~6-8mo out.
  const { promptRestoreWallet } = useNoSeedPhrasePrompt();

  const geoRestricted = useWalletGeoRestricted();
  const connectionContextRef = useRef<ConnectionContext | undefined>(undefined);

  // Trigger an initial fetch of balances so at least
  // some stale data is present.
  useWalletBalances();

  const primaryRecoveryKeyRef = useRef<{
    value: string;
    expiresAt: number;
    fid: number;
  } | null>(null);

  const getPrimaryRecoveryKey = useCallback(async () => {
    const fid = currentUser?.fid;
    const cached = primaryRecoveryKeyRef.current;
    if (cached && cached.fid === fid && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    const walletResource = await fetchWalletResource(
      'warpcast_wallet_recovery_encryption_key',
    );
    const value = walletResource.resource.value;
    if (typeof value === 'undefined') {
      throw new Error('No recovery key found');
    }
    if (typeof fid !== 'undefined') {
      primaryRecoveryKeyRef.current = {
        value,
        expiresAt: Date.now() + PRIMARY_RECOVERY_KEY_TTL_MS,
        fid,
      };
    }
    return value;
  }, [fetchWalletResource, currentUser?.fid]);

  useEffect(() => {
    primaryRecoveryKeyRef.current = null;
  }, [currentUser?.fid]);

  const disconnect = useCallback(
    async (force = false) => {
      // Our embedded wallet doesn't fit into our Wallet abstraction well as we
      // never actually want to disconnect from the wallet even if it's no
      // longer the users preferred frame wallet so by default this function
      // should no-op. Force is only used in debugging contexts.
      if (force) {
        const privyUser = await privyClient.user.get().catch(() => null);
        if (privyUser) {
          try {
            logInDevOnly('[EmbeddedWallet] logging user out of Privy');
            await privyClient.auth.logout();
          } catch (e) {
            trackError(new Error('Failed to logout Privy user', { cause: e }));
          }
        }
      }
    },
    [privyClient],
  );

  const login = useCallback(async () => {
    try {
      logInDevOnly('[EmbeddedWallet] logging user into Privy');
      const { user } = await loginToPrivyWithFarcaster();
      return user;
    } catch (e) {
      logInDevOnly(`[EmbeddedWallet] Error logging in user ${e}`);

      // In the rare case the user logged out from one Farcaster account and logged
      // in with another yet Privy failed to logout the previous account we will
      // try to logout the user again.
      if (
        e instanceof Error &&
        e.message.includes('User already has one Farcaster account linked')
      ) {
        await privyClient.auth.logout();
        throw e;
      }

      trackError(
        new Error('[EmbeddedWallet] Failed to log user into Privy', {
          cause: e,
        }),
      );

      throw e;
    }
  }, [loginToPrivyWithFarcaster, privyClient]);

  const { isOnline } = useConnectionStatus();

  const [evmWalletProvider, setEvmWalletProvider] =
    useState<EvmWalletProvider>();
  const [evmWalletProviderAddress, setEvmWalletProviderAddress] =
    useState<string>();
  const [solanaWalletProvider, setSolanaWalletProvider] =
    useState<SolanaWalletProviderWithConn>();
  const connectingPromise = useRef<
    Promise<{
      evmAddress: string;
      evmProvider: EvmWalletProvider;
      solanaAddress?: string;
      solanaProvider?: SolanaWalletProviderWithConn;
    }>
  >(undefined);
  // Namespace the in-flight connect() promise belongs to, so a primary connect
  // that's still resolving is never handed back after the user switched to the
  // secondary wallet (and vice versa).
  const connectNamespaceRef = useRef<ActiveWalletNamespace | null>(null);

  const { wallets: evmWallets } = useEmbeddedEthereumWallet();
  const { wallets: solanaWallets } = useEmbeddedSolanaWallet();
  const {
    activeNamespace,
    activeEvmWallet,
    activeSolanaWallet,
    activeWalletId,
  } = useActiveWallet();
  const isSecondaryNamespace = activeNamespace === 'secondary';

  // The Privy embedded wallet is only valid when Privy is authenticated as the
  // currently logged-in Farcaster account. On an account switch Privy re-auths
  // asynchronously; until its linked Farcaster FID matches the active session,
  // every wallet read/registration must treat the wallet as not-this-user's,
  // rather than fall back to the previous account's wallet (which is what PUTs a
  // stale warplet under the wrong FID — the VerificationsService cross-claim).
  const { user: privyUser, isReady } = usePrivy();
  const privyFarcasterFid = useMemo(() => {
    const fcAccount = privyUser?.linked_accounts.find(
      (a) => a.type === 'farcaster',
    );
    return fcAccount?.type === 'farcaster' ? fcAccount.fid : undefined;
  }, [privyUser]);
  // Definite mismatch only: both FIDs known and unequal. A still-loading Privy
  // session (privyFarcasterFid undefined) is the normal pre-connect state, not
  // a mismatch — do not hard-gate on it.
  const walletIdentityMismatch =
    privyFarcasterFid !== undefined &&
    currentUser?.fid !== undefined &&
    privyFarcasterFid !== currentUser.fid;

  const activeEvmAllowedInMiniApps =
    !activeEvmWallet ||
    activeEvmWallet.isPrimary ||
    getMiniAppPermission(activeEvmWallet) === 'allowed';
  const activeSolanaAllowedInMiniApps =
    !activeSolanaWallet ||
    activeSolanaWallet.isPrimary ||
    getMiniAppPermission(activeSolanaWallet) === 'allowed';

  const evmWallet = useMemo<ConnectedEthereumWallet | undefined>(() => {
    // Privy authed as a different Farcaster account (mid account-switch): the
    // embedded wallet list still belongs to the previous account. Expose
    // nothing rather than fall back to its root wallet.
    if (walletIdentityMismatch) {
      return undefined;
    }
    // When the active EVM wallet lives in the secondary Privy app, the
    // primary's useEmbeddedEthereumWallet list won't contain it. Return
    // undefined here; signing is routed through evmWalletProvider (populated
    // by the effect below) via connect()'s secondary short-circuit.
    if (activeEvmWallet?.privyAppNamespace === 'secondary') {
      return undefined;
    }
    if (activeEvmWallet) {
      return (
        evmWallets.find(
          (wallet) =>
            wallet.address.toLowerCase() ===
            activeEvmWallet.address.toLowerCase(),
        ) ?? pickRootEmbeddedWallet(evmWallets)
      );
    }
    return pickRootEmbeddedWallet(evmWallets);
  }, [walletIdentityMismatch, activeEvmWallet, evmWallets]);

  // When the active wallet flips to a secondary-app wallet, override
  // `evmWalletProvider` with one from the secondary Privy context.
  //
  // Depend on the stable `getSecondaryEvmProvider` callback (memoized with
  // `useCallback([])` inside SecondaryEmbeddedWalletProvider) rather than the
  // whole `secondaryEmbeddedWallet` object. The object identity changes
  // whenever the secondary context's state updates (e.g. the provider we
  // fetch here sets state inside the worker), so depending on the object
  // would re-trigger this effect on every fetch and loop forever.
  //
  // Ref-guard against the same active wallet address to make the effect a
  // no-op if we've already populated state for it.
  const { getSecondaryEvmProvider, getSecondarySolanaProvider } =
    secondaryEmbeddedWallet;
  const lastFetchedSecondaryAddressRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeEvmWallet || activeEvmWallet.privyAppNamespace !== 'secondary') {
      lastFetchedSecondaryAddressRef.current = null;
      return;
    }
    if (lastFetchedSecondaryAddressRef.current === activeEvmWallet.address) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const wr = await fetchWalletResource(
          'secondary_warpcast_wallet_recovery_encryption_key',
        );
        if (cancelled || !wr.resource.value) return;
        const provider = await getSecondaryEvmProvider(wr.resource.value);
        if (cancelled || !provider) return;
        setEvmWalletProvider(provider);
        setEvmWalletProviderAddress(activeEvmWallet.address);
        lastFetchedSecondaryAddressRef.current = activeEvmWallet.address;
      } catch (e) {
        trackError(
          new Error('failed to load secondary EVM provider', {
            cause: e as Error,
          }),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeEvmWallet, getSecondaryEvmProvider, fetchWalletResource]);

  // Analogous secondary-SOL provider routing.
  const lastFetchedSecondarySolanaAddressRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      !activeSolanaWallet ||
      activeSolanaWallet.privyAppNamespace !== 'secondary'
    ) {
      lastFetchedSecondarySolanaAddressRef.current = null;
      return;
    }
    if (
      lastFetchedSecondarySolanaAddressRef.current ===
      activeSolanaWallet.address
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const wr = await fetchWalletResource(
          'secondary_warpcast_wallet_recovery_encryption_key',
        );
        if (cancelled || !wr.resource.value) return;
        const provider = await getSecondarySolanaProvider(wr.resource.value);
        if (cancelled || !provider) return;
        setSolanaWalletProvider(provider);
        lastFetchedSecondarySolanaAddressRef.current =
          activeSolanaWallet.address;
      } catch (e) {
        trackError(
          new Error('failed to load secondary Solana provider', {
            cause: e as Error,
          }),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSolanaWallet, getSecondarySolanaProvider, fetchWalletResource]);

  const solanaWallet = useMemo(() => {
    if (walletIdentityMismatch) {
      return undefined;
    }
    // Mirror the EVM path: when the active SOL wallet lives in the secondary
    // Privy app, the primary's useEmbeddedSolanaWallet list won't contain it.
    // Signing routes through solanaWalletProvider (populated by the effect
    // above) via connect()'s secondary short-circuit below.
    if (activeSolanaWallet?.privyAppNamespace === 'secondary') {
      return undefined;
    }
    if (activeSolanaWallet) {
      return (
        solanaWallets?.find(
          (wallet) =>
            wallet.address.toLowerCase() ===
            activeSolanaWallet.address.toLowerCase(),
        ) ?? pickRootEmbeddedWallet(solanaWallets)
      );
    }
    return pickRootEmbeddedWallet(solanaWallets);
  }, [walletIdentityMismatch, activeSolanaWallet, solanaWallets]);

  const connect = useCallback(() => {
    if (geoRestricted) {
      throw new Error(
        '[EmbeddedWallet] attempted to connect when geo restricted',
      );
    }

    if (!hasCustodyWallet) {
      // INCIDENT-RELATED TEMPORARY CODE (no-custody-wallet restore prompt) — remove ~6-8mo out.
      // Reactive restore prompt — seed missing for a custody-signing action.
      promptRestoreWallet();
      return Promise.reject(
        new Error('[EmbeddedWallet] no custody wallet — email-only user'),
      );
    }

    // Reuse an in-flight connect only when it targets the current namespace.
    if (
      connectingPromise.current &&
      connectNamespaceRef.current === activeNamespace
    ) {
      logInDevOnly('[EmbeddedWallet] found connecting promise, deduping');
      return connectingPromise.current;
    }

    async function performConnect() {
      try {
        logInDevOnly('[EmbeddedWallet] connecting');

        // Secondary (private) wallets live in a SEPARATE Privy app, so the
        // primary client below cannot resolve their signer. Resolve the
        // secondary provider deterministically and return — never fall through
        // to the primary path, otherwise a secondary swap would sign with the
        // primary wallet. getSecondary*Provider is idempotent and internally
        // bounded by timeouts, so this is safe under withRetry. We deliberately
        // do NOT write evmWalletProvider state here; the prewarm effects own
        // that cache (writing it from connect churns provider identity).
        if (activeEvmWallet?.privyAppNamespace === 'secondary') {
          const solanaIsSecondary =
            activeSolanaWallet?.privyAppNamespace === 'secondary';

          // Warm fast-path: the prewarm effect (or a prior connect) already
          // resolved this secondary wallet's provider into local state. Return
          // it synchronously WITHOUT re-resolving — re-resolving mints a new
          // provider wrapper + setState on every call, which feeds back into a
          // prepare/abandon churn loop that prevents the swap from executing.
          if (
            evmWalletProvider &&
            evmWalletProviderAddress?.toLowerCase() ===
              activeEvmWallet.address.toLowerCase()
          ) {
            const isSecondarySolanaReady =
              solanaIsSecondary &&
              lastFetchedSecondarySolanaAddressRef.current ===
                activeSolanaWallet?.address;
            return {
              evmAddress: activeEvmWallet.address,
              evmProvider: evmWalletProvider,
              solanaAddress: isSecondarySolanaReady
                ? activeSolanaWallet?.address
                : undefined,
              solanaProvider: solanaWalletProvider,
            };
          }

          // Cold path: resolve the secondary provider once and cache it into
          // local state so subsequent connects take the fast-path above and the
          // graph converges (mirrors the primary path's setEvm* calls). Never
          // fall through to the primary client for a secondary active wallet.
          const walletResource = await fetchWalletResource(
            'secondary_warpcast_wallet_recovery_encryption_key',
          );
          const recoveryKey = walletResource.resource.value;
          if (typeof recoveryKey === 'undefined') {
            throw new BaseError('No secondary recovery key found');
          }

          const secondaryEvmProvider =
            await getSecondaryEvmProvider(recoveryKey);
          if (!secondaryEvmProvider) {
            throw new BaseError('Secondary EVM provider unavailable');
          }

          const secondarySolanaProvider = solanaIsSecondary
            ? await getSecondarySolanaProvider(recoveryKey)
            : undefined;

          setEvmWalletProvider(secondaryEvmProvider);
          setEvmWalletProviderAddress(activeEvmWallet.address);
          if (secondarySolanaProvider) {
            setSolanaWalletProvider(secondarySolanaProvider);
          }

          return {
            evmAddress: activeEvmWallet.address,
            evmProvider: secondaryEvmProvider,
            solanaAddress: solanaIsSecondary
              ? activeSolanaWallet?.address
              : undefined,
            solanaProvider: secondarySolanaProvider,
          };
        }

        let user = await (async () => {
          try {
            const current = await privyClient.user.get().catch(() => null);
            if (current !== null) {
              const fcAccount = current.user?.linked_accounts.find(
                (a) => a.type === 'farcaster',
              );
              if (
                fcAccount?.type === 'farcaster' &&
                fcAccount?.fid === currentUser?.fid
              ) {
                logInDevOnly('[EmbeddedWallet] found matching user session');
                return current.user;
              }
              logInDevOnly('[EmbeddedWallet] mismatched user session');
            }

            logInDevOnly('[EmbeddedWallet] logging in');
            return await login();
          } catch (e) {
            trackError(
              new BaseError('[EmbeddedWallet] failed privyClient.user.get()', {
                cause: e as Error,
              }),
            );
            throw e;
          }
        })();

        // Mid account-switch (Privy authed as a different FID): resolving
        // evmAccount here would fall through to getUserEmbeddedEthereumWallet(
        // user) — the previous account's wallet. Block connect entirely so the
        // wrong account's wallet is never used to sign.
        if (walletIdentityMismatch) {
          throw new BaseError(
            '[EmbeddedWallet] connect blocked: Privy authed as a different FID than the active Farcaster session',
          );
        }

        const evmAccount = await (async () => {
          try {
            if (activeEvmWallet && evmWallet) {
              // Connected-wallet object lacks recovery_method; use full account.
              const fullActiveAccount = getUserEmbeddedEthereumWallet(user);
              if (
                fullActiveAccount &&
                fullActiveAccount.address.toLowerCase() ===
                  evmWallet.address.toLowerCase()
              ) {
                return fullActiveAccount;
              }
              return evmWallet as unknown as NonNullable<
                ReturnType<typeof getUserEmbeddedEthereumWallet>
              >;
            }

            const existingAccount = getUserEmbeddedEthereumWallet(user);
            if (existingAccount) {
              return existingAccount;
            }

            logInDevOnly('[EmbeddedWallet] creating evm embedded wallet');
            const recoveryKey = await getPrimaryRecoveryKey();

            const { user: newUser } = await privyClient.embeddedWallet.create({
              recoveryMethod: 'recovery-encryption-key',
              recoveryKey,
            });
            user = newUser;

            const newAccount = getUserEmbeddedEthereumWallet(user);

            // We should always have a new account, make a runtime assertion.
            if (!newAccount) {
              throw new BaseError('No evm account found after creating wallet');
            }

            return newAccount;
          } catch (e) {
            trackError(
              new BaseError(
                '[EmbeddedWallet] failed getUserEmbeddedEthereumWallet',
                {
                  cause: e as Error,
                },
              ),
            );
            throw e;
          }
        })();

        rumRecovery('wallet_recovery_account_resolved', {
          activeBranch: !!(activeEvmWallet && evmWallet),
          resolvedHasRecoveryMethod: accountHasRecoveryMethod(evmAccount),
          resolvedWalletIndex:
            (evmAccount as { walletIndex?: number }).walletIndex ??
            (evmAccount as { wallet_index?: number }).wallet_index ??
            -1,
        });

        const { solanaAccount, evmProvider, solanaProvider } =
          await (async () => {
            if (
              evmWalletProvider &&
              evmWalletProviderAddress?.toLowerCase() ===
                evmAccount.address.toLowerCase() &&
              solanaWalletProvider
            ) {
              logInDevOnly('[EmbeddedWallet] found existing providers');
              return {
                evmProvider: evmWalletProvider,
                solanaProvider: solanaWalletProvider,
              };
            }

            // After registering onNeedsRecovery below, we need to call
            // something on the Ethereum provider in order for the recovery to
            // be triggered. Any call should work, this is just the cheapest
            // `recoveryChain` only labels the RUM result — the underlying call
            // is always the EVM provider (Solana reuses it for the shared
            // entropy), so a Solana-triggered recovery is attributed to solana.
            const triggerRecovery = async (
              recoveryChain: 'ethereum' | 'solana' = 'ethereum',
            ) => {
              const startedAt = Date.now();
              const recoveryKey = await getPrimaryRecoveryKey();
              try {
                await withTimeout(
                  privyClient.embeddedWallet.getEthereumProvider({
                    wallet: evmAccount,
                    entropyId: evmAccount.address,
                    entropyIdVerifier: 'ethereum-address-verifier',
                    recoveryKey,
                  }),
                  PRIMARY_RECOVERY_TIMEOUT_MS,
                  'primary triggerRecovery',
                );
                rumRecovery('wallet_recovery_result', {
                  chain: recoveryChain,
                  outcome: 'ok',
                  durationMs: Date.now() - startedAt,
                  hasRecoveryKey: !!recoveryKey,
                });
              } catch (e) {
                rumRecovery('wallet_recovery_result', {
                  chain: recoveryChain,
                  outcome: 'error',
                  durationMs: Date.now() - startedAt,
                  errorKind: recoveryErrorKind(e),
                  errorMessage: recoveryErrorMessage(e),
                  hasRecoveryKey: !!recoveryKey,
                });
                throw e;
              }
            };

            logInDevOnly(
              '[EmbeddedWallet] found embedded evm wallet, connecting to provider',
            );
            let privyProvider;
            try {
              privyProvider =
                await privyClient.embeddedWallet.getEthereumProvider({
                  wallet: evmAccount,
                  entropyId: evmAccount.address,
                  entropyIdVerifier: 'ethereum-address-verifier',
                  onNeedsRecovery: async (recoveryArgs) => {
                    rumRecovery('wallet_recovery_needed', {
                      chain: 'ethereum',
                      recoveryMethod: String(
                        (recoveryArgs as { recoveryMethod?: unknown })
                          .recoveryMethod ?? 'undefined',
                      ),
                    });
                    await triggerRecovery();
                    recoveryArgs.onRecovered();
                  },
                });
            } catch (e) {
              trackError(
                new BaseError(
                  '[EmbeddedWallet] failed privyClient.embeddedWallet.getEthereumProvider',
                  {
                    cause: e as Error,
                  },
                ),
              );
              throw e;
            }

            const wrappedProvider = Provider.from({
              on: privyProvider.on.bind(privyProvider),
              removeListener: privyProvider.removeListener.bind(privyProvider),
              async request(request) {
                const startedAt = Date.now();
                try {
                  logInDevOnly('[EmbeddedWalletRequest] evm request', request);

                  // @ts-expect-error - failed to get this typechecking
                  const result = await privyProvider.request(request);

                  logInDevOnly(
                    '[EmbeddedWalletRequest] evm request result',
                    result,
                  );

                  if (request.method === 'eth_sendTransaction') {
                    analyticsClient.capture('wallet_eth_transaction');
                  }

                  return result;
                } catch (e) {
                  rumRecovery('wallet_request_failed', {
                    chain: 'ethereum',
                    method: request.method,
                    durationMs: Date.now() - startedAt,
                    errorKind: recoveryErrorKind(e),
                    errorMessage: recoveryErrorMessage(e),
                  });
                  DdRum.addError(
                    `[EmbeddedWallet] evm request error: ${e}`,
                    ErrorSource.SOURCE,
                    (e instanceof Error && e.stack) || '',
                  );

                  throw e;
                }
              },
            }) as EvmWalletProvider;

            const solanaAccount = await (async () => {
              try {
                try {
                  const existingAccount = getUserEmbeddedSolanaWallet(user);
                  if (existingAccount) {
                    return existingAccount;
                  }
                } catch (e) {
                  trackError(
                    new BaseError(
                      '[EmbeddedWallet] failed existing Solana account fetch',
                      {
                        cause: e as Error,
                      },
                    ),
                  );
                  throw e;
                }

                // The createSolana call below doesn't trigger recovery
                // correctly, so we need to do another call here to make sure
                // the user's wallet is recovered
                await triggerRecovery();

                const { user: newUser } =
                  await privyClient.embeddedWallet.createSolana({
                    ethereumAccount: evmAccount,
                  });
                user = newUser;

                try {
                  const newAccount = getUserEmbeddedSolanaWallet(user);

                  // We should always have a new account, make a runtime assertion.
                  if (!newAccount) {
                    throw new BaseError(
                      'No solana account found after creating wallet',
                    );
                  }

                  return newAccount;
                } catch (e) {
                  trackError(
                    new BaseError(
                      '[EmbeddedWallet] failed new Solana account fetch',
                      {
                        cause: e as Error,
                      },
                    ),
                  );
                  throw e;
                }
              } catch (e) {
                trackError(
                  new BaseError(
                    '[EmbeddedWallet] failed innerSolanaAccount fetch',
                    {
                      cause: e as Error,
                    },
                  ),
                );
                throw e;
              }
            })();

            const solanaProvider = await (async () => {
              try {
                if (solanaWalletProvider) {
                  logInDevOnly(
                    '[EmbeddedWallet] found existing solana provider',
                  );
                  return solanaWalletProvider;
                }

                logInDevOnly(
                  '[EmbeddedWallet] found embedded solana wallet, connecting to provider',
                );
                const privyProvider =
                  await privyClient.embeddedWallet.getSolanaProvider(
                    solanaAccount,
                    evmAccount.address,
                    'ethereum-address-verifier',
                    undefined,
                    undefined,
                    undefined,
                    async (recoveryArgs) => {
                      rumRecovery('wallet_recovery_needed', {
                        chain: 'solana',
                        recoveryMethod: String(
                          (recoveryArgs as { recoveryMethod?: unknown })
                            .recoveryMethod ?? 'undefined',
                        ),
                      });
                      try {
                        await triggerRecovery('solana');
                        recoveryArgs.onRecovered();
                      } catch (e) {
                        trackError(
                          new BaseError(
                            '[EmbeddedWallet] failed Privy recovery callback',
                            {
                              cause: e as Error,
                            },
                          ),
                        );
                        throw e;
                      }
                    },
                  );

                const requestFn = async <T extends SolanaCombinedTransaction>(
                  request:
                    | SolanaConnectRequestArguments
                    | SolanaSignMessageRequestArguments
                    | SolanaSignAndSendTransactionRequestWithConnArguments
                    | SolanaSignTransactionRequestArguments<T>,
                ) => {
                  const startedAt = Date.now();
                  try {
                    logInDevOnly(
                      '[EmbeddedWalletRequest] solana request',
                      request,
                    );

                    let result;
                    if (request.method === 'connect') {
                      result = { publicKey: solanaAccount.address };
                    } else if (request.method === 'signMessage') {
                      result = await privyProvider.request(request);
                    } else if (request.method === 'signAndSendTransaction') {
                      result = await privyProvider.request(request);
                    } else if (request.method === 'signTransaction') {
                      result = await privyProvider.request(request);
                    }

                    logInDevOnly(
                      '[EmbeddedWalletRequest] solana request result',
                      result,
                    );

                    return result;
                  } catch (e) {
                    rumRecovery('wallet_request_failed', {
                      chain: 'solana',
                      method: request.method,
                      durationMs: Date.now() - startedAt,
                      errorKind: recoveryErrorKind(e),
                      errorMessage: recoveryErrorMessage(e),
                    });
                    DdRum.addError(
                      `[EmbeddedWallet] solana request error: ${e}`,
                      ErrorSource.SOURCE,
                      (e instanceof Error && e.stack) || '',
                    );

                    throw e;
                  }
                };

                return createSolanaWalletProviderWithConn(
                  requestFn as SolanaRequestFnWithConn,
                );
              } catch (e) {
                trackError(
                  new BaseError(
                    '[EmbeddedWallet] failed privyClient.embeddedWallet.getSolanaProvider call',
                    {
                      cause: e as Error,
                    },
                  ),
                );
                throw e;
              }
            })();

            setSolanaWalletProvider(solanaProvider);
            setEvmWalletProvider(wrappedProvider);
            setEvmWalletProviderAddress(evmAccount.address);

            return {
              evmProvider: wrappedProvider,
              solanaAccount,
              solanaProvider,
            };
          })();

        return {
          evmAddress: evmAccount.address,
          evmProvider,
          solanaAddress: solanaAccount?.address,
          solanaProvider,
        };
      } catch (e) {
        trackError(
          new BaseError('[EmbeddedWallet] failed to connect', {
            cause: e as Error,
          }),
        );
        throw e;
      } finally {
        connectingPromise.current = undefined;
      }
    }

    const connectPromise = withRetry(performConnect, {
      delay: 0,
      retryCount: 3,
      shouldRetry: () => {
        return isOnline;
      },
    });

    connectingPromise.current = connectPromise;
    connectNamespaceRef.current = activeNamespace;
    return connectPromise;
  }, [
    walletIdentityMismatch,
    geoRestricted,
    hasCustodyWallet,
    promptRestoreWallet,
    privyClient.user,
    privyClient.embeddedWallet,
    login,
    currentUser?.fid,
    fetchWalletResource,
    getPrimaryRecoveryKey,
    evmWalletProvider,
    evmWalletProviderAddress,
    evmWallet,
    isOnline,
    solanaWalletProvider,
    activeNamespace,
    activeEvmWallet,
    activeSolanaWallet,
    getSecondaryEvmProvider,
    getSecondarySolanaProvider,
  ]);

  const getWalletClientUnsafe = useCallback(
    async function <chain extends Chain>(chain: chain, forceReconnent = false) {
      const { evmAddress: localEvmAddress, evmProvider: localEvmProvider } =
        await (async () => {
          if (
            evmWalletProvider &&
            evmWalletProviderAddress?.toLowerCase() ===
              evmWallet?.address.toLowerCase() &&
            evmWallet &&
            !forceReconnent
          ) {
            return {
              evmProvider: evmWalletProvider,
              evmAddress: evmWallet.address,
            };
          }

          return connect();
        })();

      const c = createViemWalletClient({
        chain,
        account: assertHex(localEvmAddress),
        transport: custom(localEvmProvider),
      });

      c.switchChain({ id: chain.id });

      return c;
    },
    [connect, evmWallet, evmWalletProvider, evmWalletProviderAddress],
  );

  const getWalletClient = useCallback<GetWalletClient>(
    async (chain, forceReconnent = false) => {
      try {
        return await getWalletClientUnsafe(chain, forceReconnent);
      } catch (e) {
        // We see errors like "Failed to initialize... not loaded on this device"
        // See if they are from here and try to repair.
        trackError(e, {
          handled: true,
          fn: 'EmbeddedWallerProvider.getWalletClient()',
          forceReconnent,
        });

        if (!forceReconnent) {
          return getWalletClientUnsafe(chain, true);
        }

        throw e;
      }
    },
    [getWalletClientUnsafe],
  );

  const createPrivateWallet = useCallback(
    async (options?: { protocols?: ('ethereum' | 'solana')[] }) => {
      const protocols = options?.protocols ?? ['ethereum', 'solana'];
      // eslint-disable-next-line no-console
      console.log('[secondary-wallet] createPrivateWallet.start', {
        protocols,
      });
      try {
        await secondaryEmbeddedWallet.authenticateSecondary();
        // eslint-disable-next-line no-console
        console.log(
          '[secondary-wallet] createPrivateWallet.authenticateSecondary OK',
        );
        const wr = await fetchWalletResource(
          'secondary_warpcast_wallet_recovery_encryption_key',
        );
        // eslint-disable-next-line no-console
        console.log(
          '[secondary-wallet] createPrivateWallet.fetchWalletResource',
          {
            hasValue: !!wr.resource.value,
            valueLen: wr.resource.value?.length,
          },
        );
        if (typeof wr.resource.value === 'undefined') {
          throw new Error('No secondary recovery key');
        }
        const result = await secondaryEmbeddedWallet.createSecondaryWallet(
          wr.resource.value,
          { protocols },
        );
        // eslint-disable-next-line no-console
        console.log('[secondary-wallet] createPrivateWallet.OK', result);
        return result;
      } catch (e) {
        const err = e as Error;
        // eslint-disable-next-line no-console
        console.log('[secondary-wallet] createPrivateWallet.ERROR', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack?.split('\n').slice(0, 5).join(' | '),
        });
        throw e;
      }
    },
    [fetchWalletResource, secondaryEmbeddedWallet],
  );

  useEffect(() => {
    let outerTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    if (!geoRestricted && isSignedIn && hasCustodyWallet && !didAutoInit) {
      didAutoInit = true;

      outerTimer = setTimeout(async () => {
        try {
          logInDevOnly('[EmbeddedWallet] auto initializing');
          void getPrimaryRecoveryKey().catch(() => undefined);
          await connect();
        } catch (e) {
          retryTimer = setTimeout(() => {
            didAutoInit = false;
          }, 30_000);
          logErrorInDevOnly(e);
          trackError(
            new Error('[EmbeddedWallet] failed to auto initialize', {
              cause: e,
            }),
          );
        }
      }, 500);
    }

    return () => {
      if (outerTimer) clearTimeout(outerTimer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    connect,
    geoRestricted,
    isSignedIn,
    hasCustodyWallet,
    getPrimaryRecoveryKey,
  ]);

  // Reset autoInit if the user signs out
  useEffect(() => {
    if (isSignedIn) {
      return () => {
        didAutoInit = false;
        primaryRecoveryKeyRef.current = null;
      };
    }
  }, [isSignedIn]);

  // Generally prefer to interact with the lower-level PrivyClient instead of
  // the React-specific hooks that tie state to render cycles since these are
  // harder to work with given our callback rather than UI driven integration.
  // `usePrivy()` (privyUser/isReady) is hoisted above for the wallet-identity gate.

  // The status property on the returned object is stale since we use the lower
  // level client to initialize the wallet. Don't use it.
  const privyWallet = useEmbeddedPrivyWallet();
  const isConnected = !!privyWallet.account?.address;

  // Clear the provider instance if the user session ends
  useEffect(() => {
    if (privyUser) {
      return () => {
        setEvmWalletProvider(undefined);
        setEvmWalletProviderAddress(undefined);
      };
    }
  }, [privyUser]);

  // Sign the user out of Privy if they log out of Farcaster
  useEffect(() => {
    if (privyUser) {
      return addSignOutListener(async () => {
        try {
          await privyClient.auth.logout();
        } catch (err) {
          trackError(
            new AppError('Failed to logout Privy user', {
              cause: err as Error,
              location: 'MobileEmbeddedWalletProvider',
              name: 'PrivyLogoutError',
            }),
          );
        }
      });
    }
  }, [addSignOutListener, privyUser, privyClient.auth]);

  // Sign the user out of Privy if we detect FID mismatch with Farcaster session.
  // Only check when currentUser is defined — if the user is simply signed out of
  // Farcaster (currentUser === undefined), this is not a mismatch; the sign-out
  // listener above already handles logging Privy out in that case.
  useEffect(() => {
    if (privyUser !== null && currentUser !== undefined) {
      const fcAccount = privyUser.linked_accounts.find(
        (a) => a.type === 'farcaster',
      );
      if (
        fcAccount?.type === 'farcaster' &&
        fcAccount?.fid !== currentUser.fid
      ) {
        trackError(new Error('[EmbeddedWallet] Detected FID mismatch'), {
          privy: fcAccount.fid,
          warpcast: currentUser.fid,
        });
        withRetry(
          async () => {
            try {
              await privyClient.auth.logout();
            } catch (e) {
              trackError(
                new Error('Failed to logout Privy user', { cause: e }),
              );
            }
          },
          {
            delay: 0,
            retryCount: 3,
          },
        );
      }
    }
  }, [login, currentUser, privyUser, privyClient.auth]);

  const sentEvmWalletAddressToServerRef = useRef(false);
  const sentSolanaWalletAddressToServerRef = useRef(false);

  // Re-arm warplet registration when the Farcaster account changes so the new
  // account's wallet registers once Privy re-auths. Without this the refs keep
  // the previous account's "already sent" state across a switch.
  useEffect(() => {
    sentEvmWalletAddressToServerRef.current = false;
    sentSolanaWalletAddressToServerRef.current = false;
  }, [currentUser?.fid]);

  const sendEvmWalletAddressToServer = useCallback(
    async (fid: number, evmWallet: ConnectedEthereumWallet) => {
      if (sentEvmWalletAddressToServerRef.current) {
        return;
      }

      logInDevOnly('[EmbeddedWallet] sending evm wallet address to server');

      sentEvmWalletAddressToServerRef.current = true;

      try {
        const address = evmWallet.address;
        const provider = await evmWallet.getProvider();
        const signature = await provider.request({
          method: 'personal_sign',
          params: [`${fid}-${address.toLowerCase()}`, address],
        });

        putWarpcastWalletAddress({
          address,
          signature: signature as string,
        });
      } catch (e) {
        sentEvmWalletAddressToServerRef.current = false;
        trackError(e);
      }
    },
    [putWarpcastWalletAddress],
  );

  const sendSolanaWalletAddressToServer = useCallback(
    async (fid: number, solanaWallet: ConnectedSolanaWallet) => {
      if (sentSolanaWalletAddressToServerRef.current) {
        return;
      }

      logInDevOnly('[EmbeddedWallet] sending solana wallet address to server');

      sentSolanaWalletAddressToServerRef.current = true;

      try {
        const address = solanaWallet.address;
        const provider = await solanaWallet.getProvider();
        const message = new TextEncoder().encode(
          `${fid}-${address.toLowerCase()}`,
        );
        const { signature } = await provider.request({
          method: 'signMessage',
          params: { message: Buffer.from(message).toString('base64') },
        });

        putWarpcastWalletAddress({
          address,
          signature: signature as string,
          protocol: 'solana',
        });
      } catch (e) {
        sentSolanaWalletAddressToServerRef.current = false;
        trackError(e);
      }
    },
    [putWarpcastWalletAddress],
  );

  const upgradeWalletRecoveryMethod = useCallback(async () => {
    if (didUpgradeRecoveryMethod!) {
      return;
    }

    didUpgradeRecoveryMethod = true;
    const walletResource = await fetchWalletResource(
      'warpcast_wallet_recovery_encryption_key',
    );
    if (typeof walletResource.resource.value === 'undefined') {
      throw new Error('No recovery key found');
    }
    await setRecovery({
      recoveryMethod: 'recovery-encryption-key',
      recoveryKey: walletResource.resource.value,
    });
  }, [setRecovery, fetchWalletResource]);

  useEffect(() => {
    if (!isReady || !onboardingState.state.user?.fid) {
      return;
    }

    // Register only when Privy is authenticated as the EXACT FID we're about to
    // PUT (onboardingState.state.user.fid). currentUser.fid, the onboarding FID
    // and Privy's session briefly diverge during an account switch — tying the
    // guard to the PUT's own FID guarantees we never claim the previous
    // account's wallet under the new FID (the VerificationsService cross-claim).
    if (privyFarcasterFid !== onboardingState.state.user.fid) {
      return;
    }

    // Only register the user's PRIMARY Farcaster wallet here; secondary wallets
    // are registered via the `useRegisterEmbeddedWallet` path from
    // `createPrivateWallet`.
    if (
      !onboardingState.state.hasWarpcastWalletAddress &&
      evmWallet &&
      activeEvmWallet?.privyAppNamespace !== 'secondary'
    ) {
      sendEvmWalletAddressToServer(onboardingState.state.user.fid, evmWallet);
    }

    if (
      !onboardingState.state.hasWarpcastSolanaWalletAddress &&
      solanaWallet &&
      activeSolanaWallet?.privyAppNamespace !== 'secondary'
    ) {
      sendSolanaWalletAddressToServer(
        onboardingState.state.user.fid,
        solanaWallet,
      );
    }

    if (privyWallet.account?.recovery_method !== 'recovery-encryption-key') {
      upgradeWalletRecoveryMethod();
    }
  }, [
    privyFarcasterFid,
    isReady,
    onboardingState.state.user?.fid,
    onboardingState.state.hasWarpcastWalletAddress,
    onboardingState.state.hasWarpcastSolanaWalletAddress,
    activeEvmWallet?.privyAppNamespace,
    activeSolanaWallet?.privyAppNamespace,
    evmWallet,
    sendEvmWalletAddressToServer,
    solanaWallet,
    sendSolanaWalletAddressToServer,
    privyWallet.account?.recovery_method,
    upgradeWalletRecoveryMethod,
  ]);

  const evmChainId = useMemo(() => {
    if (privyWallet.account?.chain_id) {
      const caip10 = privyWallet.account?.chain_id;
      const [, chainId] = caip10.split(':');
      return parseInt(chainId);
    } else {
      return undefined;
    }
  }, [privyWallet?.account]);

  const privyWalletProvider = isConnected ? evmWalletProvider : undefined;
  const evmProvider = useMemo(
    () =>
      Provider.from({
        ...(privyWalletProvider
          ? {
              on: privyWalletProvider.on.bind(privyWalletProvider),
              removeListener:
                privyWalletProvider.removeListener.bind(privyWalletProvider),
            }
          : disconnectedEmitter),
        async request(request) {
          const { evmProvider: rawEvmProvider } = await connect();
          return await rawEvmProvider.request(request as never);
        },
      }),
    [privyWalletProvider, connect],
  );

  const transactionCounterRef = useRef(0);

  const getConnectionContext = useCallback(() => {
    return connectionContextRef.current;
  }, []);

  const solanaProvider = useMemo<SolanaWalletProviderWithConn>(() => {
    const request = async <T extends SolanaCombinedTransaction>(
      request:
        | SolanaConnectRequestArguments
        | SolanaSignMessageRequestArguments
        | SolanaSignAndSendTransactionRequestWithConnArguments
        | SolanaSignTransactionRequestArguments<T>,
    ) => {
      const { solanaProvider: rawSolanaProvider } = await connect();
      if (!rawSolanaProvider) {
        throw new Error('Solana not enabled');
      }
      if (request.method === 'connect') {
        return await rawSolanaProvider.request(request);
      } else if (request.method === 'signMessage') {
        return await rawSolanaProvider.request(request);
      } else if (request.method === 'signAndSendTransaction') {
        return await rawSolanaProvider.request(request);
      } else if (request.method === 'signTransaction') {
        return await rawSolanaProvider.request(request);
      }
    };
    return createSolanaWalletProviderWithConn(
      request as SolanaRequestFnWithConn,
    );
  }, [connect]);

  const {
    purchase,
    requestedPurchaseSucceeded,
    requestedPurchaseFailed,
    requestedPurchaseCancelledByUser,
    requestedPurchaseTrackingId,
    resetPurchaseState,
  } = useInAppPurchases();

  const toast = useRootToast();
  const { trackEvent } = useSharedTelemetry();

  const updateCurrentUserLevel = useOptimisticallyUpdateCurrentUserLevel();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const applyLimitedFunctionality =
    !checkUserAppContextGate('wallet-intents').value;

  const upgradeToProPurchaseActiveRef = React.useRef<boolean>(false);

  const handlePayForProWithIAP = React.useCallback(async () => {
    if (applyLimitedFunctionality) {
      upgradeToProPurchaseActiveRef.current = true;

      await purchase({
        onchainTransactionType: FARCASTER_PRO_IAP_TRANSACTION_TYPE,
        productId: FARCASTER_PRO_IAP_PRODUCT_ID,
      });
    }
  }, [applyLimitedFunctionality, purchase]);

  React.useEffect(() => {
    if (applyLimitedFunctionality && upgradeToProPurchaseActiveRef.current) {
      const iapAnalyticsProps = {
        productId: FARCASTER_PRO_IAP_PRODUCT_ID,
        requestedPurchaseTrackingId,
        paymentMethod: 'iap',
        onchainTransactionType: FARCASTER_PRO_IAP_TRANSACTION_TYPE,
        platform: Platform.OS,
      };

      if (requestedPurchaseCancelledByUser) {
        trackEvent(AnalyticsEvent.FarcasterProIAPPurchaseCancelled, {
          ...iapAnalyticsProps,
          failureCode: 'E_USER_CANCELLED',
        });
        toast.show('Your payment did not go through. Please try again.');

        upgradeToProPurchaseActiveRef.current = false;
        resetPurchaseState();
      } else if (requestedPurchaseFailed) {
        trackEvent(
          AnalyticsEvent.FarcasterProIAPPurchaseFailed,
          iapAnalyticsProps,
        );
        toast.show('Your payment did not go through. Please try again.');

        upgradeToProPurchaseActiveRef.current = false;
        resetPurchaseState();
      } else if (requestedPurchaseSucceeded) {
        trackEvent(
          AnalyticsEvent.FarcasterProIAPPurchaseSucceeded,
          iapAnalyticsProps,
        );
        toast.show('Your purchase is successful for Farcaster Pro!');

        updateCurrentUserLevel({ level: 'pro' });

        upgradeToProPurchaseActiveRef.current = false;
        resetPurchaseState();
      }
    }
  }, [
    applyLimitedFunctionality,
    requestedPurchaseCancelledByUser,
    requestedPurchaseFailed,
    requestedPurchaseSucceeded,
    requestedPurchaseTrackingId,
    resetPurchaseState,
    trackEvent,
    toast,
    updateCurrentUserLevel,
  ]);

  const { checkGate } = useGlobalGate();
  const swapAggregation = checkGate('swap_aggregation').value;

  const value = useMemo(() => {
    // When Privy is authed as a different Farcaster account, expose no address
    // / disconnected so the swap CTA can't fire on the previous account's
    // wallet.
    const activeEvmAddress = walletIdentityMismatch
      ? undefined
      : ((activeEvmWallet?.address as `0x${string}` | undefined) ??
        (evmWallet?.address as `0x${string}` | undefined));
    const activeSolanaAddress = walletIdentityMismatch
      ? undefined
      : (activeSolanaWallet?.address ?? solanaWallet?.address);
    const miniAppEvmAddress = activeEvmAllowedInMiniApps
      ? activeEvmAddress
      : undefined;
    const miniAppSolanaAddress = activeSolanaAllowedInMiniApps
      ? activeSolanaAddress
      : undefined;
    const miniAppActiveWalletId =
      activeEvmAllowedInMiniApps && isSecondaryNamespace && activeEvmWallet
        ? activeEvmWallet.id
        : undefined;

    // Secondary signer warms asynchronously after a wallet switch; report
    // readiness so the swap CTA can wait instead of tapping into a not-ready
    // provider. Keyed on the locally-cached provider that connect()'s fast-path
    // returns, so the CTA un-gates exactly when a swap can resolve the signer
    // synchronously. Primary is ready once connected.
    const isActiveWalletSignerReady = isSecondaryNamespace
      ? !!evmWalletProvider &&
        evmWalletProviderAddress?.toLowerCase() ===
          activeEvmWallet?.address?.toLowerCase()
      : isConnected && !walletIdentityMismatch;

    return {
      isReady,
      isActiveWalletSignerReady,
      connect: async () => {
        await connect();
      },
      disconnect,
      createPrivateWallet,
      getWalletClient,
      evmChainId,
      transactionCounterRef,
      isInitializing: false,
      getConnectionContext,
      evmProvider,
      miniAppActiveWalletId,
      miniAppEvmAddress: miniAppEvmAddress as `0x${string}` | undefined,
      miniAppEvmProvider: activeEvmAllowedInMiniApps ? evmProvider : undefined,
      connectionContextRef,
      solanaProvider,
      miniAppSolanaAddress,
      miniAppSolanaProvider: activeSolanaAllowedInMiniApps
        ? solanaProvider
        : undefined,
      activeWalletId:
        isSecondaryNamespace && activeEvmWallet ? activeWalletId : undefined,
      solanaAddress: activeSolanaAddress,
      ...(activeEvmAddress
        ? {
            evmAddress: activeEvmAddress as `0x${string}`,
            isConnected: true as const,
          }
        : { isConnected: false as const }),
      applyLimitedFunctionality,
      handlePayForProWithIAP,
      swapAggregation,
    };
  }, [
    walletIdentityMismatch,
    activeEvmAllowedInMiniApps,
    activeEvmWallet,
    activeSolanaAllowedInMiniApps,
    activeSolanaWallet?.address,
    activeWalletId,
    applyLimitedFunctionality,
    connect,
    createPrivateWallet,
    disconnect,
    evmChainId,
    evmProvider,
    evmWallet?.address,
    getConnectionContext,
    getWalletClient,
    handlePayForProWithIAP,
    isConnected,
    isReady,
    isSecondaryNamespace,
    evmWalletProvider,
    evmWalletProviderAddress,
    solanaProvider,
    solanaWallet?.address,
    swapAggregation,
  ]);

  // Log when a signed-in user has no mini-app EVM address (RUM attaches the FID).
  // Deduped by reason + settle-delayed so the cold-boot/connect window is skipped.
  const miniAppEvmUnavailableReasonRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isSignedIn) {
      miniAppEvmUnavailableReasonRef.current = null;
      return;
    }
    const hasMiniAppEvmAddress =
      activeEvmAllowedInMiniApps &&
      !walletIdentityMismatch &&
      !!(activeEvmWallet?.address ?? evmWallet?.address);
    if (hasMiniAppEvmAddress) {
      miniAppEvmUnavailableReasonRef.current = null;
      return;
    }
    const reason = walletIdentityMismatch
      ? 'fid_mismatch'
      : !hasCustodyWallet
        ? 'no_custody_wallet'
        : !activeEvmAllowedInMiniApps
          ? 'wallet_not_allowed'
          : !isConnected
            ? 'not_ready'
            : 'unknown';
    if (miniAppEvmUnavailableReasonRef.current === reason) {
      return;
    }
    const timer = setTimeout(() => {
      miniAppEvmUnavailableReasonRef.current = reason;
      rumRecovery('wallet_miniapp_evm_address_unavailable', {
        reason,
        activeNamespace,
      });
    }, MINI_APP_EVM_UNAVAILABLE_LOG_DELAY_MS);
    return () => clearTimeout(timer);
  }, [
    isSignedIn,
    activeEvmAllowedInMiniApps,
    walletIdentityMismatch,
    hasCustodyWallet,
    isConnected,
    activeNamespace,
    activeEvmWallet,
    evmWallet?.address,
  ]);

  return (
    <EmbeddedWalletProvider value={value}>{children}</EmbeddedWalletProvider>
  );
}
