import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useFrameBlocklist,
  useNonSuspenseFrameDetails,
  useUpdateEmbeddedWallet,
} from 'farcaster-client-hooks';
import {
  ConnectionContext,
  getLocalMiniAppPolicyOverridesKey,
  parseLocalMiniAppPolicyOverrides,
  useActiveWallet,
  useCurrentUserFid,
  useEmbeddedWallet,
  useIsAdmin,
  useSecondaryWalletsVisible,
} from 'farcaster-expo';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useMMKVString } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';

import { BlockedSiteIcon } from '~/components/icons/BlockedSiteIcon';
import { MiniAppQualityBottomSheet } from '~/components/MiniApp/MiniAppQualityBottomSheet';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import {
  InAppBrowserSurfaceProps,
  useMinimizedInAppBrowser,
} from '~/contexts/MinimizedInAppBrowserProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';
import { sanitizeUrl } from '~/utils/UrlUtils';

import { BrowserChrome } from './BrowserChrome';
import {
  buildBrowserSession,
  hasOriginChanged,
  isBlockedBrowserUrl,
  normalizeHostnameFromUrl,
  normalizeOriginFromUrl,
} from './BrowserOriginController';
import {
  getBrowserPermission,
  revokeBrowserPermission,
  upsertBrowserPermission,
} from './BrowserPermissionStore';
import {
  BrowserConnectApprovalDecision,
  createBrowserProviderController,
} from './BrowserProviderController';
import { BrowserSitePermissionsSheet } from './BrowserSitePermissionsSheet';
import {
  blockDomain,
  getUserBlockedDomains,
  isDomainUserBlocked,
  unblockDomain,
} from './BrowserUserBlocklistStore';
import {
  dismissBrowserWalletOverlays,
  sendBrowserBridgeEvent,
} from './BrowserWalletBridge';
import {
  BrowserWebView,
  invalidateBrowserWebViewRequests,
} from './BrowserWebView';

function getWalletMiniAppPermission(
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

type InAppBrowserScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'InAppBrowser'
>;

/**
 * Reusable body of the in-app browser. Hosted by `MinimizedInAppBrowserProvider`
 * inside a global bottom sheet so that "minimize" is a cheap sheet-close
 * (WebView stays mounted, pending prompts preserved) rather than a full
 * route unmount. Also reachable directly as a stack screen via the
 * back-compat route shim below.
 */
function InAppBrowserSurface({
  url: initialUrlParam,
  source,
  walletLink,
  onRequestMinimize,
  onRequestClose,
  onBarUpdate,
}: InAppBrowserSurfaceProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const embeddedWallet = useEmbeddedWallet();
  const isAdmin = useIsAdmin();
  const secondaryWalletsVisible = useSecondaryWalletsVisible();
  const fid = useCurrentUserFid();
  const queryClient = useQueryClient();
  const updateEmbeddedWallet = useUpdateEmbeddedWallet();
  const {
    activeNamespace,
    primaryWallet,
    secondaryEvmWallet,
    secondarySolanaWallet,
    selectPrimaryWallet,
  } = useActiveWallet();
  const isSecondaryNamespaceActive =
    secondaryWalletsVisible && activeNamespace === 'secondary';
  const activePrivateEvmWallet = isSecondaryNamespaceActive
    ? secondaryEvmWallet
    : undefined;
  const activePrivateSolanaWallet = isSecondaryNamespaceActive
    ? secondarySolanaWallet
    : undefined;
  // Surface a single representative wallet for the "selected secondary wallet"
  // banner — prefer EVM since most mini-apps still go through it.
  const activePrivateWallet =
    activePrivateEvmWallet ?? activePrivateSolanaWallet;
  const activePrivateWallets = [
    activePrivateEvmWallet,
    activePrivateSolanaWallet,
  ].filter((wallet): wallet is NonNullable<typeof wallet> => Boolean(wallet));
  const activePrivateWalletBlockedByPolicy = activePrivateWallets.some(
    (wallet) => getWalletMiniAppPermission(wallet) !== 'allowed',
  );
  const primaryEvmAddress =
    primaryWallet?.protocol === 'ethereum'
      ? primaryWallet.address.toLowerCase()
      : undefined;
  const activeEvmAddress = embeddedWallet.evmAddress?.toLowerCase();
  const miniAppEvmAddress = embeddedWallet.miniAppEvmAddress?.toLowerCase();
  const activeSolanaAddress = embeddedWallet.solanaAddress?.toLowerCase();
  const miniAppSolanaAddress =
    embeddedWallet.miniAppSolanaAddress?.toLowerCase();
  const activeEvmAddressIsPrivate =
    Boolean(activeEvmAddress) &&
    Boolean(primaryEvmAddress) &&
    activeEvmAddress !== primaryEvmAddress;
  // When the secondary namespace is active, the EmbeddedWallet provider
  // nulls out the miniApp{Evm,Solana}Address fields for whichever protocol
  // is blocked. Detect either one being blocked-by-context.
  const evmBlockedByContext =
    isSecondaryNamespaceActive &&
    Boolean(activePrivateEvmWallet) &&
    !miniAppEvmAddress;
  const solanaBlockedByContext =
    isSecondaryNamespaceActive &&
    Boolean(activePrivateSolanaWallet) &&
    !miniAppSolanaAddress;
  const activePrivateWalletBlockedByContext =
    evmBlockedByContext ||
    solanaBlockedByContext ||
    (activeEvmAddressIsPrivate && miniAppEvmAddress !== activeEvmAddress) ||
    (isSecondaryNamespaceActive &&
      Boolean(activeSolanaAddress) &&
      miniAppSolanaAddress !== activeSolanaAddress);
  const activePrivateWalletBlocked =
    secondaryWalletsVisible &&
    (activePrivateWalletBlockedByPolicy || activePrivateWalletBlockedByContext);
  const [rawMiniAppPolicyOverrides, setRawMiniAppPolicyOverrides] =
    useMMKVString(getLocalMiniAppPolicyOverridesKey(fid));
  const [isEnablingWalletAccess, setIsEnablingWalletAccess] = useState(false);
  const { trackEvent } = useAnalytics();
  const openComposer = useOpenComposer();
  const frameBlocklist = useFrameBlocklist();

  const initialUrl = useMemo(
    () => sanitizeUrl(initialUrlParam),
    [initialUrlParam],
  );
  const webViewRef = useRef<WebView>(null);
  const previousConnectionContextRef = useRef<ConnectionContext | undefined>(
    embeddedWallet.connectionContextRef.current,
  );
  // This browser session's own connection context (incl. wallet-link
  // attribution), threaded per-request into the preview provider so a
  // transaction is attributed to this session rather than whatever surface last
  // wrote the shared connectionContextRef (NEYN-12452).
  const browserConnectionContextRef = useRef<ConnectionContext | undefined>(
    undefined,
  );
  const pendingApprovalResolverRef = useRef<
    ((decision: BrowserConnectApprovalDecision) => void) | null
  >(null);
  const [webViewSourceUrl, setWebViewSourceUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [pageTitle, setPageTitle] = useState<string | undefined>();
  const [showPermissions, setShowPermissions] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [approvalMode, setApprovalMode] = useState(false);
  const [showQualitySheet, setShowQualitySheet] = useState(false);
  // User-blocked domains stored locally. Use a state version counter so that
  // block/unblock actions trigger a re-render without going through MMKV hooks.
  const [userBlocklistVersion, setUserBlocklistVersion] = useState(0);
  const bumpUserBlocklist = useCallback(
    () => setUserBlocklistVersion((v) => v + 1),
    [],
  );
  const [chainIdHex, setChainIdHex] = useState('0x1');
  const [sessionConnectedAddress, setSessionConnectedAddress] = useState<
    `0x${string}` | undefined
  >();
  const [permissionsVersion, setPermissionsVersion] = useState(0);
  const bumpPermissionsVersion = useCallback(
    () => setPermissionsVersion((v) => v + 1),
    [],
  );
  const currentOrigin = useMemo(
    () => normalizeOriginFromUrl(currentUrl),
    [currentUrl],
  );
  const blockedDomains = useMemo(() => {
    const domains = new Set<string>();
    if (frameBlocklist.data) {
      frameBlocklist.data.forEach((entry: string) => {
        const hostname = normalizeHostnameFromUrl(entry);
        if (hostname) {
          domains.add(hostname);
        }
      });
    }
    // Merge user-blocked domains (re-computed when userBlocklistVersion bumps).

    getUserBlockedDomains().forEach((d) => domains.add(d));

    return domains;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameBlocklist.data, userBlocklistVersion]);
  const currentHostname = useMemo(
    () => normalizeHostnameFromUrl(currentUrl),
    [currentUrl],
  );
  const { data: currentFrame } = useNonSuspenseFrameDetails({
    domain: currentHostname,
    enabled: isAdmin && Boolean(currentHostname),
  });
  const initialUrlBlocked = useMemo(
    () => isBlockedBrowserUrl({ url: currentUrl, blockedDomains }),

    [blockedDomains, currentUrl],
  );
  // True only when the current URL is blocked specifically by the user
  // (not by the server-side frame blocklist).
  const isUserBlocked = useMemo(
    () => (currentHostname ? isDomainUserBlocked(currentHostname) : false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentHostname, userBlocklistVersion],
  );

  const session = useMemo(
    () =>
      buildBrowserSession({
        url: currentUrl,
        title: undefined,
        sessionConnectedAddress,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentOrigin, permissionsVersion, sessionConnectedAddress],
  );

  const permissionRecord = useMemo(
    () => (session.origin ? getBrowserPermission(session.origin) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session.origin, permissionsVersion],
  );

  // This session's own connection context (incl. wallet-link attribution).
  // Computed during render and mirrored onto browserConnectionContextRef
  // synchronously below so a wallet RPC dispatched before the effect that
  // syncs the shared ref flushes still reads this session's freshest
  // attribution (e.g. a same-URL reopen that refreshes `walletLink` while the
  // WebView stays mounted) rather than a stale value (NEYN-12452).
  const browserConnectionContext = useMemo<ConnectionContext>(
    () => ({
      source: 'browser',
      domain: session.origin ?? 'unknown',
      origin: session.origin,
      pageTitle,
      walletLinkAttribution: walletLink,
    }),
    [session.origin, pageTitle, walletLink],
  );
  browserConnectionContextRef.current = browserConnectionContext;

  const rejectPendingApproval = useCallback(() => {
    const resolver = pendingApprovalResolverRef.current;
    if (resolver) {
      resolver({ type: 'reject' });
    }
  }, []);

  const requestConnectApproval = useCallback(
    (ctx: { origin: string; previouslyTrusted: boolean }) =>
      new Promise<BrowserConnectApprovalDecision>((resolve) => {
        const settle = (decision: BrowserConnectApprovalDecision) => {
          if (pendingApprovalResolverRef.current !== settle) {
            return;
          }
          pendingApprovalResolverRef.current = null;
          setApprovalMode(false);
          setShowPermissions(false);
          resolve(decision);
        };
        pendingApprovalResolverRef.current = settle;
        setApprovalMode(true);
        setShowPermissions(true);
        trackEvent(AnalyticsEvent.VisitingExternalURL, {
          source: 'browser_connect_approval_requested',
          origin: ctx.origin,
          previouslyTrusted: ctx.previouslyTrusted,
        });
        if (webViewRef.current) {
          dismissBrowserWalletOverlays({ webView: webViewRef.current });
        }
      }),
    [trackEvent],
  );

  // Wrap the EVM preview provider so every wallet RPC this browser dispatches
  // first tags the shared wallet with this session's connection context. The
  // preview handler consumes that tag synchronously, so the resulting
  // transaction preview carries this session's attribution instead of reading
  // the last-writer-wins shared ref at preview time (NEYN-12452).
  const browserScopedEmbeddedWallet = useMemo(() => {
    const baseProvider = embeddedWallet.evmMiniAppProvider;
    const scopedEvmProvider: typeof baseProvider = {
      ...baseProvider,
      request: ((arg: unknown) => {
        embeddedWallet.pendingConnectionContextRef.current =
          browserConnectionContextRef.current;
        return (baseProvider.request as (a: unknown) => unknown)(arg);
      }) as unknown as typeof baseProvider.request,
    };
    return { ...embeddedWallet, evmMiniAppProvider: scopedEvmProvider };
  }, [embeddedWallet]);

  const providerController = useMemo(
    () =>
      createBrowserProviderController({
        session,
        embeddedWallet: browserScopedEmbeddedWallet,
        requestConnectApproval,
        onConnectAuthorized: ({ address }) => {
          setSessionConnectedAddress(address);
          bumpPermissionsVersion();
        },
        onChainChanged: (nextChainIdHex) => {
          setChainIdHex(nextChainIdHex);
          if (webViewRef.current && session.origin) {
            sendBrowserBridgeEvent({
              webView: webViewRef.current,
              origin: session.origin,
              event: { type: 'chainChanged', payload: nextChainIdHex },
            });
          }
        },
        onUnsupportedRpc: (method) =>
          trackEvent(AnalyticsEvent.VisitingExternalURL, {
            source: 'browser_wallet_unsupported_rpc',
            method,
            origin: session.origin,
          }),
      }),
    [
      bumpPermissionsVersion,
      browserScopedEmbeddedWallet,
      requestConnectApproval,
      session,
      trackEvent,
    ],
  );

  useEffect(() => {
    if (initialUrl === webViewSourceUrl) {
      return;
    }

    invalidateBrowserWebViewRequests({
      webView: webViewRef.current,
      origin: session.origin,
      message:
        'Pending wallet requests were rejected when navigating to a new website',
    });
    providerController.clearPendingRequests();
    embeddedWallet.clearPreviewRequests();
    rejectPendingApproval();
    setPageTitle(undefined);
    setSessionConnectedAddress(undefined);
    setCurrentUrl(initialUrl);
    setWebViewSourceUrl(initialUrl);
  }, [
    embeddedWallet,
    initialUrl,
    providerController,
    rejectPendingApproval,
    session.origin,
    trackEvent,
    webViewSourceUrl,
  ]);

  useEffect(() => {
    // Mirror this session onto the shared connectionContextRef WITHOUT the
    // wallet-link attribution. That ref is last-writer-wins across surfaces, so
    // putting attribution there let it leak onto other surfaces' transactions;
    // attribution instead lives on the session-scoped browserConnectionContextRef
    // (set synchronously during render) that the wrapped provider threads
    // per-request (NEYN-12452).
    const previousContext = previousConnectionContextRef.current;
    embeddedWallet.connectionContextRef.current = {
      source: 'browser',
      domain: session.origin ?? 'unknown',
      origin: session.origin,
      pageTitle,
    };
    return () => {
      embeddedWallet.connectionContextRef.current = previousContext;
    };
  }, [embeddedWallet.connectionContextRef, pageTitle, session.origin]);

  useEffect(() => {
    const run = async () => {
      try {
        const chainId = await embeddedWallet.evmMiniAppProvider.request({
          method: 'eth_chainId',
        });
        setChainIdHex(chainId);
      } catch {
        setChainIdHex('0x1');
      }
    };
    void run();
  }, [embeddedWallet.evmMiniAppProvider]);

  useEffect(() => {
    trackEvent(AnalyticsEvent.VisitingExternalURL, {
      source: source ?? 'manual',
      url: currentUrl,
      origin: session.origin,
    });
  }, [currentUrl, source, session.origin, trackEvent]);

  // Keep the minimized dock bar (origin / title) in sync with the
  // currently-rendered page.
  useEffect(() => {
    if (!session.origin) {
      return;
    }
    onBarUpdate({ origin: session.origin, url: currentUrl, title: pageTitle });
  }, [currentUrl, pageTitle, session.origin, onBarUpdate]);

  const handleNavigationStateChange = useCallback(
    (state: WebViewNavigation) => {
      const nextUrl = state.url;
      const changedOrigin = hasOriginChanged({
        previousUrl: currentUrl,
        nextUrl,
      });

      if (changedOrigin) {
        trackEvent(AnalyticsEvent.VisitingExternalURL, {
          source: 'browser_origin_transition_invalidated_session',
          fromUrl: currentUrl,
          toUrl: nextUrl,
        });
        invalidateBrowserWebViewRequests({
          webView: webViewRef.current,
          origin: session.origin,
          message: 'Pending wallet requests were rejected after origin change',
        });
        providerController.clearPendingRequests();
        embeddedWallet.clearPreviewRequests();
        rejectPendingApproval();
        setSessionConnectedAddress(undefined);
      }

      setCurrentUrl(nextUrl);
      setPageTitle(state.title);
      setCanGoBack(state.canGoBack);
      setCanGoForward(state.canGoForward);
    },
    [
      currentUrl,
      embeddedWallet,
      providerController,
      rejectPendingApproval,
      session.origin,
      trackEvent,
    ],
  );

  const close = useCallback(() => {
    invalidateBrowserWebViewRequests({
      webView: webViewRef.current,
      origin: session.origin,
      message: 'Pending wallet requests were rejected when the browser closed',
    });
    embeddedWallet.clearPreviewRequests();
    providerController.clearPendingRequests();
    rejectPendingApproval();
    onRequestClose();
  }, [
    embeddedWallet,
    onRequestClose,
    providerController,
    rejectPendingApproval,
    session.origin,
  ]);

  const minimize = useCallback(() => {
    // Minimize does NOT touch pending wallet requests — the whole point is
    // to keep the WebView + in-flight state alive while the user steps
    // away. `MinimizedInAppBrowserProvider.minimizeInAppBrowser` already
    // clears preview sheets to avoid a stuck confirm panel.
    onRequestMinimize();
  }, [onRequestMinimize]);

  const handleShare = useCallback(() => {
    if (!currentUrl) {
      return;
    }

    minimize();
    openComposer(createCastParamsWithIntent({ embeds: [currentUrl] }));
  }, [currentUrl, minimize, openComposer]);

  const grantConnection = useCallback(
    (trusted: boolean) => {
      if (!session.origin) {
        return;
      }
      if (activePrivateWalletBlocked) {
        return;
      }
      const resolver = pendingApprovalResolverRef.current;
      const address = embeddedWallet.evmAddress as `0x${string}` | undefined;
      if (resolver) {
        resolver({ type: 'connect', trusted, address });
        trackEvent(AnalyticsEvent.VisitingExternalURL, {
          source: trusted
            ? 'browser_trust_granted'
            : 'browser_connect_approved',
          origin: session.origin,
        });
        return;
      }

      if (!address) {
        return;
      }

      setSessionConnectedAddress(address);
      if (trusted) {
        upsertBrowserPermission(session.origin, {
          connectGranted: true,
          trusted: true,
          connectedAddress: address,
        });
      }
      bumpPermissionsVersion();
      setShowPermissions(false);
      trackEvent(AnalyticsEvent.VisitingExternalURL, {
        source: trusted ? 'browser_trust_granted' : 'browser_connect_approved',
        origin: session.origin,
      });
    },
    [
      activePrivateWalletBlocked,
      bumpPermissionsVersion,
      embeddedWallet.evmAddress,
      session.origin,
      trackEvent,
    ],
  );

  const handleConnectOnce = useCallback(() => {
    grantConnection(false);
  }, [grantConnection]);

  const handleConnectAndTrust = useCallback(() => {
    grantConnection(true);
  }, [grantConnection]);

  const handleEnableWalletAccess = useCallback(async () => {
    if (activePrivateWallets.length === 0) {
      return;
    }
    setIsEnablingWalletAccess(true);
    try {
      const newOverrides: Record<string, 'allowed' | 'blocked'> = {
        ...parseLocalMiniAppPolicyOverrides(rawMiniAppPolicyOverrides),
      };
      for (const wallet of activePrivateWallets) {
        const response = await updateEmbeddedWallet({
          walletId: wallet.id,
          miniAppPolicy: { default: 'allowed' },
        });
        if (
          getWalletMiniAppPermission(response.data.result.wallet) !== 'allowed'
        ) {
          throw new Error('Unexpected mini-app policy response');
        }
        newOverrides[wallet.id] = 'allowed';
      }
      setRawMiniAppPolicyOverrides(JSON.stringify(newOverrides));
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'embeddedWallets',
      });
    } finally {
      setIsEnablingWalletAccess(false);
    }
  }, [
    activePrivateWallets,
    queryClient,
    rawMiniAppPolicyOverrides,
    setRawMiniAppPolicyOverrides,
    updateEmbeddedWallet,
  ]);

  const handleReject = useCallback(() => {
    if (!session.origin) {
      return;
    }
    const resolver = pendingApprovalResolverRef.current;
    if (resolver) {
      resolver({ type: 'reject' });
    } else {
      setApprovalMode(false);
      setShowPermissions(false);
    }
    trackEvent(AnalyticsEvent.VisitingExternalURL, {
      source: 'browser_connect_rejected',
      origin: session.origin,
    });
  }, [session.origin, trackEvent]);

  const handleDisconnect = useCallback(() => {
    if (!session.origin) {
      return;
    }
    revokeBrowserPermission(session.origin);
    setSessionConnectedAddress(undefined);
    // Notify the active page's EIP-1193 provider that the user has
    // disconnected, so dApps clear their "connected" UI state. Pages
    // that subscribed via provider.on('accountsChanged', ...) will get
    // called with [] immediately; pages that don't subscribe just ignore
    // the injection.
    if (webViewRef.current) {
      sendBrowserBridgeEvent({
        webView: webViewRef.current,
        origin: session.origin,
        event: { type: 'accountsChanged', payload: [] },
      });
    }
    bumpPermissionsVersion();
    setShowPermissions(false);
    trackEvent(AnalyticsEvent.VisitingExternalURL, {
      source: 'browser_disconnect',
      origin: session.origin,
    });
  }, [bumpPermissionsVersion, session.origin, trackEvent]);

  const handleRevokeTrust = useCallback(() => {
    if (!session.origin) {
      return;
    }
    upsertBrowserPermission(session.origin, {
      trusted: false,
    });
    bumpPermissionsVersion();
    setShowPermissions(false);
    trackEvent(AnalyticsEvent.VisitingExternalURL, {
      source: 'browser_trust_revoked',
      origin: session.origin,
    });
  }, [bumpPermissionsVersion, session.origin, trackEvent]);

  const handleSheetClose = useCallback(() => {
    if (approvalMode) {
      handleReject();
      return;
    }
    setShowPermissions(false);
  }, [approvalMode, handleReject]);

  // The blocklist is a soft safety filter, not a security boundary. We fail
  // open if the backend errors so a flaky network doesn't take the entire
  // in-app browser offline. Tanstack-query keeps cached data across refetch
  // failures, so previously-loaded entries continue to enforce blocks.
  if (frameBlocklist.isLoading && !frameBlocklist.data) {
    return (
      <View style={[t.flex1]}>
        <BrowserChrome origin={session.origin} onBack={close} onClose={close} />
        <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4]}>
          <Text2 color="secondary">Checking site safety…</Text2>
        </View>
      </View>
    );
  }

  if (initialUrlBlocked) {
    return (
      <View style={[t.flex1]}>
        <BrowserChrome origin={session.origin} onBack={close} onClose={close} />
        <View
          style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4, { gap: 16 }]}
        >
          {isUserBlocked ? (
            <>
              <BlockedSiteIcon size={48} color={t.colors.text.secondary} />
              <Text2 color="secondary" weight="semibold" size="lg">
                You blocked this site
              </Text2>
              <Pressable
                onPress={() => {
                  if (currentHostname) {
                    unblockDomain(currentHostname);
                    bumpUserBlocklist();
                  }
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 28,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: t.colors.bgNewLightGray,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text2 weight="semibold" color="primary">
                  Unblock
                </Text2>
              </Pressable>
            </>
          ) : (
            <Text2 color="secondary">
              This site cannot be opened in Farcaster.
            </Text2>
          )}
        </View>
      </View>
    );
  }

  // session.tier is already recomputed on permissionsVersion bumps via
  // the session useMemo above, so read through it instead of calling
  // getBrowserPermissionTier a second time with a workaround.
  const rawTier = session.tier;
  const currentEvmAddress = embeddedWallet.evmAddress;
  const permissionAddressMatchesActiveWallet =
    permissionRecord?.connectedAddress?.toLowerCase() ===
    currentEvmAddress?.toLowerCase();
  const sessionAddressMatchesActiveWallet =
    session.sessionConnectedAddress?.toLowerCase() ===
    currentEvmAddress?.toLowerCase();
  const connectedAddress = permissionAddressMatchesActiveWallet
    ? permissionRecord?.connectedAddress
    : sessionAddressMatchesActiveWallet
      ? session.sessionConnectedAddress
      : undefined;
  const connected =
    (permissionRecord?.connectGranted &&
      permissionAddressMatchesActiveWallet) ||
    sessionAddressMatchesActiveWallet;
  const tier = connected ? rawTier : rawTier === 0 ? 0 : 1;

  const body = (
    <View style={[t.flex1]}>
      <BrowserChrome
        origin={session.origin}
        onBack={() => {
          if (webViewRef.current) {
            webViewRef.current.goBack();
          }
        }}
        onForward={() => {
          if (webViewRef.current) {
            webViewRef.current.goForward();
          }
        }}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onOpenMenu={() => setShowPermissions(true)}
        onShare={handleShare}
        onClose={close}
      />
      {showQualitySheet && currentHostname ? (
        <MiniAppQualityBottomSheet
          domain={currentHostname}
          name={currentFrame?.name}
          harmful={currentFrame?.harmful}
          onDismiss={() => setShowQualitySheet(false)}
        />
      ) : null}
      <View style={[t.flex1]}>
        <BrowserWebView
          ref={webViewRef}
          url={webViewSourceUrl}
          session={session}
          chainIdHex={chainIdHex}
          injectWindowEthereum={true}
          blockedDomains={blockedDomains}
          allowExternalAppRedirect={source !== 'mini-app-globe'}
          onNavigationStateChange={handleNavigationStateChange}
          onBlockedNavigation={(url) => {
            setCurrentUrl(url);
            setPageTitle(undefined);
            trackEvent(AnalyticsEvent.VisitingExternalURL, {
              source: 'browser_blocked_navigation',
              url,
            });
          }}
          onProviderRequest={providerController.handleRequest}
        />
      </View>
      <BrowserSitePermissionsSheet
        title={pageTitle || currentHostname || session.origin}
        url={currentUrl}
        origin={session.origin}
        trusted={permissionRecord?.trusted ?? false}
        connected={connected}
        tier={tier}
        address={connectedAddress}
        approvalMode={approvalMode}
        visible={showPermissions}
        isAdmin={isAdmin && Boolean(currentHostname)}
        onOpenQuality={
          isAdmin && currentHostname
            ? () => setShowQualitySheet(true)
            : undefined
        }
        onConnectOnce={handleConnectOnce}
        onConnectAndTrust={handleConnectAndTrust}
        onDisconnect={handleDisconnect}
        onRevokeTrust={handleRevokeTrust}
        onRefresh={() => webViewRef.current?.reload()}
        onOpenExternal={() => {
          void Linking.openURL(currentUrl);
        }}
        onBlockSite={
          currentHostname
            ? () => {
                blockDomain(currentHostname);
                bumpUserBlocklist();
                setShowPermissions(false);
              }
            : undefined
        }
        onUnblockSite={
          currentHostname
            ? () => {
                unblockDomain(currentHostname);
                bumpUserBlocklist();
                setShowPermissions(false);
              }
            : undefined
        }
        isSiteBlocked={isUserBlocked}
        onReject={handleReject}
        onClose={handleSheetClose}
        blockedWalletName={
          activePrivateWalletBlocked
            ? (activePrivateWallet?.displayName ?? 'Selected secondary wallet')
            : undefined
        }
        isEnablingWalletAccess={isEnablingWalletAccess}
        onEnableWalletAccess={() => {
          void handleEnableWalletAccess();
        }}
        onSwitchToPublicWallet={selectPrimaryWallet}
      />
    </View>
  );

  // Android + edge-to-edge + react-native-webview + @gorhom/bottom-sheet
  // together produce keyboard jitter: react-native-webview assumes
  // android:windowSoftInputMode="adjustResize", which fights with the
  // sheet's layout and causes the content to bounce as the keyboard
  // animates in/out. Padding via react-native-keyboard-controller avoids
  // that feedback loop. iOS handles this natively; no wrapper needed.
  if (Platform.OS !== 'android') {
    return body;
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={insets.top}
      style={t.flex1}
    >
      {body}
    </KeyboardAvoidingView>
  );
}

/**
 * Back-compat stack-screen route. When a deep link or legacy navigation
 * call lands here, we hand off to the global `MinimizedInAppBrowserProvider`
 * (which owns the persistent WebView surface) and immediately pop so we
 * don't leave an invisible route on the stack.
 */
const InAppBrowserScreen = buildScreen<InAppBrowserScreenProps>(
  { name: 'InAppBrowser' },
  ({ route: { params } }) => {
    const t = useTheme();
    const pop = usePop();
    const { setOpenInAppBrowser } = useMinimizedInAppBrowser();

    useEffect(() => {
      setOpenInAppBrowser({ url: params.url, source: params.source });
      // Defer pop to the next tick so React commits `setOpenInAppBrowser`
      // before the stack unmounts this screen.
      const timer = setTimeout(() => {
        pop();
      }, 0);
      return () => clearTimeout(timer);
    }, [params.source, params.url, pop, setOpenInAppBrowser]);

    // Brief empty frame while the global sheet expands.
    return <View style={[t.flex1, t.bgDefault]} />;
  },
);

export { InAppBrowserScreen, InAppBrowserSurface };
