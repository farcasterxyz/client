/**
 * ScrollAwareBottomSheetProvider
 *
 * Provides Safari-style bottom sheet behavior that responds to scroll gestures:
 * - Shows when scrolling up, hides when scrolling down
 * - Follows finger movement 1:1 until reaching a threshold
 * - Auto-completes animation after passing 10% threshold
 * - Snaps to nearest state when drag ends
 * - Handles edge cases like top/bottom scroll boundaries
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  cancelAnimation,
  SharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type ScrollAwareBottomSheetContextType = {
  bottomSheetTranslateY: SharedValue<number>;
  bottomSheetProgress: SharedValue<number>;
  scrollHandlers: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  show: () => void;
  hide: () => void;
};

const ScrollAwareBottomSheetContext =
  createContext<ScrollAwareBottomSheetContextType | null>(null);

// Configuration constants
const BOTTOM_BOUNCE_OFFSET = 10; // Pixels from bottom to detect bounce

const SPRING_CONFIG = {
  damping: 50,
  stiffness: 300,
  overshootClamping: true,
};

// Helper to clamp a value between min and max
function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(max, value));
}

interface ScrollAwareBottomSheetProviderProps {
  children: React.ReactNode;
  bottomSheetHeight: number;
  /**
   * Whether to start with the bottom sheet hidden.
   * Defaults to false (visible).
   */
  startHidden?: boolean;
  /**
   * Minimum height to keep visible when collapsed.
   * Defaults to 0 (fully hidden).
   */
  minVisibleHeight?: number;
}

export function ScrollAwareBottomSheetProvider({
  children,
  bottomSheetHeight,
  startHidden = false,
  minVisibleHeight = 0,
}: ScrollAwareBottomSheetProviderProps) {
  const BOTTOM_SHEET_HIDDEN_Y = bottomSheetHeight - minVisibleHeight;
  const TRIGGER_THRESHOLD = BOTTOM_SHEET_HIDDEN_Y * 0.1;
  const SNAP_THRESHOLD = BOTTOM_SHEET_HIDDEN_Y / 2;

  // Public API
  const bottomSheetTranslateY = useSharedValue(
    startHidden ? BOTTOM_SHEET_HIDDEN_Y : 0,
  );
  const bottomSheetProgress = useDerivedValue(() => {
    // Calculate progress from 1 (fully open) to 0 (collapsed)
    return 1 - bottomSheetTranslateY.value / BOTTOM_SHEET_HIDDEN_Y;
  });

  // Internal state for scroll tracking
  const lastScrollY = useSharedValue(0);
  const accumulatedPosition = useSharedValue(
    startHidden ? BOTTOM_SHEET_HIDDEN_Y : 0,
  );
  const hasTriggered = useSharedValue(false);
  const scrollDirection = useSharedValue<-1 | 0 | 1>(0);

  const scrollHandlers = useAnimatedScrollHandler({
    onBeginDrag: (event) => {
      'worklet';
      lastScrollY.value = event.contentOffset.y;
      hasTriggered.value = false;
      cancelAnimation(bottomSheetTranslateY);
    },

    onScroll: (event: NativeScrollEvent) => {
      'worklet';
      const currentY = event.contentOffset.y;
      const deltaY = currentY - lastScrollY.value;

      // Calculate if content is scrollable
      const contentHeight = event.contentSize.height;
      const scrollViewHeight = event.layoutMeasurement.height;
      const isScrollable = contentHeight > scrollViewHeight;
      const isAtBottom =
        currentY >= contentHeight - scrollViewHeight - BOTTOM_BOUNCE_OFFSET;

      // If content isn't scrollable, ignore all scroll events (these are just bounces)
      if (!isScrollable) {
        lastScrollY.value = currentY;
        return;
      }

      // Ignore bounce at top (negative scroll position)
      if (currentY < 0 && deltaY > 0) {
        lastScrollY.value = currentY;
        return;
      }

      // Ignore bounce at bottom
      if (isAtBottom && deltaY < 0) {
        lastScrollY.value = currentY;
        return;
      }

      // Update scroll direction and reset trigger on direction change
      const previousDirection = scrollDirection.value;
      const newDirection = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;

      if (newDirection !== 0 && newDirection !== previousDirection) {
        scrollDirection.value = newDirection;
        hasTriggered.value = false;
      }

      // Safari-style behavior: follow finger until threshold
      if (!hasTriggered.value && deltaY !== 0) {
        // Accumulate position clamped between visible and hidden states
        accumulatedPosition.value = clamp(
          accumulatedPosition.value + deltaY,
          0,
          BOTTOM_SHEET_HIDDEN_Y,
        );

        // Direct 1:1 movement for immediate response
        bottomSheetTranslateY.value = accumulatedPosition.value;

        // Check for auto-completion threshold
        const shouldAutoHide =
          scrollDirection.value === 1 &&
          accumulatedPosition.value > TRIGGER_THRESHOLD;
        const shouldAutoShow =
          scrollDirection.value === -1 &&
          accumulatedPosition.value < BOTTOM_SHEET_HIDDEN_Y - TRIGGER_THRESHOLD;

        if (shouldAutoHide || shouldAutoShow) {
          hasTriggered.value = true;
          const targetY = shouldAutoHide ? BOTTOM_SHEET_HIDDEN_Y : 0;
          bottomSheetTranslateY.value = withSpring(targetY, SPRING_CONFIG);
          accumulatedPosition.value = targetY;
        }
      }

      lastScrollY.value = currentY;
    },

    onEndDrag: () => {
      'worklet';
      // Snap to closest state if auto-complete hasn't triggered
      if (!hasTriggered.value) {
        const shouldShow = accumulatedPosition.value < SNAP_THRESHOLD;
        const targetY = shouldShow ? 0 : BOTTOM_SHEET_HIDDEN_Y;

        bottomSheetTranslateY.value = withSpring(targetY, SPRING_CONFIG);
        accumulatedPosition.value = targetY;
      }
    },
  });

  const show = useCallback(() => {
    'worklet';
    cancelAnimation(bottomSheetTranslateY);
    bottomSheetTranslateY.value = withSpring(0, SPRING_CONFIG);
    accumulatedPosition.value = 0;
    hasTriggered.value = false;
  }, [bottomSheetTranslateY, accumulatedPosition, hasTriggered]);

  const hide = useCallback(() => {
    'worklet';
    cancelAnimation(bottomSheetTranslateY);
    bottomSheetTranslateY.value = withSpring(
      BOTTOM_SHEET_HIDDEN_Y,
      SPRING_CONFIG,
    );
    accumulatedPosition.value = BOTTOM_SHEET_HIDDEN_Y;
    hasTriggered.value = false;
  }, [
    bottomSheetTranslateY,
    accumulatedPosition,
    hasTriggered,
    BOTTOM_SHEET_HIDDEN_Y,
  ]);

  const value = useMemo(
    () => ({
      bottomSheetTranslateY,
      bottomSheetProgress,
      scrollHandlers,
      show,
      hide,
    }),
    [bottomSheetTranslateY, bottomSheetProgress, scrollHandlers, show, hide],
  );

  return (
    <ScrollAwareBottomSheetContext.Provider value={value}>
      {children}
    </ScrollAwareBottomSheetContext.Provider>
  );
}

export function useScrollAwareBottomSheet() {
  const context = useContext(ScrollAwareBottomSheetContext);
  if (!context) {
    throw new Error(
      'useScrollAwareBottomSheet must be used within ScrollAwareBottomSheetProvider',
    );
  }
  return context;
}
