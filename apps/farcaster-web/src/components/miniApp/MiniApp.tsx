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
  createIframeEndpoint,
  HostEndpoint,
  MiniAppClientEvent,
  useExposeToEndpoint,
  ViewProfile,
} from '@farcaster/miniapp-host';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CopyIcon,
  DiffAddedIcon,
  DiffRemovedIcon,
  KebabHorizontalIcon,
  SyncIcon,
  XIcon,
} from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  apiChainToChainId,
  apiChainToChainIdOrThrow,
  ApiFrame,
  ApiUser,
  getMiniAppCanonicalUrl,
  isTunnelDomain,
  parseCAIP19Token,
  preserveQueryParams,
  solanaMainnetCaip2Id,
  TxResultSchema,
  WALLET_CHAIN_IDS,
} from 'farcaster-client-data';
import { isFarcasterApiError } from 'farcaster-client-data/src';
import {
  frameAnalyticsProperties,
  getMiniAppNotificationPreferenceSummary,
  resolveUsernameShort,
  useEnableFrameNotifications,
  useFeatureFlag,
  useFrameAnalytcsProperties,
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
  usePutMiniAppEvent,
  useResolveMiniAppConfig,
  useSetMiniAppPushNotifications,
  useTrackEvent,
  useUpdateFavoriteFrame,
} from 'farcaster-client-hooks';
import { Loader2Icon, WalletMinimal } from 'lucide-react';
import { Provider, RpcSchema } from 'ox';
import React, {
  forwardRef,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import {
  EmbeddedWalletBridgeProvider,
  EmbeddedWalletIframe,
  useEmbeddedWalletBridge,
} from '~/components/EmbeddedWallet';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { MiniAppsIcon } from '~/components/icons/MiniAppsIcon';
import {
  IFrameLoader,
  IFrameLoaderRef,
} from '~/components/iframes/IFrameLoader';
import { FrameIconImage } from '~/components/images/FrameIconImage';
import { Image } from '~/components/images/Image';
import { MiniAppQualityButton } from '~/components/miniApp/MiniAppQualityButton';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { MiniAppQualityModal } from '~/components/modals/MiniAppQualityModal';
import {
  FavoriteFrameProvider,
  useFavoriteFrame,
} from '~/contexts/FavoriteFrameProvider';
import {
  SignInProvider,
  useSignIn,
} from '~/contexts/Frame/Actions/SignInProvider';
import {
  useViewProfileAction,
  ViewProfileActionProvider,
} from '~/contexts/Frame/Actions/ViewProfileActionProvider';
import { LaunchContext } from '~/contexts/MiniAppProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useOpenableWarpcastWallet } from '~/contexts/OpenableWarpcastWalletContext';
import {
  SignManifestProvider,
  useSignManifest as useWebSignManifest,
} from '~/contexts/SignManifestProvider';
import { SubordinateOpenableWarpcastWalletProvider } from '~/contexts/SubordinateOpenableWarpcastWalletProvider';
import { useWallet, WalletProvider } from '~/contexts/WalletProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useNavigateToConversation } from '~/hooks/navigation/useNavigateToConversation';
import { cn } from '~/lib/utils';
import { CastComposerIntent } from '~/types';
import { trackError } from '~/utils/errorUtils';
import { logError } from '~/utils/logUtils';
import { toast } from '~/utils/toast';

type PrimaryButtonState = {
  text: string;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
};

type StandaloneMiniAppLaunchConfig = {
  type: 'standalone';
  url: string;
  name: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  author?: ApiUser;
};

type ManifestMiniAppLaunchConfig = {
  type: 'manifest';
  url: string;
};

export type MiniAppLaunchConfig =
  | ManifestMiniAppLaunchConfig
  | StandaloneMiniAppLaunchConfig;

type MiniAppProps<TConfig = MiniAppLaunchConfig> = {
  launchConfig?: TConfig;
  context?: LaunchContext;
  debug?: boolean;
  onClose: () => void;
  alwaysShowAsIcon?: boolean;
};

export function MiniApp(props: MiniAppProps): ReactElement {
  return (
    <SubordinateOpenableWarpcastWalletProvider>
      <EmbeddedWalletBridgeProvider surface="mini_app_modal">
        <WalletProvider>
          <LaunchMiniApp {...props} />
        </WalletProvider>
      </EmbeddedWalletBridgeProvider>
    </SubordinateOpenableWarpcastWalletProvider>
  );
}

// Returns ReactElement instead of ReactNode because the latter allows falsey
// values. We want to make sure we always return children so that the wallet
// iframe is perma-loaded and doesn't need to be reloaded when a mini app opens.
function LaunchMiniApp({ launchConfig, ...rest }: MiniAppProps): ReactElement {
  const url = launchConfig?.url;

  const manifestConfig = launchConfig?.type === 'manifest';

  let domain = '';
  if (url) {
    const urlObj = new URL(url);
    domain = urlObj.hostname;
  }
  const { data } = useNonSuspenseFrameDetails({
    domain,
    enabled: manifestConfig,
  });
  const frame = useGloballyCachedFrame(data);

  const name =
    launchConfig?.type === 'standalone' ? launchConfig.name : frame?.name;
  const splashImageUrl =
    launchConfig?.type === 'standalone'
      ? launchConfig.splashImageUrl
      : frame?.splashImageUrl;
  const splashBackgroundColor =
    launchConfig?.type === 'standalone'
      ? launchConfig.splashBackgroundColor
      : frame?.splashBackgroundColor;
  const author =
    launchConfig?.type === 'standalone' ? launchConfig.author : frame?.author;

  return (
    <InnerMiniApp
      url={url}
      name={name}
      splashImageUrl={splashImageUrl}
      splashBackgroundColor={splashBackgroundColor}
      author={author}
      harmful={frame?.harmful}
      {...rest}
    />
  );
}

type InnerMiniAppProps = {
  url?: string;
  name?: string;
  splashBackgroundColor?: string;
  splashImageUrl?: string;
  author?: ApiUser;
  harmful?: boolean;
  debug?: boolean;
  context?: LaunchContext;
  onClose: () => void;
  alwaysShowAsIcon?: boolean;
};

// Returns ReactElement instead of ReactNode because the latter allows falsey
// values. We want to make sure we always return children so that the wallet
// iframe is perma-loaded and doesn't need to be reloaded when a mini app opens.
function InnerMiniApp({
  url,
  name,
  splashBackgroundColor,
  splashImageUrl,
  author,
  harmful,
  debug = false,
  context,
  onClose,
  alwaysShowAsIcon,
}: InnerMiniAppProps): ReactElement {
  const { trackEvent, trackInternalEvent } = useTrackEvent();

  useEffect(() => {
    if (url === undefined || name === undefined || context === undefined) {
      return;
    }

    const analyticsProperties = frameAnalyticsProperties({
      frameUrl: url,
      frameName: name,
      author,
      platform: 'web',
    });

    trackEvent(AnalyticsEvent.LaunchFrame, {
      ...analyticsProperties,
      from:
        context.type === 'notification'
          ? 'notification'
          : context.type === 'cast_embed'
            ? 'cast'
            : 'home',
    });

    trackInternalEvent({
      type: 'frame-launch',
      data: {
        frameDomain: analyticsProperties.frameDomain,
        frameUrl: url,
        frameName: name,
        authorFid: analyticsProperties.authorFid,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, name]);

  return (
    <div
      className={cn([
        'border-top border-left border-right relative rounded-xl',
        'flex min-h-[48px] shrink flex-col',
      ])}
    >
      <MiniAppContent
        url={url}
        name={name}
        splashBackgroundColor={splashBackgroundColor}
        splashImageUrl={splashImageUrl}
        author={author}
        harmful={harmful}
        debug={debug}
        context={context}
        onClose={onClose}
        alwaysShowAsIcon={alwaysShowAsIcon}
      />
    </div>
  );
}

export function MiniAppContent(props: InnerMiniAppProps): ReactElement {
  return (
    <FavoriteFrameProvider>
      <SignInProvider>
        <ViewProfileActionProvider>
          <SignManifestProvider url={props.url}>
            <InnerMiniAppContent {...props} />
          </SignManifestProvider>
        </ViewProfileActionProvider>
      </SignInProvider>
    </FavoriteFrameProvider>
  );
}

// Returns ReactElement instead of ReactNode because the latter allows falsey
// values. We want to make sure we always return children so that the wallet
// iframe is perma-loaded and doesn't need to be reloaded when a mini app opens.
function InnerMiniAppContent({
  url,
  name,
  splashBackgroundColor,
  splashImageUrl,
  author,
  harmful,
  debug,
  context,
  onClose,
  alwaysShowAsIcon,
}: InnerMiniAppProps): ReactElement {
  const currentUser = useCurrentUser();
  const { trackEvent } = useTrackEvent();
  const putMiniAppEvent = usePutMiniAppEvent();

  const didOpenFrame = useRef(false);
  const iframeLoaderRef = useRef<IFrameLoaderRef>(null);
  const iframeLoadedRef = useRef(false);
  const addRejectedBeforeLoadRef = useRef(false);
  const addPromptCountRef = useRef(0);

  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [backState, setBackState] = useState<Back.BackState>(
    Back.DEFAULT_BACK_STATE,
  );
  const [isKebabMenuOpen, setIsKebabMenuOpen] = useState(false);
  const [primaryButton, setPrimaryButton] = useState<PrimaryButtonState | null>(
    null,
  );

  const minSplashTimer = useRef<Promise<void>>(undefined);
  if (minSplashTimer.current === undefined) {
    minSplashTimer.current = new Promise((resolve) => {
      setTimeout(resolve, 600);
    });
  }

  const urlObj = url ? new URL(url) : undefined;
  const domain = urlObj?.hostname ?? '';
  const host = urlObj?.host ?? '';
  const invalidUrl = url && !url.startsWith('https://') && !debug;
  const isDevPreview = context?.type === 'dev_preview';

  const { data, refetch } = useNonSuspenseFrameDetails({
    domain,
    enabled: !!url,
  });
  const frame = useGloballyCachedFrame(data);

  const unavailable = invalidUrl || (!debug && (harmful || frame?.harmful));

  // Reset state when rendering a new mini app
  useEffect(() => {
    if (url) {
      setShowSplashScreen(true);
      setPrimaryButton(null);
      setBackState(Back.DEFAULT_BACK_STATE);
      addPromptCountRef.current = 0;
      didOpenFrame.current = false;
      iframeLoadedRef.current = false;
      addRejectedBeforeLoadRef.current = false;
      minSplashTimer.current = new Promise((resolve) => {
        setTimeout(resolve, 600);
      });
    }
  }, [url]);

  const refresh = useCallback(() => {
    if (iframeLoaderRef.current) {
      setShowSplashScreen(true);
      setBackState(Back.DEFAULT_BACK_STATE);
      iframeLoadedRef.current = false;
      addRejectedBeforeLoadRef.current = false;
      iframeLoaderRef.current.refresh();
    }
  }, []);

  const {
    connectionContextRef,
    navigate: navigateInWallet,
    sendToken,
    solanaProvider,
    swapToken,
    clearPreviewRequests,
  } = useEmbeddedWalletBridge();

  const close = useCallback(() => {
    // Clear any pending transaction preview requests
    clearPreviewRequests();

    trackEvent(AnalyticsEvent.FrameClose, {
      frameDomain: domain,
      frameName: name,
      authorFid: author?.fid,
      isStudioGenerated: domain.endsWith('.neynar.app'),
    });

    if (didOpenFrame.current) {
      void putMiniAppEvent({
        domain,
        event: 'close',
        platformType: 'web',
      });
    }
    onClose();
  }, [
    domain,
    putMiniAppEvent,
    onClose,
    trackEvent,
    name,
    author?.fid,
    clearPreviewRequests,
  ]);

  const ready = useCallback(async () => {
    await minSplashTimer.current;
    setShowSplashScreen(false);
    clearPreviewRequests();

    // Only track events on initial open
    if (didOpenFrame.current === false) {
      didOpenFrame.current = true;

      trackEvent(AnalyticsEvent.FrameReady, {
        frameDomain: domain,
        frameName: name,
        authorFid: author?.fid,
        isStudioGenerated: domain.endsWith('.neynar.app'),
      });

      void putMiniAppEvent({
        domain,
        event: 'open',
        platformType: 'web',
      }).catch((e) => {
        if (isFarcasterApiError(e) && e.status === 429) {
          return;
        }

        trackError(e);
      });
    }
  }, [
    domain,
    putMiniAppEvent,
    trackEvent,
    name,
    author?.fid,
    clearPreviewRequests,
  ]);

  const analyticsContext = useFrameAnalytcsProperties({
    frameName: name,
    frameUrl: url,
    author,
    platform: 'web',
  });

  const openUrl = useExternalNavigate();
  const navigateToConversation = useNavigateToConversation();
  const { signManifest: signManifestWeb } = useWebSignManifest();
  const handleOpenUrl = useCallback(
    (url: string) => {
      trackEvent(AnalyticsEvent.FrameOpenUrl, {
        ...analyticsContext,
        url,
      });
      if (url.startsWith('https://')) {
        openUrl({ to: url, openInNewTab: true });
      }
    },
    [openUrl, trackEvent, analyticsContext],
  );

  const handleSignManifest = useCallback(
    async ({ domain }: { domain: string }) => {
      const sig = await signManifestWeb({ domain });
      return sig;
    },
    [signManifestWeb],
  );

  const { viewProfile } = useViewProfileAction();
  const handleSetPrimaryButton = useCallback(
    (message: { text: string }) => {
      trackEvent(AnalyticsEvent.FrameSetPrimaryButton, {
        ...analyticsContext,
        buttonText: message.text,
      });
      setPrimaryButton(message);
    },
    [trackEvent, analyticsContext],
  );
  const handlePrimaryButtonPress = () => {
    emit?.({ event: 'primary_button_clicked' });
  };

  const handleProviderRequest = useCallback(async () => {
    throw new Error('not implemented');
  }, []);

  const locationContext: Context.LocationContext | undefined = useMemo(
    () => (context && context.type !== 'dev_preview' ? context : undefined),
    [context],
  );

  const [endpoint, setEndpoint] = useState<HostEndpoint | undefined>(undefined);
  useEffect(() => {
    const iframe = iframeLoaderRef.current?.iframe;
    if (!iframe || !url) {
      return;
    }

    setEndpoint(
      createIframeEndpoint({
        iframe,
        // targetOrigin: '*',
        targetOrigin: new URL(url).origin,
        debug,
      }),
    );
  }, [debug, url]);

  const emit = useMemo(() => endpoint?.emit, [endpoint?.emit]);

  const triggerBack = useCallback(() => {
    if (backState.visible) {
      emit?.({
        event: 'back_navigation_triggered',
      });
    }
  }, [backState, emit]);

  const { confirmAddFavoriteFrame } = useFavoriteFrame();
  const handleAddMiniApp = useCallback(async () => {
    trackEvent(AnalyticsEvent.FrameAddMiniApp, {
      ...analyticsContext,
      alreadyFavorited: frame?.viewerContext?.favorited,
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

    // Avoid spamming by only allowing to ask the user a few times
    if (addPromptCountRef.current >= 3) {
      emit?.({ event: 'miniapp_add_rejected', reason: 'rejected_by_user' });
      return Promise.reject(new AddMiniApp.RejectedByUser());
    }

    addPromptCountRef.current += 1;
    let result: AddMiniApp.AddMiniAppResult;
    try {
      result = await confirmAddFavoriteFrame({
        frame,
        emit,
        emitOnRejection: true,
        // We are already in a portal
        renderInPortal: false,
      });
    } catch (e) {
      // Many mini apps follow the pattern `await sdk.actions.addFrame();
      // await sdk.actions.ready();` and never reach `ready()` when the user
      // declines. Hide the splash so the user isn't trapped on a permanent
      // spinner; if the iframe hasn't loaded yet, defer the hide until it does.
      if (e instanceof AddMiniApp.RejectedByUser) {
        if (iframeLoadedRef.current) {
          setShowSplashScreen(false);
        } else {
          addRejectedBeforeLoadRef.current = true;
        }
      }
      throw e;
    }

    refetch();

    return result;
  }, [
    frame,
    confirmAddFavoriteFrame,
    refetch,
    emit,
    trackEvent,
    analyticsContext,
  ]);

  const { signIn, resetSignIn } = useSignIn();
  const handleSignIn = useCallback<MiniAppHost['signIn']>(
    async (options) => {
      if (!url || !host) {
        throw new Error('attempted sign in when no iframe was loaded');
      }
      trackEvent(AnalyticsEvent.FrameSignIn, {
        ...analyticsContext,
        domain: host,
        hasOptions: !!options,
      });
      const result = await signIn({
        name: frame?.name,
        domain: host,
        uri: url,
        options,
        // We are already in a portal
        renderInPortal: false,
      });

      return result;
    },
    [signIn, frame?.name, host, url, trackEvent, analyticsContext],
  );

  useEffect(() => {
    if (url) {
      resetSignIn();
    }
  }, [url, resetSignIn]);

  const {
    miniAppMinimized,
    dismissMiniApp,
    launchMiniApp,
    minimizeMiniApp,
    maximizeMiniApp,
    setMiniAppLoadingMessage,
  } = useMinimizableWindowContext();
  const [castIntentAndPromise, setCastIntentAndPromise] = useState<{
    castIntent: CastComposerIntent;
    onSuccess: ((value: ComposeCast.Result<false>) => void) | undefined;
  }>();

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
        dismissMiniApp();
        setCastIntentAndPromise({
          castIntent: {
            text: options.text ?? '',
            embeds: options.embeds ?? [],
            channelKey: options.channelKey,
            parentCastHash: options.parent?.hash,
          },
          onSuccess: undefined,
        });
        return Promise.resolve(undefined as ComposeCast.Result<close>);
      }

      return new Promise<ComposeCast.Result<false>>((resolve) => {
        setCastIntentAndPromise({
          castIntent: {
            text: options.text ?? '',
            embeds: options.embeds ?? [],
            channelKey: options.channelKey,
            parentCastHash: options.parent?.hash,
          },
          onSuccess: resolve,
        });
      }) as Promise<ComposeCast.Result<close>>;
    },
    [dismissMiniApp, trackEvent, analyticsContext],
  );

  const handleViewCast = useCallback(
    async ({
      hash,
      close,
      authorUsername,
    }: {
      hash: string;
      close?: boolean;
      authorUsername?: string;
    }) => {
      trackEvent(AnalyticsEvent.FrameViewCast, {
        ...analyticsContext,
        hash,
        close,
        authorUsername,
      });

      if (close) {
        dismissMiniApp();
      }

      navigateToConversation({
        castHash: hash,
        authorUsername: authorUsername,
        openInNewTab: false,
      });
    },
    [trackEvent, dismissMiniApp, navigateToConversation, analyticsContext],
  );

  const eip6963UUID = useRef<string>(undefined);
  const getEip6963UUID = useCallback(() => {
    if (eip6963UUID.current === undefined) {
      eip6963UUID.current = (() => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
          /[xy]/g,
          function (c) {
            const r =
                (parseFloat(
                  '0.' +
                    Math.random().toString().replace('0.', '') +
                    new Date().getTime(),
                ) *
                  16) |
                0,
              // eslint-disable-next-line eqeqeq
              v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
      })();
    }
    return eip6963UUID.current;
  }, []);

  const { provider, preferredWallet } = useWallet();

  const solanaProviderRequest = solanaProvider.request;

  // Haptic feedback handlers (no-op on web)
  const handleImpactOccurred = useCallback(
    async (_type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid') => {
      // No-op on web
    },
    [],
  );

  const handleNotificationOccurred = useCallback(
    async (_type: 'success' | 'warning' | 'error') => {
      // No-op on web
    },
    [],
  );

  const handleSelectionChanged = useCallback(async () => {
    // No-op on web
  }, []);

  const handleRequestCameraAndMicrophoneAccess = useCallback(async () => {
    // No-op on web - camera and microphone access is not supported in web mini apps
  }, []);

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
      'wallet.getSolanaProvider',
      'experimental.signManifest',
      'actions.openMiniApp',
      'back',
    ];
  }, []);

  const getChains = useCallback(async () => {
    const evmChainIds = WALLET_CHAIN_IDS.map(
      (eip155Id) => `eip155:${eip155Id}`,
    );
    return [...evmChainIds, solanaMainnetCaip2Id];
  }, []);

  const resolveMiniAppConfig = useResolveMiniAppConfig();

  const openMiniAppBusinessLogic = useCallback(
    async ({ url }: OpenMiniApp.OpenMiniAppOptions) => {
      minimizeMiniApp();

      let config;
      try {
        config = await resolveMiniAppConfig(url);
      } catch (error) {
        logError(error);
        maximizeMiniApp();
        throw error;
      }

      let referrerDomain = connectionContextRef.current?.domain;
      if (!referrerDomain) {
        logError(new Error(`No referrer domain found for ${url}`));
        referrerDomain = '';
      }

      trackEvent(AnalyticsEvent.FrameOpenMiniApp, {
        ...analyticsContext,
        launchUrl: config.url,
      });

      launchMiniApp({
        launchConfig: {
          type: 'manifest',
          url: preserveQueryParams({ launchUrl: config.url, sourceUrl: url }),
        },
        context: {
          type: 'open_miniapp',
          referrerDomain,
        },
        skipConfirmation: true,
      });
    },
    [
      resolveMiniAppConfig,
      launchMiniApp,
      minimizeMiniApp,
      maximizeMiniApp,
      connectionContextRef,
      trackEvent,
      analyticsContext,
    ],
  );

  const handleOpenMiniApp = useCallback(
    async ({ url }: OpenMiniApp.OpenMiniAppOptions) => {
      const urlDomain = new URL(url).hostname;

      // If the URL is a launcher, then we simply say "Navigating.."
      const navigateText =
        urlDomain !== 'farcaster.xyz'
          ? `Navigating to ${urlDomain}`
          : 'Navigating...';
      setMiniAppLoadingMessage(navigateText);
      try {
        await openMiniAppBusinessLogic({ url });
      } finally {
        setMiniAppLoadingMessage(null);
      }
    },
    [openMiniAppBusinessLogic, setMiniAppLoadingMessage],
  );

  const handleViewProfile = useCallback<ViewProfile.ViewProfile>(
    async (params) => {
      trackEvent(AnalyticsEvent.FrameViewProfile, {
        ...analyticsContext,
        fid: params.fid,
      });
      await viewProfile(params);
    },
    [trackEvent, viewProfile, analyticsContext],
  );

  const getProviderAddress = useCallback(async () => {
    if (!provider) {
      return undefined;
    }
    const accounts = await provider.request({
      method: 'eth_accounts',
    });
    return accounts[0] as string;
  }, [provider]);

  const sdk = useMemo<Omit<MiniAppHost, 'ethProviderRequestV2' | 'addFrame'>>(
    () => ({
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
          platformType: 'web',
          clientFid: 9152,
          added: frame?.viewerContext?.favorited || false,
          notificationDetails: frame?.viewerContext?.notificationsEnabled
            ? frame?.viewerContext?.notificationDetails
            : undefined,
        },
        features: {
          haptics: false,
          cameraAndMicrophoneAccess: false,
        },
      },
      close: close,
      ready: ready,
      setPrimaryButton: handleSetPrimaryButton,
      signManifest: handleSignManifest,
      ethProviderRequest: handleProviderRequest,
      solanaProviderRequest,
      signIn: handleSignIn,
      openUrl: handleOpenUrl,
      openMiniApp: handleOpenMiniApp,
      addMiniApp: handleAddMiniApp,
      viewProfile: handleViewProfile,
      updateBackState: async (state) => {
        trackEvent(AnalyticsEvent.FrameUpdateBackState, {
          ...analyticsContext,
          visible: state.visible,
        });
        setBackState(state);
      },
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
      viewToken: async ({ token }) => {
        trackEvent(AnalyticsEvent.FrameViewToken, {
          frameDomain: domain,
          frameName: name,
          authorFid: author?.fid,
          hasToken: !!token,
        });

        const erc20 = parseCAIP19Token(token);
        if (!erc20) {
          throw new Error('invalid token');
        }
        navigateInWallet({
          path: 'Token',
          params: {
            chain: erc20.chain,
            ca: erc20.ca,
            via: 'miniapp_view_token',
          },
          inParent: true,
        });
      },
      swapToken: async ({ sellToken, buyToken, sellAmount }) => {
        trackEvent(AnalyticsEvent.FrameSwapToken, {
          frameDomain: domain,
          frameName: name,
          authorFid: author?.fid,
          hasBuyToken: !!buyToken,
          hasSellToken: !!sellToken,
          hasSellAmount: !!sellAmount,
        });

        const buy = buyToken ? parseCAIP19Token(buyToken) : undefined;
        const sell = sellToken ? parseCAIP19Token(sellToken) : undefined;

        const result = await swapToken({
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
        });

        // Report mini app transaction
        if (
          result.success &&
          result.swap?.transactions &&
          result.swap.transactions.length > 0 &&
          sell?.chain &&
          buyToken &&
          sellToken &&
          sellAmount
        ) {
          putMiniAppEvent({
            domain,
            event: 'tx',
            platformType: 'web',
            metadata: {
              id: result.swap.transactions[0],
              type: 'swap-token',
              buyToken,
              sellToken,
              sellAmount,
            },
          }).catch((e) => {
            trackError(e);
          });
        }

        return result;
      },
      sendToken: async ({ token, amount, recipientAddress, recipientFid }) => {
        trackEvent(AnalyticsEvent.FrameSendToken, {
          frameDomain: domain,
          frameName: name,
          authorFid: author?.fid,
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

        const result = await sendToken({
          sendIntent,
          attributedDomain: domain,
        });

        // Report mini app transaction
        if (result.success && result.send?.transaction && sendIntent) {
          const walletAddress = await getProviderAddress();
          if (walletAddress) {
            const chainId = Number(apiChainToChainId(sendIntent.chain));
            putMiniAppEvent({
              domain,
              event: 'tx',
              platformType: 'web',
              metadata: {
                id: result.send.transaction,
                type: 'send-token',
                walletChain: sendIntent.chain === 'solana' ? 'solana' : 'eth',
                walletAddress,
                chainId,
              },
            }).catch((e) => {
              trackError(e);
            });
          }
        }
        return result;
      },
      composeCast: handleComposeCast,
      viewCast: handleViewCast,
      getCapabilities,
      getChains,
      impactOccurred: handleImpactOccurred,
      notificationOccurred: handleNotificationOccurred,
      selectionChanged: handleSelectionChanged,
      requestCameraAndMicrophoneAccess: handleRequestCameraAndMicrophoneAccess,
    }),
    [
      analyticsContext,
      author?.fid,
      close,
      currentUser.displayName,
      currentUser.fid,
      currentUser.pfp?.url,
      currentUser.profile.location,
      currentUser.username,
      domain,
      emit,
      frame?.viewerContext?.favorited,
      frame?.viewerContext?.notificationDetails,
      frame?.viewerContext?.notificationsEnabled,
      getCapabilities,
      getChains,
      getEip6963UUID,
      getProviderAddress,
      handleAddMiniApp,
      handleComposeCast,
      handleImpactOccurred,
      handleNotificationOccurred,
      handleOpenMiniApp,
      handleOpenUrl,
      handleProviderRequest,
      handleRequestCameraAndMicrophoneAccess,
      handleSelectionChanged,
      handleSetPrimaryButton,
      handleSignIn,
      handleSignManifest,
      handleViewCast,
      handleViewProfile,
      locationContext,
      name,
      navigateInWallet,
      putMiniAppEvent,
      ready,
      sendToken,
      solanaProviderRequest,
      swapToken,
      trackEvent,
    ],
  );

  useEffect(() => {
    if (!domain) {
      return;
    }
    connectionContextRef.current = {
      domain,
      iconUrl: splashImageUrl,
    };
  }, [connectionContextRef, domain, splashImageUrl]);

  const getChainId: () => Promise<number | undefined> =
    useCallback(async () => {
      if (!provider) {
        return undefined;
      }
      const chainIdHex = await provider.request({
        method: 'eth_chainId',
      });
      return parseInt(chainIdHex, 16);
    }, [provider]);

  const instrumentedProvider = useMemo(() => {
    if (!provider) {
      // FIXME: figure out how to provider never be undefined
      return undefined;
    }

    return {
      on: provider.on.bind(provider),
      removeListener: provider.removeListener.bind(provider),
      async request(parameters: RpcSchema.ExtractRequest<RpcSchema.Default>) {
        const attempt = async () => {
          switch (parameters.method) {
            case 'wallet_sendCalls': {
              const resultPayload = await provider.request(parameters);
              const result = TxResultSchema.safeParse(resultPayload);
              if (!result.success) {
                logError(
                  `[MiniApp] Invalid result from wallet_sendCalls: ${JSON.stringify(result.error)}. Payload: ${JSON.stringify(resultPayload)}`,
                );
                return resultPayload;
              }

              const providerAddress = await getProviderAddress();
              if (!providerAddress) {
                return resultPayload;
              }

              const chainId = await getChainId();
              const allCalls = parameters.params[0].calls.map((_call, idx) => {
                return putMiniAppEvent({
                  domain,
                  platformType: 'web',
                  event: 'tx',
                  metadata: {
                    id: `${result.data.id}-${idx}`,
                    type: 'tx',
                    walletChain: 'eth',
                    walletAddress: providerAddress,
                    chainId,
                    provider: preferredWallet || 'warpcast',
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
              const result = await provider.request(parameters);

              // Get the chainId from the provider (not from params which might be missing)
              if (parameters.method === 'eth_sendTransaction') {
                const providerAddress = await getProviderAddress();
                if (providerAddress) {
                  const chainId = await getChainId();
                  putMiniAppEvent({
                    domain,
                    platformType: 'web',
                    event: 'tx',
                    metadata: {
                      id: result,
                      type: 'tx',
                      walletChain: 'eth',
                      walletAddress: providerAddress,
                      chainId,
                      provider: preferredWallet || 'warpcast',
                    },
                  });
                }
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
              const result = await provider.request(parameters);
              trackEvent(AnalyticsEvent.ConfirmFrameEthSignature, {
                method: parameters.method,
                ...analyticsContext,
              });
              return result;
            }
            default: {
              const response = await provider.request(parameters);
              return response;
            }
          }
        };

        try {
          return await attempt();
        } catch (e) {
          // Attempt one retry if the provider is unauthorized
          if (e instanceof Provider.UnauthorizedError) {
            try {
              await provider.request({
                method: 'eth_requestAccounts',
              });
              return await attempt();
            } catch (retryError) {
              trackError(retryError);
              throw retryError;
            }
          }
          throw e;
        }
      },
    };
  }, [
    analyticsContext,
    domain,
    trackEvent,
    provider,
    putMiniAppEvent,
    getProviderAddress,
    getChainId,
    preferredWallet,
  ]);

  useExposeToEndpoint({
    endpoint,
    sdk,
    miniAppOrigin: '*',
    // @ts-expect-error - cant figure out typing here
    ethProvider: instrumentedProvider,
    debug,
  });

  // We always start out from minimized state so that we can animate it open
  const [showMiniAppAsMinimized, setShowMiniAppAsMinimized] =
    React.useState(true);
  const considerMiniAppMinimized = url ? miniAppMinimized : true;
  React.useEffect(() => {
    setShowMiniAppAsMinimized(considerMiniAppMinimized);
  }, [considerMiniAppMinimized]);

  return (
    <div
      className={cn(
        'flex min-h-[48px] shrink flex-col',
        'shadow-[0px_0px_25px_0_rgba(0,0,0,0.12)]',
        'dark:shadow-[0px_4px_20px_0_rgba(255,255,255,0.07),_0px_0px_0.5px_0_rgba(255,255,255,0.30),_0px_0px_3px_0_rgba(255,255,255,0.15)]',
        'overflow-hidden rounded-xl',
      )}
    >
      <MiniAppHeader
        name={name}
        author={author}
        domain={domain}
        frame={frame ?? undefined}
        onBack={triggerBack}
        showBack={backState.visible}
        locationContext={locationContext}
        isKebabMenuOpen={isKebabMenuOpen}
        setIsKebabMenuOpen={setIsKebabMenuOpen}
        onClose={close}
        refresh={refresh}
        emit={emit}
        alwaysShowAsIcon={alwaysShowAsIcon}
        clearPreviewRequests={clearPreviewRequests}
      />
      <div
        className={cn(
          'relative overflow-hidden rounded-b-xl transition-all duration-300 ease-in-out',
          'flex min-h-0 flex-col',
          {
            ['basis-0']: showMiniAppAsMinimized,
            ['shrink grow basis-[695px]']: !showMiniAppAsMinimized,
          },
        )}
      >
        {unavailable ? (
          <div className="flex h-full flex-1 flex-col items-center justify-center bg-faint">
            <div className="text-lg">
              {invalidUrl ? 'Mini Apps must use https' : 'App not available'}
            </div>
          </div>
        ) : (
          <>
            {showSplashScreen && (
              <SplashScreen
                imageUrl={splashImageUrl}
                backgroundColor={splashBackgroundColor}
                showOverlayIfStuck={isDevPreview}
                onHideSplashScreen={() => setShowSplashScreen(false)}
                miniAppUrl={url}
                isDevPreview={isDevPreview}
              />
            )}
            <AppFrameIFrame
              ref={iframeLoaderRef}
              url={url}
              splashBackgroundColor={splashBackgroundColor}
              disablePointerEvents={isKebabMenuOpen}
              primaryButton={primaryButton}
              handlePrimaryButtonPress={handlePrimaryButtonPress}
              onLoaded={() => {
                iframeLoadedRef.current = true;
                if (addRejectedBeforeLoadRef.current) {
                  addRejectedBeforeLoadRef.current = false;
                  setShowSplashScreen(false);
                }
              }}
            />
            {castIntentAndPromise && (
              <ComposeCastModal
                onClose={(cast) => {
                  castIntentAndPromise.onSuccess?.({
                    cast: cast !== undefined ? cast : null,
                  });
                  setCastIntentAndPromise(undefined);
                }}
                intent={castIntentAndPromise.castIntent}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

type AppFrameIframeProps = {
  url?: string;
  splashBackgroundColor?: string;
  disablePointerEvents?: boolean;
  primaryButton: PrimaryButtonState | null;
  handlePrimaryButtonPress: () => void;
  onLoaded?: () => void;
};

// Returns ReactElement instead of ReactNode because the latter allows falsey
// values. We want to make sure we always return children so that the wallet
// iframe is perma-loaded and doesn't need to be reloaded when a mini app opens.
const AppFrameIFrame = forwardRef<IFrameLoaderRef, AppFrameIframeProps>(
  (
    {
      url,
      splashBackgroundColor,
      disablePointerEvents,
      primaryButton,
      handlePrimaryButtonPress,
      onLoaded,
    },
    ref,
  ): ReactElement => {
    const { isWarpcastWalletOpen } = useOpenableWarpcastWallet();
    const { trackEvent } = useTrackEvent();

    const [hasBeenOpened, setHasBeenOpened] = useState(false);

    useEffect(() => {
      if (isWarpcastWalletOpen && !hasBeenOpened) {
        trackEvent(AnalyticsEvent.WalletOpenedBeforeLoad, {
          location: 'mini_app',
        });
        setHasBeenOpened(true);
      }
    }, [isWarpcastWalletOpen, hasBeenOpened, trackEvent]);

    // Load iframe immediately — the user has already opened a mini-app so the
    // wallet is needed right away. Delaying here causes mini_app_modal's Privy
    // init to race with full_warplet's 5 s timer and produce a stuck popup.
    useEffect(() => {
      setHasBeenOpened(true);
    }, []);

    return (
      <div className="flex h-full flex-1 flex-col bg-muted">
        <IFrameLoader
          ref={ref}
          src={url}
          allow="microphone; camera; clipboard-write"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          onLoaded={onLoaded}
          className={classNames(
            splashBackgroundColor
              ? `bg-[${splashBackgroundColor}]`
              : 'scrollbar-hide bg-muted',
            disablePointerEvents && 'pointer-events-none',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 z-20 flex animate-overlay-show items-end',
              {
                'pointer-events-none hidden': !isWarpcastWalletOpen,
              },
            )}
          >
            <div className="h-full flex-1 animate-frame-action-content-show">
              {hasBeenOpened && (
                <EmbeddedWalletIframe surface="mini_app_modal" />
              )}
            </div>
          </div>
        </IFrameLoader>
        {primaryButton && !primaryButton.hidden && (
          <div className="flex-none p-3 bg-app">
            <DefaultButton
              onClick={(e) => {
                e.stopPropagation();
                handlePrimaryButtonPress();
              }}
              disabled={primaryButton.disabled}
              isLoading={primaryButton.loading}
              className="h-[48px] w-full px-2 !text-lg"
            >
              {primaryButton.text}
            </DefaultButton>
          </div>
        )}
      </div>
    );
  },
);

function SplashScreen({
  miniAppUrl,
  imageUrl,
  backgroundColor,
  showOverlayIfStuck,
  onHideSplashScreen,
  showOverlayDelayMs = 5000,
  isDevPreview = false,
}: {
  miniAppUrl?: string;
  imageUrl?: string;
  backgroundColor?: string;
  showOverlayIfStuck: boolean;
  onHideSplashScreen?: () => void;
  showOverlayDelayMs?: number;
  isDevPreview?: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!showOverlayIfStuck) {
      return;
    }
    const timer = setTimeout(() => {
      setShowOverlay(true);
    }, showOverlayDelayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [showOverlayIfStuck, showOverlayDelayMs]);

  const overlay = useMemo(() => {
    if (!showOverlay) {
      return null;
    }
    let isTunnelUrl = false;
    if (miniAppUrl) {
      try {
        isTunnelUrl = isTunnelDomain(new URL(miniAppUrl).hostname);
      } catch {
        // fall through, treat as non-tunnel
      }
    }
    return (
      <div className="absolute inset-x-4 top-4 z-20 max-w-sm animate-overlay-show">
        <div className="space-y-2">
          {isDevPreview && (
            <div className="inline-flex items-center rounded-md border px-3 py-1.5 bg-elevated border-default">
              <span className="text-xs font-medium">Developer Mode</span>
            </div>
          )}

          {/* Alert: Ready not called */}
          <div className="rounded-lg border p-3 shadow-lg bg-app border-default">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium">Ready not called</p>
                <p className="mt-0.5 text-xs text-faint">
                  Your app hasn't called{' '}
                  <code className="font-mono rounded px-1 py-0.5 text-xs bg-overlay-light">
                    sdk.actions.ready()
                  </code>{' '}
                  yet. This may cause the splash screen to persist.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href="https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium underline hover:no-underline"
                  >
                    View documentation
                  </a>
                  <span className="text-faint">•</span>
                  <button
                    className="text-xs font-medium underline hover:no-underline"
                    onClick={onHideSplashScreen}
                  >
                    Hide splash screen for now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alert: Tunnel URL detected */}
          {isTunnelUrl && (
            <div className="rounded-lg border p-3 shadow-lg bg-app border-default">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">Tunnel URL detected</p>
                  <p className="mt-0.5 text-xs text-faint">
                    Your URL looks like a tunnel. Open it in your browser first
                    to ensure it's working properly.
                  </p>
                  <div className="mt-2">
                    <a
                      href={miniAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium underline hover:no-underline"
                    >
                      Open URL in new tab
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [showOverlay, miniAppUrl, onHideSplashScreen, isDevPreview]);

  return (
    <div
      className="absolute inset-0 z-10 flex h-full items-center justify-center"
      style={{ backgroundColor: backgroundColor ?? '#ffffff' }}
    >
      {overlay}
      {imageUrl && (
        <div className="mt-[-88px]">
          <Image src={imageUrl} alt="Splash" className="size-[88px]" />
        </div>
      )}
    </div>
  );
}

function MiniAppHeader({
  name,
  author,
  domain,
  frame,
  locationContext,
  isKebabMenuOpen,
  setIsKebabMenuOpen,
  onClose,
  onBack,
  refresh,
  emit,
  alwaysShowAsIcon,
  showBack,
  clearPreviewRequests,
}: {
  name?: string;
  author?: ApiUser;
  domain: string;
  frame?: ApiFrame;
  onBack: () => void;
  showBack: boolean;
  locationContext?: Context.LocationContext;
  isKebabMenuOpen: boolean;
  setIsKebabMenuOpen: (open: boolean) => void;
  onClose: () => void;
  refresh: () => void;
  emit: ((event: MiniAppClientEvent) => void) | undefined;
  debug?: boolean;
  alwaysShowAsIcon?: boolean;
  clearPreviewRequests: () => void;
}) {
  const {
    confirmAddFavoriteFrame,
    confirmRemoveFavoriteFrame,
    resetAddFavoriteFrame,
  } = useFavoriteFrame();
  const { refetch } = useNonSuspenseFrameDetails({ domain });
  const { openConnectModal } = useWallet();
  const isAdmin = useIsAdmin();
  const [showQualityModal, setShowQualityModal] = useState(false);

  useEffect(() => {
    if (name) {
      resetAddFavoriteFrame();
    }
  }, [resetAddFavoriteFrame, name]);

  const handleAddMiniApp = useCallback(async () => {
    if (!frame) {
      return;
    }

    setIsKebabMenuOpen(false);
    try {
      await confirmAddFavoriteFrame({
        frame,
        emit,
        emitOnRejection: false,
        // We are already in a portal
        renderInPortal: false,
      });

      refetch();
    } catch (e) {
      if (e instanceof AddMiniApp.RejectedByUser) {
        throw e;
      }

      toast({ message: 'Something went wrong', type: 'error' });
      throw e;
    }
  }, [emit, confirmAddFavoriteFrame, frame, refetch, setIsKebabMenuOpen]);

  const handleRemoveFrame = useCallback(() => {
    if (frame) {
      setIsKebabMenuOpen(false);
      confirmRemoveFavoriteFrame({ frame, emit, renderInPortal: false });
      refetch();
    }
  }, [frame, setIsKebabMenuOpen, confirmRemoveFavoriteFrame, emit, refetch]);

  const frameShareUrl = useMemo(() => {
    if (locationContext?.type === 'cast_embed') {
      return locationContext.embed;
    }

    if (frame) {
      return getMiniAppCanonicalUrl({ frame });
    }
  }, [locationContext, frame]);

  const enableFrameNotifications = useEnableFrameNotifications();

  const updateFavoriteFrame = useUpdateFavoriteFrame();

  const notificationsEnabled =
    frame?.viewerContext?.notificationsEnabled ?? false;
  const pushNotificationsEnabled =
    frame?.viewerContext?.pushNotificationsEnabled ?? false;
  const miniAppPushNotificationsEnabled = useFeatureFlag(
    'mini-app-push-notifications',
  );
  const setMiniAppPushNotifications = useSetMiniAppPushNotifications();
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

  const toggleNotifications = useCallback(async () => {
    if (!frame) {
      return;
    }

    if (notificationsEnabled) {
      try {
        await updateFavoriteFrame({
          frame,
          disableNotifications: true,
          pushNotificationsEnabled:
            miniAppPushNotificationsEnabled && frame.supportsPushNotifications
              ? pushNotificationsEnabled
              : undefined,
        });
        toast({ message: 'Notifications disabled', type: 'success' });
      } catch (e) {
        toast({ message: 'Error disabling notifications', type: 'error' });
      }
    } else {
      try {
        await enableFrameNotifications(frame);
        toast({ message: 'Notifications enabled', type: 'success' });
      } catch (e) {
        toast({ message: 'Error enabling notifications', type: 'error' });
      }
    }
  }, [
    enableFrameNotifications,
    frame,
    miniAppPushNotificationsEnabled,
    notificationsEnabled,
    pushNotificationsEnabled,
    updateFavoriteFrame,
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
    try {
      await setMiniAppPushNotifications({ frame, enabled: nextValue });
      toast({
        message: `Push notifications ${nextValue ? 'enabled' : 'disabled'}`,
        type: 'success',
      });
    } catch {
      toast({
        message: 'Error updating push notifications',
        type: 'error',
      });
    }
  }, [
    frame,
    miniAppPushNotificationsEnabled,
    pushNotificationsEnabled,
    setMiniAppPushNotifications,
  ]);

  const {
    miniAppMinimized,
    minimizeMiniApp,
    maximizeMiniApp,
    miniAppLoadingMessage,
  } = useMinimizableWindowContext();

  const dropdownMenu = (
    <DropdownMenu.Root
      open={isKebabMenuOpen}
      onOpenChange={setIsKebabMenuOpen}
      modal={false}
    >
      <DropdownMenu.Trigger onClick={(e) => e.stopPropagation()}>
        <div
          className={cn([
            'hidden',
            'items-center justify-center',
            'size-8 rounded-full transition-colors',
            'bg-overlay-light hover:bg-overlay-medium active:bg-elevated',
            {
              flex: !miniAppMinimized,
              'xl:flex': !alwaysShowAsIcon,
            },
          ])}
        >
          <KebabHorizontalIcon />
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="bottom"
        sideOffset={21}
        align="end"
        alignOffset={-15}
        className="z-20 w-52 divide-y divide-[#efefef] overflow-hidden rounded-xl border shadow-xl bg-app border-default dark:divide-[#4c3a4e80]"
        onClick={(e) => e.stopPropagation()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {!!frameShareUrl && (
          <DropdownMenuItem
            name="Copy link"
            icon={<CopyIcon size="small" />}
            onSelect={(e) => {
              e.preventDefault();
              toast({ message: 'Link copied to clipboard', type: 'info' });
              navigator.clipboard.writeText(frameShareUrl);
              setIsKebabMenuOpen(false);
            }}
          />
        )}
        <DropdownMenuItem
          name="Reload page"
          icon={<SyncIcon size="small" />}
          onSelect={(e) => {
            e.preventDefault();
            setIsKebabMenuOpen(false);
            refresh();
          }}
        />
        <DropdownMenuItem
          name="Switch wallet"
          icon={<WalletMinimal size="small" />}
          onSelect={(e) => {
            e.preventDefault();
            setIsKebabMenuOpen(false);
            openConnectModal();
          }}
        />
        {(showInAppNotificationSettings || showPushNotificationSettings) && (
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="outline-hidden p-2 text-sm focus-within:bg-overlay-medium hover:cursor-pointer hover:bg-overlay-medium active:bg-overlay-medium">
              <div className="flex flex-row items-center gap-2">
                <div className="min-w-0 flex-1 truncate">Notifications</div>
                <div className="text-xs text-muted">
                  {notificationPreferenceSummary}
                </div>
                <ChevronRightIcon size="small" />
              </div>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                sideOffset={4}
                className="z-30 w-52 divide-y divide-[#efefef] overflow-hidden rounded-xl border shadow-xl bg-app border-default dark:divide-[#4c3a4e80]"
                onClick={(e) => e.stopPropagation()}
              >
                {showInAppNotificationSettings && (
                  <DropdownMenuItem
                    onSelect={async (e) => {
                      e.preventDefault();
                      await toggleNotifications();
                    }}
                  >
                    <div className="flex flex-row items-center justify-between gap-3">
                      <span>In-app</span>
                      <span className="text-xs text-muted">
                        {notificationsEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}
                {showPushNotificationSettings && (
                  <DropdownMenuItem
                    onSelect={async (e) => {
                      e.preventDefault();
                      await togglePushNotifications();
                    }}
                  >
                    <div className="flex flex-row items-center justify-between gap-3">
                      <span>Push</span>
                      <span className="text-xs text-muted">
                        {pushNotificationsEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
        )}
        {frame && (
          <>
            {frame.viewerContext?.favorited ? (
              <DropdownMenuItem
                name="Remove Mini App"
                icon={<DiffRemovedIcon size="small" />}
                onSelect={async (e) => {
                  e.preventDefault();
                  handleRemoveFrame();
                }}
                className="text-danger"
              />
            ) : (
              <DropdownMenuItem
                name="Add Mini App"
                icon={<DiffAddedIcon size="small" />}
                onSelect={async (e) => {
                  e.preventDefault();
                  await handleAddMiniApp();
                }}
              />
            )}
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );

  const toggleMiniAppMinimization = React.useCallback(() => {
    if (miniAppMinimized) {
      maximizeMiniApp();
    } else {
      // Clear any pending transaction preview requests when minimizing
      clearPreviewRequests();
      minimizeMiniApp();
    }
  }, [
    miniAppMinimized,
    minimizeMiniApp,
    maximizeMiniApp,
    clearPreviewRequests,
  ]);

  const iconUrl = frame?.iconUrl;
  const authorIsProUser = useUserLevel(author) === 'pro';

  const isLoadingSection = useMemo(() => {
    if (!miniAppLoadingMessage) {
      return;
    }
    return (
      <div className="flex flex-1 items-center gap-2">
        <Loader2Icon className="text-elevated animate-spin" />
        <span className="text-elevated truncate text-sm">
          {miniAppLoadingMessage}
        </span>
      </div>
    );
  }, [miniAppLoadingMessage]);

  const innerSection = useMemo(() => {
    // If the loading section exists, return that
    if (isLoadingSection) {
      return isLoadingSection;
    }

    // Otherwise, return the inner default section
    return (
      <>
        <button
          className={cn([
            'absolute flex items-center justify-center',
            'size-8 rounded-full transition-all',
            'bg-overlay-light',
            showBack && 'hover:bg-overlay-medium active:bg-elevated',
            (!showBack || miniAppMinimized) && 'pointer-events-none opacity-0',
            miniAppMinimized ? 'duration-300' : 'duration-150',
          ])}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (showBack && !miniAppMinimized) {
              e.preventDefault();
              e.stopPropagation();

              onBack();
            }
          }}
        >
          <ChevronLeftIcon />
        </button>
        <div
          className={cn([
            'transition-all',
            miniAppMinimized ? 'duration-300' : 'duration-150',
            showBack && !miniAppMinimized && 'ml-[38px]',
          ])}
        >
          {iconUrl ? (
            <FrameIconImage imageUrl={iconUrl} size={24} />
          ) : (
            <MiniAppsIcon size={24} color="currentColor" fill={false} />
          )}
        </div>
        <div
          className={cn([
            'min-w-0 flex-1',
            'hidden',
            'flex-col',
            'truncate',
            {
              flex: !miniAppMinimized,
              'xl:flex': !alwaysShowAsIcon,
            },
          ])}
        >
          {author ? (
            <>
              <div className="truncate text-sm font-semibold" title={name}>
                {name}
              </div>
              <div className="flex items-center gap-1">
                <div className="text-xs text-faint">
                  by {resolveUsernameShort(author)}
                </div>
                {authorIsProUser && <FarcasterProBadge size={14} />}
              </div>
            </>
          ) : (
            <div className="truncate" title={domain}>
              {domain}
            </div>
          )}
        </div>
      </>
    );
  }, [
    alwaysShowAsIcon,
    author,
    authorIsProUser,
    domain,
    iconUrl,
    isLoadingSection,
    miniAppMinimized,
    name,
    onBack,
    showBack,
  ]);

  return (
    <div
      className={cn([
        'relative flex-1',
        'flex items-center justify-between gap-2',
        'w-full',
        'bg-swap',
        'cursor-pointer',
        'flex-shrink-0',
        'p-3',
      ])}
      onClick={toggleMiniAppMinimization}
    >
      {innerSection}
      {isAdmin && !miniAppMinimized && (
        <MiniAppQualityButton
          quality={frame?.harmful ? 'harmful' : 'neutral'}
          onClick={() => setShowQualityModal(true)}
        />
      )}
      {dropdownMenu}
      <button
        className={cn([
          'hidden',
          'items-center justify-center',
          'size-8 rounded-full transition-colors',
          'bg-overlay-light hover:bg-overlay-medium active:bg-elevated',
          {
            flex: !miniAppMinimized,
            'xl:flex': !alwaysShowAsIcon,
          },
        ])}
      >
        {miniAppMinimized ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={cn([
          'hidden',
          'items-center justify-center',
          'size-8 rounded-full transition-colors',
          'bg-overlay-light hover:bg-overlay-medium active:bg-elevated',
          {
            flex: !miniAppMinimized,
            'xl:flex': !alwaysShowAsIcon,
          },
        ])}
      >
        <XIcon />
      </button>
      {showQualityModal && (
        <MiniAppQualityModal
          domain={domain}
          name={frame?.name ?? name}
          harmful={frame?.harmful}
          onCancel={() => setShowQualityModal(false)}
        />
      )}
    </div>
  );
}
