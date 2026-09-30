import { type SnapRenderState } from '@farcaster/snap/react-native';
import { ApiCastSnapEmbed, ApiCastUrlEmbed } from 'farcaster-client-data';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { type SnapPageResponse } from '~/utils/snapUtils';

import { SnapLiftPortal } from './SnapLiftPortal';
import {
  clearActiveSnapLift,
  consumeSnapLiftAfterReseatSuppression,
  isActiveSnapLift,
  markSnapLiftInteraction,
  setActiveSnapLift,
  subscribeToActiveSnapLift,
  suppressNextSnapLiftAfterReseat,
  updateActiveSnapLiftRect,
} from './snapLiftState';
import { SnapRenderer } from './SnapRenderer';
import { useFetchSnap } from './useFetchSnap';

type SnapEmbedAttachmentProps = {
  // Preferred — new hoisted-snap shape from `embeds.snap[0]`.
  snap?: ApiCastSnapEmbed;
  // Legacy — still supported during the NEYN-10204 / NEYN-10425 rollout.
  // If both `snap` and `embed` are passed, `snap` wins.
  embed?: ApiCastUrlEmbed;
  castHash?: string;
  castAuthorFid?: number;
  height?: number;
  width?: number;
  enableLiftOnInteraction?: boolean;
};

const LOADING_PLACEHOLDER_HEIGHT = 320;
const LIFT_AFFORDANCE_DURATION_MS = 900;
const SNAP_INLINE_MAX_HEIGHT = 500;
const LIFT_VIEWPORT_PADDING = 12;
const LIFT_AFTER_INTERACTION_DELAY_MS = 75;
const LIFT_CANCEL_MOVE_THRESHOLD = 8;

/**
 * Renders a snap embed. Callers must ensure the embed is a snap (via
 * `isSnapEmbed` / `getCastSnap` from `farcaster-client-hooks`) — this
 * component does not detect or fall back to an OG card based on content.
 *
 * Accepts either the new `ApiCastSnapEmbed` (`snap` prop) or the legacy
 * `ApiCastUrlEmbed` (`embed` prop) during the backend migration. Phase 2
 * (NEYN-10437) will drop the `embed` prop once backend is fully rolled out.
 *
 * Fetches the full SnapPage payload at this level (mirroring web) and passes
 * it into `SnapRenderer`. While the fetch is in flight, renders an empty
 * card-shaped placeholder sized to match the eventual snap so the feed
 * doesn't jump when the content loads. If the fetch fails, the placeholder
 * persists.
 */
export const SnapEmbedAttachment: React.FC<SnapEmbedAttachmentProps> =
  React.memo(
    ({
      snap,
      embed,
      castHash,
      castAuthorFid,
      height,
      width,
      enableLiftOnInteraction = true,
    }) => {
      const t = useTheme();
      const { height: windowHeight } = useWindowDimensions();
      const insets = useSafeAreaInsets();
      const [isLifted, setIsLifted] = useState(false);
      const [showLiftAffordance, setShowLiftAffordance] = useState(false);
      const [renderedSnap, setRenderedSnap] = useState<SnapPageResponse | null>(
        null,
      );
      const [snapRenderState, setSnapRenderState] = useState<
        SnapRenderState | undefined
      >(undefined);
      const [activeSnapUrl, setActiveSnapUrl] = useState<string | null>(null);
      const liftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
      const deferredInteractionLiftTimerRef = useRef<ReturnType<
        typeof setTimeout
      > | null>(null);
      const affordanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
      );
      const liftGenerationRef = useRef(0);
      const containerRef = useRef<View | null>(null);
      const liftedRef = useRef<View | null>(null);
      const inlineFrameRef = useRef<View | null>(null);
      const inlineContentRef = useRef<View | null>(null);
      const inlineTouchStartRef = useRef<{ x: number; y: number } | null>(null);
      const isLiftedRef = useRef(false);
      const enableLiftOnInteractionRef = useRef(enableLiftOnInteraction);
      const liftIdRef = useRef(
        `snap-lift-${Math.random().toString(36).slice(2)}`,
      );
      const [placeholderHeight, setPlaceholderHeight] = useState<number | null>(
        null,
      );
      const [inlineContentHeight, setInlineContentHeight] = useState(0);
      const [liftResetKey, setLiftResetKey] = useState(0);
      const [liftFrame, setLiftFrame] = useState<{
        x: number;
        y: number;
        width: number;
      } | null>(null);
      const [portalTopCorrection, setPortalTopCorrection] = useState(0);
      const desiredPortalTopRef = useRef<number | null>(null);
      const portalTopCorrectionAppliedRef = useRef(false);
      const [isPortalPositionReady, setIsPortalPositionReady] = useState(true);
      // Prefer the new hoisted shape; fall back to the legacy URL embed's
      // page URL (content-negotiating snap servers serve both HTML and snap
      // JSON from the same URL, which is what existing callers pass).
      const snapUrl = snap?.url ?? embed?.openGraph.url;
      const castContext = useMemo(
        () =>
          castHash && castAuthorFid
            ? { hash: castHash, authorFid: castAuthorFid }
            : undefined,
        [castAuthorFid, castHash],
      );
      const { snap: fetchedSnap } = useFetchSnap({
        url: snapUrl ?? '',
        enabled: !!snapUrl,
        castContext,
      });
      const snapToRender = renderedSnap ?? fetchedSnap;
      isLiftedRef.current = isLifted;
      enableLiftOnInteractionRef.current = enableLiftOnInteraction;
      const clearLiftTimers = useCallback(() => {
        liftGenerationRef.current += 1;
        if (liftTimerRef.current) {
          clearTimeout(liftTimerRef.current);
          liftTimerRef.current = null;
        }
        if (deferredInteractionLiftTimerRef.current) {
          clearTimeout(deferredInteractionLiftTimerRef.current);
          deferredInteractionLiftTimerRef.current = null;
        }
        if (affordanceTimerRef.current) {
          clearTimeout(affordanceTimerRef.current);
          affordanceTimerRef.current = null;
        }
      }, []);
      const cancelPendingLift = useCallback(() => {
        liftGenerationRef.current += 1;
        if (liftTimerRef.current) {
          clearTimeout(liftTimerRef.current);
          liftTimerRef.current = null;
        }
        if (deferredInteractionLiftTimerRef.current) {
          clearTimeout(deferredInteractionLiftTimerRef.current);
          deferredInteractionLiftTimerRef.current = null;
        }
      }, []);
      const resetLiftState = useCallback(() => {
        clearLiftTimers();
        isLiftedRef.current = false;
        setIsLifted(false);
        setShowLiftAffordance(false);
        setPlaceholderHeight(null);
        setLiftFrame(null);
        setPortalTopCorrection(0);
        portalTopCorrectionAppliedRef.current = false;
        setIsPortalPositionReady(true);
        setLiftResetKey((current) => current + 1);
      }, [clearLiftTimers]);
      const updateLiftRect = useCallback(() => {
        const liftId = liftIdRef.current;

        if (isLifted && liftFrame) {
          liftedRef.current?.measureInWindow((x, y, width, height) => {
            const desiredY = desiredPortalTopRef.current;
            if (desiredY !== null && !portalTopCorrectionAppliedRef.current) {
              portalTopCorrectionAppliedRef.current = true;
              setPortalTopCorrection((currentCorrection) =>
                Math.abs(desiredY - y) > 0.5
                  ? currentCorrection + desiredY - y
                  : currentCorrection,
              );
              setIsPortalPositionReady(true);
            }

            setActiveSnapLift(liftId);
            updateActiveSnapLiftRect(liftId, {
              x,
              y: desiredY ?? y,
              width,
              height,
            });
          });
          return;
        }

        if (!isActiveSnapLift(liftId)) {
          return;
        }

        containerRef.current?.measureInWindow((x, y, nextWidth, nextHeight) => {
          if (!isActiveSnapLift(liftId)) {
            return;
          }

          updateActiveSnapLiftRect(liftId, {
            x,
            y,
            width: nextWidth,
            height: nextHeight,
          });
        });
      }, [isLifted, liftFrame]);
      const scheduleLift = useCallback(() => {
        if (
          !enableLiftOnInteractionRef.current ||
          isLiftedRef.current ||
          liftTimerRef.current ||
          consumeSnapLiftAfterReseatSuppression()
        ) {
          return;
        }

        markSnapLiftInteraction();
        const liftGeneration = liftGenerationRef.current + 1;
        liftGenerationRef.current = liftGeneration;

        liftTimerRef.current = setTimeout(() => {
          liftTimerRef.current = null;
          if (liftGenerationRef.current !== liftGeneration) {
            return;
          }

          const measureRef =
            inlineFrameRef.current ??
            inlineContentRef.current ??
            liftedRef.current;
          measureRef?.measureInWindow((x, y, nextWidth, nextHeight) => {
            if (liftGenerationRef.current !== liftGeneration) {
              return;
            }

            isLiftedRef.current = true;
            portalTopCorrectionAppliedRef.current = false;
            setPortalTopCorrection(0);
            setIsPortalPositionReady(false);
            setLiftFrame({
              x,
              y,
              width: nextWidth,
            });
            setPlaceholderHeight(nextHeight);
            setIsLifted(true);
            setShowLiftAffordance(true);
            if (affordanceTimerRef.current) {
              clearTimeout(affordanceTimerRef.current);
            }
            affordanceTimerRef.current = setTimeout(() => {
              affordanceTimerRef.current = null;
              setShowLiftAffordance(false);
            }, LIFT_AFFORDANCE_DURATION_MS);
          });
        }, 0);
      }, []);
      const scheduleLiftAfterInteraction = useCallback(() => {
        if (
          !enableLiftOnInteractionRef.current ||
          isLiftedRef.current ||
          liftTimerRef.current ||
          deferredInteractionLiftTimerRef.current
        ) {
          return;
        }

        deferredInteractionLiftTimerRef.current = setTimeout(() => {
          deferredInteractionLiftTimerRef.current = null;
          scheduleLift();
        }, LIFT_AFTER_INTERACTION_DELAY_MS);
      }, [scheduleLift]);
      const handleInlineTouchStart = useCallback(
        (event: GestureResponderEvent) => {
          inlineTouchStartRef.current = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          };
        },
        [],
      );
      const handleInlineTouchMove = useCallback(
        (event: GestureResponderEvent) => {
          const touchStart = inlineTouchStartRef.current;
          if (!touchStart) {
            return;
          }

          const deltaX = event.nativeEvent.pageX - touchStart.x;
          const deltaY = event.nativeEvent.pageY - touchStart.y;
          const movedEnoughToScroll =
            Math.hypot(deltaX, deltaY) >= LIFT_CANCEL_MOVE_THRESHOLD;

          if (movedEnoughToScroll) {
            inlineTouchStartRef.current = null;
            cancelPendingLift();
          }
        },
        [cancelPendingLift],
      );
      const handleInlineTouchCancel = useCallback(() => {
        inlineTouchStartRef.current = null;
        cancelPendingLift();
      }, [cancelPendingLift]);
      const handleInlineTouchEnd = useCallback(() => {
        const hadStationaryTouch = inlineTouchStartRef.current !== null;
        inlineTouchStartRef.current = null;

        if (hadStationaryTouch) {
          scheduleLiftAfterInteraction();
        }
      }, [scheduleLiftAfterInteraction]);
      const dismissLift = useCallback(() => {
        suppressNextSnapLiftAfterReseat();
        clearActiveSnapLift(liftIdRef.current);
        resetLiftState();
      }, [resetLiftState]);
      const handleSnapChange = useCallback(
        (nextSnap: SnapPageResponse | null) => {
          setRenderedSnap(nextSnap);
          setSnapRenderState(undefined);
        },
        [],
      );
      const handleSnapDocumentUrlChange = useCallback((url: string) => {
        setActiveSnapUrl(url);
        setSnapRenderState(undefined);
      }, []);
      const setInlineContentNode = useCallback((node: View | null) => {
        inlineContentRef.current = node;
      }, []);
      const handleInlineContentLayout = useCallback(
        (event: LayoutChangeEvent) => {
          setInlineContentHeight(Math.round(event.nativeEvent.layout.height));
        },
        [],
      );
      const liftedFrameStyle = useMemo(() => {
        if (!liftFrame) {
          return null;
        }

        const safeBottom = windowHeight - insets.bottom - LIFT_VIEWPORT_PADDING;
        const maxViewportHeight = safeBottom - liftFrame.y;
        const maxHeight = Math.max(
          1,
          Math.min(SNAP_INLINE_MAX_HEIGHT, maxViewportHeight),
        );

        // Preserve the inline card origin exactly; only constrain height so the
        // lifted snap can scroll if it would run below the viewport.
        return {
          top: liftFrame.y,
          left: liftFrame.x,
          width: liftFrame.width,
          maxHeight,
        };
      }, [insets.bottom, liftFrame, windowHeight]);
      desiredPortalTopRef.current = liftedFrameStyle?.top ?? null;
      const liftedMaxHeight =
        liftedFrameStyle?.maxHeight ?? SNAP_INLINE_MAX_HEIGHT;
      const liftedTop =
        liftedFrameStyle !== null
          ? liftedFrameStyle.top + portalTopCorrection
          : null;
      const liftedBorderColor = t.dark
        ? 'rgba(130, 109, 219, 0.62)'
        : 'rgba(66, 46, 140, 0.38)';
      const keepInlineVisibleWhilePortalSettles =
        isLifted && !isPortalPositionReady;

      useEffect(() => {
        const liftId = liftIdRef.current;
        return subscribeToActiveSnapLift((nextActiveId) => {
          if (
            nextActiveId !== liftId &&
            (isLiftedRef.current ||
              liftTimerRef.current !== null ||
              deferredInteractionLiftTimerRef.current !== null)
          ) {
            resetLiftState();
          }
        });
      }, [resetLiftState]);

      useEffect(() => {
        clearActiveSnapLift(liftIdRef.current);
        resetLiftState();
        setRenderedSnap(null);
        setSnapRenderState(undefined);
        setActiveSnapUrl(snapUrl ?? null);
        setInlineContentHeight(0);
      }, [resetLiftState, snapUrl]);

      useEffect(() => {
        const liftId = liftIdRef.current;
        return () => {
          clearLiftTimers();
          clearActiveSnapLift(liftId);
        };
      }, [clearLiftTimers]);

      useEffect(() => {
        if (!isLifted || !liftFrame) {
          return;
        }

        const animationFrame = requestAnimationFrame(updateLiftRect);
        return () => cancelAnimationFrame(animationFrame);
      }, [isLifted, liftFrame, updateLiftRect]);

      useEffect(() => {
        if (!isLifted || !liftedFrameStyle || liftedTop === null) {
          return;
        }

        const liftId = liftIdRef.current;
        setActiveSnapLift(liftId);
        updateActiveSnapLiftRect(liftId, {
          x: liftedFrameStyle.left,
          y: liftedTop,
          width: liftedFrameStyle.width,
          height: Math.min(
            placeholderHeight ??
              (inlineContentHeight > 0
                ? inlineContentHeight
                : SNAP_INLINE_MAX_HEIGHT),
            liftedMaxHeight,
          ),
        });
      }, [
        inlineContentHeight,
        isLifted,
        liftedFrameStyle,
        liftedMaxHeight,
        liftedTop,
        placeholderHeight,
      ]);

      // Carousel: height is provided, width is not — derive width like OG embeds.
      // Non-carousel: width is provided, height is not — use width directly.
      const resolvedWidth =
        height !== undefined ? height * 1.91 - 158.5 : width;

      // Sizing only. `SnapRenderer` owns the rounded card chrome, content
      // clipping, AND the "Show more" pill-overhang padding — so no wrapper
      // in the app should re-implement any of that. Every screen that
      // embeds snaps (feed, quote casts, DMs, composer preview, dev
      // emulator) goes through `SnapRenderer` and gets the right look.
      const containerStyle = {
        ...(resolvedWidth !== undefined
          ? { width: resolvedWidth }
          : { flex: 1, minWidth: 0 }),
        maxWidth: '100%' as const,
      };

      if (!snapUrl) return null;

      if (!snapToRender) {
        // Placeholder mirrors the eventual card shape so the feed doesn't
        // jump when the real snap loads in. Since there's no "Show more"
        // pill on the placeholder, we don't need the bottom overhang here.
        return (
          <View
            style={{
              ...containerStyle,
              height: height ?? LOADING_PLACEHOLDER_HEIGHT,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          />
        );
      }

      const hostControlledInlineOverflow =
        !isLifted &&
        enableLiftOnInteraction &&
        inlineContentHeight >= SNAP_INLINE_MAX_HEIGHT;
      const renderer = (
        <SnapRenderer
          snapUrl={activeSnapUrl ?? snapUrl}
          initialSnap={snapToRender}
          castContext={castContext}
          forceExpanded={isLifted || hostControlledInlineOverflow}
          expandButtonLabel={
            enableLiftOnInteraction ? 'Show Full Snap' : undefined
          }
          onExpandPress={enableLiftOnInteraction ? scheduleLift : undefined}
          onFirstInteraction={
            enableLiftOnInteraction ? scheduleLiftAfterInteraction : undefined
          }
          onNavigateAway={dismissLift}
          onBeforeExternalAction={dismissLift}
          onSnapChange={handleSnapChange}
          onSnapDocumentUrlChange={handleSnapDocumentUrlChange}
          initialRenderState={snapRenderState}
          onRenderStateChange={setSnapRenderState}
        />
      );
      const liftedSnap =
        isLifted && liftedFrameStyle ? (
          <SnapLiftPortal.Portal>
            <View
              ref={liftedRef}
              collapsable={false}
              onLayout={updateLiftRect}
              style={[
                styles.liftedFrame,
                styles.liftedPortalFrame,
                {
                  backgroundColor: t.colors.background.secondary,
                  borderColor: liftedBorderColor,
                  left: liftedFrameStyle.left,
                  maxHeight: liftedMaxHeight,
                  shadowColor: t.colors.black,
                  shadowOpacity: showLiftAffordance
                    ? t.dark
                      ? 0.62
                      : 0.36
                    : t.dark
                      ? 0.44
                      : 0.24,
                  opacity: isPortalPositionReady ? 1 : 0,
                  top: liftedTop ?? liftedFrameStyle.top,
                  width: liftedFrameStyle.width,
                },
              ]}
            >
              <ScrollView
                scrollEnabled
                style={[styles.snapScroll, { maxHeight: liftedMaxHeight }]}
                contentContainerStyle={styles.snapScrollContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                <View collapsable={false}>{renderer}</View>
              </ScrollView>
              <View pointerEvents="box-none" style={styles.closeLiftDock}>
                <Pressable
                  hitSlop={8}
                  onPress={dismissLift}
                  style={[
                    styles.closeLiftButton,
                    {
                      backgroundColor: 'rgb(108, 76, 210)',
                      borderColor: liftedBorderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.closeLiftButtonText,
                      { color: t.colors.white },
                    ]}
                  >
                    Close
                  </Text>
                </Pressable>
              </View>
            </View>
          </SnapLiftPortal.Portal>
        ) : null;

      return (
        <View
          ref={containerRef}
          collapsable={false}
          style={[
            containerStyle,
            isLifted && placeholderHeight !== null
              ? { height: placeholderHeight }
              : undefined,
            enableLiftOnInteraction ? styles.liftContainer : undefined,
          ]}
        >
          {!isLifted || keepInlineVisibleWhilePortalSettles ? (
            <View
              ref={inlineFrameRef}
              collapsable={false}
              pointerEvents={isLifted ? 'none' : 'auto'}
              style={[
                styles.inlineClipFrame,
                hostControlledInlineOverflow
                  ? styles.inlineClipFrameConstrained
                  : undefined,
              ]}
            >
              <ScrollView
                scrollEnabled={false}
                style={styles.snapScroll}
                contentContainerStyle={styles.snapScrollContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View
                  key={`inline-snap-${liftResetKey}`}
                  ref={setInlineContentNode}
                  collapsable={false}
                  onLayout={handleInlineContentLayout}
                  onTouchCancel={handleInlineTouchCancel}
                  onTouchEnd={handleInlineTouchEnd}
                  onTouchMove={handleInlineTouchMove}
                  onTouchStart={handleInlineTouchStart}
                >
                  {renderer}
                </View>
              </ScrollView>
              {hostControlledInlineOverflow ? (
                <View pointerEvents="box-none" style={styles.inlineExpandDock}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.inlineExpandButton,
                      {
                        backgroundColor: pressed
                          ? 'rgba(18, 18, 20, 0.94)'
                          : 'rgba(18, 18, 20, 0.88)',
                        borderColor: 'rgba(255, 255, 255, 0.16)',
                      },
                    ]}
                    onPress={scheduleLift}
                  >
                    <Text
                      style={[
                        styles.inlineExpandButtonText,
                        { color: t.colors.white },
                      ]}
                    >
                      Show Full Snap
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
          {liftedSnap}
        </View>
      );
    },
  );

SnapEmbedAttachment.displayName = 'SnapEmbedAttachment';

const styles = StyleSheet.create({
  inlineClipFrame: {
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: SNAP_INLINE_MAX_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  inlineClipFrameConstrained: {
    height: SNAP_INLINE_MAX_HEIGHT,
  },
  inlineExpandDock: {
    bottom: 0,
    left: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
  },
  inlineExpandButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    width: '100%',
  },
  inlineExpandButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  liftContainer: {
    position: 'relative',
    overflow: 'visible',
  },
  liftedFrame: {
    borderRadius: 12,
    borderWidth: 1,
    elevation: 10,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    zIndex: 1000,
  },
  liftedPortalFrame: {
    position: 'absolute',
  },
  snapScroll: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  snapScrollContent: {
    flexGrow: 0,
  },
  closeLiftDock: {
    alignItems: 'center',
    position: 'absolute',
    right: 8,
    top: '100%',
    zIndex: 1001,
  },
  closeLiftButton: {
    alignItems: 'center',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    elevation: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  closeLiftButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
