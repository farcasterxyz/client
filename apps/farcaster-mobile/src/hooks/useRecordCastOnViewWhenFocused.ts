import { TrackCastViewFn, useTrackEvent } from 'farcaster-client-hooks';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ViewabilityConfigCallbackPairs, ViewToken } from 'react-native';

// FlashList and FlatList use incompatible ViewToken types, luckily the
// 3 properties we need (`index`, `isViewable`, and `item`) are shared, so use only them
export type SharedViewToken = Pick<ViewToken, 'index' | 'isViewable' | 'item'>;

// Minimum callback signature
export type ViewabilityCallback = (info: {
  changed: SharedViewToken[];
}) => void;

export const CAST_MIN_VIEW_TIME = 500;

export type CastViewData = Parameters<TrackCastViewFn>[0];

export function useCastViewabilityConfigs(
  onViewableItemsChanged: ViewabilityCallback,
): ViewabilityConfigCallbackPairs {
  return useMemo(
    // We use 2 configs in order to compensate their individual weaknesses:
    // * viewAreaCoveragePercentThreshold triggers when an item is visible in full and when
    //   it covers a part of the whole viewport. This however means that if a small part
    //   of the cast is not in the viewport, and the cast does not occupy enough of the
    //   viewport (e.g. it is small or the phone is large), the cast will not be considered viewed.
    // * itemVisiblePercentThreshold triggers when a part of the items is visible on the viewport.
    //   This fails on small phones and long casts which may occupy the full viewport but still
    //   not hit the required threshold as part of the cast.
    () => [
      {
        viewabilityConfig: {
          minimumViewTime: CAST_MIN_VIEW_TIME,
          viewAreaCoveragePercentThreshold: 50,
        },
        onViewableItemsChanged,
      },
      {
        viewabilityConfig: {
          minimumViewTime: CAST_MIN_VIEW_TIME,
          itemVisiblePercentThreshold: 50,
        },
        onViewableItemsChanged,
      },
    ],
    [onViewableItemsChanged],
  );
}

// Helper hook that records cast views immediately when the list is focused,
// or buffers them when unfocused and records them when the list becomes focused later
export function useRecordCastsOnViewWhenFocused({
  isFocused,
}: {
  isFocused: boolean;
}) {
  const { trackCastView } = useTrackEvent();
  const isFocusedRef = useRef(false);
  const bufferRef = useRef(new Map<string, CastViewData>());

  // Submit buffered hashes once list becomes and stays focused
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isFocused && !isFocusedRef.current) {
      // List became focused -> set a timeout to submit the buffered hashes.
      // We need the timeout to mimic what onViewableItemsChanged with its config does
      // because the user hasn't yet looked at these casts
      timeout = setTimeout(() => {
        if (isFocusedRef.current && bufferRef.current.size > 0) {
          // List is (still) in focus -> record buffered casts as seen
          const castViews = Array.from(bufferRef.current.values());
          bufferRef.current.clear();
          for (const castView of castViews) {
            trackCastView(castView);
          }
        }
      }, CAST_MIN_VIEW_TIME);
    }
    isFocusedRef.current = isFocused;

    return () => {
      if (timeout) {
        // Focus changed to false -> clear timeout to not submit buffered items
        clearTimeout(timeout);
      }
    };
  }, [isFocused, trackCastView]);

  return useCallback(
    (castViews: CastViewData[]) => {
      if (isFocusedRef.current) {
        // Focused -> record immediately
        for (const castView of castViews) {
          trackCastView(castView);
        }
      } else {
        // Not focused -> buffer for sending when focused
        for (const castView of castViews) {
          bufferRef.current.set(castView.castHash, castView);
        }
      }
    },
    [trackCastView],
  );
}
