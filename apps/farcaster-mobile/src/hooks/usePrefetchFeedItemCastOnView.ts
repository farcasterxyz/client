import {
  FeedItemType,
  MixedFeedItem,
  usePrefetchUserCast,
} from 'farcaster-client-hooks';
import { useCallback, useRef } from 'react';
import { Platform, ViewabilityConfigCallbackPairs } from 'react-native';

import {
  SharedViewToken,
  useCastViewabilityConfigs,
} from '~/hooks/useRecordCastOnViewWhenFocused';

// On Android, throttle prefetch callbacks so that rapid scroll events don't
// trigger a burst of React Query prefetch operations that compete with the
// JS thread during active scrolling. 300ms means prefetch still runs when
// the user slows down or pauses, preserving the UX benefit without the jank.
const ANDROID_PREFETCH_THROTTLE_MS = 300;

export function usePrefetchFeedItemCastOnView(): ViewabilityConfigCallbackPairs {
  const prefetchUserCast = usePrefetchUserCast();
  const lastPrefetchTimeRef = useRef(0);

  const onViewableItemsChanged = useCallback(
    ({ changed }: { changed: SharedViewToken[] }) => {
      if (Platform.OS === 'android') {
        const now = Date.now();
        if (now - lastPrefetchTimeRef.current < ANDROID_PREFETCH_THROTTLE_MS) {
          return;
        }
        lastPrefetchTimeRef.current = now;
      }

      for (const changedItem of changed) {
        if (changedItem.isViewable) {
          const item = changedItem.item as MixedFeedItem;
          if (item.type === FeedItemType.Cast) {
            if (
              typeof item.item.cast.embeds !== 'undefined' &&
              typeof item.item.cast.embeds.casts !== 'undefined'
            ) {
              for (const quote of item.item.cast.embeds.casts) {
                if (typeof quote.author.username !== 'undefined') {
                  prefetchUserCast({
                    hash: quote.hash,
                    username: quote.author.username,
                    shouldSkipIfRecentlyPrefetched: true,
                  });
                }
              }
            }
          }
        }
      }
    },
    [prefetchUserCast],
  );

  return useCastViewabilityConfigs(onViewableItemsChanged);
}
