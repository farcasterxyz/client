import { Skia, SkImage } from '@shopify/react-native-skia';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import { withRetry } from 'viem';

import { trackError } from '~/utils/ErrorUtils';
import { logInDevOnly } from '~/utils/LogUtils';

// Reusable Skia image cache based on Expo's cache
const skiaImageCache = new Map<string, SkImage>();
const MAX_CACHE_SIZE = 15; // Limit cache to prevent memory issues

// Clean up oldest entries when cache is full
function cleanupSkiaCache() {
  if (skiaImageCache.size <= MAX_CACHE_SIZE) {
    return;
  }

  const keysToRemove = Array.from(skiaImageCache.keys()).slice(
    0,
    skiaImageCache.size - MAX_CACHE_SIZE,
  );
  keysToRemove.forEach((key) => skiaImageCache.delete(key));

  logInDevOnly('Cleaned up Skia image cache', {
    removed: keysToRemove.length,
    remaining: skiaImageCache.size,
  });
}

async function loadImage(url: string): Promise<SkImage> {
  const cachedSkiaImage = skiaImageCache.get(url);
  if (cachedSkiaImage) {
    return cachedSkiaImage;
  }

  try {
    let skImage: SkImage | null = null;
    let cachedPath = await ExpoImage.getCachePathAsync(url);

    if (!cachedPath) {
      await ExpoImage.prefetch(url);
      cachedPath = await ExpoImage.getCachePathAsync(url);
    }

    if (cachedPath) {
      const fileUri = cachedPath.startsWith('file://')
        ? cachedPath
        : `file://${cachedPath}`;

      try {
        const data = await Skia.Data.fromURI(fileUri);
        if (data) {
          skImage = Skia.Image.MakeImageFromEncoded(data);
        }
      } catch (cacheError) {
        trackError(cacheError);
        logInDevOnly(`cache load error`, {
          error: cacheError instanceof Error ? cacheError.message : 'Unknown',
          fileUri,
        });
      }
    }

    // if cache failed, try direct download
    if (!skImage) {
      const data = await Skia.Data.fromURI(url);

      if (data) {
        skImage = Skia.Image.MakeImageFromEncoded(data);
      }
    }

    if (!skImage) {
      throw new Error('Failed to create Skia image from any method');
    }

    cleanupSkiaCache(); // Clean up if cache is getting too large
    skiaImageCache.set(url, skImage);
    return skImage;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logInDevOnly(`skia loadImage failed`, {
      error: errorMessage,
      url,
    });

    trackError(error);
    throw error;
  }
}

export type ImageAssets = Record<string, SkImage>;

export function useImages({ images }: { images: Record<string, string> }) {
  const [imageAssets, setImageAssets] = useState<Record<
    string,
    SkImage
  > | null>(null);

  useEffect(() => {
    (async () => {
      const results = await Promise.all(
        Object.entries(images).map(async ([key, url]) => {
          const skImage = await withRetry(() => loadImage(url), {
            retryCount: 3,
          });
          return [key, skImage];
        }),
      );

      setImageAssets(Object.fromEntries(results));
    })();
  }, [images]);

  return { imageAssets };
}
