// SecondaryEmbeddedWalletProvider
//
// Hosts the SECOND Privy app context. Same Farcaster/SIWE proof is reused
// across both apps; the secondary app's user holds its own `wallet_index: 0`
// embedded wallet — independent entropy root = independent seedphrase from
// the primary Farcaster Wallet.
//
// We instantiate `@privy-io/js-sdk-core`'s `Privy` client directly here
// instead of mounting a second `<PrivyProvider>` from `@privy-io/expo`.
// Reason: the expo SDK stores its `user` / `client` reference in module-level
// Zustand stores (`V`, `ee` in dist/chunk-XX3UQBBY.js). Two `<PrivyProvider>`
// instances in one app tree share that global state — primary login
// populates `usePrivy().user`, secondary believes itself authed without
// having ever logged in → `privyClient.user.get()` throws "No tokens found
// in storage". Going through `@privy-io/js-sdk-core` gives us a truly
// isolated client instance.
//
// We mount our own hidden <WebView> to host the secondary Privy iframe
// (the iframe is required for all `embeddedWallet.*` ops — key generation
// runs inside it). Message routing + secure-storage proxying mirror what
// `@privy-io/expo`'s internal Sr component does.

import {
  SolanaCombinedTransaction,
  SolanaConnectRequestArguments,
  SolanaSignAndSendTransactionRequestArguments,
  SolanaSignMessageRequestArguments,
  SolanaSignTransactionRequestArguments,
} from '@farcaster/miniapp-core';
import Privy, {
  getUserEmbeddedEthereumWallet,
  getUserEmbeddedSolanaWallet,
  type Storage as PrivyStorage,
} from '@privy-io/js-sdk-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoApplication from 'expo-application';
import * as ExpoCrypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import {
  createSolanaWalletProviderWithConn,
  type EvmWalletProvider,
  type SolanaRequestFnWithConn,
  type SolanaWalletProviderWithConn,
  useActiveWallet,
} from 'farcaster-expo';
import * as Provider from 'ox/Provider';
import * as Siwe from 'ox/Siwe';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, InteractionManager, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import {
  SECONDARY_PRIVY_APP_ID,
  SECONDARY_PRIVY_CLIENT_ID,
} from '~/constants/Privy';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { trackError } from '~/utils/ErrorUtils';

import { useWallet } from './WalletProvider';

// iOS SecureStore Keychain only allows [A-Za-z0-9._-] in account keys.
// Strip colons from internal Privy keys before namespacing.
const SECONDARY_STORAGE_PREFIX = 'sec_';
const KEYCHAIN_OPTS = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};
const sanitizeKey = (k: string) => k.replaceAll(':', '-');
const namespacedKey = (k: string) => SECONDARY_STORAGE_PREFIX + sanitizeKey(k);

const secondaryPrivyStorage: PrivyStorage = {
  async get(key: string) {
    const k = namespacedKey(key);
    try {
      return await SecureStore.getItemAsync(k, KEYCHAIN_OPTS);
    } catch {
      return await AsyncStorage.getItem(k);
    }
  },
  async put(key: string, value: unknown) {
    if (typeof value !== 'string') {
      throw new Error('secondaryPrivyStorage.put requires a string value');
    }
    const k = namespacedKey(key);
    try {
      await SecureStore.setItemAsync(k, value, KEYCHAIN_OPTS);
    } catch (e) {
      // Fallback to AsyncStorage if SecureStore is unavailable (e.g. Android
      // Keystore not yet ready). Track the underlying error once, then
      // suppress on subsequent calls during the same session.
      trackError(
        new Error('Secondary Privy SecureStore write failed, falling back', {
          cause: e as Error,
        }),
      );
      await AsyncStorage.setItem(k, value);
    }
  },
  async del(key: string) {
    const k = namespacedKey(key);
    try {
      await SecureStore.deleteItemAsync(k, KEYCHAIN_OPTS);
    } catch {
      // ignore
    }
    try {
      await AsyncStorage.removeItem(k);
    } catch {
      // ignore
    }
  },
  getKeys() {
    return [];
  },
};

// Iframe → host secure-storage proxy events. Mirrors the pattern used by
// `@privy-io/expo` (Sr / br in dist/chunk-XX3UQBBY.js). Keys are namespaced
// under the secondary prefix so secondary's iframe-side secure storage doesn't
// collide with the primary app's identical keys.
type SecureStorageGet = {
  event: 'app:secure-storage:get';
  id: string;
  data: { key: string };
};
type SecureStorageSet = {
  event: 'app:secure-storage:set';
  id: string;
  data: { key: string; value: string };
};
type SecureStorageRemove = {
  event: 'app:secure-storage:remove';
  id: string;
  data: { key: string };
};
type SecureStorageEvent =
  | SecureStorageGet
  | SecureStorageSet
  | SecureStorageRemove;

function isSecureStorageEvent(msg: unknown): msg is SecureStorageEvent {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  if (typeof m.event !== 'string') return false;
  if (!m.event.startsWith('app:secure-storage:')) return false;
  if (typeof m.id !== 'string') return false;
  if (!m.data || typeof m.data !== 'object') return false;
  return true;
}

async function handleSecureStorageEvent(event: SecureStorageEvent) {
  const k = namespacedKey(event.data.key);
  switch (event.event) {
    case 'app:secure-storage:get': {
      const value = await SecureStore.getItemAsync(k, KEYCHAIN_OPTS).catch(
        () => null,
      );
      return { event: event.event, id: event.id, data: { value } };
    }
    case 'app:secure-storage:set': {
      const success = await SecureStore.setItemAsync(
        k,
        event.data.value,
        KEYCHAIN_OPTS,
      )
        .then(() => true)
        .catch(() => false);
      return { event: event.event, id: event.id, data: { success } };
    }
    case 'app:secure-storage:remove': {
      const success = await SecureStore.deleteItemAsync(k, KEYCHAIN_OPTS)
        .then(() => true)
        .catch(() => false);
      return { event: event.event, id: event.id, data: { success } };
    }
  }
}

export type SecondaryWalletProtocol = 'ethereum' | 'solana';

export type CreateSecondaryWalletResult = {
  ethereum?: { address: `0x${string}` };
  solana?: { address: string };
};

type SecondaryEmbeddedWalletContextValue = {
  isSecondaryAuthed: boolean;
  secondaryEvmAddress: `0x${string}` | undefined;
  secondaryEvmProvider: EvmWalletProvider | undefined;
  secondarySolanaAddress: string | undefined;
  secondarySolanaProvider: SolanaWalletProviderWithConn | undefined;
  authenticateSecondary: () => Promise<void>;
  createSecondaryWallet: (
    recoveryKey: string,
    options?: { protocols?: SecondaryWalletProtocol[] },
  ) => Promise<CreateSecondaryWalletResult>;
  getSecondaryEvmProvider: (
    recoveryKey: string,
  ) => Promise<EvmWalletProvider | undefined>;
  getSecondarySolanaProvider: (
    recoveryKey: string,
  ) => Promise<SolanaWalletProviderWithConn | undefined>;
};

const SecondaryEmbeddedWalletContext = createContext<
  SecondaryEmbeddedWalletContextValue | undefined
>(undefined);

const WEBVIEW_LOAD_TIMEOUT_MS = 20_000;

// Creating the hidden WebView costs tens of ms of synchronous UI-thread work
// (AwContents construction, plus full Chromium browser-process startup if it
// is the first WebView in the process), and at cold start it lands inside the
// feed's initial Fabric mount window (NEYN-11907 Android ANR bucket). Defer
// mounting until a wallet op first needs the iframe, or until the app has
// settled after startup — whichever comes first.
const WEBVIEW_MOUNT_IDLE_DELAY_MS = 5_000;

// Bounds for secondary Privy iframe ops. The secondary wallet lives in a hidden
// WebView; if that iframe is cold or wedged a request can hang forever, which
// would freeze a swap on "Buying/Selling" since the executor only resolves on
// settle. Embedded-wallet signing is MPC with no human prompt, so a healthy
// op is sub-second — these only fire on a stuck iframe.
const SECONDARY_PING_FOREGROUND_DELAY_MS = 2_000;
const ACQUIRE_TIMEOUT_MS = 25_000; // getEthereumProvider / getSolanaProvider warm
const SIGN_TIMEOUT_MS = 60_000; // sign-only (signTypedData/signMessage/signTransaction)
const BROADCAST_TIMEOUT_MS = 90_000; // submits to network (eth_sendTransaction/signAndSend)

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(new Error(`Secondary wallet ${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([p.finally(() => clearTimeout(timer)), timeout]);
}

type SecondaryPrivyHost = {
  clientRef: React.MutableRefObject<Privy | null>;
  isClientReady: boolean;
  isClientReadyRef: React.MutableRefObject<boolean>;
  isWebViewReadyRef: React.MutableRefObject<boolean>;
  waitForWebView: () => Promise<void>;
  requestMountWebView: () => void;
};

const SecondaryPrivyHostContext = createContext<SecondaryPrivyHost | undefined>(
  undefined,
);

// Hosts the secondary Privy `@privy-io/js-sdk-core` client + its hidden iframe
// WebView. Mounted ABOVE the app's <Suspense> (App.tsx) so this WebView — and
// the in-memory recovery/session state it holds — survives a Suspense
// re-suspend / error-boundary retry instead of remounting and re-running a full
// user-owned recovery. Auth-free by construction (module-const config only);
// the auth-fed lifecycle stays deep in SecondaryEmbeddedWalletProvider, which
// resolves this host via useSecondaryPrivyHost(). A SEPARATE Privy instance
// from the primary `@privy-io/expo` <PrivyProvider> (see file header) — the
// two-app isolation is unchanged by this hoist.
export function SecondaryPrivyHostProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Refs — synchronous access from async callbacks.
  const clientRef = useRef<Privy | null>(null);
  const webViewRef = useRef<WebView | null>(null);
  const isWebViewReadyRef = useRef(false);

  // State — drives re-render + WebView mount gating.
  const [isClientReady, setIsClientReady] = useState(false);
  // Ref mirror of `isClientReady` for listeners with stable (`[]`) deps that
  // would otherwise capture a stale `false`.
  const isClientReadyRef = useRef(false);
  const [shouldMountWebView, setShouldMountWebView] = useState(false);

  // ── construct Privy client (once) ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const client = new Privy({
      appId: SECONDARY_PRIVY_APP_ID,
      clientId: SECONDARY_PRIVY_CLIENT_ID,
      storage: secondaryPrivyStorage,
      ...({
        nativeAppIdentifier: ExpoApplication.applicationId ?? undefined,
        crypto: { digest: ExpoCrypto.digest },
        sdkVersion: 'farcaster-secondary:1',
      } as Record<string, unknown>),
    } as ConstructorParameters<typeof Privy>[0]);
    clientRef.current = client;

    (async () => {
      try {
        await client.initialize();
        if (cancelled) return;
        isClientReadyRef.current = true;
        setIsClientReady(true);
      } catch (e) {
        if (cancelled) return;
        trackError(
          new Error('Secondary Privy client init failed', {
            cause: e as Error,
          }),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const requestMountWebView = useCallback(() => {
    setShouldMountWebView(true);
  }, []);

  // ── WebView ↔ iframe message routing. ────────────────────────────────────
  const handleWebViewMessage = useCallback(async (e: WebViewMessageEvent) => {
    const client = clientRef.current;
    if (!client) return;
    let msg: unknown;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (isSecureStorageEvent(msg)) {
      const response = await handleSecureStorageEvent(msg);
      webViewRef.current?.postMessage(JSON.stringify(response));
      return;
    }
    // Cast: SDK's onMessage accepts a PrivyResponseEvent union we don't model
    // at this layer. Trust the SDK to validate.
    (client.embeddedWallet.onMessage as unknown as (m: unknown) => void)(msg);
  }, []);

  // ── wait until WebView is ready for iframe-driven ops. ───────────────────
  const waitForWebView = useCallback(async () => {
    if (isWebViewReadyRef.current) return;
    // Demand-mount: an op needs the iframe before the idle-delay mount fired.
    setShouldMountWebView(true);
    const start = Date.now();
    while (!isWebViewReadyRef.current) {
      if (Date.now() - start > WEBVIEW_LOAD_TIMEOUT_MS) {
        throw new Error('Secondary Privy WebView did not load in time');
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }, []);

  const value = useMemo<SecondaryPrivyHost>(
    () => ({
      clientRef,
      isClientReady,
      isClientReadyRef,
      isWebViewReadyRef,
      waitForWebView,
      requestMountWebView,
    }),
    [isClientReady, waitForWebView, requestMountWebView],
  );

  return (
    <SecondaryPrivyHostContext.Provider value={value}>
      {children}
      {isClientReady && shouldMountWebView && clientRef.current && (
        // Hidden offscreen WebView hosts the secondary Privy iframe. All
        // embedded-wallet ops route through this iframe via the message
        // poster wired below.
        <View
          style={{
            width: 1,
            height: 1,
            position: 'absolute',
            top: -1000,
            left: -1000,
            opacity: 0,
          }}
          pointerEvents="none"
        >
          <WebView
            ref={(i) => {
              if (i && clientRef.current) {
                // The SDK only uses `.postMessage(string)` at runtime — the
                // WebView ref satisfies the EmbeddedWalletMessagePoster shape
                // structurally (extra args are ignored).
                (
                  clientRef.current.setMessagePoster as unknown as (
                    p: unknown,
                  ) => void
                )(i);
                webViewRef.current = i;
              }
            }}
            style={{ flex: 1 }}
            source={{ uri: clientRef.current.embeddedWallet.getURL() }}
            cacheEnabled={false}
            cacheMode="LOAD_NO_CACHE"
            injectedJavaScriptObject={{ shouldUseAppBackedStorage: true }}
            onLoad={() => {
              isWebViewReadyRef.current = true;
              // eslint-disable-next-line no-console
              console.log('[secondary-wallet] secondary WebView loaded');
            }}
            onError={(err) => {
              // eslint-disable-next-line no-console
              console.log(
                '[secondary-wallet] secondary WebView error',
                err.nativeEvent,
              );
            }}
            onMessage={handleWebViewMessage}
          />
        </View>
      )}
    </SecondaryPrivyHostContext.Provider>
  );
}

function useSecondaryPrivyHost(): SecondaryPrivyHost {
  const v = useContext(SecondaryPrivyHostContext);
  if (!v) {
    throw new Error(
      'useSecondaryPrivyHost must be used inside <SecondaryPrivyHostProvider>',
    );
  }
  return v;
}

export function SecondaryEmbeddedWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = useCurrentUser();
  const { account: custodyAccount } = useWallet();

  // Only do proactive secondary work (mount the hidden iframe WebView, run the
  // foreground keepalive ping) for users who actually have / are using a
  // secondary wallet. On-demand create/use still force-mounts via waitForWebView.
  const { activeNamespace, hasSecondaryEvm, hasSecondarySolana } =
    useActiveWallet();
  const secondaryNeeded =
    activeNamespace === 'secondary' || hasSecondaryEvm || hasSecondarySolana;
  const secondaryNeededRef = useRef(secondaryNeeded);
  secondaryNeededRef.current = secondaryNeeded;

  // The remount-sensitive client + hidden WebView live in the root-mounted
  // SecondaryPrivyHostProvider (above <Suspense>); this deep provider consumes
  // them so a re-suspend remounting *this* tree never tears down the iframe.
  const {
    clientRef,
    isClientReady,
    isClientReadyRef,
    isWebViewReadyRef,
    waitForWebView,
    requestMountWebView,
  } = useSecondaryPrivyHost();

  // State — drives re-render + context value.
  const [isSecondaryAuthed, setIsSecondaryAuthed] = useState(false);
  const [secondaryEvmAddress, setSecondaryEvmAddress] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [secondaryEvmProvider, setSecondaryEvmProvider] = useState<
    EvmWalletProvider | undefined
  >(undefined);
  const [secondarySolanaAddress, setSecondarySolanaAddress] = useState<
    string | undefined
  >(undefined);
  const [secondarySolanaProvider, setSecondarySolanaProvider] = useState<
    SolanaWalletProviderWithConn | undefined
  >(undefined);

  const currentFid = currentUser?.fid ?? null;
  const prevFidRef = useRef<number | null>(null);

  // ── Deferred WebView mount ───────────────────────────────────────────────
  // Idle-path mount: once startup interactions settle, wait a beat and mount
  // the hidden WebView so proactive flows (AppState ping, session keepalive)
  // get their iframe without any op having to demand it.
  useEffect(() => {
    if (!isClientReady || !secondaryNeeded) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const interaction = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(requestMountWebView, WEBVIEW_MOUNT_IDLE_DELAY_MS);
    });
    return () => {
      interaction.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [isClientReady, secondaryNeeded, requestMountWebView]);

  // ── Account-switch boundary ─────────────────────────────────────────────
  // When the app-level FID changes (login, logout, account switch), tear
  // down any stale secondary Privy session so the next authenticateSecondary
  // call starts fresh for the new user.
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !isClientReady) return;

    const prev = prevFidRef.current;
    prevFidRef.current = currentFid;

    // First mount or same user — try hydrating the persisted session.
    if (prev === null && currentFid !== null) {
      (async () => {
        try {
          const { user } = await client.user.get();
          if (!user) return;
          const linkedFarcaster = user.linked_accounts?.find(
            (a: { type: string }) => a.type === 'farcaster',
          ) as { fid?: number } | undefined;
          if (linkedFarcaster?.fid && linkedFarcaster.fid !== currentFid) {
            // eslint-disable-next-line no-console
            console.log(
              '[secondary-wallet] init: stale session (fid %d), logging out',
              linkedFarcaster.fid,
            );
            await client.auth.logout();
          } else {
            setIsSecondaryAuthed(true);
            const account = getUserEmbeddedEthereumWallet(user);
            if (account)
              setSecondaryEvmAddress(account.address as `0x${string}`);
            const solanaAccount = getUserEmbeddedSolanaWallet(user);
            if (solanaAccount) {
              setSecondarySolanaAddress(solanaAccount.address);
            }
          }
        } catch {
          // No persisted session — expected.
        }
      })();
      return;
    }

    // FID actually changed (logout or switch).
    if (prev !== null && prev !== currentFid) {
      // eslint-disable-next-line no-console
      console.log(
        '[secondary-wallet] account switch %d → %s, resetting secondary session',
        prev,
        currentFid,
      );
      setIsSecondaryAuthed(false);
      setSecondaryEvmAddress(undefined);
      setSecondaryEvmProvider(undefined);
      setSecondarySolanaAddress(undefined);
      setSecondarySolanaProvider(undefined);
      (async () => {
        try {
          await client.auth.logout();
        } catch {
          // ignore — may already be logged out
        }
      })();
    }
  }, [clientRef, currentFid, isClientReady]);

  // ── AppState reload: match @privy-io/expo behavior. ──────────────────────
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const sub = AppState.addEventListener('change', (s) => {
      // Skip for users without a secondary wallet, and defer the rest so the
      // primary wallet's foreground connect() isn't contended — this keepalive
      // is non-urgent.
      if (s !== 'active' || !secondaryNeededRef.current) return;
      const timer = setTimeout(async () => {
        timers.delete(timer);
        const client = clientRef.current;
        // `isClientReadyRef` (not just `!client`): the embedded-wallet proxy
        // only exists once async `initialize()` resolves (NEYN-11742); and
        // before the deferred WebView has loaded there is no iframe to ping.
        if (
          !client ||
          !isClientReadyRef.current ||
          !isWebViewReadyRef.current
        ) {
          return;
        }
        try {
          const alive = await client.embeddedWallet.ping(500);
          if (!alive) client.embeddedWallet.reload();
        } catch {
          // ignore
        }
      }, SECONDARY_PING_FOREGROUND_DELAY_MS);
      timers.add(timer);
    });
    return () => {
      sub.remove();
      timers.forEach(clearTimeout);
    };
  }, [clientRef, isClientReadyRef, isWebViewReadyRef]);

  // ── authenticate ── reuses primary's custody-key SIWE proof. ─────────────
  const authenticateSecondary = useCallback(async () => {
    const client = clientRef.current;
    if (!client) throw new Error('Secondary Privy client not initialized');
    // eslint-disable-next-line no-console
    console.log('[secondary-wallet] authenticate.start', {
      fid: currentUser?.fid,
      hasCustody: !!custodyAccount,
    });
    try {
      const { user } = await client.user.get();
      if (user) {
        // eslint-disable-next-line no-console
        console.log('[secondary-wallet] authenticate.already authed', {
          userId: user.id,
        });
        setIsSecondaryAuthed(true);
        return;
      }
    } catch {
      // No session — fall through to login.
    }
    if (!custodyAccount) {
      throw new Error('Secondary auth requires a custody wallet');
    }
    if (!currentUser) {
      throw new Error('Secondary auth requires a signed-in Farcaster user');
    }
    const initRes = await client.auth.farcasterV2.initializeAuth();
    // eslint-disable-next-line no-console
    console.log('[secondary-wallet] authenticate.init done');
    const data = {
      version: '1',
      address: custodyAccount.address,
      statement: 'Farcaster Auth',
      chainId: 10,
      resources: [`farcaster://fid/${currentUser.fid}`] as string[],
      domain: 'farcaster.xyz',
      uri: 'https://farcaster.xyz/login',
      nonce: initRes.nonce,
    } as const satisfies Siwe.Message;
    const message = Siwe.createMessage(data);
    const signature = await custodyAccount.signMessage({ message });
    // eslint-disable-next-line no-console
    console.log('[secondary-wallet] authenticate.signed SIWE, calling login');
    await client.auth.farcasterV2.authenticate({
      message,
      signature,
      fid: currentUser.fid,
    });
    setIsSecondaryAuthed(true);
    // eslint-disable-next-line no-console
    console.log('[secondary-wallet] authenticate.login OK');
  }, [clientRef, custodyAccount, currentUser]);

  // ── ensure the secondary app has the requested wallets, returning accounts.
  //
  // EVM is created (or recovered) first because Privy's Solana embedded wallet
  // is derived from the EVM account's entropy — `createSolana` MUST be passed
  // an `ethereumAccount` arg. SOL also reuses the same recovery key implicitly
  // through that derivation.
  const ensureWallets = useCallback(
    async (
      recoveryKey: string,
      protocols: SecondaryWalletProtocol[],
    ): Promise<{
      evmAccount: NonNullable<
        ReturnType<typeof getUserEmbeddedEthereumWallet>
      > | null;
      solanaAccount: NonNullable<
        ReturnType<typeof getUserEmbeddedSolanaWallet>
      > | null;
    }> => {
      const client = clientRef.current;
      if (!client) throw new Error('Secondary Privy client not initialized');
      // eslint-disable-next-line no-console
      console.log('[secondary-wallet] ensureWallets.start', {
        recoveryKeyLen: recoveryKey?.length,
        protocols,
      });
      await waitForWebView();
      const wantsEvm =
        protocols.includes('ethereum') || protocols.includes('solana');
      const wantsSolana = protocols.includes('solana');

      let { user } = await client.user.get();
      let evmAccount = getUserEmbeddedEthereumWallet(user);
      let solanaAccount = getUserEmbeddedSolanaWallet(user);

      // Always require an EVM account before we can sign or derive Solana.
      if (wantsEvm && !evmAccount) {
        // eslint-disable-next-line no-console
        console.log('[secondary-wallet] ensureWallets.creating EVM');
        const created = await client.embeddedWallet.create({
          recoveryMethod: 'recovery-encryption-key',
          recoveryKey,
        });
        user = created.user as unknown as typeof user;
        evmAccount = getUserEmbeddedEthereumWallet(
          user as unknown as Parameters<
            typeof getUserEmbeddedEthereumWallet
          >[0],
        );
      }

      if (wantsEvm && !evmAccount) {
        throw new Error('No EVM account on secondary Privy user after create');
      }

      if (evmAccount) {
        // Warm the iframe for subsequent provider calls.
        await client.embeddedWallet.getEthereumProvider({
          wallet: evmAccount,
          entropyId: evmAccount.address,
          entropyIdVerifier: 'ethereum-address-verifier',
          recoveryKey,
        });
        setSecondaryEvmAddress(evmAccount.address as `0x${string}`);
      }

      if (wantsSolana && !solanaAccount) {
        if (!evmAccount) {
          throw new Error('Cannot create secondary Solana without EVM account');
        }
        // eslint-disable-next-line no-console
        console.log('[secondary-wallet] ensureWallets.creating Solana');
        const created = await client.embeddedWallet.createSolana({
          ethereumAccount: evmAccount,
        });
        user = created.user as unknown as typeof user;
        solanaAccount = getUserEmbeddedSolanaWallet(
          user as unknown as Parameters<typeof getUserEmbeddedSolanaWallet>[0],
        );
      }

      if (wantsSolana && !solanaAccount) {
        throw new Error(
          'No Solana account on secondary Privy user after create',
        );
      }

      if (solanaAccount) {
        setSecondarySolanaAddress(solanaAccount.address);
      }

      // eslint-disable-next-line no-console
      console.log('[secondary-wallet] ensureWallets.OK', {
        evm: evmAccount?.address,
        sol: solanaAccount?.address,
      });

      return {
        evmAccount: evmAccount ?? null,
        solanaAccount: solanaAccount ?? null,
      };
    },
    [clientRef, waitForWebView],
  );

  const createSecondaryWallet = useCallback(
    async (
      recoveryKey: string,
      options?: { protocols?: SecondaryWalletProtocol[] },
    ): Promise<CreateSecondaryWalletResult> => {
      const protocols = options?.protocols ?? ['ethereum', 'solana'];
      // eslint-disable-next-line no-console
      console.log('[secondary-wallet] createSecondaryWallet.start', {
        protocols,
      });
      await authenticateSecondary();
      const { evmAccount, solanaAccount } = await ensureWallets(
        recoveryKey,
        protocols,
      );
      const result: CreateSecondaryWalletResult = {};
      if (protocols.includes('ethereum') && evmAccount) {
        result.ethereum = { address: evmAccount.address as `0x${string}` };
      }
      if (protocols.includes('solana') && solanaAccount) {
        result.solana = { address: solanaAccount.address };
      }
      // eslint-disable-next-line no-console
      console.log('[secondary-wallet] createSecondaryWallet.OK', result);
      return result;
    },
    [authenticateSecondary, ensureWallets],
  );

  const getSecondaryEvmProvider = useCallback(
    async (recoveryKey: string): Promise<EvmWalletProvider | undefined> => {
      const client = clientRef.current;
      if (!client) throw new Error('Secondary Privy client not initialized');
      await authenticateSecondary();
      const { evmAccount } = await ensureWallets(recoveryKey, ['ethereum']);
      if (!evmAccount) return undefined;
      const privyProvider = await withTimeout(
        client.embeddedWallet.getEthereumProvider({
          wallet: evmAccount,
          entropyId: evmAccount.address,
          entropyIdVerifier: 'ethereum-address-verifier',
          recoveryKey,
        }),
        ACQUIRE_TIMEOUT_MS,
        'getEthereumProvider',
      );
      const wrapped = Provider.from({
        on: privyProvider.on.bind(privyProvider),
        removeListener: privyProvider.removeListener.bind(privyProvider),
        async request(request) {
          const ms =
            request.method === 'eth_sendTransaction'
              ? BROADCAST_TIMEOUT_MS
              : SIGN_TIMEOUT_MS;
          // @ts-expect-error privy/ox type mismatch — matches primary wrapper
          const result = privyProvider.request(request);
          return withTimeout(result, ms, request.method);
        },
      }) as EvmWalletProvider;
      setSecondaryEvmProvider(wrapped);
      setSecondaryEvmAddress(evmAccount.address as `0x${string}`);
      return wrapped;
    },
    [clientRef, authenticateSecondary, ensureWallets],
  );

  const getSecondarySolanaProvider = useCallback(
    async (
      recoveryKey: string,
    ): Promise<SolanaWalletProviderWithConn | undefined> => {
      const client = clientRef.current;
      if (!client) throw new Error('Secondary Privy client not initialized');
      await authenticateSecondary();
      const { evmAccount, solanaAccount } = await ensureWallets(recoveryKey, [
        'solana',
      ]);
      if (!solanaAccount || !evmAccount) return undefined;
      const privyProvider = await withTimeout(
        client.embeddedWallet.getSolanaProvider(
          solanaAccount,
          evmAccount.address,
          'ethereum-address-verifier',
          undefined,
          undefined,
          undefined,
          async ({ onRecovered }) => {
            // Recovery callback — re-warm EVM provider with recovery key so the
            // Solana derivation can proceed.
            try {
              await client.embeddedWallet.getEthereumProvider({
                wallet: evmAccount,
                entropyId: evmAccount.address,
                entropyIdVerifier: 'ethereum-address-verifier',
                recoveryKey,
              });
              onRecovered();
            } catch (e) {
              trackError(
                new Error(
                  'Secondary Solana recovery callback failed: ' +
                    (e as Error)?.message,
                  { cause: e as Error },
                ),
              );
              throw e;
            }
          },
        ),
        ACQUIRE_TIMEOUT_MS,
        'getSolanaProvider',
      );
      const requestFn = async <T extends SolanaCombinedTransaction>(
        request:
          | SolanaConnectRequestArguments
          | SolanaSignMessageRequestArguments
          | SolanaSignAndSendTransactionRequestArguments
          | SolanaSignTransactionRequestArguments<T>,
      ) => {
        if (request.method === 'connect') {
          return { publicKey: solanaAccount.address };
        }
        if (
          request.method === 'signMessage' ||
          request.method === 'signAndSendTransaction' ||
          request.method === 'signTransaction'
        ) {
          const ms =
            request.method === 'signAndSendTransaction'
              ? BROADCAST_TIMEOUT_MS
              : SIGN_TIMEOUT_MS;
          return withTimeout(
            // @ts-expect-error privy provider request types are looser than ours
            privyProvider.request(request),
            ms,
            request.method,
          );
        }
        return undefined;
      };
      const wrapped = createSolanaWalletProviderWithConn(
        requestFn as SolanaRequestFnWithConn,
      );
      setSecondarySolanaProvider(wrapped);
      setSecondarySolanaAddress(solanaAccount.address);
      return wrapped;
    },
    [clientRef, authenticateSecondary, ensureWallets],
  );

  const value = useMemo<SecondaryEmbeddedWalletContextValue>(
    () => ({
      isSecondaryAuthed,
      secondaryEvmAddress,
      secondaryEvmProvider,
      secondarySolanaAddress,
      secondarySolanaProvider,
      authenticateSecondary,
      createSecondaryWallet,
      getSecondaryEvmProvider,
      getSecondarySolanaProvider,
    }),
    [
      isSecondaryAuthed,
      secondaryEvmAddress,
      secondaryEvmProvider,
      secondarySolanaAddress,
      secondarySolanaProvider,
      authenticateSecondary,
      createSecondaryWallet,
      getSecondaryEvmProvider,
      getSecondarySolanaProvider,
    ],
  );

  return (
    <SecondaryEmbeddedWalletContext.Provider value={value}>
      {children}
    </SecondaryEmbeddedWalletContext.Provider>
  );
}

export function useSecondaryEmbeddedWallet(): SecondaryEmbeddedWalletContextValue {
  const value = useContext(SecondaryEmbeddedWalletContext);
  if (!value) {
    throw new Error(
      'useSecondaryEmbeddedWallet must be used inside <SecondaryEmbeddedWalletProvider>',
    );
  }
  return value;
}
