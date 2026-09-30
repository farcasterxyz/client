/* eslint-disable react-hooks/exhaustive-deps */
import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { Feather, Octicons } from '@expo/vector-icons';
import {
  Back,
  ComposeCast,
  MiniAppHost,
  MiniAppHostCapability,
  OpenMiniApp,
} from '@farcaster/miniapp-core';
import {
  AddMiniApp,
  Context,
  EthProvideRequest,
  MiniAppClientEvent,
  SendToken,
  SwapToken,
  useExposeWebViewToEndpoint,
  useWebViewRpcEndpoint,
  ViewProfile,
} from '@farcaster/miniapp-host-react-native';
import {
  useBottomSheetGestureHandlers,
  useBottomSheetInternal,
} from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  addPathToUrl,
  ApiChain,
  apiChainToChainId,
  apiChainToChainIdOrThrow,
  ApiFrame,
  ApiUser,
  ApiWalletChain,
  getMiniAppCanonicalUrl,
  injectQueryParams,
  isFarcasterApiError,
  isTunnelDomain,
  parseCAIP19Token,
  preserveQueryParams,
  solanaMainnetCaip2Id,
  TxResultSchema,
  WALLET_CHAIN_IDS,
} from 'farcaster-client-data';
import {
  getMiniAppNotificationPreferenceSummary,
  resolveUsernameShort,
  useEnableFrameNotifications,
  useFeatureFlag,
  useFrameAnalytcsProperties,
  useFrameDetails,
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
  usePutMiniAppEvent,
  useResolveMiniAppConfig,
  useSetMiniAppPushNotifications,
  useSignManifest,
  useTrackEvent,
  useUpdateFavoriteFrame,
} from 'farcaster-client-hooks';
import {
  bindSolanaConnIntoRequestFn,
  sizes,
  useEmbeddedWallet,
} from 'farcaster-expo';
import * as Provider from 'ox/Provider';
import type * as RpcSchema from 'ox/RpcSchema';
import * as Siwe from 'ox/Siwe';
import React, {
  FC,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import { uuidv4 } from 'react-native-compressor';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';
import WebView, {
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';

import { Avatar } from '~/components/Avatar';
import { useBottomSheetModalRef } from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { ButtonV2 } from '~/components/ButtonV2';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { ShareIcon } from '~/components/icons/ShareIcon';
import { SquareAddIcon } from '~/components/icons/SquareAddIcon';
import { MiniAppQualityBottomSheet } from '~/components/MiniApp/MiniAppQualityBottomSheet';
import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { Switch } from '~/components/Switch';
import { Text2 } from '~/components/Text';
import { miniAppHeaderHeight } from '~/constants/MiniApp';
import { hitSlop } from '~/constants/Pressable';
import { useConnectedWallet } from '~/contexts/ConnectWalletProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import {
  FollowChannelProvider,
  useFollowChannel,
} from '~/contexts/FarcasterActionsProvider';
import {
  FavoriteFrameProvider,
  useFavoriteFrame,
} from '~/contexts/FavoriteFrameProvider';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { usePushNotificationPermission } from '~/contexts/PushNotificationPermissionProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { isNotificationPromptDisabled } from '~/hooks/pushNotifications/useRequestNotificationsPermission';
import { useHaptics } from '~/hooks/useHaptics';
import { LaunchContext, useLaunchFrame } from '~/hooks/useLaunchFrame';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';
import { trackError } from '~/utils/ErrorUtils';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';
import { logErrorInDevOnly } from '~/utils/LogUtils';
import {
  getMiniAppOpenWindowUrl,
  shouldKeepMiniAppNavigationInContext,
} from '~/utils/MiniAppNavigationUtils';
import { useHeightForExpandingBottomSheet } from '~/utils/MiniAppUtils';
import { truncateAddress } from '~/utils/SolanaUtils';
import { getWarpcastParsedUrl, openWarpcastSettings } from '~/utils/UrlUtils';

import {
  CameraAndMicrophoneAccessProvider,
  useCameraAndMicrophoneAccess,
} from './CameraAndMicrophoneAccessProvider';
import {
  createLaunchMilestoneGuard,
  MiniAppLaunchMilestone,
  recordMiniAppLaunchMilestone,
  shouldFireLaunchMilestone,
} from './miniAppLaunchTelemetry';
import { SignManifestProvider } from './SignManifestProvider';
import {
  ManifestLaunchMiniAppConfig,
  MiniAppProps,
  StandaloneLaunchMiniAppConfig,
} from './types';

type PrimaryButtonState = {
  text: string;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
};

export function MiniApp({
  launchConfig,
  hideHeader,
  externalMenuVisible,
  onExternalMenuDismiss,
  ...rest
}: MiniAppProps) {
  return (
    <FollowChannelProvider>
      <FavoriteFrameProvider>
        {(() => {
          switch (launchConfig.type) {
            case 'standalone':
              return (
                <LaunchStandalone
                  launchConfig={launchConfig}
                  hideHeader={hideHeader}
                  externalMenuVisible={externalMenuVisible}
                  onExternalMenuDismiss={onExternalMenuDismiss}
                  {...rest}
                />
              );
            case 'manifest':
              return (
                <LaunchManifest
                  launchConfig={launchConfig}
                  hideHeader={hideHeader}
                  externalMenuVisible={externalMenuVisible}
                  onExternalMenuDismiss={onExternalMenuDismiss}
                  {...rest}
                />
              );
          }
        })()}
      </FavoriteFrameProvider>
    </FollowChannelProvider>
  );
}

function LaunchStandalone({
  launchConfig,
  hideHeader,
  externalMenuVisible,
  onExternalMenuDismiss,
  ...rest
}: MiniAppProps<StandaloneLaunchMiniAppConfig>) {
  const url = injectQueryParams(
    addPathToUrl(launchConfig.url, launchConfig.path ?? ''),
    launchConfig.queryParams ?? {},
  );

  return (
    <MiniAppContent
      url={url}
      name={launchConfig.name}
      splashImageUrl={launchConfig.splashImageUrl}
      splashBackgroundColor={launchConfig.splashBackgroundColor}
      author={launchConfig.author}
      harmful={launchConfig.harmful}
      timestamp={launchConfig.timestamp}
      hideHeader={hideHeader}
      externalMenuVisible={externalMenuVisible}
      onExternalMenuDismiss={onExternalMenuDismiss}
      {...rest}
    />
  );
}

function LaunchManifest({
  launchConfig,
  hideHeader,
  externalMenuVisible,
  onExternalMenuDismiss,
  ...rest
}: MiniAppProps<ManifestLaunchMiniAppConfig>) {
  const { data } = useFrameDetails({ domain: launchConfig.domain });
  const frame = useGloballyCachedFrame(data);
  const toast = useToast();
  const { closeMiniApp } = useMinimizedMiniApp();

  useEffect(() => {
    if (!frame || frame.harmful) {
      toast.show(
        frame?.harmful
          ? 'App not available'
          : `No frame found for ${launchConfig.domain}`,
        { type: 'danger' },
      );
      closeMiniApp();
    }
  }, [frame, launchConfig.domain, closeMiniApp, toast]);

  if (!frame || frame.harmful) {
    return null;
  }

  const url = injectQueryParams(
    addPathToUrl(launchConfig.url ?? frame.homeUrl, launchConfig.path ?? ''),
    launchConfig.queryParams ?? {},
  );

  return (
    <MiniAppContent
      url={url}
      name={frame.name}
      splashImageUrl={frame.splashImageUrl}
      splashBackgroundColor={frame.splashBackgroundColor}
      author={frame.author}
      harmful={frame.harmful}
      timestamp={launchConfig.timestamp}
      hideHeader={hideHeader}
      externalMenuVisible={externalMenuVisible}
      onExternalMenuDismiss={onExternalMenuDismiss}
      {...rest}
    />
  );
}

/**
 * Normalize a thrown provider error into a plain, JSON-serializable
 * `{ code, message, data }` before it re-enters Comlink.
 *
 * Comlink's default throw serializer keeps only `message`/`name`/`stack` on
 * `Error` instances and drops everything else — notably `.code` and `.data`,
 * the fields a JSON-RPC node error carries (e.g. `-32000 insufficient funds`).
 * Without `.code`, the mini-app's own viem can't classify the failure and
 * surfaces a generic "Unknown provider RPC error" / `InternalRpcError (-32603)`.
 * Comlink preserves a thrown *plain object* whole, so we re-throw one.
 *
 * Mirrors `toRpcError` in InAppBrowser/BrowserProviderController.ts (same Privy
 * provider, same code extraction); `-32603` fallback only when no code is set,
 * so genuine `4001` user-rejections still propagate as cancels.
 */
function toSerializableProviderError(err: unknown): {
  code: number;
  message: string;
  data?: unknown;
} {
  const e = err as { code?: unknown; message?: unknown; data?: unknown } | null;
  const code =
    typeof e?.code === 'number' && Number.isFinite(e.code) ? e.code : -32603;
  const message =
    typeof e?.message === 'string' && e.message.length > 0
      ? e.message
      : code === 4001
        ? 'User rejected the request'
        : 'Internal wallet error';
  return e?.data !== undefined
    ? { code, message, data: e.data }
    : { code, message };
}

// Inner component that uses the camera/microphone context
const MiniAppContentInner = ({
  url,
  name,
  splashBackgroundColor,
  splashImageUrl,
  author,
  harmful,
  context,
  timestamp,
  debug = false,
  hideHeader = false,
  externalMenuVisible = false,
  onExternalMenuDismiss,
}: {
  url: string;
  name: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  author?: ApiUser;
  // Caller-supplied harmful flag. Mirrors web's pattern — lets a caller that
  // already knows the frame is harmful (e.g. via the launch config) hard-block
  // synchronously, before this component's own frame fetch resolves.
  harmful?: boolean;
  context: LaunchContext;
  timestamp: number;
  debug?: boolean;
  hideHeader?: boolean;
  externalMenuVisible?: boolean;
  onExternalMenuDismiss?: () => void;
}) => {
  const currentUser = useCurrentUser_UNSAFE();
  const { trackEvent } = useTrackEvent();
  const webViewRef = useRef<WebView<unknown>>(null);
  const putMiniAppEvent = usePutMiniAppEvent();
  const didOpenFrame = useRef(false);
  const webviewLoadedRef = useRef(false);
  const addRejectedBeforeLoadRef = useRef(false);
  // Launch-waterfall: tracks the launch `timestamp` the `ready` milestone last
  // fired for, so it re-fires on relaunch (this component is reused, not
  // remounted, for a same-domain relaunch). Kept separate from `didOpenFrame`,
  // which gates the initial-open-only analytics below and must NOT re-arm.
  const readyMilestoneFiredFor = useRef<number | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const {
    triggerImpactAsync,
    triggerMediumImpactAsync,
    triggerSuccessNotificationAsync,
  } = useHaptics();
  const toast = useToast();
  const domain = useMemo(() => new URL(url).hostname, [url]);
  const formDomain = React.useMemo(() => {
    return domain.replace(/^www\./, '');
  }, [domain]);
  const { data } = useNonSuspenseFrameDetails({ domain: formDomain });
  const frame = useGloballyCachedFrame(data);
  const eip6963UUID = useRef<string>(undefined);
  const getEip6963UUID = useCallback(() => {
    if (eip6963UUID.current === undefined) {
      eip6963UUID.current = uuidv4();
    }
    return eip6963UUID.current;
  }, []);

  // Mini-app launch waterfall: content mounted means the manifest fetch +
  // bottom-sheet sleep + Suspense are done and we're about to render the
  // WebView. Keyed on `timestamp` so it re-fires when the same app is
  // relaunched (which reuses this component with a new launch timestamp).
  useEffect(() => {
    recordMiniAppLaunchMilestone({
      milestone: 'content_mounted',
      launchTimestamp: timestamp,
      domain: formDomain,
    });
  }, [timestamp, formDomain]);

  // Same-domain relaunches reuse this component, so per-launch refs must reset
  // explicitly. The webview reloads on relaunch and will re-fire `onLoaded`.
  // Keyed on `url` too so an in-place URL change also re-arms the gate.
  useEffect(() => {
    webviewLoadedRef.current = false;
    addRejectedBeforeLoadRef.current = false;
  }, [timestamp, url]);

  const { endpoint, onMessage } = useWebViewRpcEndpoint(webViewRef, domain);
  const emitRaw = useMemo(() => endpoint?.emit, [endpoint?.emit]);
  const emit = useCallback(
    (data: MiniAppClientEvent) => {
      try {
        emitRaw?.(data);
      } catch (error) {
        trackError(error);
        toast.show('Failed to emit event to Mini App', { type: 'danger' });
      }
    },
    [emitRaw, toast],
  );

  const {
    closeMiniApp,
    minimizeMiniApp,
    maximizeMiniApp,
    currentlyMinimized,
    disableGesturesForCurrentMiniApp,
    miniAppLoadingMessage,
    setMiniAppLoadingMessage,
  } = useMinimizedMiniApp();
  const openComposer = useOpenComposer();

  const {
    solanaMiniAppProvider,
    clearPreviewRequests,
    miniAppEvmAddress,
    miniAppSolanaAddress,
    connect: embeddedWalletConnect,
    isConnected: embeddedWalletIsConnected,
  } = useEmbeddedWallet();
  const miniAppSafeEvmAddress = miniAppEvmAddress;
  const miniAppSafeSolanaAddress = miniAppSolanaAddress;
  const { requestPermissions } = useCameraAndMicrophoneAccess();
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [nativeGesturesDisabled, setNativeGesturesDisabled] = useState(false);
  const [backState, setBackState] = useState<Back.BackState>(
    Back.DEFAULT_BACK_STATE,
  );

  const disableNativeGestures = useCallback(() => {
    disableGesturesForCurrentMiniApp();
    setNativeGesturesDisabled(true);
  }, [disableGesturesForCurrentMiniApp]);

  const analyticsContext = useFrameAnalytcsProperties({
    frameUrl: url,
    frameName: name,
    author,
    platform: 'mobile',
  });

  const didCloseHarmful = useRef(false);
  useEffect(() => {
    if (frame?.harmful && !debug && !didCloseHarmful.current) {
      didCloseHarmful.current = true;
      toast.show('App not available', { type: 'danger' });
      closeMiniApp();
    }
  }, [frame?.harmful, debug, toast, closeMiniApp]);

  // We should improve sanitization and move into the shared library
  const handleUpdateBackState = useCallback(
    async (state: Back.BackState) => {
      trackEvent(AnalyticsEvent.FrameUpdateBackState, {
        ...analyticsContext,
        visible: state.visible,
      });

      setBackState({
        visible: state.visible,
      });

      // On mobile a swipe gesture is used for back that conflicts with the
      // swipe down to dismiss gesture (manifests as being hard to swipe back
      // since there are two axes of freedom).
      if (state.visible) {
        disableNativeGestures();
      }
    },
    [disableNativeGestures, trackEvent, analyticsContext],
  );

  const triggerBack = useCallback(async () => {
    emit?.({ event: 'back_navigation_triggered' });
  }, [emit]);

  const cancel = useCallback(() => {
    // Clear any pending transaction preview requests
    clearPreviewRequests();

    if (didOpenFrame.current) {
      void putMiniAppEvent({
        domain,
        event: 'close',
        platformType: 'mobile',
      }).catch((e) => {
        trackError(e);
      });
    }
    closeMiniApp();
  }, [domain, closeMiniApp, putMiniAppEvent, clearPreviewRequests]);

  const refresh = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  // Debug-only "Clear browser state": scoped to this mini app's own WebView.
  // The full app-wide wipe (clearAllWebViewStorage) belongs on the sign-out
  // boundary, not a per-mini-app debug button — running it here also tears down
  // the always-mounted embedded-wallet WebViews mid-session.
  const clearWebviewCache = useCallback(() => {
    webViewRef.current?.clearCache?.(true);
  }, []);

  const ready = useCallback<MiniAppHost['ready']>(
    async (
      options = {
        disableNativeGestures: false,
      },
    ) => {
      DdRum.addTiming('app_frame_splash_hidden');
      // Hide the splash as soon as the mini app signals ready, rather than
      // forcing a 600ms minimum. The previous 600ms floor added up to ~600ms of
      // perceived latency to every launch with no benefit once the app is
      // interactive.
      setShowSplashScreen(false);

      if (options?.disableNativeGestures) {
        disableNativeGestures();
      }

      // Record the `ready` milestone once per launch (re-fires on relaunch),
      // independent of the initial-open-only analytics gated by didOpenFrame.
      if (readyMilestoneFiredFor.current !== timestamp) {
        readyMilestoneFiredFor.current = timestamp;
        recordMiniAppLaunchMilestone({
          milestone: 'ready',
          launchTimestamp: timestamp,
          domain: formDomain,
        });
      }

      // Only track events on initial open
      if (!didOpenFrame.current) {
        didOpenFrame.current = true;

        trackEvent(AnalyticsEvent.FrameReady, {
          ...analyticsContext,
          disableNativeGestures: options?.disableNativeGestures,
        });

        void putMiniAppEvent({
          domain,
          event: 'open',
          platformType: 'mobile',
        }).catch((e) => {
          if (isFarcasterApiError(e) && e.status === 429) {
            return;
          }

          trackError(e);
        });
      }
    },
    [
      putMiniAppEvent,
      domain,
      formDomain,
      disableNativeGestures,
      trackEvent,
      analyticsContext,
      timestamp,
    ],
  );

  const handleCloseMessage = useCallback(() => {
    // Clear any pending transaction preview requests
    clearPreviewRequests();

    trackEvent(AnalyticsEvent.FrameClose, {
      ...analyticsContext,
    });

    void putMiniAppEvent({
      domain,
      event: 'close',
      platformType: 'mobile',
    }).catch((e) => {
      trackError(e);
    });
    closeMiniApp();
  }, [
    domain,
    closeMiniApp,
    putMiniAppEvent,
    trackEvent,
    analyticsContext,
    clearPreviewRequests,
  ]);

  const openUrl = usePossiblyNavigateOrOpenUrl();
  const { account } = useWallet();
  const { signManifest } = useSignManifest();

  const handleOpenUrl = useCallback(
    (url: string) => {
      trackEvent(AnalyticsEvent.FrameOpenUrl, {
        ...analyticsContext,
        url: new URL(url).hostname, // Only track hostname for privacy
      });

      triggerImpactAsync();

      // Check if the URL is external (not a Warpcast/Farcaster URL)
      // Only minimize if it's an internal URL that will navigate within the app
      const isInternalUrl = !!getWarpcastParsedUrl(url);
      if (isInternalUrl) {
        minimizeMiniApp();
      }

      openUrl({
        url,
        openExternalTarget: 'system',
        // since this is a modal we must navigate
        navMethod: 'navigate',
      });
    },
    [
      openUrl,
      minimizeMiniApp,
      triggerImpactAsync,
      trackEvent,
      analyticsContext,
      domain,
      name,
    ],
  );

  const [primaryButton, setPrimaryButton] = useState<PrimaryButtonState | null>(
    null,
  );
  const [showQualitySheet, setShowQualitySheet] = useState(false);
  const handleSetPrimaryButton = useCallback(
    (message: { text: string }) => {
      trackEvent(AnalyticsEvent.FrameSetPrimaryButton, {
        ...analyticsContext,
        buttonText: message.text,
      });

      setPrimaryButton(message);
    },
    [trackEvent, analyticsContext, domain, name],
  );
  const handlePrimaryButtonPress = () => {
    emit?.({ event: 'primary_button_clicked' });
  };

  const push = usePush();
  const pushToUserProfile = usePushToUserProfile();
  const resolveMiniAppConfig = useResolveMiniAppConfig();
  const launchFrame = useLaunchFrame();

  const handleOpenMiniApp = useCallback(
    async ({ url }: OpenMiniApp.OpenMiniAppOptions) => {
      const urlDomain = new URL(url).hostname;

      const navigateText =
        urlDomain !== 'farcaster.xyz'
          ? `Navigating to ${urlDomain}`
          : 'Navigating...';
      setMiniAppLoadingMessage(navigateText);

      const config = await resolveMiniAppConfig(url).catch((error) => {
        logErrorInDevOnly(error);
        return { url, name: urlDomain } as const;
      });

      trackEvent(AnalyticsEvent.FrameOpenMiniApp, {
        ...analyticsContext,
        requestedDomain: urlDomain,
      });

      try {
        await launchFrame({
          context: {
            type: 'open_miniapp',
            referrerDomain: domain,
          },
          config: {
            ...config,
            url: preserveQueryParams({ launchUrl: config.url, sourceUrl: url }),
          },
          author: 'author' in config ? config.author : undefined,
          onComplete: () => {
            setMiniAppLoadingMessage(null);
          },
          skipConfirmation: true,
        });
      } finally {
        setMiniAppLoadingMessage(null);
      }
    },
    [
      resolveMiniAppConfig,
      domain,
      launchFrame,
      setMiniAppLoadingMessage,
      trackEvent,
      analyticsContext,
    ],
  );

  const handleViewProfile = useCallback<ViewProfile.ViewProfile>(
    async (params) => {
      trackEvent(AnalyticsEvent.FrameViewProfile, {
        ...analyticsContext,
        fid: params.fid,
      });

      triggerImpactAsync();
      minimizeMiniApp();
      pushToUserProfile({ fid: params.fid });
    },
    [
      trackEvent,
      triggerImpactAsync,
      minimizeMiniApp,
      pushToUserProfile,
      analyticsContext,
    ],
  );

  const handleViewToken = useCallback(
    async ({ token }: { token: string }) => {
      trackEvent(AnalyticsEvent.FrameViewToken, {
        ...analyticsContext,
        hasToken: !!token,
      });

      const erc20 = parseCAIP19Token(token);
      if (!erc20) {
        throw new Error('invalid token');
      }

      minimizeMiniApp();

      push('Token', {
        chain: erc20.chain,
        ca: erc20.ca,
        via: 'miniapp_view_token',
      });
    },
    [push, minimizeMiniApp, trackEvent, analyticsContext],
  );

  const handleSwapToken = useCallback(
    async ({
      buyToken,
      sellToken,
      sellAmount,
    }: {
      buyToken?: string;
      sellToken?: string;
      sellAmount?: string;
    }): Promise<SwapToken.SwapTokenResult> => {
      trackEvent(AnalyticsEvent.FrameSwapToken, {
        ...analyticsContext,
        hasBuyToken: !!buyToken,
        hasSellToken: !!sellToken,
        hasSellAmount: !!sellAmount,
      });

      const buy = buyToken ? parseCAIP19Token(buyToken) : undefined;
      const sell = sellToken ? parseCAIP19Token(sellToken) : undefined;

      return new Promise((resolve) => {
        const onSuccess = (hashes: string[]) => {
          // Report mini app transaction
          if (
            hashes.length > 0 &&
            sell?.chain &&
            buyToken &&
            sellToken &&
            sellAmount
          ) {
            putMiniAppEvent({
              domain,
              event: 'tx',
              platformType: 'mobile',
              metadata: {
                id: hashes[0],
                type: 'swap-token',
                buyToken,
                sellToken,
                sellAmount,
              },
            }).catch((e) => {
              trackError(e);
            });
          }

          resolve({
            success: true as const,
            swap: {
              transactions: hashes,
            },
          } as SwapToken.SwapTokenResult);
        };

        const onError = (reason: string) => {
          resolve({
            success: false as const,
            reason,
          } as SwapToken.SwapTokenResult);
        };

        const onSwapExecuted = () => {
          maximizeMiniApp();
        };

        minimizeMiniApp();

        push('WalletSwap', {
          platformType: 'mobile',
          swapIntent: {
            buy: buy
              ? {
                  chainId: Number(apiChainToChainIdOrThrow(buy.chain)),
                  address: buy.ca,
                }
              : undefined,
            sell: sell
              ? {
                  chainId: Number(apiChainToChainIdOrThrow(sell.chain)),
                  address: sell.ca,
                }
              : undefined,
            sellAmount,
          },
          attributedDomain: domain,
          onSwapExecuted,
          onSuccess,
          onError,
        });
      });
    },
    [
      push,
      domain,
      minimizeMiniApp,
      maximizeMiniApp,
      trackEvent,
      analyticsContext,
      name,
      putMiniAppEvent,
    ],
  );

  const handleSendToken = useCallback(
    async ({
      token,
      amount,
      recipientAddress,
      recipientFid,
    }: {
      token?: string;
      amount?: string;
      recipientAddress?: string;
      recipientFid?: number;
    }): Promise<SendToken.SendTokenResult> => {
      trackEvent(AnalyticsEvent.FrameSendToken, {
        ...analyticsContext,
        hasToken: !!token,
        hasAmount: !!amount,
        hasRecipientAddress: !!recipientAddress,
        hasRecipientFid: !!recipientFid,
      });

      let sendIntent:
        | {
            chain: ApiChain;
            ca: string;
            amount?: string;
            recipientAddress?: string;
            recipientFid?: number;
          }
        | undefined;

      if (token) {
        const erc20 = parseCAIP19Token(token);
        if (!erc20) {
          throw new Error('invalid token');
        }
        sendIntent = {
          chain: erc20.chain,
          ca: erc20.ca,
          amount,
          recipientAddress,
          recipientFid,
        };
      }

      return new Promise((resolve) => {
        const onSuccess = (hash: string) => {
          // Report mini app transaction
          if (sendIntent) {
            const walletChain: ApiWalletChain =
              sendIntent.chain === 'solana' ? 'solana' : 'eth';
            const chainId = Number(apiChainToChainId(sendIntent.chain));
            putMiniAppEvent({
              domain,
              event: 'tx',
              platformType: 'mobile',
              metadata: {
                id: hash,
                type: 'send-token',
                walletChain,
                walletAddress:
                  walletChain === 'solana'
                    ? (miniAppSafeSolanaAddress as string)
                    : (miniAppSafeEvmAddress as string),
                chainId,
              },
            }).catch((e) => {
              trackError(e);
            });
          }

          resolve({
            success: true as const,
            send: {
              transaction: hash,
            },
          } as SendToken.SendTokenResult);
        };

        const onError = (reason: string) => {
          resolve({
            success: false as const,
            reason,
          } as SendToken.SendTokenResult);
        };

        const onSendExecuted = () => {
          maximizeMiniApp();
        };

        minimizeMiniApp();

        push('WalletSend', {
          platformType: 'mobile',
          sendIntent,
          attributedDomain: domain,
          onSendExecuted,
          onSuccess,
          onError,
        });
      });
    },
    [
      push,
      domain,
      minimizeMiniApp,
      maximizeMiniApp,
      trackEvent,
      analyticsContext,
      name,
      putMiniAppEvent,
      miniAppSafeEvmAddress,
      miniAppSafeSolanaAddress,
    ],
  );

  const { followChannel } = useFollowChannel();
  const handleFollowChannel = useCallback(
    ({ key }: { key: string }) => {
      trackEvent(AnalyticsEvent.FrameFollowChannel, {
        ...analyticsContext,
        channelKey: key,
      });

      triggerImpactAsync();

      return followChannel({ key });
    },
    [
      followChannel,
      triggerImpactAsync,
      trackEvent,
      analyticsContext,
      domain,
      name,
    ],
  );

  const {
    provider: ethProvider,
    wallet: providerWallet,
    connect,
  } = useConnectedWallet();

  providerWallet.connectionContextRef.current = {
    source: 'mini-app',
    domain,
    iconUrl: splashImageUrl,
    surface: 'mini_app',
  };

  const handleProviderRequest = useCallback(
    async (parameters: RpcSchema.ExtractRequest<RpcSchema.Default>) => {
      try {
        switch (parameters.method) {
          case 'eth_signTransaction':
          case 'eth_sendTransaction': {
            trackEvent(AnalyticsEvent.RequestFrameEthTransaction, {
              method: parameters.method,
              ...analyticsContext,
            });
            const result = await ethProvider.request(parameters);
            trackEvent(AnalyticsEvent.ConfirmFrameEthTransaction, {
              method: parameters.method,
              ...analyticsContext,
            });
            return result;
          }
          case 'personal_sign':
          case 'eth_signTypedData_v4': {
            trackEvent(AnalyticsEvent.RequestFrameEthSignature, {
              method: parameters.method,
              ...analyticsContext,
            });
            const result = await ethProvider.request(parameters);
            trackEvent(AnalyticsEvent.ConfirmFrameEthSignature, {
              method: parameters.method,
              ...analyticsContext,
            });
            return result;
          }
          default:
            return await ethProvider.request(parameters);
        }
      } catch (err) {
        // Re-throw a plain, serializable error so Comlink preserves .code/.data
        // across the WebView bridge; otherwise the mini-app sees a codeless
        // Error and mislabels node errors as a generic "Unknown provider RPC
        // error" / -32603. See toSerializableProviderError above.
        throw toSerializableProviderError(err);
      }
    },
    [analyticsContext, trackEvent, ethProvider],
  );

  const locationContext: Context.LocationContext | undefined = useMemo(
    () => (context.type !== 'dev_preview' ? context : undefined),
    [context],
  );
  const isDevPreview = context.type === 'dev_preview';

  const { confirmAddFavoriteFrame } = useFavoriteFrame();
  const promptedToAddFavoriteFrame = useRef(false);
  const handleAddMiniApp = useCallback(async () => {
    trackEvent(AnalyticsEvent.FrameAddMiniApp, {
      ...analyticsContext,
      alreadyFavorited: frame?.viewerContext?.favorited || false,
    });

    if (!frame) {
      emit?.({
        event: 'miniapp_add_rejected',
        reason: 'invalid_domain_manifest',
      });
      return Promise.reject(new AddMiniApp.InvalidDomainManifest());
    }

    if (frame.viewerContext?.favorited) {
      emit?.({
        event: 'miniapp_added',
        notificationDetails: frame.viewerContext?.notificationDetails,
      });

      return Promise.resolve<AddMiniApp.AddMiniAppResult>({
        notificationDetails: frame.viewerContext?.notificationDetails,
      });
    }

    // Avoid spamming by only allowing to ask the user once
    if (promptedToAddFavoriteFrame.current) {
      emit?.({ event: 'miniapp_add_rejected', reason: 'rejected_by_user' });
      return Promise.reject(new AddMiniApp.RejectedByUser());
    }

    promptedToAddFavoriteFrame.current = true;
    try {
      return await confirmAddFavoriteFrame({
        frame,
        emit,
        emitOnRejection: true,
      });
    } catch (e) {
      // Many mini apps follow the pattern `await sdk.actions.addFrame();
      // await sdk.actions.ready();` and never reach `ready()` when the user
      // declines. Hide the splash so the user isn't trapped on a permanent
      // spinner; if the webview hasn't loaded yet, defer the hide until it does.
      if (e instanceof AddMiniApp.RejectedByUser) {
        if (webviewLoadedRef.current) {
          setShowSplashScreen(false);
        } else {
          addRejectedBeforeLoadRef.current = true;
        }
      }
      throw e;
    }
  }, [
    frame,
    confirmAddFavoriteFrame,
    emit,
    trackEvent,
    analyticsContext,
    domain,
    name,
  ]);

  // const webViewRef = useRef<WebView>(null);

  // const user = useCurrentUser_UNSAFE();
  const handleSignIn = useCallback<MiniAppHost['signIn']>(
    async (options) => {
      trackEvent(AnalyticsEvent.FrameSignIn, {
        ...analyticsContext,
        hasNonce: !!options.nonce,
        hasNotBefore: !!options.notBefore,
        hasExpirationTime: !!options.expirationTime,
      });

      const data = {
        version: '1',
        address: account!.address,
        statement: 'Farcaster Auth',
        chainId: 10,
        resources: [`farcaster://fid/${currentUser.fid}`] as string[],
        domain,
        // ensure valid RFC 3986 resource URI, a bit surprised this is needed
        // but URLs of origins without trailing slashes were throwing from ox
        uri: new URL(url).href,
        nonce: options.nonce,
        notBefore: options.notBefore ? new Date(options.notBefore) : undefined,
        expirationTime: options.expirationTime
          ? new Date(options.expirationTime)
          : undefined,
      } as const satisfies Siwe.Message;

      const message = Siwe.createMessage(data);
      const signature = await account!.signMessage({ message });

      return {
        authMethod: 'custody',
        message,
        signature,
      };
    },
    [currentUser.fid, domain, url, trackEvent, analyticsContext, name],
  );

  const handleComposeCast = useCallback(
    <close extends boolean | undefined = undefined>(
      options: ComposeCast.Options<close>,
    ): Promise<ComposeCast.Result<close>> => {
      trackEvent(AnalyticsEvent.FrameComposeCast, {
        ...analyticsContext,
        close: options.close,
        hasText: !!options.text,
        hasEmbeds: !!(options.embeds && options.embeds.length > 0),
        hasParent: !!options.parent,
        hasChannelKey: !!options.channelKey,
      });

      if (options.close) {
        closeMiniApp();
      } else {
        minimizeMiniApp();
      }

      if (options.close) {
        openComposer({
          intent: {
            text: options.text ?? '',
            embeds: options.embeds ?? [],
            parentCastHash: options.parent?.hash,
            mentions: [],
            channelKey: options.channelKey,
          },
        });
        return Promise.resolve(undefined as ComposeCast.Result<close>);
      }

      return new Promise((resolve) => {
        const onSuccess = (cast: ComposeCast.Result<false>['cast']) => {
          maximizeMiniApp();
          resolve({
            cast,
          } as ComposeCast.Result<close>);
        };

        const onDismiss = () => {
          maximizeMiniApp();
          resolve({
            cast: null,
          } as ComposeCast.Result<close>);
        };

        openComposer({
          intent: {
            text: options.text ?? '',
            embeds: options.embeds ?? [],
            parentCastHash: options.parent?.hash,
            mentions: [],
            channelKey: options.channelKey,
          },
          onSuccess,
          onDismiss,
        });
      });
    },
    [
      closeMiniApp,
      maximizeMiniApp,
      minimizeMiniApp,
      openComposer,
      trackEvent,
      analyticsContext,
    ],
  );

  const handleRequestCameraAndMicrophoneAccess = useCallback(async () => {
    trackEvent(AnalyticsEvent.FrameRequestCameraAndMicrophoneAccess, {
      ...analyticsContext,
    });
    await requestPermissions();
  }, [requestPermissions, trackEvent, analyticsContext]);

  const handleViewCast = useCallback(
    async ({ hash, close }: { hash: string; close?: boolean }) => {
      trackEvent(AnalyticsEvent.FrameViewCast, {
        ...analyticsContext,
        hash,
        close,
      });

      triggerImpactAsync();

      if (close) {
        closeMiniApp();
      } else {
        minimizeMiniApp();
      }

      push('Cast', { castHash: hash });
      return undefined;
    },
    [
      trackEvent,
      triggerImpactAsync,
      closeMiniApp,
      minimizeMiniApp,
      push,
      analyticsContext,
    ],
  );

  const baseRequestFn = solanaMiniAppProvider.request;
  const solanaProviderRequest = useMemo(
    () => bindSolanaConnIntoRequestFn(baseRequestFn),
    [baseRequestFn],
  );

  // Haptic feedback handlers
  const handleImpactOccurred = useCallback(
    async (type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid') => {
      trackEvent(AnalyticsEvent.FrameHapticFeedback, {
        ...analyticsContext,
        hapticType: 'impact',
        impactType: type,
      });

      switch (type) {
        case 'light':
        case 'soft':
          triggerImpactAsync();
          break;
        case 'medium':
        case 'heavy':
        case 'rigid':
          triggerMediumImpactAsync();
          break;
        default:
          triggerImpactAsync();
      }
    },
    [
      triggerImpactAsync,
      triggerMediumImpactAsync,
      trackEvent,
      analyticsContext,
    ],
  );

  const handleNotificationOccurred = useCallback(
    async (type: 'success' | 'warning' | 'error') => {
      trackEvent(AnalyticsEvent.FrameHapticFeedback, {
        ...analyticsContext,
        hapticType: 'notification',
        notificationType: type,
      });

      // Map all notification types to success for now
      triggerSuccessNotificationAsync();
    },
    [triggerSuccessNotificationAsync, trackEvent, analyticsContext],
  );

  const handleSelectionChanged = useCallback(async () => {
    trackEvent(AnalyticsEvent.FrameHapticFeedback, {
      ...analyticsContext,
      hapticType: 'selection',
    });

    // Map selection to light impact
    triggerImpactAsync();
  }, [triggerImpactAsync, trackEvent, analyticsContext]);

  const getCapabilities = useCallback(async (): Promise<
    MiniAppHostCapability[]
  > => {
    return [
      // We used getEvmProvider for a short period before getEthereumProvider.
      // We include the old key in case of a mini app with an old SDK.
      'wallet.getEvmProvider' as MiniAppHostCapability,
      'wallet.getEthereumProvider',
      'actions.ready',
      'actions.openUrl',
      'actions.openMiniApp',
      'actions.close',
      'actions.setPrimaryButton',
      'actions.addMiniApp',
      'actions.signIn',
      'actions.viewProfile',
      'actions.composeCast',
      'actions.viewCast',
      'actions.viewToken',
      'actions.sendToken',
      'actions.swapToken',
      'actions.requestCameraAndMicrophoneAccess',
      'wallet.getSolanaProvider',
      'haptics.impactOccurred',
      'haptics.notificationOccurred',
      'haptics.selectionChanged',
      'experimental.signManifest',
      'back',
    ];
  }, []);

  const getChains = useCallback(async () => {
    const evmChainIds = WALLET_CHAIN_IDS.map(
      (eip155Id) => `eip155:${eip155Id}`,
    );
    return [...evmChainIds, solanaMainnetCaip2Id];
  }, []);

  const { hasPermissions } = useCameraAndMicrophoneAccess();

  const handleSignManifest = useCallback(
    async ({ domain }: { domain: string }) => {
      const signature = await signManifest({ domain });
      return signature;
    },
    [signManifest],
  );

  const sdk = useMemo<
    Omit<MiniAppHost, 'ethProviderRequestV2' | 'addFrame'>
  >(() => {
    return {
      context: {
        user: {
          fid: currentUser.fid,
          username: currentUser.username,
          displayName: currentUser.displayName,
          pfpUrl: currentUser.pfp?.url,
          location: currentUser.profile.location,
        },
        location: locationContext,
        client: {
          platformType: 'mobile',
          clientFid: 9152,
          added: frame?.viewerContext?.favorited || false,
          safeAreaInsets: {
            top: 0,
            left: 0,
            right: 0,
            bottom: insets.bottom,
          },
          notificationDetails: frame?.viewerContext?.notificationsEnabled
            ? frame?.viewerContext?.notificationDetails
            : undefined,
        },
        features: {
          haptics: true,
          cameraAndMicrophoneAccess: hasPermissions,
        },
      },
      close: handleCloseMessage,
      ready: ready,
      setPrimaryButton: handleSetPrimaryButton,
      signManifest: handleSignManifest,
      signIn: handleSignIn,
      ethProviderRequest: handleProviderRequest as EthProvideRequest,
      solanaProviderRequest,
      openUrl: handleOpenUrl,
      followChannel: handleFollowChannel,
      addMiniApp: handleAddMiniApp,
      viewProfile: handleViewProfile,
      viewToken: handleViewToken,
      swapToken: handleSwapToken,
      sendToken: handleSendToken,
      updateBackState: handleUpdateBackState,
      openMiniApp: handleOpenMiniApp,
      eip6963RequestProvider: () => {
        emit?.({
          event: 'eip6963:announceProvider',
          info: {
            name: 'Farcaster',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiPjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiByeD0iNTYiIGZpbGw9IiM3QzY1QzEiPjwvcmVjdD48cGF0aCBkPSJNMTgzLjI5NiA3MS42OEgyMTEuOTY4TDIwNy44NzIgOTQuMjA4SDIwMC43MDRWMTgwLjIyNEwyMDEuMDIgMTgwLjIzMkMyMDQuMjY2IDE4MC4zOTYgMjA2Ljg0OCAxODMuMDgxIDIwNi44NDggMTg2LjM2OFYxOTEuNDg4TDIwNy4xNjQgMTkxLjQ5NkMyMTAuNDEgMTkxLjY2IDIxMi45OTIgMTk0LjM0NSAyMTIuOTkyIDE5Ny42MzJWMjAyLjc1MkgxNTUuNjQ4VjE5Ny42MzJDMTU1LjY0OCAxOTQuMzQ1IDE1OC4yMjkgMTkxLjY2IDE2MS40NzYgMTkxLjQ5NkwxNjEuNzkyIDE5MS40ODhWMTg2LjM2OEMxNjEuNzkyIDE4My4wODEgMTY0LjM3MyAxODAuMzk2IDE2Ny42MiAxODAuMjMyTDE2Ny45MzYgMTgwLjIyNFYxMzguMjRDMTY3LjkzNiAxMTYuMTg0IDE1MC4wNTYgOTguMzA0IDEyOCA5OC4zMDRDMTA1Ljk0NCA5OC4zMDQgODguMDYzOCAxMTYuMTg0IDg4LjA2MzggMTM4LjI0VjE4MC4yMjRMODguMzc5OCAxODAuMjMyQzkxLjYyNjIgMTgwLjM5NiA5NC4yMDc4IDE4My4wODEgOTQuMjA3OCAxODYuMzY4VjE5MS40ODhMOTQuNTIzOCAxOTEuNDk2Qzk3Ljc3MDIgMTkxLjY2IDEwMC4zNTIgMTk0LjM0NSAxMDAuMzUyIDE5Ny42MzJWMjAyLjc1Mkg0My4wMDc4VjE5Ny42MzJDNDMuMDA3OCAxOTQuMzQ1IDQ1LjU4OTQgMTkxLjY2IDQ4LjgzNTggMTkxLjQ5Nkw0OS4xNTE4IDE5MS40ODhWMTg2LjM2OEM0OS4xNTE4IDE4My4wODEgNTEuNzMzNCAxODAuMzk2IDU0Ljk3OTggMTgwLjIzMkw1NS4yOTU4IDE4MC4yMjRWOTQuMjA4SDQ4LjEyNzhMNDQuMDMxOCA3MS42OEg3Mi43MDM4VjU0LjI3MkgxODMuMjk2VjcxLjY4WiIgZmlsbD0id2hpdGUiPjwvcGF0aD48L3N2Zz4K',
            // use the rdns from @farcaster/wagmi-frame-connector so it'll get
            // deduped in cases where the user is configuring manually and is
            // supporting injected wallet discovery
            rdns: 'xyz.farcaster.MiniAppWallet',
            uuid: getEip6963UUID(),
          },
        });
      },
      composeCast: handleComposeCast,
      getCapabilities,
      getChains,
      viewCast: handleViewCast,
      impactOccurred: handleImpactOccurred,
      notificationOccurred: handleNotificationOccurred,
      selectionChanged: handleSelectionChanged,
      requestCameraAndMicrophoneAccess: handleRequestCameraAndMicrophoneAccess,
    };
  }, [
    currentUser.fid,
    currentUser.username,
    currentUser.displayName,
    currentUser.pfp?.url,
    currentUser.profile.location,
    locationContext,
    frame?.viewerContext?.favorited,
    frame?.viewerContext?.notificationsEnabled,
    frame?.viewerContext?.notificationDetails,
    insets.bottom,
    getEip6963UUID,
    handleCloseMessage,
    ready,
    handleSetPrimaryButton,
    handleSignIn,
    handleProviderRequest,
    handleOpenUrl,
    handleFollowChannel,
    handleAddMiniApp,
    handleViewProfile,
    handleViewToken,
    handleSwapToken,
    handleSendToken,
    handleViewCast,
    emit,
    handleComposeCast,
    solanaProviderRequest,
    getCapabilities,
    getChains,
    handleImpactOccurred,
    handleNotificationOccurred,
    handleSelectionChanged,
    handleUpdateBackState,
    handleOpenMiniApp,
    handleRequestCameraAndMicrophoneAccess,
    handleSignManifest,
    hasPermissions,
  ]);

  const instrumentedEthProvider = useMemo(() => {
    return {
      on: ethProvider.on.bind(ethProvider),
      removeListener: ethProvider.removeListener.bind(ethProvider),
      async request(parameters: RpcSchema.ExtractRequest<RpcSchema.Default>) {
        try {
          DdRum.addAction(RumActionType.CUSTOM, `frame:eth_provider:request`, {
            method: parameters.method,
            params: parameters.params,
            domain,
          });
        } catch {
          // no-op
        }

        if (!providerWallet.address && providerWallet.type !== 'warpcast') {
          await connect();
        }

        if (!providerWallet.address && providerWallet.type === 'warpcast') {
          if (parameters.method === 'eth_accounts') {
            return [];
          }
          if (parameters.method === 'eth_requestAccounts') {
            return ethProvider.request(parameters);
          }
          throw new Provider.ProviderRpcError(
            4100,
            'Farcaster Wallet is not enabled for this mini app',
          );
        }

        if (
          providerWallet.address &&
          providerWallet.type === 'warpcast' &&
          (parameters.method === 'eth_accounts' ||
            parameters.method === 'eth_requestAccounts')
        ) {
          return [providerWallet.address];
        }

        // Defensive preflight: if using embedded wallet, ensure embedded providers are initialized.
        // Run this only after blocked mini-app wallet access has been rejected.
        if (providerWallet.type === 'warpcast' && !embeddedWalletIsConnected) {
          await embeddedWalletConnect();
        }

        try {
          switch (parameters.method) {
            case 'wallet_sendCalls': {
              const resultPayload = await ethProvider.request(parameters);
              const result = TxResultSchema.safeParse(resultPayload);
              if (!result.success) {
                logErrorInDevOnly(
                  `[MiniApp] Invalid result from wallet_sendCalls: ${JSON.stringify(result.error)}. Payload: ${JSON.stringify(resultPayload)}`,
                );
                return resultPayload;
              }

              if (!providerWallet.address) {
                return resultPayload;
              }

              const walletAddress = providerWallet.address;
              const chainIdHex = await ethProvider.request({
                method: 'eth_chainId',
              });
              const chainId = parseInt(chainIdHex, 16);
              const allCalls = parameters.params[0].calls.map((_call, idx) => {
                return putMiniAppEvent({
                  domain,
                  platformType: 'mobile',
                  event: 'tx',
                  metadata: {
                    id: `${result.data.id}-${idx}`,
                    type: 'tx',
                    walletChain: 'eth',
                    walletAddress,
                    chainId,
                    provider: providerWallet.type || 'warpcast',
                  },
                });
              });
              Promise.all(allCalls).catch((e) => {
                trackError(e);
              });

              return resultPayload;
            }
            case 'eth_signTransaction':
            case 'eth_sendTransaction': {
              trackEvent(AnalyticsEvent.RequestFrameEthTransaction, {
                method: parameters.method,
                ...analyticsContext,
              });
              const result = await ethProvider.request(parameters);

              // Record mini app transaction
              if (
                parameters.method === 'eth_sendTransaction' &&
                providerWallet.address
              ) {
                // Get the chainId from the provider
                const chainIdHex = await ethProvider.request({
                  method: 'eth_chainId',
                });
                const chainId = parseInt(chainIdHex, 16);

                putMiniAppEvent({
                  domain,
                  event: 'tx',
                  platformType: 'mobile',
                  metadata: {
                    id: result,
                    type: 'tx',
                    walletChain: 'eth',
                    walletAddress: providerWallet.address,
                    chainId,
                    provider: providerWallet.type || 'warpcast',
                  },
                });
              }

              trackEvent(AnalyticsEvent.ConfirmFrameEthTransaction, {
                method: parameters.method,
                ...analyticsContext,
              });
              return result;
            }
            case 'personal_sign':
            case 'eth_signTypedData_v4': {
              trackEvent(AnalyticsEvent.RequestFrameEthSignature, {
                method: parameters.method,
                ...analyticsContext,
              });
              const result = await ethProvider.request(parameters);
              trackEvent(AnalyticsEvent.ConfirmFrameEthSignature, {
                method: parameters.method,
                ...analyticsContext,
              });
              return result;
            }
            default:
              return await ethProvider.request(parameters);
          }
        } catch (e) {
          if (!(e instanceof Provider.ProviderRpcError)) {
            trackError(e);
          }

          // This provider is exposed directly to the WebView (getEthereumProvider
          // / v2 path), so the throw crosses Comlink — re-throw a plain object so
          // .code/.data survive. Also recovers the code from ProviderRpcError
          // throws that Comlink would otherwise strip. See
          // toSerializableProviderError above and handleProviderRequest.
          throw toSerializableProviderError(e);
        }
      },
    };
  }, [
    ethProvider,
    domain,
    trackEvent,
    analyticsContext,
    connect,
    providerWallet.address,
    providerWallet.type,
    putMiniAppEvent,
    embeddedWalletConnect,
    embeddedWalletIsConnected,
  ]);

  useExposeWebViewToEndpoint({
    endpoint,
    sdk,
    // @ts-expect-error need to make this type work with forwarded ref
    ethProvider: instrumentedEthProvider,
  });

  useEffect(() => {
    if (Platform.OS === 'android' && !currentlyMinimized) {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        if (backState.visible) {
          triggerBack();
          return true;
        }

        if (!nativeGesturesDisabled) {
          minimizeMiniApp();
        }

        return true;
      });

      return () => {
        return listener.remove();
      };
    }
  }, [
    backState.visible,
    currentlyMinimized,
    nativeGesturesDisabled,
    minimizeMiniApp,
    triggerBack,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(miniAppLoadingMessage ? 1 : 0, { duration: 400 }),
    };
  }, [miniAppLoadingMessage]);

  // Hard-block before the WebView mounts; the useEffect above only
  // closes the sheet post-mount, letting the harmful URL load (NEYN-11871).
  // Combines the caller-supplied prop (synchronous when known) with the inner
  // fetch (fallback for launches that didn't carry the flag).
  if ((harmful || frame?.harmful) && !debug) {
    return null;
  }

  const baseContent = (
    <>
      {!hideHeader && (
        <MiniAppHeader
          name={name}
          domain={formDomain}
          frame={frame}
          author={author}
          debug={debug}
          cancel={cancel}
          minimize={minimizeMiniApp}
          refresh={refresh}
          clearWebviewCache={clearWebviewCache}
          emit={emit}
          locationContext={locationContext}
          miniAppLoadingMessage={miniAppLoadingMessage}
          onOpenQualitySheet={() => setShowQualitySheet(true)}
        />
      )}
      {externalMenuVisible && onExternalMenuDismiss && (
        <MiniAppKebabMenu
          frame={frame}
          name={name}
          author={author}
          debug={debug}
          domain={formDomain}
          locationContext={locationContext}
          refresh={refresh}
          clearWebviewCache={clearWebviewCache}
          onDismiss={onExternalMenuDismiss}
          emit={emit}
          onOpenQualitySheet={() => setShowQualitySheet(true)}
        />
      )}
      {showQualitySheet && (
        <MiniAppQualityBottomSheet
          domain={formDomain}
          name={frame?.name ?? name}
          harmful={frame?.harmful}
          onDismiss={() => setShowQualitySheet(false)}
        />
      )}
      <View style={[t.flex1, t.relative, t.bgMuted]}>
        <SplashScreen
          visible={showSplashScreen}
          imageUrl={splashImageUrl}
          backgroundColor={splashBackgroundColor}
          showOverlayIfStuck={isDevPreview}
          onHideSplashScreen={() => setShowSplashScreen(false)}
          miniAppUrl={url}
          isDevPreview={isDevPreview}
        />
        <MiniAppWebView
          ref={webViewRef}
          targetUrl={url}
          appDomain={frame?.domain ?? domain}
          launchTelemetryDomain={formDomain}
          timestamp={timestamp}
          splashBackgroundColor={splashBackgroundColor}
          onMessage={onMessage}
          onOpenUrl={handleOpenUrl}
          onLoaded={() => {
            webviewLoadedRef.current = true;
            if (addRejectedBeforeLoadRef.current) {
              addRejectedBeforeLoadRef.current = false;
              setShowSplashScreen(false);
            }
          }}
          primaryButton={primaryButton}
          handlePrimaryButtonPress={handlePrimaryButtonPress}
          backNavigationEnabled={backState.visible}
          debug={debug}
        />
        {miniAppLoadingMessage && (
          <Animated.View
            style={[
              t.absolute,
              t.inset0,
              t.z10,
              t.itemsCenter,
              t.justifyEnd,
              { backgroundColor: t.colors.background.overlay },
              animatedStyle,
            ]}
          >
            <View
              style={[
                t.bgDefault,
                t.p4,
                t.roundedLg,
                t.itemsCenter,
                { gap: 12 },
                t.mB16,
              ]}
            >
              <ActivityIndicator size="large" color={t.colors.text.primary} />
              <Text2 weight="medium">{miniAppLoadingMessage}</Text2>
            </View>
          </Animated.View>
        )}
      </View>
    </>
  );

  if (Platform.OS !== 'android') {
    return baseContent;
  }

  // react-native-webview seems to automatically handle keyboard-avoiding
  // on iOS, but not on Android with edge-to-edge enabled. It assumes
  // adjustResize on Android, which is incompatible with edge-to-edge
  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={insets.top}
      style={t.flex1}
    >
      {baseContent}
    </KeyboardAvoidingView>
  );
};

// Wrapper component that provides the camera/microphone context
const MiniAppContent = (props: {
  url: string;
  name: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  author?: ApiUser;
  harmful?: boolean;
  context: LaunchContext;
  timestamp: number;
  debug?: boolean;
  hideHeader?: boolean;
  externalMenuVisible?: boolean;
  onExternalMenuDismiss?: () => void;
}) => {
  const domain = useMemo(() => new URL(props.url).hostname, [props.url]);
  return (
    <CameraAndMicrophoneAccessProvider domain={domain}>
      <SignManifestProvider hostDomain={domain}>
        <MiniAppContentInner {...props} />
      </SignManifestProvider>
    </CameraAndMicrophoneAccessProvider>
  );
};

function HeaderIcon({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <TouchableOpacity onPress={onPress} hitSlop={hitSlop} activeOpacity={0.5}>
      <View
        style={[
          t.roundedFull,
          { height: 28, width: 28 },
          { backgroundColor: t.colors.gray700 },
          t.itemsCenter,
          t.justifyCenter,
        ]}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
}

function MiniAppHeader({
  domain,
  name,
  frame,
  author,
  locationContext,
  debug,
  cancel,
  minimize,
  refresh,
  clearWebviewCache,
  emit,
  miniAppLoadingMessage,
  onOpenQualitySheet,
}: {
  domain: string;
  name: string;
  debug: boolean;
  frame?: ApiFrame;
  author?: ApiUser;
  locationContext?: Context.LocationContext;
  cancel: () => void;
  minimize: () => void;
  refresh: () => void;
  clearWebviewCache: () => void;
  emit: ((event: MiniAppClientEvent) => void) | undefined;
  miniAppLoadingMessage: string | null;
  onOpenQualitySheet: () => void;
}) {
  const t = useTheme();
  const openComposer = useOpenComposer();
  const { triggerImpactAsync } = useHaptics();

  const {
    activeOffsetX,
    activeOffsetY,
    failOffsetX,
    failOffsetY,
    waitFor,
    simultaneousHandlers: _providedSimultaneousHandlers,
  } = useBottomSheetInternal();
  const { handlePanGestureHandler } = useBottomSheetGestureHandlers();

  const handlePanGesture = useMemo(() => {
    let gesture = Gesture.Pan()
      .enabled(true)
      .shouldCancelWhenOutside(false)
      .runOnJS(false)
      .onStart(handlePanGestureHandler.handleOnStart)
      .onChange(handlePanGestureHandler.handleOnChange)
      .onEnd(handlePanGestureHandler.handleOnEnd)
      .onFinalize(handlePanGestureHandler.handleOnFinalize);

    if (waitFor) {
      gesture = gesture.requireExternalGestureToFail(waitFor);
    }

    if (_providedSimultaneousHandlers) {
      const handlers = Array.isArray(_providedSimultaneousHandlers)
        ? _providedSimultaneousHandlers
        : [_providedSimultaneousHandlers];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gesture = gesture.simultaneousWithExternalGesture(...(handlers as any[]));
    }

    if (activeOffsetX) {
      gesture = gesture.activeOffsetX(activeOffsetX);
    }

    if (activeOffsetY) {
      gesture = gesture.activeOffsetY(activeOffsetY);
    }

    if (failOffsetX) {
      gesture = gesture.failOffsetX(failOffsetX);
    }

    if (failOffsetY) {
      gesture = gesture.failOffsetY(failOffsetY);
    }

    return gesture;
  }, [
    activeOffsetX,
    activeOffsetY,
    failOffsetX,
    failOffsetY,
    _providedSimultaneousHandlers,
    waitFor,
    handlePanGestureHandler,
  ]);

  const [showMenu, setShowMenu] = useState(false);
  const frameShareUrl = useMemo(() => {
    if (locationContext?.type === 'cast_embed') {
      return locationContext.embed;
    }

    if (frame) {
      return getMiniAppCanonicalUrl({ frame });
    }
  }, [locationContext, frame]);

  const handleSharePress = useCallback(() => {
    if (!frameShareUrl) {
      return;
    }

    triggerImpactAsync();
    minimize();
    openComposer(createCastParamsWithIntent({ embeds: [frameShareUrl] }));
  }, [frameShareUrl, minimize, openComposer, triggerImpactAsync]);

  return (
    <View
      style={[
        {
          height: miniAppHeaderHeight,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: 6,
          backgroundColor: t.colors.gray850,
        },
      ]}
    >
      <GestureDetector gesture={handlePanGesture}>
        <Animated.View collapsable={false}>
          <View
            style={[
              t.roundedFull,
              {
                alignSelf: 'center',
                width: 72,
                height: 5,
                marginBottom: 11,
                backgroundColor: t.colors.gray500,
              },
            ]}
          />
          <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
            <View
              style={[
                t.itemsCenter,
                t.justifyCenter,
                {
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  overflow: 'hidden',
                  backgroundColor: t.colors.gray700,
                },
              ]}
            >
              {frame?.iconUrl ? (
                <SimplerRemoteImage
                  uri={frame.iconUrl}
                  height={28}
                  width={28}
                />
              ) : (
                <Feather
                  name="image"
                  size={16}
                  color={t.colors.text.tertiary}
                />
              )}
            </View>
            <View style={[t.flex1, { height: 36, justifyContent: 'center' }]}>
              <View
                pointerEvents="none"
                style={[
                  t.wFull,
                  t.hFull,
                  t.roundedFull,
                  t.flexRow,
                  t.itemsCenter,
                  t.justifyCenter,
                  {
                    paddingHorizontal: 36,
                    backgroundColor: t.colors.gray800,
                  },
                ]}
              >
                {miniAppLoadingMessage ? (
                  <ActivityIndicator size="small" color={t.colors.text.light} />
                ) : (
                  <Text2
                    color="light"
                    weight="medium"
                    size="sm"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {frame?.name ?? name}
                  </Text2>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowMenu(true)}
                hitSlop={hitSlop}
                activeOpacity={0.75}
                style={[
                  t.absolute,
                  t.roundedFull,
                  t.itemsCenter,
                  t.justifyCenter,
                  {
                    right: 8,
                    width: 22,
                    height: 22,
                    backgroundColor: t.colors.gray700,
                  },
                ]}
              >
                <Feather
                  name="more-horizontal"
                  size={14}
                  color={t.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <HeaderIcon onPress={handleSharePress}>
              <ShareIcon size={18} color={t.colors.text.secondary} />
            </HeaderIcon>
            <HeaderIcon onPress={cancel}>
              <Octicons
                name="x"
                style={{ left: 0.5 }}
                color={t.colors.text.secondary}
                size={20}
              />
            </HeaderIcon>
          </View>
        </Animated.View>
      </GestureDetector>
      {showMenu && (
        <MiniAppKebabMenu
          frame={frame}
          name={name}
          author={author}
          debug={debug}
          domain={domain}
          locationContext={locationContext}
          refresh={refresh}
          clearWebviewCache={clearWebviewCache}
          onDismiss={() => setShowMenu(false)}
          emit={emit}
          onOpenQualitySheet={onOpenQualitySheet}
        />
      )}
      <CameraPermissionDialog appName={frame?.name ?? domain} />
    </View>
  );
}

function WalletConnection() {
  const t = useTheme();
  const { wallet } = useConnectedWallet();
  const { miniAppEvmAddress, miniAppSolanaAddress } = useEmbeddedWallet();
  const walletEvmAddress = miniAppEvmAddress ?? wallet.address;
  const walletSolanaAddress = miniAppSolanaAddress;

  const copyEvmAddress = useCallback(() => {
    if (!walletEvmAddress) {
      return;
    }
    Clipboard.setStringAsync(walletEvmAddress);
  }, [walletEvmAddress]);

  const copySolanaAddress = useCallback(() => {
    if (!walletSolanaAddress) {
      return;
    }
    Clipboard.setStringAsync(walletSolanaAddress);
  }, [walletSolanaAddress]);

  if (!walletEvmAddress && !walletSolanaAddress) {
    return null;
  }

  return (
    <View style={[t.flexCol, t.itemsCenter, t.wFull, { gap: 14 }]}>
      <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
        <Text2 color="primary" size="sm" weight="medium">
          Wallet connected
        </Text2>
        <View
          style={[
            t.roundedFull,
            { width: 8, height: 8, backgroundColor: t.colors.actionGreen },
          ]}
        />
      </View>
      <View style={[t.flexCol, t.wFull, { gap: 10 }]}>
        {walletEvmAddress && (
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.wFull,
              {
                borderRadius: 14,
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: t.colors.bgLightPurple,
              },
            ]}
          >
            <Text2
              size="base"
              weight="semibold"
              style={{ color: t.colors.text.brand }}
            >
              Ethereum
            </Text2>
            <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
              <Text2
                size="sm"
                weight="medium"
                style={{ color: t.colors.text.tertiary }}
              >
                {truncateAddress(walletEvmAddress)}
              </Text2>
              <TouchableOpacity
                activeOpacity={0.75}
                hitSlop={hitSlop}
                onPress={copyEvmAddress}
              >
                <Octicons name="copy" size={18} color={t.colors.text.brand} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {walletSolanaAddress && (
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.wFull,
              {
                borderRadius: 14,
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: t.colors.bgLightPurple,
              },
            ]}
          >
            <Text2
              size="base"
              weight="semibold"
              style={{ color: t.colors.text.brand }}
            >
              Solana
            </Text2>
            <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
              <Text2
                size="sm"
                weight="medium"
                style={{ color: t.colors.text.tertiary }}
              >
                {truncateAddress(walletSolanaAddress)}
              </Text2>
              <TouchableOpacity
                activeOpacity={0.75}
                hitSlop={hitSlop}
                onPress={copySolanaAddress}
              >
                <Octicons name="copy" size={18} color={t.colors.text.brand} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      <Text2 color="tertiary" size="sm" align="center">
        Signing and transaction requests{'\n'}still require explicit approval
      </Text2>
    </View>
  );
}

function SplashScreen({
  visible,
  imageUrl,
  backgroundColor,
  showOverlayIfStuck = false,
  onHideSplashScreen,
  miniAppUrl,
  isDevPreview = false,
  showOverlayDelayMs = 5000,
}: {
  visible: boolean;
  imageUrl?: string;
  backgroundColor?: string;
  showOverlayIfStuck?: boolean;
  onHideSplashScreen?: () => void;
  miniAppUrl?: string;
  isDevPreview?: boolean;
  showOverlayDelayMs?: number;
}) {
  const t = useTheme();
  const splashAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(visible ? 1 : 0, { duration: 0 }),
    };
  });

  const heightWithHeader = useHeightForExpandingBottomSheet();
  const height = heightWithHeader - miniAppHeaderHeight;

  const [showOverlay, setShowOverlay] = useState(false);
  useEffect(() => {
    if (!showOverlayIfStuck || !visible) {
      setShowOverlay(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowOverlay(true);
    }, showOverlayDelayMs);
    return () => clearTimeout(timer);
  }, [showOverlayIfStuck, showOverlayDelayMs, visible]);

  let isTunnelUrl = false;
  if (miniAppUrl) {
    try {
      isTunnelUrl = isTunnelDomain(new URL(miniAppUrl).hostname);
    } catch {
      // fall through, treat as non-tunnel
    }
  }

  return (
    <Animated.View
      style={[
        t.absolute,
        t.inset0,
        t.wFull,
        t.hFull,
        {
          backgroundColor: backgroundColor ?? t.colors.background.light,
          zIndex: 1,
        },
        splashAnimatedStyles,
        { height },
      ]}
      pointerEvents={showOverlay ? 'box-none' : 'none'}
    >
      <View
        style={[t.wFull, t.hFull, t.itemsCenter, t.justifyCenter]}
        pointerEvents="none"
      >
        <View style={{ marginTop: -88 }}>
          <SimplerRemoteImage uri={imageUrl} height={88} width={88} />
        </View>
      </View>
      {showOverlay && (
        <View
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            maxWidth: 384,
            gap: 8,
          }}
          pointerEvents="box-none"
        >
          {isDevPreview && (
            <View
              style={{
                alignSelf: 'flex-start',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: t.colors.borderDefault,
                backgroundColor: t.colors.bgFaint,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text2 weight="medium" size="xs">
                Developer Mode
              </Text2>
            </View>
          )}
          <View
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.colors.borderDefault,
              backgroundColor: t.colors.bgDefault,
              padding: 12,
            }}
          >
            <Text2 weight="medium" size="sm">
              Ready not called
            </Text2>
            <Text2
              size="xs"
              style={{ marginTop: 2, color: t.colors.text.tertiary }}
            >
              Your app hasn't called sdk.actions.ready() yet. This may cause the
              splash screen to persist.
            </Text2>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    'https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display',
                  )
                }
                hitSlop={hitSlop}
              >
                <Text2
                  weight="medium"
                  size="xs"
                  style={{ textDecorationLine: 'underline' }}
                >
                  View documentation
                </Text2>
              </Pressable>
              <Text2 size="xs" style={{ color: t.colors.text.tertiary }}>
                •
              </Text2>
              <Pressable onPress={onHideSplashScreen} hitSlop={hitSlop}>
                <Text2
                  weight="medium"
                  size="xs"
                  style={{ textDecorationLine: 'underline' }}
                >
                  Hide splash screen for now
                </Text2>
              </Pressable>
            </View>
          </View>
          {isTunnelUrl && miniAppUrl && (
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.colors.borderDefault,
                backgroundColor: t.colors.bgDefault,
                padding: 12,
              }}
            >
              <Text2 weight="medium" size="sm">
                Tunnel URL detected
              </Text2>
              <Text2
                size="xs"
                style={{ marginTop: 2, color: t.colors.text.tertiary }}
              >
                Your URL looks like a tunnel. Open it in your browser first to
                ensure it's working properly.
              </Text2>
              <View style={{ marginTop: 8 }}>
                <Pressable
                  onPress={() => Linking.openURL(miniAppUrl)}
                  hitSlop={hitSlop}
                >
                  <Text2
                    weight="medium"
                    size="xs"
                    style={{ textDecorationLine: 'underline' }}
                  >
                    Open URL in new tab
                  </Text2>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

type MiniAppWebViewProps = {
  targetUrl: string;
  appDomain: string;
  // Canonical (www-stripped) domain used only for launch-waterfall telemetry, so
  // every `miniapp_launch` milestone aggregates under one domain. Distinct from
  // `appDomain` (the manifest domain that drives theme injection).
  launchTelemetryDomain: string;
  timestamp: number;
  splashBackgroundColor?: string;
  onMessage: (event: WebViewMessageEvent) => void;
  onOpenUrl: (url: string) => void;
  onLoaded?: () => void;
  primaryButton: PrimaryButtonState | null;
  handlePrimaryButtonPress: () => void;
  debug: boolean | undefined;
  backNavigationEnabled: boolean;
};

const MiniAppWebView = forwardRef<WebView, MiniAppWebViewProps>(
  (
    {
      targetUrl,
      appDomain,
      launchTelemetryDomain,
      splashBackgroundColor,
      onMessage,
      onOpenUrl,
      onLoaded,
      primaryButton,
      handlePrimaryButtonPress,
      debug = false,
      backNavigationEnabled = false,
      timestamp,
    },
    webViewRef,
  ) => {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const { hasPermissions } = useCameraAndMicrophoneAccess();

    // Refresh the WebView when the same URL is launched again. WebView ignores
    // duplicate `source` URIs, so we previously bumped a `key` to remount it —
    // but a key change tears down and recreates the native WebView and its
    // renderer process, which is a major main-thread cost on Android. Calling
    // reload() on the existing instance refreshes in place at a fraction of the
    // cost.
    const prevLaunch = useRef({ targetUrl, timestamp });

    useEffect(() => {
      const isSameUrl = prevLaunch.current.targetUrl === targetUrl;
      const isNewLaunch = prevLaunch.current.timestamp !== timestamp;

      // `webViewRef` is a forwarded ref and could in principle be a callback
      // ref; narrow to an object ref before reading `.current` instead of
      // casting (a callback ref would have no `.current` to reload).
      if (
        isSameUrl &&
        isNewLaunch &&
        typeof webViewRef === 'object' &&
        webViewRef !== null
      ) {
        webViewRef.current?.reload();
      }

      prevLaunch.current = { targetUrl, timestamp };
    }, [timestamp, targetUrl, webViewRef]);

    const invalidUrl = !targetUrl.startsWith('https://') && !debug;

    const source = React.useMemo(() => ({ uri: targetUrl }), [targetUrl]);

    // Mini-app launch waterfall: time the initial WebView document load. Each
    // mark fires once per launch (keyed on `timestamp`) via the shared guard, so
    // SPA in-app navigations and relaunches that reuse this component don't
    // double-count, while a new launch re-arms every mark.
    const loadGuard = useRef(createLaunchMilestoneGuard());

    const fireLoadMilestone = React.useCallback(
      (milestone: MiniAppLaunchMilestone) => {
        if (
          shouldFireLaunchMilestone(loadGuard.current, timestamp, milestone)
        ) {
          recordMiniAppLaunchMilestone({
            milestone,
            launchTimestamp: timestamp,
            domain: launchTelemetryDomain,
          });
        }
      },
      [timestamp, launchTelemetryDomain],
    );

    const handleLoadStart = React.useCallback(() => {
      fireLoadMilestone('webview_load_start');
    }, [fireLoadMilestone]);

    const handleLoadEnd = React.useCallback(() => {
      fireLoadMilestone('webview_load_end');
      onLoaded?.();
    }, [fireLoadMilestone, onLoaded]);

    const handleLoadError = React.useCallback(() => {
      fireLoadMilestone('webview_load_error');
    }, [fireLoadMilestone]);

    const handleShouldStartLoadWithRequest = React.useCallback(
      (request: WebViewNavigation) => {
        const isTopFrame = (
          request as WebViewNavigation & { isTopFrame?: boolean }
        ).isTopFrame;

        if (isTopFrame === false || request.url === 'about:blank') {
          return true;
        }

        try {
          const requestedUrl = new URL(request.url);

          if (
            requestedUrl.protocol !== 'http:' &&
            requestedUrl.protocol !== 'https:'
          ) {
            onOpenUrl(request.url);
            return false;
          }

          if (
            shouldKeepMiniAppNavigationInContext({
              allowInsecure: debug,
              appDomain,
              url: request.url,
            })
          ) {
            return true;
          }

          onOpenUrl(request.url);
          return false;
        } catch {
          return true;
        }
      },
      [appDomain, debug, onOpenUrl],
    );

    const handleOpenWindow = React.useCallback(
      (event: { nativeEvent: { targetUrl?: string } }) => {
        const targetUrl = getMiniAppOpenWindowUrl(event.nativeEvent.targetUrl);

        if (targetUrl) {
          onOpenUrl(targetUrl);
        }
      },
      [onOpenUrl],
    );

    const styles = React.useMemo(
      () => [
        splashBackgroundColor
          ? { backgroundColor: splashBackgroundColor }
          : t.bgMuted,
      ],
      [splashBackgroundColor, t.bgMuted],
    );

    const effectiveTheme: 'dark' | 'light' = t.dark ? 'dark' : 'light';
    const injectedThemeScript = React.useMemo(() => {
      // Runs inside the miniapp WebView at document-start (via the patched
      // WebViewCompat.addDocumentStartJavaScript path) so that theme detection
      // is overridden *before* any page inline <script> reads
      // `window.matchMedia('(prefers-color-scheme: dark)')`. This is the only
      // way to reliably win the race against SSR-injected theme bootstrappers
      // (e.g. Next.js apps like Streme) on Android, where the system
      // prefers-color-scheme signal is not honored on 13+.
      //
      // We intentionally DO NOT set data-theme, class names, or localStorage:
      // those are app-owned and touching them regresses miniapps that manage
      // their own theme independent of the host.
      return `(function () {
        try {
          var fcTheme = '${effectiveTheme}';
          var isDark = fcTheme === 'dark';

          // Signal the active color scheme to UA chrome and color-scheme-aware
          // CSS. We deliberately do NOT create a <meta name="color-scheme">
          // here: at document-start <head> does not exist yet, and <meta> only
          // declares which schemes the document *supports* (not the active
          // one), so setting it to a single value can actually narrow UA
          // rendering for miniapps that legitimately support both schemes.
          try {
            if (document.documentElement && document.documentElement.style) {
              document.documentElement.style.colorScheme = fcTheme;
            }
          } catch (e) {}

          // Override matchMedia so miniapps that rely on prefers-color-scheme
          // (either directly or via libraries like next-themes in "system"
          // mode) follow the host theme. Defined as non-writable /
          // non-configurable so a late-running polyfill cannot clobber us.
          try {
            var origMatchMedia = window.matchMedia
              ? window.matchMedia.bind(window)
              : null;

            function createMediaQueryList(matches, media) {
              var listeners = [];
              var mql = {
                matches: matches,
                media: media,
                onchange: null,
                addListener: function (cb) {
                  if (typeof cb === 'function') listeners.push(cb);
                },
                removeListener: function (cb) {
                  var i = listeners.indexOf(cb);
                  if (i >= 0) listeners.splice(i, 1);
                },
                addEventListener: function (type, cb) {
                  if (type === 'change' && typeof cb === 'function') {
                    listeners.push(cb);
                  }
                },
                removeEventListener: function (type, cb) {
                  if (type === 'change') {
                    var i = listeners.indexOf(cb);
                    if (i >= 0) listeners.splice(i, 1);
                  }
                },
                dispatchEvent: function () { return false; }
              };
              return mql;
            }

            var patched = function matchMedia(query) {
              if (query === '(prefers-color-scheme: dark)') {
                return createMediaQueryList(isDark, query);
              }
              if (query === '(prefers-color-scheme: light)') {
                return createMediaQueryList(!isDark, query);
              }
              if (origMatchMedia) {
                try { return origMatchMedia(query); } catch (e) {}
              }
              return createMediaQueryList(false, query);
            };

            try {
              Object.defineProperty(window, 'matchMedia', {
                configurable: false,
                writable: false,
                value: patched,
              });
            } catch (e) {
              // Fallback assignment if defineProperty is blocked (shouldn't be
              // at document-start, but keep theme behavior working either way).
              window.matchMedia = patched;
            }
          } catch (e) {}
        } catch (e) {}
      })();true;`;
    }, [effectiveTheme]);

    if (invalidUrl) {
      return (
        <View style={[t.flex1, t.bgMuted]}>
          <Text2>Mini Apps must use https</Text2>
        </View>
      );
    }

    return (
      <View style={[t.flex1, t.bgMuted]}>
        <View style={t.flex1}>
          <WebView
            ref={webViewRef}
            source={source}
            userAgent="warpcast"
            injectedJavaScriptBeforeContentLoaded={
              Platform.OS === 'android' ? injectedThemeScript : undefined
            }
            domStorageEnabled
            allowsBackForwardNavigationGestures={backNavigationEnabled}
            allowsInlineMediaPlayback={true}
            webviewDebuggingEnabled={debug}
            cacheMode={debug ? 'LOAD_NO_CACHE' : 'LOAD_DEFAULT'}
            cacheEnabled={!debug}
            mediaPlaybackRequiresUserAction={false}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleLoadError}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onOpenWindow={handleOpenWindow}
            setSupportMultipleWindows={true}
            decelerationRate={0.998}
            nestedScrollEnabled
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            textZoom={100}
            onMessage={onMessage}
            style={styles}
            bounces={false}
            overScrollMode="never"
            // iOS: Permissions for audio video
            mediaCapturePermissionGrantType={
              hasPermissions ? 'grant' : 'prompt'
            }
          />
        </View>
        {primaryButton && !primaryButton.hidden && (
          <View style={[t.flexNone, { paddingBottom: insets.bottom }]}>
            <View style={[t.p3]}>
              <ButtonV2
                title={primaryButton?.text ?? 'Prim'}
                onPress={handlePrimaryButtonPress}
              />
            </View>
          </View>
        )}
      </View>
    );
  },
);

export interface MiniAppKebabMenuProps {
  frame?: ApiFrame;
  name: string;
  author?: ApiUser;
  domain: string;
  locationContext?: Context.LocationContext;
  refresh: () => void;
  clearWebviewCache: () => void;
  onDismiss: () => void;
  emit: ((event: MiniAppClientEvent) => void) | undefined;
  debug?: boolean;
  onOpenQualitySheet?: () => void;
}

export const MiniAppKebabMenu: FC<MiniAppKebabMenuProps> = ({
  frame,
  name,
  author,
  locationContext,
  debug,
  domain,
  refresh,
  clearWebviewCache,
  onDismiss,
  emit,
  onOpenQualitySheet,
}) => {
  const t = useTheme();
  const toast = useToast();
  const bottomSheetRef = useBottomSheetModalRef();
  const favoriteFrame = useFavoriteFrame();
  const { minimizeMiniApp } = useMinimizedMiniApp();
  const { hasPermissions, setPermissions } = useCameraAndMicrophoneAccess();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    frame?.viewerContext?.notificationsEnabled || false,
  );
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(
    frame?.viewerContext?.pushNotificationsEnabled || false,
  );
  const [notificationSettingsOpen, setNotificationSettingsOpen] =
    useState(false);
  const miniAppPushNotificationsEnabled = useFeatureFlag(
    'mini-app-push-notifications',
  );
  const { permission, setPermission } = usePushNotificationPermission();
  const enableFrameNotifications = useEnableFrameNotifications();
  const updateFavoriteFrame = useUpdateFavoriteFrame();
  const setMiniAppPushNotifications = useSetMiniAppPushNotifications();
  const isAdmin = useIsAdmin();
  const hasVideoPermissionsOnFirstLoad = useRef(hasPermissions);
  const appAuthor = frame?.author ?? author;
  const isProUser = useUserLevel(appAuthor) === 'pro';
  const authorDisplayName = useMemo(() => {
    if (!appAuthor) {
      return undefined;
    }

    return resolveUsernameShort(appAuthor) || appAuthor.displayName;
  }, [appAuthor]);

  const toggleNotifications = useCallback(async () => {
    if (!frame || !frame.supportsNotifications) {
      return;
    }

    if (notificationsEnabled) {
      try {
        setNotificationsEnabled(false);
        await updateFavoriteFrame({
          frame,
          disableNotifications: true,
          pushNotificationsEnabled:
            miniAppPushNotificationsEnabled && frame.supportsPushNotifications
              ? pushNotificationsEnabled
              : undefined,
        });
        toast.show('Notifications disabled', { type: 'generic' });
        emit?.({ event: 'notifications_disabled' });
      } catch (e: unknown) {
        setNotificationsEnabled(true);
        toast.show('Error disabling notifications, please try again', {
          type: 'error',
        });
      }
    } else {
      try {
        setNotificationsEnabled(true);
        const notificationDetails = await enableFrameNotifications(frame);
        toast.show('Notifications enabled', { type: 'generic' });
        emit?.({
          event: 'notifications_enabled',
          notificationDetails: notificationDetails,
        });
      } catch (e: unknown) {
        setNotificationsEnabled(false);
        toast.show('Error enabling notifications, please try again', {
          type: 'error',
        });
      }
    }
  }, [
    frame,
    notificationsEnabled,
    updateFavoriteFrame,
    toast,
    emit,
    enableFrameNotifications,
    miniAppPushNotificationsEnabled,
    pushNotificationsEnabled,
  ]);

  const togglePushNotifications = useCallback(async () => {
    if (
      !frame ||
      !miniAppPushNotificationsEnabled ||
      !frame.supportsPushNotifications
    ) {
      return;
    }

    const nextValue = !pushNotificationsEnabled;
    if (nextValue && !permission?.granted) {
      if (isNotificationPromptDisabled) {
        return;
      }
      if (permission && !permission.canAskAgain) {
        toast.show('Enable Farcaster notifications in system settings', {
          type: 'generic',
        });
        openWarpcastSettings();
        return;
      }
      const nextPermission = await Notifications.requestPermissionsAsync();
      setPermission(nextPermission);
      if (!nextPermission.granted) {
        return;
      }
    }

    setPushNotificationsEnabled(nextValue);
    try {
      await setMiniAppPushNotifications({ frame, enabled: nextValue });
      toast.show(`Push notifications ${nextValue ? 'enabled' : 'disabled'}`, {
        type: 'generic',
      });
    } catch {
      setPushNotificationsEnabled(!nextValue);
      toast.show('Error updating push notifications, please try again', {
        type: 'error',
      });
    }
  }, [
    frame,
    miniAppPushNotificationsEnabled,
    permission,
    pushNotificationsEnabled,
    setMiniAppPushNotifications,
    setPermission,
    toast,
  ]);

  const frameShareUrl = useMemo(() => {
    if (locationContext?.type === 'cast_embed') {
      return locationContext.embed;
    }

    if (frame) {
      return getMiniAppCanonicalUrl({ frame });
    }
  }, [locationContext, frame]);

  const toggleVideoPermissions = useCallback(() => {
    setPermissions(!hasPermissions);
  }, [setPermissions, hasPermissions]);

  const pushToUserProfile = usePushToUserProfile();

  const viewAuthor = useCallback(() => {
    if (!appAuthor) {
      return;
    }

    onDismiss();
    minimizeMiniApp();
    pushToUserProfile({ fid: appAuthor.fid });
  }, [appAuthor, minimizeMiniApp, onDismiss, pushToUserProfile]);

  const showInAppNotificationSettings =
    frame?.viewerContext?.favorited && frame.supportsNotifications;
  const showPushNotificationSettings =
    frame?.viewerContext?.favorited &&
    miniAppPushNotificationsEnabled &&
    frame.supportsPushNotifications;
  const notificationPreferenceSummary = getMiniAppNotificationPreferenceSummary(
    {
      inAppNotificationsEnabled:
        !!showInAppNotificationSettings && notificationsEnabled,
      pushNotificationsEnabled:
        !!showPushNotificationSettings && pushNotificationsEnabled,
    },
  );

  const options = useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    if (notificationSettingsOpen) {
      opts.push({
        label: 'Back to app options',
        onPress: () => setNotificationSettingsOpen(false),
        iconLeft: ({ size, color }) => (
          <Octicons name="chevron-left" color={color} size={size} />
        ),
      });
      if (showInAppNotificationSettings) {
        opts.push({
          label: 'In-app',
          subLabel: 'Activity inside Farcaster',
          onPress: toggleNotifications,
          icon: () => (
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              newColors
            />
          ),
        });
      }
      if (showPushNotificationSettings) {
        opts.push({
          label: 'Push',
          subLabel: 'Alerts on your device',
          onPress: togglePushNotifications,
          icon: () => (
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={togglePushNotifications}
              newColors
            />
          ),
        });
      }
      return opts;
    }

    const pushNotificationSettingsOption = () => {
      if (!showInAppNotificationSettings && !showPushNotificationSettings) {
        return;
      }

      opts.push({
        label: 'Notifications',
        subLabel: notificationPreferenceSummary,
        onPress: () => setNotificationSettingsOpen(true),
        icon: ({ size, color }) => (
          <Octicons name="chevron-right" color={color} size={size} />
        ),
      });
    };
    const pushRemoveOption = () => {
      if (!frame?.viewerContext?.favorited) {
        return;
      }

      opts.push({
        label: 'Remove app',
        onPress: () => {
          onDismiss();
          favoriteFrame.confirmRemoveFavoriteFrame({ frame, emit });
        },
        icon: ({ size, color }) => (
          <Octicons name="x-circle" size={size} color={color} />
        ),
        destructive: true,
      });
    };
    const pushAdminQualityOption = () => {
      if (!isAdmin || !domain || !onOpenQualitySheet) {
        return;
      }

      opts.push({
        label: 'Manage safety rating',
        onPress: () => {
          onDismiss();
          onOpenQualitySheet();
        },
        icon: ({ size, color }) => (
          <Octicons name="shield" color={color} size={size} />
        ),
      });
    };

    if (!appAuthor) {
      opts.push({
        label: 'Refresh app',
        onPress: () => {
          onDismiss();
          refresh();
        },
        icon: ({ size, color }) => (
          <Octicons name="sync" color={color} size={size} />
        ),
      });

      if (frameShareUrl) {
        opts.push({
          label: 'Copy link',
          onPress: () => {
            Clipboard.setStringAsync(frameShareUrl);
            toast.show('Copied link to clipboard');
            onDismiss();
          },
          icon: ({ size, color }) => (
            <Octicons name="copy" color={color} size={size} />
          ),
        });
      }

      if (frame?.viewerContext?.favorited) {
        pushNotificationSettingsOption();
      } else if (frame?.domain) {
        opts.push({
          label: 'Add app',
          onPress: () => {
            onDismiss();
            favoriteFrame.confirmAddFavoriteFrame({
              frame,
              emit,
              emitOnRejection: false,
            });
          },
          icon: ({ size, color }) => (
            <SquareAddIcon size={size} color={color} />
          ),
        });
      }

      pushAdminQualityOption();
      pushRemoveOption();

      return opts;
    }

    // Showing direct actions instead of pushing to the manage screen because we are in a root
    // navigator and a few things don't work correctly: can't click on author, can't show toasts,
    // bottom sheets don't work in a 2nd level modal
    opts.push({
      label: 'Refresh app',
      onPress: () => {
        onDismiss();
        refresh();
      },
      icon: ({ size, color }) => (
        <Octicons name="sync" color={color} size={size} />
      ),
    });

    if (appAuthor) {
      const authorFid = appAuthor.fid;
      opts.push({
        label: 'View developer profile',
        onPress: () => {
          onDismiss();
          minimizeMiniApp();
          pushToUserProfile({ fid: authorFid });
        },
        icon: ({ size, color }) => (
          <Octicons name="person" color={color} size={size} />
        ),
      });
    }

    if (frameShareUrl) {
      opts.push({
        label: 'Copy link',
        onPress: () => {
          Clipboard.setStringAsync(frameShareUrl);
          toast.show('Copied link to clipboard');
          onDismiss();
        },
        icon: ({ size, color }) => (
          <Octicons name="copy" color={color} size={size} />
        ),
      });
    }

    if (debug) {
      opts.push({
        label: 'Clear browser state',
        onPress: clearWebviewCache,
        icon: ({ size, color }) => (
          <Octicons name="bug" color={color} size={size} />
        ),
      });
    }

    if (frame?.viewerContext?.favorited) {
      pushNotificationSettingsOption();
    } else if (frame?.domain) {
      opts.push({
        label: 'Add app',
        onPress: () => {
          onDismiss();
          favoriteFrame.confirmAddFavoriteFrame({
            frame,
            emit,
            emitOnRejection: false,
          });
        },
        icon: ({ size, color }) => <SquareAddIcon size={size} color={color} />,
      });
    }

    if (hasVideoPermissionsOnFirstLoad.current) {
      opts.push({
        label: 'Camera and microphone access',
        onPress: () => {
          setPermissions(false);
        },
        icon: () => (
          <Switch
            value={hasPermissions}
            onValueChange={toggleVideoPermissions}
            newColors
          />
        ),
      });
    }

    pushAdminQualityOption();
    pushRemoveOption();

    return opts;
  }, [
    frameShareUrl,
    appAuthor,
    debug,
    domain,
    frame,
    toast,
    onDismiss,
    refresh,
    clearWebviewCache,
    toggleNotifications,
    notificationsEnabled,
    toggleVideoPermissions,
    favoriteFrame,
    emit,
    hasPermissions,
    setPermissions,
    pushToUserProfile,
    minimizeMiniApp,
    isAdmin,
    onOpenQualitySheet,
    miniAppPushNotificationsEnabled,
    pushNotificationsEnabled,
    togglePushNotifications,
    notificationSettingsOpen,
    notificationPreferenceSummary,
    showInAppNotificationSettings,
    showPushNotificationSettings,
  ]);

  const inner = useMemo(() => {
    return (
      <View style={[t.pT4, { gap: 16 }]}>
        <View style={[t.itemsCenter, { gap: 4 }]}>
          <Text2 weight="semibold" size="xl">
            {notificationSettingsOpen ? 'Notifications' : name}
          </Text2>
          {notificationSettingsOpen ? (
            <Text2 size="sm" color="secondary">
              {name}
            </Text2>
          ) : appAuthor && authorDisplayName ? (
            <Pressable
              onPress={viewAuthor}
              style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
            >
              <Text2 size="sm" style={{ color: t.colors.text.tertiary }}>
                by
              </Text2>
              <Avatar pfpUrl={appAuthor.pfp?.url} diameter={16} />
              <Text2 size="sm" style={{ color: t.colors.text.brand }}>
                @{authorDisplayName}
              </Text2>
              {isProUser && <FarcasterProBadge size={14} />}
            </Pressable>
          ) : (
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.wFull,
                {
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.colors.border.danger,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginTop: 8,
                  gap: 8,
                },
              ]}
            >
              <Text2
                color="primary"
                size="base"
                weight="medium"
                style={{ flex: 1 }}
              >
                App developer is unknown
              </Text2>
              <Octicons
                name="alert-fill"
                size={18}
                color={t.colors.text.danger}
              />
            </View>
          )}
        </View>

        <ButtonGroup options={options} />
        {!notificationSettingsOpen && <WalletConnection />}
      </View>
    );
  }, [
    t,
    options,
    name,
    appAuthor,
    authorDisplayName,
    isProUser,
    viewAuthor,
    notificationSettingsOpen,
  ]);

  return (
    <AutoDisplayingBottomSheetModal
      name="frameActions"
      ref={bottomSheetRef}
      onDismiss={onDismiss}
    >
      {inner}
    </AutoDisplayingBottomSheetModal>
  );
};

function CameraPermissionDialog({ appName }: { appName: string }) {
  const { isRequestPending, setPermissions, dismissPendingRequest } =
    useCameraAndMicrophoneAccess();

  if (!isRequestPending) {
    return null;
  }

  return (
    <MiniAppVideoPermissionsMenu
      onDismiss={dismissPendingRequest}
      appName={appName}
      setVideoPermissions={setPermissions}
    />
  );
}

function MiniAppVideoPermissionsMenu({
  onDismiss,
  appName,
  setVideoPermissions,
}: {
  onDismiss: () => void;
  appName: string;
  setVideoPermissions: (granted: boolean) => void;
}) {
  const t = useTheme();
  const bottomSheetRef = useBottomSheetModalRef();

  return (
    <AutoDisplayingBottomSheetModal
      name="videoPermissions"
      ref={bottomSheetRef}
      onDismiss={onDismiss}
    >
      <View style={[{ gap: sizes.s3 }, t.flexCol, t.wFull, t.flex1]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: sizes.s3 }]}>
          <View style={[t.roundedFull, t.bgFaint, { padding: 6 }]}>
            <Feather name="camera" size={20} color={t.colors.text.secondary} />
          </View>
          <Text2 size="xl" weight="semibold" color="primary">
            Camera and microphone access
          </Text2>
        </View>

        <View style={[t.mY3]}>
          <Text2 size="base" color="primary">
            <Text2 color="primary" size="base" weight="bold">
              {appName}
            </Text2>{' '}
            needs access to your camera and microphone to continue. You can
            update permissions anytime in your miniapp settings.
          </Text2>
        </View>

        <View style={[t.flexRow, t.justifyBetween, { gap: sizes.s3 }]}>
          <View style={[t.flex1]}>
            <ButtonV2
              textSize="lg"
              variant="secondary"
              title="Don't allow"
              onPress={() => {
                setVideoPermissions(false);
              }}
            />
          </View>
          <View style={[t.flex1]}>
            <ButtonV2
              textSize="lg"
              title="Allow"
              onPress={() => {
                setVideoPermissions(true);
              }}
            />
          </View>
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
