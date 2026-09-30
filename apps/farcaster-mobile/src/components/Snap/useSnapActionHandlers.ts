import { MEDIA_TYPE, validateSnapResponse } from '@farcaster/snap';
import { type SnapActionHandlers } from '@farcaster/snap/react-native';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  type ApiFarcasterWalletAction,
  isAllowedSnapTargetUrl,
  parseCAIP19Token,
  preserveQueryParams,
} from 'farcaster-client-data';
import {
  buildSnapHandlerAnalyticsProps,
  type ResolvedMiniAppConfig,
  type SnapHandlerKind,
  useFarcasterApiClient,
  useFetchEvmScanAction,
  useResolveMiniAppConfig,
} from 'farcaster-client-hooks';
import { useEmbeddedWallet } from 'farcaster-expo';
import { useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { usePostHogFeatureFlag } from '~/hooks/usePostHogFeatureFlag';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';
import {
  parseSnapPayload,
  SNAP_ACCEPT_HEADER,
  type SnapPageResponse,
} from '~/utils/snapUtils';

function isHttpOrHttpsUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

type SnapSendTransactionParams = {
  chainId: string;
  to: string;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

type SnapTransactionActionHandlers = Omit<
  SnapActionHandlers,
  'send_transaction'
> & {
  view_channel: (params: { channelKey: string }) => void;
  send_transaction: (params: SnapSendTransactionParams) => Promise<void>;
};

type NavigationHandlers = Omit<SnapTransactionActionHandlers, 'submit'>;

type SnapCastContext = {
  hash: string;
  authorFid: number;
};

type SnapTransactionFailureReason = 'rejected_by_user' | 'failed' | 'unknown';

type SnapTransactionResult =
  | { success: true; transactionHash: string }
  | {
      success: false;
      reason: SnapTransactionFailureReason;
      message?: string;
      code?: string | number;
      transactionHash?: string;
    };

const SNAP_TRANSACTION_ACTIONS_EXECUTE_FLAG =
  'snap-transaction-actions-execute';

function parseSnapChainId(chainId: string): number | undefined {
  const trimmed = chainId.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = trimmed.startsWith('0x')
    ? Number.parseInt(trimmed, 16)
    : Number(trimmed);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function getSnapDomain(snapDocumentUrl: string | null | undefined): string {
  if (!snapDocumentUrl) {
    return 'unknown';
  }

  try {
    return new URL(snapDocumentUrl).hostname;
  } catch {
    return 'unknown';
  }
}

function buildSendTransactionAction(
  params: SnapSendTransactionParams,
): ApiFarcasterWalletAction {
  return {
    method: 'eth_sendTransaction',
    params: {
      chainId: params.chainId,
      to: params.to,
      data: params.data ?? '0x',
      value: params.value ?? '0x0',
      ...(params.gas ? { gas: params.gas } : {}),
      ...(params.gasPrice ? { gasPrice: params.gasPrice } : {}),
      ...(params.maxFeePerGas ? { maxFeePerGas: params.maxFeePerGas } : {}),
      ...(params.maxPriorityFeePerGas
        ? { maxPriorityFeePerGas: params.maxPriorityFeePerGas }
        : {}),
    },
  };
}

function toEvmProviderRequest(action: ApiFarcasterWalletAction) {
  switch (action.method) {
    case 'eth_sendTransaction':
      return {
        method: action.method,
        params: [action.params],
      } as const;
    default:
      return undefined;
  }
}

function withSnapActionFrom(
  action: ApiFarcasterWalletAction,
  account: string | undefined,
): ApiFarcasterWalletAction {
  if (!account) {
    return action;
  }

  switch (action.method) {
    case 'eth_sendTransaction':
      return {
        ...action,
        params: {
          ...action.params,
          from: action.params.from ?? account,
        },
      };
    default:
      return action;
  }
}

function getTransactionHash(result: unknown): string | undefined {
  return typeof result === 'string' ? result : undefined;
}

function getErrorCode(error: unknown): string | number | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (typeof error.code === 'string' || typeof error.code === 'number')
  ) {
    return error.code;
  }
  return undefined;
}

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : undefined;
}

function getTransactionFailureReason(
  error: unknown,
): SnapTransactionFailureReason {
  const code = getErrorCode(error);
  return code === 4001 || code === '4001' ? 'rejected_by_user' : 'failed';
}

export function useSnapActionHandlers({
  snapDocumentUrl,
  castContext,
  onSnapLoad,
  onError,
  onClearError,
  onNavigateAway,
  onBeforeExternalAction,
  onTransactionLoadingChange,
  onSnapActivation,
}: {
  /** Loaded snap document URL (embed URL), not page or cast URL. */
  snapDocumentUrl?: string | null;
  castContext?: SnapCastContext;
  onSnapLoad?: (snap: SnapPageResponse, url: string) => void;
  onError?: (message: string) => void;
  onClearError?: () => void;
  onNavigateAway?: () => void;
  onBeforeExternalAction?: () => void;
  onTransactionLoadingChange?: (loading: boolean) => void;
  onSnapActivation?: (trigger: SnapHandlerKind) => void;
} = {}): NavigationHandlers {
  const { apiClient } = useFarcasterApiClient();
  const currentUser = useCurrentUser_UNSAFE();
  const push = usePush();
  const pushToUserProfile = usePushToUserProfile();
  const openComposer = useOpenComposer();
  const openUrl = usePossiblyNavigateOrOpenUrl();
  const launchFrame = useLaunchFrame();
  const resolveMiniAppConfig = useResolveMiniAppConfig();
  const { trackEvent } = useAnalytics();
  const {
    activeWalletId,
    evmAddress,
    evmMiniAppProvider,
    miniAppActiveWalletId,
    miniAppEvmAddress,
  } = useEmbeddedWallet();
  const fetchEvmScanAction = useFetchEvmScanAction();
  const snapTransactionActionsExecuteEnabled = usePostHogFeatureFlag(
    SNAP_TRANSACTION_ACTIONS_EXECUTE_FLAG,
  );
  const snapDocumentUrlRef = useRef(snapDocumentUrl);
  snapDocumentUrlRef.current = snapDocumentUrl;

  const trackCastEmbedSnapHandler = useCallback(
    (
      handler: SnapHandlerKind,
      properties?: Record<string, string | number | boolean | undefined>,
    ) => {
      const snapUrl = snapDocumentUrlRef.current;
      onSnapActivation?.(handler);
      trackEvent(AnalyticsEvent.SnapHandler, {
        handler,
        surface: 'cast_embed_mobile',
        ...properties,
        ...buildSnapHandlerAnalyticsProps(snapUrl),
      });
    },
    [onSnapActivation, trackEvent],
  );

  const loadSnapFromUrl = useCallback(
    async (absoluteUrl: string) => {
      if (!isHttpOrHttpsUrl(absoluteUrl)) {
        onError?.('Only http and https links can be opened');
        return;
      }
      try {
        const response = await fetch(absoluteUrl, {
          headers: { Accept: SNAP_ACCEPT_HEADER },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes(MEDIA_TYPE)) {
          throw new Error('Response is not a snap');
        }
        const text = await response.text();
        const json = text.trim() ? JSON.parse(text) : null;
        const validation = validateSnapResponse(json);
        if (!validation.valid) {
          throw new Error(validation.issues.map((i) => i.message).join(', '));
        }
        const parsed = parseSnapPayload(json);
        onSnapLoad?.(parsed, absoluteUrl);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load snap';
        onError?.(msg);
        throw e;
      }
    },
    [onSnapLoad, onError],
  );

  const simulateSnapEvmAction = useCallback(
    (action: ApiFarcasterWalletAction, chainId: string) => {
      const numericChainId = parseSnapChainId(chainId);
      const account = miniAppEvmAddress ?? evmAddress;
      if (!account || !numericChainId) {
        return;
      }

      void fetchEvmScanAction({
        account,
        chainId: numericChainId,
        action,
        domain: getSnapDomain(snapDocumentUrlRef.current),
        walletId: miniAppActiveWalletId ?? activeWalletId,
      }).catch(() => {});
    },
    [
      activeWalletId,
      evmAddress,
      fetchEvmScanAction,
      miniAppActiveWalletId,
      miniAppEvmAddress,
    ],
  );

  const sendTransactionResultCallback = useCallback(
    async ({
      request,
      result,
    }: {
      request: SnapSendTransactionParams;
      result: SnapTransactionResult;
    }) => {
      const snapDocUrl = snapDocumentUrlRef.current;
      if (!snapDocUrl) {
        return;
      }

      const fid = currentUser.fid;
      if (!fid || !Number.isFinite(fid) || !Number.isInteger(fid)) {
        return;
      }

      const surface = castContext
        ? {
            type: 'cast' as const,
            cast: {
              hash: castContext.hash,
              author: { fid: castContext.authorFid },
            },
          }
        : { type: 'standalone' as const };

      const res = await apiClient.snapRequest({
        method: 'POST',
        targetUrl: snapDocUrl,
        payload: {
          fid,
          user: { fid },
          timestamp: Math.floor(Date.now() / 1000),
          audience: new URL(snapDocUrl).origin,
          surface,
          type: 'transaction_result',
          transaction: { request, result },
        },
      });

      const snapResult = res.data.result;
      if (
        snapResult.success &&
        snapResult.response !== undefined &&
        snapResult.response !== null
      ) {
        const validation = validateSnapResponse(snapResult.response);
        if (!validation.valid) {
          throw new Error(validation.issues.map((i) => i.message).join(', '));
        }
        const parsed = parseSnapPayload(snapResult.response);
        onSnapLoad?.(parsed, snapDocUrl);
      }
    },
    [apiClient, castContext, currentUser.fid, onSnapLoad],
  );

  const handleSnapEvmAction = useCallback(
    async (
      action: ApiFarcasterWalletAction,
      chainId: string,
      snapRequest: SnapSendTransactionParams,
    ) => {
      const account = miniAppEvmAddress ?? evmAddress;
      const actionWithFrom = withSnapActionFrom(action, account);

      if (!snapTransactionActionsExecuteEnabled) {
        simulateSnapEvmAction(actionWithFrom, chainId);
        return;
      }

      const request = toEvmProviderRequest(actionWithFrom);
      if (!request) {
        onError?.('Wallet is not available');
        return;
      }

      onBeforeExternalAction?.();
      onTransactionLoadingChange?.(true);
      onClearError?.();
      try {
        const providerResult = await evmMiniAppProvider.request(
          request as never,
        );
        const transactionHash = getTransactionHash(providerResult);
        if (!transactionHash) {
          throw new Error('No transaction hash');
        }
        try {
          await sendTransactionResultCallback({
            request: snapRequest,
            result: { success: true, transactionHash },
          });
        } catch {
          // The wallet transaction already completed; a callback render miss
          // should not be reported as a failed transaction.
        }
        onClearError?.();
      } catch (error) {
        await sendTransactionResultCallback({
          request: snapRequest,
          result: {
            success: false,
            reason: getTransactionFailureReason(error),
            message: getErrorMessage(error),
            code: getErrorCode(error),
          },
        }).catch(() => {});
        onError?.('Transaction failed or was cancelled');
      } finally {
        onTransactionLoadingChange?.(false);
      }
    },
    [
      evmMiniAppProvider,
      evmAddress,
      miniAppEvmAddress,
      onClearError,
      onBeforeExternalAction,
      onError,
      onTransactionLoadingChange,
      sendTransactionResultCallback,
      simulateSnapEvmAction,
      snapTransactionActionsExecuteEnabled,
    ],
  );

  return useMemo(
    () => ({
      open_url: (target: string) => {
        trackCastEmbedSnapHandler('open_url');
        const trimmedTarget = target.trim();
        if (!trimmedTarget) return;

        if (!isAllowedSnapTargetUrl(trimmedTarget)) {
          onError?.('Only https or localhost links can be opened');
          return;
        }

        onBeforeExternalAction?.();
        onNavigateAway?.();
        openUrl({
          url: trimmedTarget,
          openExternalTarget: 'system',
        });
      },

      open_mini_app: (target: string) => {
        trackCastEmbedSnapHandler('open_mini_app');
        const trimmedTarget = target.trim();
        if (!trimmedTarget) return;
        if (!isAllowedSnapTargetUrl(trimmedTarget, { allowLocalhost: false })) {
          Alert.alert('Mini app URL must use https');
          return;
        }

        const targetHostname = new URL(trimmedTarget).hostname;
        const referrerDomain = snapDocumentUrlRef.current
          ? new URL(snapDocumentUrlRef.current).hostname
          : targetHostname;

        void resolveMiniAppConfig(trimmedTarget)
          .catch(
            (): ResolvedMiniAppConfig => ({
              url: trimmedTarget,
              name: targetHostname,
            }),
          )
          .then((config) => {
            onBeforeExternalAction?.();
            onNavigateAway?.();
            void launchFrame({
              context: { type: 'open_miniapp', referrerDomain },
              config: {
                ...config,
                url: preserveQueryParams({
                  launchUrl: config.url,
                  sourceUrl: trimmedTarget,
                }),
              },
              author: config.author,
              skipConfirmation: true,
            });
          });
      },

      open_snap: (target: string) => {
        trackCastEmbedSnapHandler('open_snap');
        const trimmedTarget = target.trim();
        if (!trimmedTarget) return;

        if (!isAllowedSnapTargetUrl(trimmedTarget)) {
          onError?.('Only https or localhost links can be opened');
          return;
        }

        void loadSnapFromUrl(trimmedTarget).catch(() => {});
      },

      view_cast: ({ hash }: { hash: string }) => {
        trackCastEmbedSnapHandler('view_cast');
        onBeforeExternalAction?.();
        onNavigateAway?.();
        push('Cast', { castHash: hash });
      },

      view_profile: ({ fid }: { fid: number }) => {
        trackCastEmbedSnapHandler('view_profile');
        onNavigateAway?.();
        pushToUserProfile({ fid });
      },

      view_channel: ({ channelKey }: { channelKey: string }) => {
        const trimmedChannelKey = channelKey.trim();
        if (!trimmedChannelKey) return;
        trackCastEmbedSnapHandler('view_channel');
        onBeforeExternalAction?.();
        onNavigateAway?.();
        push('Channel', { channelKey: trimmedChannelKey });
      },

      compose_cast: ({
        text,
        channelKey,
        embeds,
      }: {
        text?: string;
        channelKey?: string;
        embeds?: string[];
      }) => {
        trackCastEmbedSnapHandler('compose_cast', {
          embedCount: embeds?.length ?? 0,
          hasText: Boolean(text?.trim()),
        });
        onNavigateAway?.();
        openComposer({
          intent: {
            text: text ?? '',
            embeds: embeds ?? [],
            mentions: [],
            channelKey,
          },
        });
      },

      view_token: ({ token }: { token: string }) => {
        trackCastEmbedSnapHandler('view_token');
        const erc20 = parseCAIP19Token(token);
        if (!erc20) return;
        onBeforeExternalAction?.();
        onNavigateAway?.();
        push('Token', {
          chain: erc20.chain,
          ca: erc20.ca,
          via: 'snap_view_token',
        });
      },

      send_token: ({
        token,
        amount,
        recipientFid,
        recipientAddress,
      }: {
        token: string;
        amount?: string;
        recipientFid?: number;
        recipientAddress?: string;
      }) => {
        trackCastEmbedSnapHandler('send_token', {
          hasAmount: Boolean(amount?.trim()),
          hasRecipientFid: recipientFid !== undefined,
          hasRecipientAddress: Boolean(recipientAddress?.trim()),
        });
        const erc20 = parseCAIP19Token(token);
        if (!erc20) return;
        onBeforeExternalAction?.();
        onNavigateAway?.();
        push('WalletSend', {
          platformType: 'mobile',
          sendIntent: {
            chain: erc20.chain,
            ca: erc20.ca,
            amount,
            recipientAddress,
            recipientFid,
          },
        });
      },

      swap_token: ({
        sellToken,
        buyToken,
      }: {
        sellToken?: string;
        buyToken?: string;
      }) => {
        trackCastEmbedSnapHandler('swap_token', {
          hasSellToken: Boolean(sellToken?.trim()),
          hasBuyToken: Boolean(buyToken?.trim()),
        });
        const buy = buyToken ? parseCAIP19Token(buyToken) : undefined;
        const sell = sellToken ? parseCAIP19Token(sellToken) : undefined;
        if (!buy && !sell) return;
        try {
          const swapIntent = {
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
          };
          onBeforeExternalAction?.();
          onNavigateAway?.();
          push('WalletSwap', {
            platformType: 'mobile',
            swapIntent,
          });
        } catch {
          // unsupported chain — no-op
        }
      },

      send_transaction: (params: SnapSendTransactionParams) => {
        trackCastEmbedSnapHandler('send_transaction' as SnapHandlerKind, {
          hasChainId: Boolean(params.chainId.trim()),
          hasTo: Boolean(params.to.trim()),
        });
        return handleSnapEvmAction(
          buildSendTransactionAction(params),
          params.chainId,
          params,
        );
      },
    }),
    [
      launchFrame,
      loadSnapFromUrl,
      onBeforeExternalAction,
      onError,
      onNavigateAway,
      openComposer,
      openUrl,
      push,
      pushToUserProfile,
      resolveMiniAppConfig,
      handleSnapEvmAction,
      trackCastEmbedSnapHandler,
    ],
  );
}
