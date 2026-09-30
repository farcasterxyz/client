import { type SnapRenderState } from '@farcaster/snap/react';
import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastSnapEmbed,
  ApiCastUrlEmbed,
} from 'farcaster-client-data';
import {
  buildSnapActivationAnalyticsProps,
  type SnapActivationTrigger,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { SnapAdminInspector } from '~/components/Snap/SnapAdminInspector';
import { SnapRenderer } from '~/components/Snap/SnapRenderer';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useFetchSnap } from '~/hooks/snap/useFetchSnap';

type SnapEmbedAttachmentProps = {
  // Preferred — new hoisted-snap shape from `embeds.snap[0]`.
  snap?: ApiCastSnapEmbed;
  // Legacy — still supported during the NEYN-10204 / NEYN-10425 rollout.
  // If both `snap` and `embed` are passed, `snap` wins.
  embed?: ApiCastUrlEmbed;
  cast?: Pick<ApiCast, 'hash' | 'author'>;
  height?: number;
  width?: number;
  onMiniAppLaunch?: () => void;
  enableLiftOnInteraction?: boolean;
};

const LOADING_PLACEHOLDER_HEIGHT = 400;
const SNAP_CARD_MAX_WIDTH = 480;
const LIFT_VIEWPORT_PADDING = 16;
const LIFT_DISMISS_POINTER_BUFFER = 150;

type LiftRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Attachment wrapper around `SnapRenderer`. Handles:
 *   - Pre-fetching the snap payload at the attachment level via `useFetchSnap`.
 *   - Rendering an empty card-shaped placeholder while the fetch is in flight
 *     (we already know it's a snap — showing an OG card would be misleading
 *     and make the slot pop when the real content swaps in).
 *   - Attachment layout styling (width / shrink / click-propagation guard).
 *
 * Accepts either the new `ApiCastSnapEmbed` (`snap` prop) or the legacy
 * `ApiCastUrlEmbed` (`embed` prop) during the backend migration. Callers
 * must still already have decided the embed is a snap — this component does
 * not detect. Phase 2 (NEYN-10437) will drop the `embed` prop once backend
 * is fully rolled out.
 */
export const SnapEmbedAttachment: React.FC<SnapEmbedAttachmentProps> =
  React.memo(
    ({
      snap,
      embed,
      cast,
      height,
      width,
      onMiniAppLaunch: _onMiniAppLaunch,
      enableLiftOnInteraction = true,
    }) => {
      const liftCardRef = useRef<HTMLDivElement>(null);
      const originalContainerRef = useRef<HTMLDivElement>(null);
      const liftTimeoutRef = useRef<number | null>(null);
      const liftSyncAnimationFrameRef = useRef<number | null>(null);
      const snapActivationTrackedRef = useRef(false);
      const lastPointerPositionRef = useRef<{
        x: number;
        y: number;
      } | null>(null);
      const [liftRect, setLiftRect] = useState<LiftRect | null>(null);
      const [expansionResetKey, setExpansionResetKey] = useState(0);
      const { trackEvent } = useAnalytics();
      const { defaultCastViewProps } = useTrackEvent();
      // Prefer the new hoisted shape; fall back to reading from the legacy
      // URL embed. The snap URL from the new shape is already the snap
      // manifest URL (backend-resolved), so we pass it straight through.
      const snapUrl = snap?.url ?? embed?.openGraph.url;
      const [snapRenderState, setSnapRenderState] = useState<
        SnapRenderState | undefined
      >(undefined);
      const castContext = useMemo(
        () =>
          cast?.hash && cast.author?.fid
            ? { hash: cast.hash, authorFid: cast.author.fid }
            : undefined,
        [cast?.hash, cast?.author?.fid],
      );
      const { snap: initialSnap } = useFetchSnap({
        url: snapUrl ?? '',
        enabled: !!snapUrl,
        castContext,
      });
      const handleSnapChange = useCallback(() => {
        setSnapRenderState(undefined);
      }, []);

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
                snapUrl,
                surface: 'cast_embed_web',
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
          snapUrl,
          trackEvent,
        ],
      );

      const clearScheduledLift = useCallback(() => {
        if (liftTimeoutRef.current !== null) {
          window.clearTimeout(liftTimeoutRef.current);
          liftTimeoutRef.current = null;
        }
      }, []);

      const dismissLift = useCallback(() => {
        clearScheduledLift();
        if (liftSyncAnimationFrameRef.current !== null) {
          window.cancelAnimationFrame(liftSyncAnimationFrameRef.current);
          liftSyncAnimationFrameRef.current = null;
        }
        lastPointerPositionRef.current = null;
        setLiftRect(null);
        setExpansionResetKey((value) => value + 1);
      }, [clearScheduledLift]);

      useEffect(() => {
        return clearScheduledLift;
      }, [clearScheduledLift]);

      useEffect(() => {
        setSnapRenderState(undefined);
        snapActivationTrackedRef.current = false;
      }, [snapUrl]);

      useEffect(() => {
        if (!liftRect) {
          return;
        }

        const syncLiftRectToOriginalContainer = () => {
          liftSyncAnimationFrameRef.current = null;
          const originalNode = originalContainerRef.current;
          const liftNode = liftCardRef.current;
          if (!originalNode || !liftNode) {
            return;
          }

          const rect = originalNode.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const currentWidth = liftNode.getBoundingClientRect().width;
          const nextLeft = Math.min(
            Math.max(rect.left, LIFT_VIEWPORT_PADDING),
            Math.max(
              LIFT_VIEWPORT_PADDING,
              viewportWidth - currentWidth - LIFT_VIEWPORT_PADDING,
            ),
          );

          liftNode.style.top = `${rect.top}px`;
          liftNode.style.left = `${nextLeft}px`;
        };

        const scheduleLiftRectSync = () => {
          if (liftSyncAnimationFrameRef.current !== null) {
            return;
          }

          liftSyncAnimationFrameRef.current = window.requestAnimationFrame(
            syncLiftRectToOriginalContainer,
          );
        };

        const pointerIsWithinLiftDismissBuffer = () => {
          const pointerPosition = lastPointerPositionRef.current;
          const liftNode = liftCardRef.current;
          if (!pointerPosition || !liftNode) {
            return false;
          }

          const rect = liftNode.getBoundingClientRect();
          return (
            pointerPosition.x >= rect.left - LIFT_DISMISS_POINTER_BUFFER &&
            pointerPosition.x <= rect.right + LIFT_DISMISS_POINTER_BUFFER &&
            pointerPosition.y >= rect.top - LIFT_DISMISS_POINTER_BUFFER &&
            pointerPosition.y <= rect.bottom + LIFT_DISMISS_POINTER_BUFFER
          );
        };

        const handleScroll = () => {
          if (!pointerIsWithinLiftDismissBuffer()) {
            dismissLift();
            return;
          }

          scheduleLiftRectSync();
        };

        const handlePointerMove = (event: PointerEvent) => {
          lastPointerPositionRef.current = {
            x: event.clientX,
            y: event.clientY,
          };
        };

        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            dismissLift();
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('pointermove', handlePointerMove, true);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
          if (liftSyncAnimationFrameRef.current !== null) {
            window.cancelAnimationFrame(liftSyncAnimationFrameRef.current);
            liftSyncAnimationFrameRef.current = null;
          }
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('pointermove', handlePointerMove, true);
          window.removeEventListener('scroll', handleScroll, true);
        };
      }, [dismissLift, liftRect]);

      const scheduleLift = useCallback(() => {
        if (!enableLiftOnInteraction || liftRect) {
          return;
        }

        const node = liftCardRef.current;
        if (!node) {
          return;
        }

        const rect = node.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const maxWidth = Math.max(0, viewportWidth - LIFT_VIEWPORT_PADDING * 2);
        const nextWidth = Math.min(rect.width, maxWidth);
        const nextLeft = Math.min(
          Math.max(rect.left, LIFT_VIEWPORT_PADDING),
          Math.max(
            LIFT_VIEWPORT_PADDING,
            viewportWidth - nextWidth - LIFT_VIEWPORT_PADDING,
          ),
        );

        clearScheduledLift();
        trackSnapActivation('lift');
        liftTimeoutRef.current = window.setTimeout(() => {
          liftTimeoutRef.current = null;
          setLiftRect({
            top: rect.top,
            left: nextLeft,
            width: nextWidth,
            height: rect.height,
          });
        }, 0);
      }, [
        clearScheduledLift,
        enableLiftOnInteraction,
        liftRect,
        trackSnapActivation,
      ]);

      const handleRootClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
          event.stopPropagation();
          lastPointerPositionRef.current = {
            x: event.clientX,
            y: event.clientY,
          };
          scheduleLift();
        },
        [scheduleLift],
      );

      if (!snapUrl) {
        return null;
      }

      if (!initialSnap) {
        return (
          <div
            className={cn(
              'flex items-center justify-center rounded-xl border bg-muted border-default text-faint',
              width === undefined && 'w-full',
              width !== undefined && 'shrink-0',
            )}
            onClick={(e) => e.stopPropagation()}
            role="status"
            style={{
              ...(width !== undefined ? { width, minWidth: width } : {}),
              height: height ?? LOADING_PLACEHOLDER_HEIGHT,
            }}
          >
            <div className="flex flex-col items-center gap-2 text-sm">
              <LoadingIndicator size="md" />
              <span>Loading snap...</span>
            </div>
          </div>
        );
      }

      const liftStyle: React.CSSProperties | undefined = liftRect
        ? {
            position: 'fixed',
            top: liftRect.top,
            left: liftRect.left,
            width: liftRect.width,
            maxWidth: `calc(100vw - ${LIFT_VIEWPORT_PADDING * 2}px)`,
            zIndex: 2147483001,
          }
        : undefined;

      return (
        <>
          {liftRect ? (
            <div
              aria-hidden="true"
              className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
              onClick={(event) => {
                event.stopPropagation();
                dismissLift();
              }}
              onPointerDown={(event) => event.stopPropagation()}
              style={{ zIndex: 2147483000 }}
            />
          ) : null}
          <div
            ref={originalContainerRef}
            className={cn(
              'rounded-xl',
              width === undefined && 'w-full',
              width !== undefined && 'shrink-0',
            )}
            onClick={handleRootClick}
            style={width !== undefined ? { width, minWidth: width } : undefined}
          >
            {liftRect ? (
              <div
                aria-hidden="true"
                style={{
                  height: liftRect.height,
                  width: liftRect.width,
                  maxWidth: '100%',
                }}
              />
            ) : null}
            <div
              ref={liftCardRef}
              className={cn(
                'relative max-w-full transition-[filter,transform] duration-150 ease-out',
                liftRect && 'snap-embed-lifted rounded-xl bg-app',
              )}
              style={{
                width: Math.min(
                  width ?? SNAP_CARD_MAX_WIDTH,
                  SNAP_CARD_MAX_WIDTH,
                ),
                ...liftStyle,
              }}
            >
              <div className="overflow-hidden rounded-xl">
                <SnapRenderer
                  snapUrl={snapUrl}
                  initialSnap={initialSnap}
                  castContext={castContext}
                  expansionResetKey={expansionResetKey}
                  initialRenderState={snapRenderState}
                  onRenderStateChange={setSnapRenderState}
                  onSnapChange={handleSnapChange}
                  onBeforeExternalAction={dismissLift}
                  onSnapActivation={trackSnapActivation}
                />
              </div>
              <SnapAdminInspector snapUrl={snapUrl} disabled={!!liftRect} />
            </div>
          </div>
        </>
      );
    },
  );

SnapEmbedAttachment.displayName = 'SnapEmbedAttachment';
