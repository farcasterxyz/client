import { MEDIA_TYPE } from '@farcaster/snap';
import type { SnapActionHandlers, SnapPage } from '@farcaster/snap/react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  type ApiFarcasterWalletAction,
  isAllowedSnapTargetUrl,
  parseCAIP19Token,
} from 'farcaster-client-data';
import {
  buildSnapHandlerAnalyticsProps,
  isLocalhostUrl,
  type SnapHandlerKind,
  useFarcasterApiClient,
  useFetchEvmScanAction,
  useInteractedSnapUrls,
} from 'farcaster-client-hooks';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenableWarpcastWallet } from '~/contexts/OpenableWarpcastWalletContext';
import { useWallet } from '~/contexts/WalletProvider';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useOpenMiniAppFromSnap } from '~/hooks/snap/useOpenMiniAppFromSnap';
import { usePostHogFeatureFlag } from '~/hooks/usePostHogFeatureFlag';
import {
  isDataCloneLikeError,
  logSnapParseError,
  logSnapResponseError,
  safeStringify,
} from '~/lib/snap/snapDataCloneTrap';
import { SNAP_UPSTREAM_ACCEPT } from '~/lib/snap/snapUpstreamConstants';
import { validateAndParseSnap } from '~/lib/snap/snapUtils';
import type { CastComposerIntent } from '~/types';

/**
 * Single user-facing string for any backend-returned snap error or post-flight
 * failure (HTTP status, content-type, parse, clone, network, publisher-supplied
 * `result.response.error`). Detailed context flows to PostHog via the
 * snap-renderer trap (`SnapParseError` / `SnapResponseError` /
 * `SnapDataCloneError` / `ClientDataCloneError`). Publisher-controlled strings
 * can echo user input or surface V8 phrases that are unactionable for end
 * users.
 */
const SNAP_RESPONSE_GENERIC_ERROR = 'Something went wrong. Please try again.';
const SNAP_TRANSACTION_ACTIONS_EXECUTE_FLAG =
  'snap-transaction-actions-execute';

type SnapCastContext = {
  hash: string;
  authorFid: number;
};

type UseSnapActionHandlersOptions = {
  /**
   * URL of the loaded snap **document** (embed URL or URL after `open_snap` /
   * submit). Not the app page or cast URL.
   */
  snapDocumentUrl: string | null;
  castContext?: SnapCastContext;
  onSnapLoad?: (snap: SnapPage, url: string) => void;
  onError?: (message: string) => void;
  onClearError?: () => void;
  onBeforeExternalAction?: () => void;
  onSnapActivation?: (trigger: SnapHandlerKind) => void;
};

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

type SnapTransactionResult =
  | { success: true; transactionHash: string }
  | {
      success: false;
      reason: SnapTransactionFailureReason;
      message?: string;
      code?: string | number;
      transactionHash?: string;
    };

type SnapTransactionFailureReason = 'rejected_by_user' | 'failed' | 'unknown';

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

function getErrorName(error: unknown): string | undefined {
  return error instanceof Error ? error.name : undefined;
}

function truncateAnalyticsString(value: string | undefined, maxLength = 500) {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function getTransactionFailureReason(
  error: unknown,
): SnapTransactionFailureReason {
  const code = getErrorCode(error);
  return code === 4001 || code === '4001' ? 'rejected_by_user' : 'failed';
}

function getHexDataByteLength(data: string | undefined): number | undefined {
  if (!data) {
    return undefined;
  }

  const hex = data.startsWith('0x') ? data.slice(2) : data;
  return Math.ceil(hex.length / 2);
}

function hasNonZeroHexValue(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const hex = value.startsWith('0x') ? value.slice(2) : value;
  return Boolean(hex) && Number.parseInt(hex, 16) !== 0;
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

export function useSnapActionHandlers({
  snapDocumentUrl,
  castContext,
  onSnapLoad,
  onError,
  onClearError,
  onBeforeExternalAction,
  onSnapActivation,
}: UseSnapActionHandlersOptions): {
  handlers: SnapTransactionActionHandlers;
  loading: boolean;
  composeIntent: CastComposerIntent | undefined;
  composeModalOpen: boolean;
  closeComposeModal: () => void;
} {
  const { apiClient } = useFarcasterApiClient();
  const currentUserFid = useCachedCurrentUser()?.fid;
  const { markInteracted } = useInteractedSnapUrls();
  const appNavigate = useNavigate();
  const walletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = walletBridge?.navigate;
  const sendToken = walletBridge?.sendToken;
  const swapToken = walletBridge?.swapToken;
  const { openWarpcastWallet } = useOpenableWarpcastWallet();
  const openMiniAppFromSnap = useOpenMiniAppFromSnap();
  const { trackEvent } = useAnalytics();
  const { address, provider } = useWallet();
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
        surface: 'cast_embed_web',
        ...properties,
        ...buildSnapHandlerAnalyticsProps(snapUrl),
      });
    },
    [onSnapActivation, trackEvent],
  );

  const trackSnapTransactionError = useCallback(
    ({
      phase,
      action,
      request,
      error,
      providerAvailable,
      walletRequestAvailable,
    }: {
      phase: 'wallet_unavailable' | 'provider_request';
      action: ApiFarcasterWalletAction;
      request: SnapSendTransactionParams;
      error?: unknown;
      providerAvailable: boolean;
      walletRequestAvailable: boolean;
    }) => {
      const numericChainId = parseSnapChainId(request.chainId);

      trackEvent(AnalyticsEvent.SnapTransactionError, {
        phase,
        surface: 'cast_embed_web',
        method: action.method,
        failureReason: error
          ? getTransactionFailureReason(error)
          : 'wallet_unavailable',
        errorName: getErrorName(error),
        errorCode: getErrorCode(error),
        errorMessage: truncateAnalyticsString(getErrorMessage(error)),
        hasProvider: providerAvailable,
        hasWalletRequest: walletRequestAvailable,
        hasConnectedAddress: Boolean(address),
        snapTransactionActionsExecuteEnabled: Boolean(
          snapTransactionActionsExecuteEnabled,
        ),
        currentUserFid,
        castHash: castContext?.hash,
        castAuthorFid: castContext?.authorFid,
        chainId: request.chainId,
        numericChainId,
        to: request.to,
        hasData: Boolean(request.data),
        dataByteLength: getHexDataByteLength(request.data),
        hasValue: hasNonZeroHexValue(request.value),
        hasGas: Boolean(request.gas),
        hasGasPrice: Boolean(request.gasPrice),
        hasMaxFeePerGas: Boolean(request.maxFeePerGas),
        hasMaxPriorityFeePerGas: Boolean(request.maxPriorityFeePerGas),
        ...buildSnapHandlerAnalyticsProps(snapDocumentUrlRef.current),
      });
    },
    [
      address,
      castContext,
      currentUserFid,
      snapTransactionActionsExecuteEnabled,
      trackEvent,
    ],
  );

  const [loading, setLoading] = useState(false);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeIntent, setComposeIntent] = useState<
    CastComposerIntent | undefined
  >(undefined);

  const loadSnapFromUrl = useCallback(
    async (absoluteUrl: string) => {
      if (!isAllowedSnapTargetUrl(absoluteUrl)) {
        onError?.('Only https or localhost links can be opened');
        return;
      }
      setLoading(true);
      // Captured outside the try so the DataCloneError trap (which may fire
      // for an error thrown downstream of the parse) can attach both.
      let responseBodyText: string | null = null;
      let parsedJson: unknown = undefined;
      try {
        const response = await fetch(absoluteUrl, {
          headers: { Accept: SNAP_UPSTREAM_ACCEPT },
          cache: 'no-store',
        });
        if (!response.ok) {
          // Emit before throw — the outer catch only fires
          // `logSnapParseError` when we got past `fetch` (responseBodyText !==
          // null) or the error is data-clone-like; neither is true here, so
          // without this call the GET-path HTTP-status bail drops silently.
          logSnapResponseError({
            phase: 'get_direct',
            reason: 'http_status',
            statusCode: response.status,
            snapDocumentUrl: absoluteUrl,
            displayedMessage: `Snap returned HTTP ${response.status}`,
            trackEvent,
          });
          throw new Error(`HTTP ${response.status}`);
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes(MEDIA_TYPE)) {
          // Use `unexpected_content_type` rather than `non_json_content_type`:
          // this predicate requires the snap-specific media type
          // (`application/vnd.farcaster.snap+json`), so a server returning
          // plain `application/json` is rejected here too. Calling that
          // "non-JSON" would mislead the dashboard (Copilot review, PR #10110).
          logSnapResponseError({
            phase: 'get_direct',
            reason: 'unexpected_content_type',
            statusCode: response.status,
            snapDocumentUrl: absoluteUrl,
            displayedMessage: `Snap returned unexpected content-type: ${contentType}`,
            trackEvent,
          });
          throw new Error('Response is not a snap');
        }
        responseBodyText = await response.text();
        parsedJson = responseBodyText.trim()
          ? JSON.parse(responseBodyText)
          : null;
        const snapPage = validateAndParseSnap(parsedJson);
        onSnapLoad?.(snapPage, absoluteUrl);
      } catch (e) {
        // Emit `snap parse error` only when we got past fetch (so the
        // failure was actually parse / validation, not network / HTTP).
        // DataCloneError is always emitted regardless of phase — that's the
        // specific signal NEYN-10935 was added to surface.
        if (responseBodyText !== null || isDataCloneLikeError(e)) {
          logSnapParseError({
            phase: 'get_direct',
            snapDocumentUrl: absoluteUrl,
            responseBody: { kind: 'raw', text: responseBodyText },
            cloneTarget: parsedJson,
            error: e,
            trackEvent,
          });
        }
        onError?.(SNAP_RESPONSE_GENERIC_ERROR);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [onSnapLoad, onError, trackEvent],
  );

  const closeComposeModal = useCallback(() => {
    setComposeModalOpen(false);
    setComposeIntent(undefined);
  }, []);

  const simulateSnapEvmAction = useCallback(
    (action: ApiFarcasterWalletAction, chainId: string) => {
      const numericChainId = parseSnapChainId(chainId);
      if (!address || !numericChainId) {
        return;
      }

      void fetchEvmScanAction({
        account: address,
        chainId: numericChainId,
        action,
        domain: getSnapDomain(snapDocumentUrlRef.current),
      }).catch(() => {});
    },
    [address, fetchEvmScanAction],
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
      if (!snapDocUrl || isLocalhostUrl(snapDocUrl)) {
        return;
      }

      const fid = currentUserFid;
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
        const nextSnap = validateAndParseSnap(snapResult.response);
        onSnapLoad?.(nextSnap, snapDocUrl);
      }
    },
    [apiClient, castContext, currentUserFid, onSnapLoad],
  );

  const handleSnapEvmAction = useCallback(
    async (
      action: ApiFarcasterWalletAction,
      chainId: string,
      snapRequest: SnapSendTransactionParams,
    ) => {
      const actionWithFrom = withSnapActionFrom(action, address);

      if (!snapTransactionActionsExecuteEnabled) {
        simulateSnapEvmAction(actionWithFrom, chainId);
        return;
      }

      const request = toEvmProviderRequest(actionWithFrom);
      if (!request || !provider) {
        trackSnapTransactionError({
          phase: 'wallet_unavailable',
          action: actionWithFrom,
          request: snapRequest,
          providerAvailable: Boolean(provider),
          walletRequestAvailable: Boolean(request),
        });
        onError?.('Wallet is not available');
        return;
      }

      onBeforeExternalAction?.();
      setLoading(true);
      onClearError?.();
      try {
        const providerResult = await provider.request(request as never);
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
        trackSnapTransactionError({
          phase: 'provider_request',
          action: actionWithFrom,
          request: snapRequest,
          error,
          providerAvailable: true,
          walletRequestAvailable: true,
        });
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
        setLoading(false);
      }
    },
    [
      address,
      onClearError,
      onBeforeExternalAction,
      onError,
      provider,
      sendTransactionResultCallback,
      simulateSnapEvmAction,
      snapTransactionActionsExecuteEnabled,
      trackSnapTransactionError,
    ],
  );

  const handlers: SnapTransactionActionHandlers = useMemo(
    () => ({
      submit: async (target: string, inputs: Record<string, unknown>) => {
        trackCastEmbedSnapHandler('submit', {
          inputKeyCount: Object.keys(inputs).length,
          hasExplicitTarget: Boolean(target?.trim()),
        });
        const snapDocUrl = snapDocumentUrlRef.current;
        if (!snapDocUrl) {
          onError?.('Missing current source URL');
          return;
        }

        const fid = currentUserFid;
        if (!fid || !Number.isFinite(fid) || !Number.isInteger(fid)) {
          onError?.('Signed-in user FID is required for submit');
          return;
        }

        const resolvedTarget = target
          ? new URL(target, snapDocUrl).toString()
          : snapDocUrl;

        if (!isAllowedSnapTargetUrl(resolvedTarget)) {
          onError?.('POST target must use https, or http on localhost only');
          return;
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const typedInputs = inputs as Record<string, string | number | boolean>;
        const audience = new URL(resolvedTarget).origin;

        // v2 payload: user + surface, no nonce
        const surface = castContext
          ? {
              type: 'cast' as const,
              cast: {
                hash: castContext.hash,
                author: { fid: castContext.authorFid },
              },
            }
          : { type: 'standalone' as const };
        const v2Payload = {
          fid,
          user: { fid },
          inputs: typedInputs,
          timestamp,
          audience,
          surface,
        };

        // Localhost development bypass: the production signed-action API
        // refuses non-HTTPS target URLs, which would break local Snap
        // runtime iteration.
        // POST the unsigned v2Payload directly — the dev container is
        // expected to accept it (e.g. SKIP_JFS_VERIFICATION mode in
        // @farcaster/snap-hono, or our experiment adapter that just reads
        // `inputs` off the body without checking the signature).
        if (isLocalhostUrl(resolvedTarget)) {
          setLoading(true);
          let localResponseBodyText: string | null = null;
          let localParsedJson: unknown = undefined;
          try {
            const localRes = await fetch(resolvedTarget, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                accept: MEDIA_TYPE,
              },
              body: JSON.stringify(v2Payload),
            });
            if (!localRes.ok) {
              const msg = `Snap returned HTTP ${localRes.status}`;
              logSnapResponseError({
                phase: 'post_localhost',
                reason: 'http_status',
                statusCode: localRes.status,
                snapDocumentUrl: snapDocUrl,
                target: resolvedTarget,
                inputs,
                displayedMessage: msg,
                trackEvent,
              });
              onError?.(SNAP_RESPONSE_GENERIC_ERROR);
              return;
            }
            const ct = localRes.headers.get('content-type') ?? '';
            if (!ct.includes('json')) {
              const msg = `Snap returned non-JSON content-type: ${ct}`;
              logSnapResponseError({
                phase: 'post_localhost',
                reason: 'non_json_content_type',
                statusCode: localRes.status,
                snapDocumentUrl: snapDocUrl,
                target: resolvedTarget,
                inputs,
                displayedMessage: msg,
                trackEvent,
              });
              onError?.(SNAP_RESPONSE_GENERIC_ERROR);
              return;
            }
            // Use response.text() then JSON.parse so we still hold the raw
            // body if the DataCloneError trap fires after the parse.
            localResponseBodyText = await localRes.text();
            localParsedJson = localResponseBodyText.trim()
              ? JSON.parse(localResponseBodyText)
              : null;
            try {
              const nextSnap = validateAndParseSnap(localParsedJson);
              onSnapLoad?.(nextSnap, resolvedTarget);
            } catch (e) {
              // Inner catch: covers `validateAndParseSnap` (parse / clone /
              // validation), plus any rare throw from `onSnapLoad` (state
              // setters, `updateSnapCache`). We accept misclassifying the
              // latter as a parse error — `setSnap` / `updateSnapCache`
              // throws are not expected at runtime.
              logSnapParseError({
                phase: 'post_localhost',
                snapDocumentUrl: snapDocUrl,
                target: resolvedTarget,
                inputs: inputs,
                responseBody: {
                  kind: 'raw',
                  text: localResponseBodyText,
                },
                cloneTarget: localParsedJson,
                error: e,
                trackEvent,
              });
              onError?.(SNAP_RESPONSE_GENERIC_ERROR);
            }
          } catch (e) {
            // Outer catch: wraps the network fetch. Only emit parse-error
            // telemetry if we got past fetch (have a body) or if it's the
            // specific DataCloneError signal.
            if (localResponseBodyText !== null || isDataCloneLikeError(e)) {
              logSnapParseError({
                phase: 'post_localhost',
                snapDocumentUrl: snapDocUrl,
                target: resolvedTarget,
                inputs: inputs,
                responseBody: { kind: 'raw', text: localResponseBodyText },
                cloneTarget: localParsedJson,
                error: e,
                trackEvent,
              });
            }
            onError?.(SNAP_RESPONSE_GENERIC_ERROR);
          } finally {
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        try {
          let res = await apiClient.snapRequest({
            method: 'POST',
            targetUrl: resolvedTarget,
            payload: v2Payload as unknown as typeof v2Payload & {
              nonce: string;
            },
          });

          // Fall back to v1.18 (nonce/audience) if v2 fields are rejected
          if (!res.data.result.success) {
            const resp = res.data.result.response as
              | { issues?: Array<{ path?: string[]; keys?: string[] }> }
              | undefined;
            const needsV1Fallback = resp?.issues?.some(
              (i) =>
                i.path?.[0] === 'nonce' ||
                i.path?.[0] === 'user' ||
                i.path?.[0] === 'surface' ||
                i.keys?.includes('nonce') ||
                i.keys?.includes('user') ||
                i.keys?.includes('surface'),
            );
            if (needsV1Fallback) {
              const v1Payload = {
                fid,
                inputs: typedInputs,
                timestamp,
                nonce: crypto.randomUUID(),
                audience,
              };
              res = await apiClient.snapRequest({
                method: 'POST',
                targetUrl: resolvedTarget,
                payload: v1Payload,
              });

              // Fall back to legacy (button_index, no nonce/audience) if v1.18 fields are rejected
              if (!res.data.result.success) {
                const v1Resp = res.data.result.response as
                  | { issues?: Array<{ path?: string[]; keys?: string[] }> }
                  | undefined;
                const isLegacyServer = v1Resp?.issues?.some(
                  (i) =>
                    i.path?.[0] === 'nonce' ||
                    i.path?.[0] === 'audience' ||
                    i.keys?.includes('nonce') ||
                    i.keys?.includes('audience'),
                );
                if (isLegacyServer) {
                  res = await apiClient.snapRequest({
                    method: 'POST',
                    targetUrl: resolvedTarget,
                    payload: {
                      fid,
                      inputs: typedInputs,
                      button_index: 0,
                      timestamp,
                    } as unknown as typeof v1Payload,
                  });
                }
              }
            }
          }

          const { result } = res.data;
          if (!result.success) {
            const resp = result.response as
              | {
                  error?: string;
                  issues?: Array<{ message: string; path?: string[] }>;
                }
              | undefined;
            const parts: string[] = [];
            if (resp?.error) {
              parts.push(resp.error);
            }
            if (resp?.issues?.length) {
              parts.push(...resp.issues.map((i) => i.message));
            }
            const displayedMessage =
              parts.length > 0
                ? parts.join(': ')
                : `Snap returned HTTP ${result.statusCode}`;
            // The signed-action proxy or upstream snap-host can return a
            // DataCloneError message verbatim in `resp.error` (NEYN-10935
            // theory the parse trap can't observe — the client never throws
            // in this branch, it just forwards the backend's string). Emit
            // unconditionally so we can see what backends are returning and
            // classify the DataClone-like subset.
            logSnapResponseError({
              phase: 'post_remote',
              reason: 'result_unsuccessful',
              statusCode: result.statusCode,
              snapDocumentUrl: snapDocUrl,
              target: resolvedTarget,
              inputs,
              displayedMessage,
              responseError: resp?.error,
              responseIssues: resp?.issues,
              response: result.response,
              trackEvent,
            });
            onError?.(SNAP_RESPONSE_GENERIC_ERROR);
            return;
          }
          if (result.response !== undefined && result.response !== null) {
            try {
              const nextSnap = validateAndParseSnap(result.response);
              onSnapLoad?.(nextSnap, resolvedTarget);
            } catch (e) {
              // Inner catch: covers `validateAndParseSnap` (parse / clone /
              // validation), plus any rare throw from `onSnapLoad` (state
              // setters, `updateSnapCache`). We accept misclassifying the
              // latter as a parse error — `setSnap` / `updateSnapCache`
              // throws are not expected at runtime.
              logSnapParseError({
                phase: 'post_remote',
                snapDocumentUrl: snapDocUrl,
                target: resolvedTarget,
                inputs: inputs,
                // `apiClient.snapRequest` has already parsed the upstream
                // body — we don't have the raw text. Stringify the parsed
                // payload as a stand-in and mark it reconstructed so we
                // know not to compare it byte-for-byte to the network wire.
                responseBody: {
                  kind: 'reconstructed',
                  text: safeStringify(result.response),
                },
                cloneTarget: result.response,
                error: e,
                trackEvent,
              });
              onError?.(SNAP_RESPONSE_GENERIC_ERROR);
            }
          }
        } catch (e) {
          // Outer catch: wraps `apiClient.snapRequest`. Data-clone-like
          // errors flow through the parse trap (the original NEYN-10935
          // failure shape — a rare async clone bubbling out of the API
          // client). Anything else is a network / API-client failure —
          // emit `SnapResponseError` with `reason: 'network_error'` so
          // these don't drop silently while the user sees the generic
          // error string (NEYN-11447).
          if (isDataCloneLikeError(e)) {
            logSnapParseError({
              phase: 'post_remote',
              snapDocumentUrl: snapDocUrl,
              target: resolvedTarget,
              inputs: inputs,
              responseBody: { kind: 'reconstructed', text: null },
              cloneTarget: undefined,
              error: e,
              trackEvent,
            });
          } else {
            logSnapResponseError({
              phase: 'post_remote',
              reason: 'network_error',
              snapDocumentUrl: snapDocUrl,
              target: resolvedTarget,
              inputs,
              displayedMessage: 'Snap request failed',
              error: e,
              trackEvent,
            });
          }
          onError?.(SNAP_RESPONSE_GENERIC_ERROR);
        } finally {
          if (!isLocalhostUrl(snapDocUrl)) {
            markInteracted(snapDocUrl);
          }
          setLoading(false);
        }
      },

      open_url: (target: string) => {
        trackCastEmbedSnapHandler('open_url');
        const trimmedTarget = target.trim();
        if (!trimmedTarget) {
          return;
        }

        if (!isAllowedSnapTargetUrl(trimmedTarget)) {
          onError?.('Invalid target URL');
          return;
        }

        onBeforeExternalAction?.();
        window.open(trimmedTarget, '_blank', 'noopener,noreferrer');
      },

      open_mini_app: (target: string) => {
        trackCastEmbedSnapHandler('open_mini_app');
        const trimmedTarget = target.trim();
        let parsed: URL;
        try {
          parsed = new URL(trimmedTarget);
        } catch {
          onError?.(`Invalid mini app URL: ${trimmedTarget}`);
          return;
        }
        if (!isAllowedSnapTargetUrl(trimmedTarget, { allowLocalhost: false })) {
          onError?.(
            `Mini app URL must use https (or http on localhost): ${trimmedTarget}`,
          );
          return;
        }

        const referrerDomain = snapDocumentUrlRef.current
          ? new URL(snapDocumentUrlRef.current).hostname
          : parsed.hostname;

        onBeforeExternalAction?.();
        openMiniAppFromSnap({
          url: trimmedTarget,
          sourceUrl: snapDocumentUrlRef.current,
          context: { type: 'open_miniapp', referrerDomain },
        });
      },

      open_snap: (target: string) => {
        trackCastEmbedSnapHandler('open_snap');
        const trimmedTarget = target.trim();
        if (!trimmedTarget) {
          return;
        }

        if (!isAllowedSnapTargetUrl(trimmedTarget)) {
          onError?.('Invalid target URL');
          return;
        }

        void loadSnapFromUrl(trimmedTarget).catch(() => {});
      },

      view_cast: ({ hash }: { hash: string }) => {
        trackCastEmbedSnapHandler('view_cast');
        appNavigate({
          to: 'conversationWithoutUsername',
          params: { castHash: hash },
        });
      },

      view_profile: ({ fid }: { fid: number }) => {
        trackCastEmbedSnapHandler('view_profile');
        appNavigate({
          to: 'profileCastsWithoutUsername',
          params: { fid },
        });
      },

      view_channel: ({ channelKey }: { channelKey: string }) => {
        const trimmedChannelKey = channelKey.trim();
        if (!trimmedChannelKey) {
          return;
        }
        trackCastEmbedSnapHandler('view_channel');
        appNavigate({
          to: 'channel',
          params: { channelKey: trimmedChannelKey },
        });
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
        setComposeIntent({
          text: text ?? '',
          embeds: embeds ?? [],
          channelKey,
        });
        setComposeModalOpen(true);
      },

      view_token: ({ token }: { token: string }) => {
        trackCastEmbedSnapHandler('view_token');
        const parsed = parseCAIP19Token(token);
        if (!parsed) {
          return;
        }
        if (!navigateInWallet) {
          return;
        }
        onBeforeExternalAction?.();
        openWarpcastWallet();
        navigateInWallet({
          path: 'Token',
          params: { chain: parsed.chain, ca: parsed.ca },
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
          hasRecipientFid: Boolean(recipientFid),
          hasRecipientAddress: Boolean(recipientAddress?.trim()),
        });
        const parsed = parseCAIP19Token(token);
        if (!parsed) {
          return;
        }
        if (!sendToken) {
          return;
        }
        onBeforeExternalAction?.();
        openWarpcastWallet();
        sendToken({
          sendIntent: {
            chain: parsed.chain,
            ca: parsed.ca,
            ...(amount ? { amount } : {}),
            ...(recipientFid ? { recipientFid } : {}),
            ...(recipientAddress ? { recipientAddress } : {}),
          },
        }).catch(() => {});
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
        const sell = sellToken ? parseCAIP19Token(sellToken) : null;
        const buy = buyToken ? parseCAIP19Token(buyToken) : null;
        if (!sell && !buy) {
          return;
        }
        if (!swapToken) {
          return;
        }
        try {
          const swapIntent: Record<string, unknown> = {};
          if (sell) {
            swapIntent.sell = {
              chainId: Number(apiChainToChainIdOrThrow(sell.chain)),
              address: sell.ca as `0x${string}`,
            };
          }
          if (buy) {
            swapIntent.buy = {
              chainId: Number(apiChainToChainIdOrThrow(buy.chain)),
              address: buy.ca as `0x${string}`,
            };
          }
          onBeforeExternalAction?.();
          openWarpcastWallet();
          swapToken({ swapIntent }).catch(() => {});
        } catch {
          // unsupported chain
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
      apiClient,
      appNavigate,
      currentUserFid,
      castContext,
      loadSnapFromUrl,
      markInteracted,
      navigateInWallet,
      onError,
      onSnapLoad,
      onBeforeExternalAction,
      openMiniAppFromSnap,
      openWarpcastWallet,
      sendToken,
      handleSnapEvmAction,
      swapToken,
      trackCastEmbedSnapHandler,
      trackEvent,
    ],
  );

  return {
    handlers,
    loading,
    composeIntent,
    composeModalOpen,
    closeComposeModal,
  };
}
