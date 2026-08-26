import { validateSnapResponse } from '@farcaster/snap';
import {
  type SnapActionHandlers,
  SnapCard,
  type SnapPage,
  type SnapRenderState,
} from '@farcaster/snap/react-native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { isAllowedSnapTargetUrl } from 'farcaster-client-data';
import {
  buildSnapActivationAnalyticsProps,
  buildSnapHandlerAnalyticsProps,
  getSnapPaginatorChangeAnalytics,
  isLocalhostUrl,
  type SnapActivationTrigger,
  type SnapHandlerKind,
  useFarcasterApiClient,
  useInteractedSnapUrls,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import {
  parseSnapPayload,
  SNAP_ACCEPT_HEADER,
  type SnapPageResponse,
} from '~/utils/snapUtils';

import { updateSnapCache } from './useFetchSnap';
import { useSnapActionHandlers } from './useSnapActionHandlers';
import { useSnapThemeColors } from './useSnapThemeColors';

function validateAndParse(json: unknown): SnapPageResponse {
  const validation = validateSnapResponse(json);
  if (!validation.valid) {
    throw new Error(validation.issues.map((i) => i.message).join(', '));
  }
  return parseSnapPayload(json);
}

type SnapCastContext = {
  hash: string;
  authorFid: number;
};

type SnapTransactionActionHandlers = Omit<
  SnapActionHandlers,
  'send_transaction'
> & {
  view_channel: (params: { channelKey: string }) => void;
  send_transaction: (params: {
    chainId: string;
    to: string;
    data?: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  }) => Promise<void>;
};

type SnapRendererProps = {
  /** URL of the snap **document** (e.g. `embed.openGraph.url`), not page/cast. */
  snapUrl: string;
  /**
   * Pre-fetched snap payload. Required — callers must resolve the snap via
   * `useFetchSnap` at the wrapper level before rendering this component.
   * Feed path uses `SnapEmbedAttachment`; dev emulator uses its own wrapper.
   */
  initialSnap: SnapPageResponse;
  castContext?: SnapCastContext;
  onNavigateAway?: () => void;
  showOverflowWarning?: boolean;
  forceExpanded?: boolean;
  expandButtonLabel?: string;
  onExpandPress?: () => void;
  onFirstInteraction?: () => void;
  onSnapChange?: (snap: SnapPageResponse | null) => void;
  onSnapDocumentUrlChange?: (url: string) => void;
  onBeforeExternalAction?: () => void;
  initialRenderState?: SnapRenderState;
  onRenderStateChange?: (state: SnapRenderState) => void;
  /**
   * Card corner radius. Defaults to 12 to match `OpenGraphCastAttachment`'s
   * feed card so snap embeds and OG cards read as visually equivalent.
   * Passed straight through to `<SnapCard>`.
   */
  borderRadius?: number;
};

export const SnapRenderer = React.memo(
  ({
    snapUrl,
    initialSnap,
    castContext,
    onNavigateAway,
    showOverflowWarning,
    forceExpanded,
    expandButtonLabel,
    onExpandPress,
    onFirstInteraction,
    onSnapChange,
    onSnapDocumentUrlChange,
    onBeforeExternalAction,
    initialRenderState,
    onRenderStateChange,
    borderRadius = 12,
  }: SnapRendererProps) => {
    const t = useTheme();
    const currentUser = useCurrentUser_UNSAFE();
    const { apiClient } = useFarcasterApiClient();
    const { trackEvent } = useAnalytics();
    const { defaultCastViewProps } = useTrackEvent();
    const snapDocumentUrlRef = useRef<string>(snapUrl);
    const snapActivationTrackedRef = useRef(false);
    const { markInteracted } = useInteractedSnapUrls();
    const [snap, setSnap] = useState<SnapPageResponse | null>(initialSnap);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const renderStateRef = useRef<SnapRenderState | undefined>(
      initialRenderState,
    );
    const trackCastEmbedSnapHandler = useCallback(
      (
        handler: SnapHandlerKind,
        properties?: Record<string, string | number | boolean | undefined>,
      ) => {
        const snapUrlForEvent = snapDocumentUrlRef.current;
        trackEvent(AnalyticsEvent.SnapHandler, {
          handler,
          surface: 'cast_embed_mobile',
          ...properties,
          ...buildSnapHandlerAnalyticsProps(snapUrlForEvent),
        });
      },
      [trackEvent],
    );
    const trackSnapActivation = useCallback(
      (activationTrigger: SnapActivationTrigger) => {
        if (snapActivationTrackedRef.current) {
          return;
        }
        snapActivationTrackedRef.current = true;

        trackEvent(
          AnalyticsEvent.HomeFeedSnapActivated,
          buildSnapActivationAnalyticsProps(
            {
              snapUrl: snapDocumentUrlRef.current,
              surface: 'cast_embed_mobile',
              activationTrigger,
              castHash: castContext?.hash,
              castAuthorFid: castContext?.authorFid,
            },
            defaultCastViewProps,
          ),
        );
      },
      [
        castContext?.authorFid,
        castContext?.hash,
        defaultCastViewProps,
        trackEvent,
      ],
    );
    const handleFirstInteraction = useCallback(() => {
      trackSnapActivation('lift');
      onFirstInteraction?.();
    }, [onFirstInteraction, trackSnapActivation]);
    const handleExpandPress = useCallback(() => {
      trackSnapActivation('lift');
      onExpandPress?.();
    }, [onExpandPress, trackSnapActivation]);
    const { appearance } = useSnapThemeColors();
    const navigationHandlers = useSnapActionHandlers({
      snapDocumentUrl: snapDocumentUrlRef.current,
      castContext,
      onSnapLoad: (parsed, url) => {
        setError(null);
        setSnap(parsed);
        snapDocumentUrlRef.current = url;
        onSnapChange?.(parsed);
        onSnapDocumentUrlChange?.(url);
        // Keep the shared `useFetchSnap` cache in sync so a remount
        // (list recycling, navigation, re-layout) restores this snap
        // instead of falling back to the stale server-rendered payload.
        updateSnapCache(url, parsed);
      },
      onError: (msg) => {
        setSnap(null);
        setError(msg);
        onSnapChange?.(null);
      },
      onClearError: () => {
        setError(null);
      },
      onNavigateAway,
      onBeforeExternalAction,
      onTransactionLoadingChange: setLoading,
      onSnapActivation: trackSnapActivation,
    });

    useEffect(() => {
      setSnap(initialSnap);
      setError(null);
      snapDocumentUrlRef.current = snapUrl;
      snapActivationTrackedRef.current = false;
      renderStateRef.current = initialRenderState;
    }, [initialRenderState, initialSnap, snapUrl]);

    const handleRenderStateChange = useCallback(
      (state: SnapRenderState) => {
        handleFirstInteraction();
        const pagination = getSnapPaginatorChangeAnalytics({
          previousState: renderStateRef.current,
          nextState: state,
        });
        renderStateRef.current = state;

        if (pagination) {
          trackSnapActivation(pagination.handler);
          trackCastEmbedSnapHandler(pagination.handler, {
            previousPage: pagination.previousPage,
            page: pagination.page,
            pageCount: pagination.pageCount,
          });
        }

        onRenderStateChange?.(state);
      },
      [
        handleFirstInteraction,
        onRenderStateChange,
        trackCastEmbedSnapHandler,
        trackSnapActivation,
      ],
    );

    // ── Submit handler ─────────────────────────────────────

    const handlers: SnapTransactionActionHandlers = useMemo(
      () => ({
        open_url: (target) => {
          handleFirstInteraction();
          navigationHandlers.open_url(target);
        },
        open_mini_app: (target) => {
          handleFirstInteraction();
          navigationHandlers.open_mini_app(target);
        },
        open_snap: (target) => {
          handleFirstInteraction();
          navigationHandlers.open_snap(target);
        },
        view_cast: (target) => {
          handleFirstInteraction();
          navigationHandlers.view_cast(target);
        },
        view_profile: (target) => {
          handleFirstInteraction();
          navigationHandlers.view_profile(target);
        },
        view_channel: (target) => {
          handleFirstInteraction();
          navigationHandlers.view_channel(target);
        },
        compose_cast: (target) => {
          handleFirstInteraction();
          navigationHandlers.compose_cast(target);
        },
        view_token: (target) => {
          handleFirstInteraction();
          navigationHandlers.view_token(target);
        },
        send_token: (target) => {
          handleFirstInteraction();
          navigationHandlers.send_token(target);
        },
        swap_token: (target) => {
          handleFirstInteraction();
          navigationHandlers.swap_token(target);
        },
        send_transaction: (target) => {
          handleFirstInteraction();
          return navigationHandlers.send_transaction(target);
        },
        submit: async (target: string, inputs: Record<string, unknown>) => {
          handleFirstInteraction();
          trackSnapActivation('submit');
          trackCastEmbedSnapHandler('submit', {
            inputKeyCount: Object.keys(inputs).length,
            hasExplicitTarget: Boolean(target?.trim()),
          });
          const snapDocUrl = snapDocumentUrlRef.current;
          if (!snapDocUrl) return;

          const resolvedTarget = target
            ? new URL(target, snapDocUrl).toString()
            : snapDocUrl;

          if (!isAllowedSnapTargetUrl(resolvedTarget)) {
            setError('POST target must use https (or http on localhost)');
            return;
          }

          const fid = currentUser.fid;
          if (!fid || !Number.isFinite(fid)) {
            setError('Signed-in user required for snap submit');
            return;
          }

          setLoading(true);
          setError(null);
          const timestamp = Math.floor(Date.now() / 1000);
          const typedInputs = inputs as Record<
            string,
            string | number | boolean
          >;
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
          try {
            // The retained Developer Snap Emulator accepts local Snap URLs.
            // The backend request proxy deliberately requires HTTPS, so local
            // development requests go directly to localhost instead.
            if (__DEV__ && isLocalhostUrl(resolvedTarget)) {
              const localRes = await fetch(resolvedTarget, {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  accept: SNAP_ACCEPT_HEADER,
                },
                body: JSON.stringify(v2Payload),
              });
              if (!localRes.ok) {
                throw new Error(`Snap returned HTTP ${localRes.status}`);
              }
              const json = (await localRes.json()) as unknown;
              const nextSnap = validateAndParse(json);
              setSnap(nextSnap);
              setError(null);
              snapDocumentUrlRef.current = resolvedTarget;
              onSnapChange?.(nextSnap);
              onSnapDocumentUrlChange?.(resolvedTarget);
              updateSnapCache(resolvedTarget, nextSnap);
              return;
            }

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
                | { error?: string; issues?: Array<{ message: string }> }
                | undefined;
              const parts: string[] = [];
              if (resp?.error) parts.push(resp.error);
              if (resp?.issues?.length) {
                parts.push(...resp.issues.map((i) => i.message));
              }
              setError(
                parts.length > 0
                  ? parts.join(': ')
                  : `Snap returned HTTP ${result.statusCode}`,
              );
              return;
            }
            if (result.response !== undefined && result.response !== null) {
              const nextSnap = validateAndParse(result.response);
              setSnap(nextSnap);
              setError(null);
              snapDocumentUrlRef.current = resolvedTarget;
              onSnapChange?.(nextSnap);
              onSnapDocumentUrlChange?.(resolvedTarget);
              // Mirror onSnapLoad: keep the shared cache in sync so a remount
              // restores this post-submit state instead of the original payload.
              updateSnapCache(resolvedTarget, nextSnap);
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Snap submit failed');
          } finally {
            if (!isLocalhostUrl(snapDocUrl)) {
              markInteracted(snapDocUrl);
            }
            setLoading(false);
          }
        },
      }),
      [
        apiClient,
        currentUser.fid,
        castContext,
        markInteracted,
        navigationHandlers,
        handleFirstInteraction,
        onSnapChange,
        onSnapDocumentUrlChange,
        trackSnapActivation,
        trackCastEmbedSnapHandler,
      ],
    );

    // ── Render ─────────────────────────────────────────────

    if (error && !snap) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: t.colors.text.danger }]}>
            {error}
          </Text>
        </View>
      );
    }

    if (!snap) {
      return null;
    }

    return (
      <View>
        <SnapCard
          snap={snap as SnapPage}
          handlers={handlers}
          loading={loading}
          appearance={appearance}
          actionError={error}
          showOverflowWarning={showOverflowWarning}
          forceExpanded={forceExpanded}
          expandButtonLabel={expandButtonLabel}
          onExpandPress={onExpandPress ? handleExpandPress : undefined}
          borderRadius={borderRadius}
          initialRenderState={initialRenderState}
          onRenderStateChange={handleRenderStateChange}
        />
      </View>
    );
  },
);

SnapRenderer.displayName = 'SnapRenderer';

const styles = StyleSheet.create({
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
