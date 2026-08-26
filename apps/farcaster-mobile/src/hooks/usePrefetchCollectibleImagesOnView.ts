import { Image } from 'expo-image';
import {
  FeedItemType,
  getRenderData,
  MixedFeedItem,
} from 'farcaster-client-hooks';
import { getPixelDensity } from 'farcaster-expo';
import { useCallback, useRef } from 'react';
import { Platform, ViewabilityConfigCallbackPairs } from 'react-native';

import { imageRequestHeaders } from '~/constants/Images';
import {
  SharedViewToken,
  useCastViewabilityConfigs,
} from '~/hooks/useRecordCastOnViewWhenFocused';

// Cache pixelDensity at module level — it never changes during app lifetime
let cachedPixelDensity: number | null = null;
function getCachedPixelDensity(): number {
  if (cachedPixelDensity === null) {
    cachedPixelDensity = getPixelDensity();
  }
  return cachedPixelDensity;
}

// On Android, throttle prefetch callbacks to avoid saturating the image
// download queue and competing with already-visible content during fast
// scrolling. 300ms lets the prefetch run when the user slows down or pauses
// without firing on every scroll event. Also cap URLs per fire to 2 so a
// single callback can't queue a burst of downloads.
const ANDROID_PREFETCH_THROTTLE_MS = 300;
const ANDROID_PREFETCH_MAX_URLS = 2;

export function usePrefetchCollectibleImagesOnView(): ViewabilityConfigCallbackPairs {
  // Cache getRenderData results by cast hash to avoid recomputing on every scroll
  const renderDataCacheRef = useRef<Map<string, string>>(new Map());
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

      const urls = [];
      const cache = renderDataCacheRef.current;

      for (const changedItem of changed) {
        if (changedItem.isViewable) {
          const item = changedItem.item as MixedFeedItem;
          if (item.type === FeedItemType.Cast) {
            const castHash = item.item.cast.hash;

            // Check cache first to avoid expensive getRenderData call during scroll
            let presentationType = cache.get(castHash);
            if (presentationType === undefined) {
              const presentation = getRenderData({
                cast: item.item.cast,
                pixelDensity: getCachedPixelDensity(),
              });
              presentationType = presentation.type;
              cache.set(castHash, presentationType);
            }

            if (
              presentationType !== 'text' &&
              item.item.cast.collectible?.backgroundImageUrl
            ) {
              urls.push(item.item.cast.collectible.backgroundImageUrl);
            }
          }
        }

        // On Android, cap the number of concurrent prefetch requests per
        // callback to avoid a single fire queuing too many downloads.
        if (
          Platform.OS === 'android' &&
          urls.length >= ANDROID_PREFETCH_MAX_URLS
        ) {
          break;
        }
      }

      if (urls.length > 0) {
        Image.prefetch(urls, {
          cachePolicy: 'memory-disk',
          headers: imageRequestHeaders,
        });
      }
    },
    [],
  );

  return useCastViewabilityConfigs(onViewableItemsChanged);
}
