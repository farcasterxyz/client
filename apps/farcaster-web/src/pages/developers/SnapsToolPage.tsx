import '~/snap-theme-scope.css';

import {
  type SnapActionHandlers,
  SnapCard,
  type SnapPage,
  type SnapRenderState,
} from '@farcaster/snap/react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  type ApiFarcasterWalletAction,
  isAllowedSnapTargetUrl,
  parseCAIP19Token,
} from 'farcaster-client-data';
import {
  buildSnapGetPayload,
  buildSnapHandlerAnalyticsProps,
  getSnapPaginatorChangeAnalytics,
  type SnapHandlerKind,
  useFarcasterApiClient,
  useFetchEvmScanAction,
} from 'farcaster-client-hooks';
import { CheckIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { ExternalLink } from '~/components/links/ExternalLink';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SnapLiftFrame } from '~/components/Snap/SnapLiftFrame';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenableWarpcastWallet } from '~/contexts/OpenableWarpcastWalletContext';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { useOpenMiniAppFromSnap } from '~/hooks/snap/useOpenMiniAppFromSnap';
import { useAppThemeName } from '~/hooks/theme/useAppTheme';
import { usePostHogFeatureFlag } from '~/hooks/usePostHogFeatureFlag';
import { getSnapDiscoveryWarning } from '~/lib/snap/getSnapDiscoveryWarning';
import { SNAP_UPSTREAM_ACCEPT } from '~/lib/snap/snapUpstreamConstants';
import { validateAndParseSnap } from '~/lib/snap/snapUtils';
import { CastComposerIntent } from '~/types';

const LS_URL_KEY = 'snaps-tool:targetUrl';
const SNAP_TRANSACTION_ACTIONS_EXECUTE_FLAG =
  'snap-transaction-actions-execute';

type LastPair = {
  outgoingTitle: string;
  outgoingBody: string;
  incomingTitle: string;
  incomingBody: string;
  incomingOk: boolean;
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

type SnapTransactionActionHandlers = SnapActionHandlers & {
  view_channel: (params: { channelKey: string }) => void;
  send_transaction: (params: SnapSendTransactionParams) => void;
};

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

const SnapsToolPage = React.memo(() => {
  const { appThemeName } = useAppThemeName();
  const { apiClient } = useFarcasterApiClient();
  const currentUser = useCurrentUser();
  const { url: initialUrl } = useSearchParams('developersSnaps');
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
  const snapDocumentUrlRef = useRef<string | null>(null);
  const renderStateRef = useRef<SnapRenderState | undefined>(undefined);
  const reseatSnapRef = useRef<(() => void) | undefined>(undefined);

  const reseatSnapBeforeExternalAction = useCallback(() => {
    reseatSnapRef.current?.();
  }, []);

  const trackSnapsToolSnapHandler = useCallback(
    (
      handler: SnapHandlerKind,
      properties?: Record<string, string | number | boolean | undefined>,
    ) => {
      const snapUrl = snapDocumentUrlRef.current;
      trackEvent(AnalyticsEvent.SnapHandler, {
        handler,
        surface: 'snaps_emulator',
        ...properties,
        ...buildSnapHandlerAnalyticsProps(snapUrl),
      });
    },
    [trackEvent],
  );

  const [urlInput, setUrlInput] = useState(
    () => initialUrl ?? localStorage.getItem(LS_URL_KEY) ?? '',
  );

  const [loadSnapViaAuthenticatedGet, setLoadSnapViaAuthenticatedGet] =
    useState(false);

  const [snap, setSnap] = useState<SnapPage | null>(null);
  const [snapDocumentUrl, setSnapDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snapDiscoveryWarning, setSnapDiscoveryWarning] = useState<
    string | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastPair, setLastPair] = useState<LastPair | null>(null);
  const [copiedExchangeSide, setCopiedExchangeSide] = useState<
    'outgoing' | 'incoming' | null
  >(null);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeIntent, setComposeIntent] = useState<
    CastComposerIntent | undefined
  >(undefined);
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const snapDiscoveryProbeIdRef = useRef(0);

  snapDocumentUrlRef.current = snapDocumentUrl;

  useEffect(() => {
    renderStateRef.current = undefined;
  }, [snapDocumentUrl]);

  const authenticatedGetUnavailableReason = useMemo(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:') {
        return 'Authenticated GET only supports HTTPS URLs. HTTP URLs load directly from your browser.';
      }
    } catch {
      // Keep URL validation errors attached to the Load snap action.
    }

    return null;
  }, [urlInput]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const simulateSnapEvmAction = useCallback(
    async (action: ApiFarcasterWalletAction, chainId: string) => {
      const numericChainId = parseSnapChainId(chainId);
      if (!address || !numericChainId) {
        return;
      }

      return fetchEvmScanAction({
        account: address,
        chainId: numericChainId,
        action,
        domain: getSnapDomain(snapDocumentUrlRef.current),
      });
    },
    [address, fetchEvmScanAction],
  );

  const handleSnapEvmAction = useCallback(
    (action: ApiFarcasterWalletAction, chainId: string) => {
      if (!snapTransactionActionsExecuteEnabled) {
        return simulateSnapEvmAction(action, chainId);
      }

      const request = toEvmProviderRequest(action);
      if (!request) {
        return undefined;
      }

      return provider?.request(request as never);
    },
    [provider, simulateSnapEvmAction, snapTransactionActionsExecuteEnabled],
  );

  const copyExchangeText = useCallback(
    async (side: 'outgoing' | 'incoming', text: string) => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch {
          ok = false;
        }
      }
      if (!ok) {
        return;
      }
      if (copyFeedbackTimerRef.current !== null) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
      setCopiedExchangeSide(side);
      copyFeedbackTimerRef.current = setTimeout(() => {
        setCopiedExchangeSide(null);
        copyFeedbackTimerRef.current = null;
      }, 2000);
    },
    [],
  );

  const persistUrl = useCallback((v: string) => {
    setUrlInput(v);
    localStorage.setItem(LS_URL_KEY, v);
  }, []);

  const parseUrlOrError = useCallback((raw: string): URL | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setLoadError('Enter a URL');
      return null;
    }
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setLoadError('Invalid URL');
      return null;
    }
    if (!/^https?:$/i.test(parsed.protocol)) {
      setLoadError('URL must start with http:// or https://');
      return null;
    }
    return parsed;
  }, []);

  const loadSnapFromAbsoluteUrl = useCallback(
    async (absoluteUrl: string, options?: { updateUrlInput?: boolean }) => {
      setLoading(true);
      setLoadError(null);
      setSnapDiscoveryWarning(null);
      await Promise.allSettled([
        apiClient.scrapeEmbed({ embed: absoluteUrl }),
        apiClient.devToolsInspectImageUrl({ url: absoluteUrl }),
      ]);
      const probeId = ++snapDiscoveryProbeIdRef.current;
      void getSnapDiscoveryWarning(absoluteUrl, apiClient).then((warning) => {
        if (probeId === snapDiscoveryProbeIdRef.current) {
          setSnapDiscoveryWarning(warning);
        }
      });

      const useAuthenticatedGet =
        loadSnapViaAuthenticatedGet &&
        (() => {
          try {
            return new URL(absoluteUrl).protocol === 'https:';
          } catch {
            return false;
          }
        })();

      const authenticatedGetPayload = useAuthenticatedGet
        ? buildSnapGetPayload({
            url: absoluteUrl,
            fid: currentUser.fid,
            surface: { type: 'standalone' },
          })
        : undefined;

      if (authenticatedGetPayload === null) {
        setLoading(false);
        setLoadError('Could not build authenticated GET payload');
        return;
      }

      const snapRequestBody =
        useAuthenticatedGet && authenticatedGetPayload
          ? {
              targetUrl: absoluteUrl,
              method: 'GET' as const,
              payload: authenticatedGetPayload,
            }
          : null;

      const outgoingTitle = useAuthenticatedGet
        ? 'POST /v2/snap-request (authenticated GET)'
        : 'GET (browser → snap)';
      const outgoingBody = snapRequestBody
        ? JSON.stringify(
            {
              endpoint: '/v2/snap-request',
              body: snapRequestBody,
            },
            null,
            2,
          )
        : [
            `${absoluteUrl}`,
            '',
            formatHeaderBlock({ Accept: SNAP_UPSTREAM_ACCEPT }),
          ].join('\n');

      try {
        let parsedJson: unknown;
        let httpStatus: number;

        if (snapRequestBody) {
          try {
            const res = await apiClient.snapRequest(snapRequestBody);
            const { result } = res.data;
            if (!result.success) {
              const display = formatSignedActionResultForDisplay(result);
              setLastPair({
                outgoingTitle,
                outgoingBody,
                incomingTitle: `API result (HTTP ${result.statusCode})`,
                incomingBody: display,
                incomingOk: false,
              });
              throw new Error(
                `Snap proxy failed (upstream HTTP ${result.statusCode})`,
              );
            }
            parsedJson = result.response;
            httpStatus = result.statusCode;
          } catch (proxyErr) {
            const msg =
              proxyErr instanceof Error
                ? proxyErr.message
                : 'Snap request failed';
            setLastPair({
              outgoingTitle,
              outgoingBody,
              incomingTitle: 'Request failed',
              incomingBody: msg,
              incomingOk: false,
            });
            setLoadError(msg);
            throw proxyErr;
          }
        } else {
          let response: Response;
          try {
            response = await fetch(absoluteUrl, {
              headers: { Accept: SNAP_UPSTREAM_ACCEPT },
              cache: 'no-store',
            });
          } catch (fetchErr) {
            const base =
              fetchErr instanceof Error &&
              fetchErr.message.trim() !== 'Failed to fetch'
                ? fetchErr.message
                : 'Network error (CORS or blocked request)';
            const curlSample = `curl -fsS -H 'Accept: application/vnd.farcaster.snap+json' '${absoluteUrl}'`;
            const msg = `${base}. Try ${curlSample}, and also check the CORS headers set by this client origin.`;
            setLastPair({
              outgoingTitle,
              outgoingBody,
              incomingTitle: 'Network error',
              incomingBody: msg,
              incomingOk: false,
            });
            setLoadError(msg);
            throw fetchErr;
          }

          const text = await response.text();
          httpStatus = response.status;
          try {
            parsedJson = text.trim() ? JSON.parse(text) : null;
          } catch {
            setLastPair({
              outgoingTitle,
              outgoingBody,
              incomingTitle: `HTTP ${response.status} (non-JSON)`,
              incomingBody: text.slice(0, 8000),
              incomingOk: false,
            });
            throw new Error('Snap response is not valid JSON');
          }

          if (!response.ok) {
            setLastPair({
              outgoingTitle,
              outgoingBody,
              incomingTitle: `HTTP ${response.status}`,
              incomingBody: JSON.stringify(parsedJson, null, 2),
              incomingOk: false,
            });
            throw new Error(`HTTP ${response.status}`);
          }
        }

        const snapPage = validateAndParseSnap(parsedJson);
        setSnap(snapPage);
        setSnapDocumentUrl(absoluteUrl);
        if (options?.updateUrlInput) {
          persistUrl(absoluteUrl);
        }

        setLastPair({
          outgoingTitle,
          outgoingBody,
          incomingTitle: `HTTP ${httpStatus}`,
          incomingBody:
            typeof parsedJson === 'string'
              ? parsedJson
              : JSON.stringify(parsedJson, null, 2),
          incomingOk: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [apiClient, currentUser.fid, persistUrl, loadSnapViaAuthenticatedGet],
  );

  const handleLoad = useCallback(async () => {
    const parsedUrl = parseUrlOrError(urlInput);
    if (!parsedUrl) {
      setSnap(null);
      setSnapDocumentUrl(null);
      snapDiscoveryProbeIdRef.current += 1;
      setSnapDiscoveryWarning(null);
      return;
    }
    try {
      await loadSnapFromAbsoluteUrl(parsedUrl.toString(), {
        updateUrlInput: true,
      });
    } catch {
      setSnap(null);
      setSnapDocumentUrl(null);
    }
  }, [urlInput, parseUrlOrError, loadSnapFromAbsoluteUrl]);

  // ── Snap action handlers ─────────────────────────────

  const handlers: SnapTransactionActionHandlers = useMemo(
    () => ({
      submit: async (target: string, inputs: Record<string, unknown>) => {
        trackSnapsToolSnapHandler('submit', {
          inputKeyCount: Object.keys(inputs).length,
          hasExplicitTarget: Boolean(target?.trim()),
        });
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('submit', target, inputs);
        if (!snapDocumentUrl) {
          setActionError('Missing current source URL');
          return;
        }

        const fid = currentUser.fid;
        if (!fid || !Number.isFinite(fid) || !Number.isInteger(fid)) {
          setActionError('Signed-in user FID is required for submit');
          return;
        }

        const resolvedTarget = target
          ? new URL(target, snapDocumentUrl).toString()
          : snapDocumentUrl;

        if (!isAllowedSnapTargetUrl(resolvedTarget)) {
          setActionError(
            'POST target must use https, or http on localhost only',
          );
          return;
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const typedInputs = inputs as Record<string, string | number | boolean>;
        const audience = new URL(resolvedTarget).origin;

        // v2 payload: user + surface, no nonce
        const v2Payload = {
          fid,
          user: { fid },
          inputs: typedInputs,
          timestamp,
          audience,
          surface: { type: 'standalone' as const },
        };

        setLoading(true);
        setActionError(null);

        const outgoingBody = JSON.stringify(
          {
            endpoint: '/v2/snap-request',
            body: {
              method: 'POST',
              targetUrl: resolvedTarget,
              payload: v2Payload,
            },
          },
          null,
          2,
        );

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
          const incomingBody = formatSignedActionResultForDisplay(result);
          const incomingOk = result.success === true;

          setLastPair({
            outgoingTitle: 'POST /v2/snap-request (method POST)',
            outgoingBody,
            incomingTitle: `API result (HTTP ${result.statusCode})`,
            incomingBody,
            incomingOk,
          });

          if (!incomingOk) {
            const resp = result.response as
              | { error?: string; issues?: Array<{ message: string }> }
              | undefined;
            const parts: string[] = [];
            if (resp?.error) {
              parts.push(resp.error);
            }
            if (resp?.issues?.length) {
              parts.push(...resp.issues.map((i) => i.message));
            }
            setActionError(
              parts.length > 0
                ? parts.join(': ')
                : `Snap returned HTTP ${result.statusCode}`,
            );
          }

          if (
            incomingOk &&
            result.response !== undefined &&
            result.response !== null
          ) {
            try {
              const nextSnap = validateAndParseSnap(result.response);
              setSnap(nextSnap);
              setSnapDocumentUrl(resolvedTarget);
              setActionError(null);
            } catch (e) {
              setActionError(
                e instanceof Error
                  ? e.message
                  : 'Could not parse snap from signed-action response',
              );
            }
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unknown error';
          setActionError(message);
          setLastPair({
            outgoingTitle: 'POST /v2/snap-request (method POST)',
            outgoingBody,
            incomingTitle: 'Request failed',
            incomingBody: message,
            incomingOk: false,
          });
        } finally {
          setLoading(false);
        }
      },

      open_url: (target: string) => {
        trackSnapsToolSnapHandler('open_url');
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('open_url', target);
        const trimmedTarget = target.trim();
        if (!trimmedTarget) {
          return;
        }

        if (!isAllowedSnapTargetUrl(trimmedTarget)) {
          setActionError('Only https or localhost links can be opened');
          return;
        }

        reseatSnapBeforeExternalAction();
        window.open(trimmedTarget, '_blank', 'noopener,noreferrer');
      },

      open_mini_app: (target: string) => {
        trackSnapsToolSnapHandler('open_mini_app');
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('open_mini_app', target);
        const trimmedTarget = target.trim();
        try {
          new URL(trimmedTarget);
        } catch {
          setLastPair({
            outgoingTitle: 'Mini app: open',
            outgoingBody: target,
            incomingTitle: 'Action failed',
            incomingBody: `Invalid mini app URL: ${target}`,
            incomingOk: false,
          });
          return;
        }
        if (!isAllowedSnapTargetUrl(trimmedTarget)) {
          setLastPair({
            outgoingTitle: 'Mini app: open',
            outgoingBody: target,
            incomingTitle: 'Action failed',
            incomingBody: `Mini app URL must use https (or http on localhost): ${target}`,
            incomingOk: false,
          });
          return;
        }

        setLastPair({
          outgoingTitle: 'Mini app: open',
          outgoingBody: target,
          incomingTitle: 'Handled locally',
          incomingBody: `Launching mini app: ${target}`,
          incomingOk: true,
        });

        reseatSnapBeforeExternalAction();
        openMiniAppFromSnap({
          url: trimmedTarget,
          sourceUrl: snapDocumentUrl,
          context: { type: 'dev_preview' },
          debug: true,
        });
      },

      open_snap: (target: string) => {
        trackSnapsToolSnapHandler('open_snap');
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('open_snap', target);
        const trimmedTarget = target.trim();
        if (!trimmedTarget) {
          return;
        }

        if (!isAllowedSnapTargetUrl(trimmedTarget)) {
          setActionError('Only https or localhost links can be opened');
          return;
        }

        void loadSnapFromAbsoluteUrl(trimmedTarget, {
          updateUrlInput: true,
        }).catch(() => {});
      },

      view_cast: ({ hash }: { hash: string }) => {
        trackSnapsToolSnapHandler('view_cast');
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('view_cast', hash);
        appNavigate({
          to: 'conversationWithoutUsername',
          params: { castHash: hash },
        });
      },

      view_profile: ({ fid }: { fid: number }) => {
        trackSnapsToolSnapHandler('view_profile');
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('view_profile', fid);
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
        trackSnapsToolSnapHandler('view_channel');
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('view_channel', trimmedChannelKey);
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
        trackSnapsToolSnapHandler('compose_cast', {
          embedCount: embeds?.length ?? 0,
          hasText: Boolean(text?.trim()),
        });
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('compose_cast', text, channelKey, embeds);
        setComposeIntent({
          text: text ?? '',
          embeds: embeds ?? [],
          channelKey,
        });
        setComposeModalOpen(true);
      },

      view_token: ({ token }: { token: string }) => {
        trackSnapsToolSnapHandler('view_token');
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('view_token', token);
        const parsed = parseCAIP19Token(token);
        if (!parsed) {
          return;
        }
        if (!navigateInWallet) {
          return;
        }
        reseatSnapBeforeExternalAction();
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
        trackSnapsToolSnapHandler('send_token', {
          hasAmount: Boolean(amount?.trim()),
          hasRecipientFid: Boolean(recipientFid),
          hasRecipientAddress: Boolean(recipientAddress?.trim()),
        });
        // eslint-disable-next-line no-console -- dev tool logging
        console.log(
          'send_token',
          token,
          amount,
          recipientFid,
          recipientAddress,
        );
        const parsed = parseCAIP19Token(token);
        if (!parsed) {
          return;
        }
        if (!sendToken) {
          return;
        }
        reseatSnapBeforeExternalAction();
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
        trackSnapsToolSnapHandler('swap_token', {
          hasSellToken: Boolean(sellToken?.trim()),
          hasBuyToken: Boolean(buyToken?.trim()),
        });
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('swap_token', sellToken, buyToken);
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
          reseatSnapBeforeExternalAction();
          openWarpcastWallet();
          swapToken({ swapIntent }).catch(() => {});
        } catch {
          // unsupported chain
        }
      },

      send_transaction: ({
        chainId,
        to,
        data,
        value,
        gas,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
      }: SnapSendTransactionParams) => {
        const params = {
          chainId,
          to,
          data,
          value,
          gas,
          gasPrice,
          maxFeePerGas,
          maxPriorityFeePerGas,
        };
        trackSnapsToolSnapHandler('send_transaction' as SnapHandlerKind, {
          hasChainId: Boolean(chainId.trim()),
          hasTo: Boolean(to.trim()),
        });
        // eslint-disable-next-line no-console -- dev tool logging
        console.log('send_transaction', params);
        if (snapTransactionActionsExecuteEnabled) {
          reseatSnapBeforeExternalAction();
        }
        void handleSnapEvmAction(buildSendTransactionAction(params), chainId)
          ?.then((result) => {
            // eslint-disable-next-line no-console -- dev tool logging
            console.log(
              snapTransactionActionsExecuteEnabled
                ? 'send_transaction execution'
                : 'send_transaction simulation',
              result,
            );
          })
          .catch((error) => {
            // eslint-disable-next-line no-console -- dev tool logging
            console.error(
              snapTransactionActionsExecuteEnabled
                ? 'send_transaction execution failed'
                : 'send_transaction simulation failed',
              error,
            );
          });
      },
    }),
    [
      apiClient,
      appNavigate,
      snapDocumentUrl,
      currentUser,
      loadSnapFromAbsoluteUrl,
      navigateInWallet,
      openMiniAppFromSnap,
      openWarpcastWallet,
      reseatSnapBeforeExternalAction,
      sendToken,
      handleSnapEvmAction,
      swapToken,
      snapTransactionActionsExecuteEnabled,
      trackSnapsToolSnapHandler,
    ],
  );

  const handleRenderStateChange = useCallback(
    (state: SnapRenderState) => {
      const pagination = getSnapPaginatorChangeAnalytics({
        previousState: renderStateRef.current,
        nextState: state,
      });
      renderStateRef.current = state;

      if (pagination) {
        trackSnapsToolSnapHandler(pagination.handler, {
          previousPage: pagination.previousPage,
          page: pagination.page,
          pageCount: pagination.pageCount,
        });
      }
    },
    [trackSnapsToolSnapHandler],
  );

  return (
    <Page meta={{ title: 'Developers / Emulator' }}>
      <BorderedMainContent>
        <PageHeader hideCastButton visibleOnMobile>
          <PageTitle>
            <BackButton />
            <span>Emulator</span>
          </PageTitle>
        </PageHeader>

        <div className="flex flex-col gap-6 p-4 pb-40">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Snap URL</div>
            <TextInput
              placeholder="https://…"
              value={urlInput}
              onChange={(e) => persistUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleLoad();
                }
              }}
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className={`flex items-center gap-2 text-sm ${
                authenticatedGetUnavailableReason
                  ? 'cursor-not-allowed text-muted'
                  : 'cursor-pointer'
              }`}
              title={authenticatedGetUnavailableReason ?? undefined}
            >
              <input
                type="checkbox"
                checked={
                  loadSnapViaAuthenticatedGet &&
                  !authenticatedGetUnavailableReason
                }
                disabled={authenticatedGetUnavailableReason !== null}
                onChange={(e) =>
                  setLoadSnapViaAuthenticatedGet(e.target.checked)
                }
              />
              Load first page via authenticated get
            </label>
            {authenticatedGetUnavailableReason && (
              <div className="text-xs text-warning">
                {authenticatedGetUnavailableReason}
              </div>
            )}
          </div>

          <DefaultButton
            onClick={() => void handleLoad()}
            isLoading={loading}
            disabled={!urlInput.trim() || loading}
            className="self-start"
          >
            Load snap
          </DefaultButton>

          {loadError && (
            <div className="rounded-lg border p-3 text-sm border-faint text-danger">
              {loadError}
            </div>
          )}
          {snapDiscoveryWarning && (
            <div className="rounded-lg border p-3 text-sm border-faint text-warning">
              {snapDiscoveryWarning}
            </div>
          )}

          {snap && (
            <div className="flex flex-col items-center gap-3">
              <SnapLiftFrame className="w-full max-w-[420px]" maxWidth={420}>
                {({ expansionResetKey, onBeforeExternalAction }) => {
                  reseatSnapRef.current = onBeforeExternalAction;

                  return (
                    <div className="snap-theme-scope">
                      <SnapCard
                        key={expansionResetKey}
                        snap={snap}
                        handlers={handlers}
                        loading={loading}
                        appearance={appThemeName}
                        actionError={actionError}
                        onRenderStateChange={handleRenderStateChange}
                      />
                    </div>
                  );
                }}
              </SnapLiftFrame>
              {snapDocumentUrl ? (
                <div className="max-w-md text-center text-xs text-muted">
                  Loaded: {snapDocumentUrl}
                </div>
              ) : null}
            </div>
          )}

          {!snap && !loadError && (
            <div className="text-sm text-muted">
              Enter a snap URL and load to render it here. POST buttons use{' '}
              <code className="rounded px-1 bg-faint">/v2/snap-request</code>{' '}
              (method POST).
            </div>
          )}

          {lastPair && (
            <div className="flex flex-col gap-4 border-t pt-6 border-faint">
              <div className="text-sm font-medium">Last exchange</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1 rounded-lg border border-faint">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium bg-faint">
                    <span className="min-w-0 truncate">
                      Outgoing — {lastPair.outgoingTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void copyExchangeText('outgoing', lastPair.outgoingBody)
                      }
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                        copiedExchangeSide === 'outgoing'
                          ? 'text-success'
                          : 'hover:bg-default text-muted hover:text-default'
                      }`}
                      aria-label={
                        copiedExchangeSide === 'outgoing'
                          ? 'Copied outgoing'
                          : 'Copy outgoing'
                      }
                    >
                      {copiedExchangeSide === 'outgoing' ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-3.5 w-3.5" aria-hidden />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="font-mono max-h-80 overflow-auto whitespace-pre-wrap break-all p-3 text-xs">
                    {lastPair.outgoingBody}
                  </pre>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border border-faint">
                  <div
                    className={`flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium ${
                      lastPair.incomingOk
                        ? 'bg-faint text-success'
                        : 'bg-faint text-danger'
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      Incoming — {lastPair.incomingTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void copyExchangeText('incoming', lastPair.incomingBody)
                      }
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                        copiedExchangeSide === 'incoming'
                          ? 'text-success'
                          : lastPair.incomingOk
                            ? 'text-success/80 hover:bg-default hover:text-success'
                            : 'text-danger/80 hover:bg-default hover:text-danger'
                      }`}
                      aria-label={
                        copiedExchangeSide === 'incoming'
                          ? 'Copied incoming'
                          : 'Copy incoming'
                      }
                    >
                      {copiedExchangeSide === 'incoming' ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-3.5 w-3.5" aria-hidden />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="font-mono max-h-80 overflow-auto whitespace-pre-wrap break-all p-3 text-xs">
                    {lastPair.incomingBody}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div
            className={`flex flex-col gap-3 ${
              snap ? 'border-t pt-6 border-faint' : ''
            }`}
          >
            <p className="text-sm leading-5 text-muted">
              Snaps can render a little differently on mobile. To verify the
              mobile version, open Farcaster on your phone and go to Settings
              &gt; Snap Emulator.
            </p>
            <ExternalLink
              href="https://docs.farcaster.xyz/snap"
              title="https://docs.farcaster.xyz/snap"
              className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium border-faint text-link hover:bg-faint"
            >
              Snap documentation
              <ExternalLinkIcon className="h-4 w-4" aria-hidden />
            </ExternalLink>
          </div>
        </div>
      </BorderedMainContent>
      {composeModalOpen ? (
        <ComposeCastModal
          intent={composeIntent}
          isIntentFromSearchParams={false}
          onClose={() => {
            setComposeModalOpen(false);
            setComposeIntent(undefined);
          }}
        />
      ) : null}
    </Page>
  );
});

function formatHeaderBlock(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');
}

function formatSignedActionResultForDisplay(result: {
  success: boolean;
  statusCode: number;
  contentType?: string | null;
  response: unknown;
}): string {
  const ordered: Record<string, unknown> = {
    success: result.success,
    statusCode: result.statusCode,
  };
  if (result.contentType !== undefined && result.contentType !== null) {
    ordered.contentType = result.contentType;
  }
  ordered.response = result.response;
  return JSON.stringify(ordered, null, 2);
}

SnapsToolPage.displayName = 'SnapsToolPage';

export { SnapsToolPage };
