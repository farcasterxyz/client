import {
  Image,
  ImageContentFit,
  ImageContentPosition,
  ImageErrorEventData,
  ImageLoadEventData,
  ImageSource,
  ImageStyle,
} from 'expo-image';
import { getCloudflareImageUrl } from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, View, ViewStyle } from 'react-native';

import { imageRequestHeaders } from '../constants/Images';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingIndicator } from './design-system/atoms/LoadingIndicator';

// Single cache-busted retry to recover from expo-image cache-eviction /
// transient CDN failures before we fall back to fallbackSource.
const MAX_REMOTE_IMAGE_RETRIES = 1;
const REMOTE_IMAGE_RETRY_DELAY_MS = 600;
// Watchdog for expo-image silent stalls (neither onLoad nor onError fires).
const REMOTE_IMAGE_LOAD_WATCHDOG_MS = 5000;
const SIM_COLLECTIBLE_IMAGE_PREFIX =
  'https://api.sim.dune.com/v1/evm/collectible/image/';

const buildRetriedUri = (uri: string, retryAttempt: number): string => {
  if (retryAttempt <= 0) {
    return uri;
  }
  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}_r=${retryAttempt}`;
};

// When the Cloudflare image proxy can't handle a source (e.g. unsupported
// format like .ico, or the developer's host returns HTML for missing files),
// `wrpcd.net/cdn-cgi/image` answers 415 / `cf-resized: err=9412` and the
// cache-busted retry above is useless. Callers that show third-party images
// (mini-app icons, etc.) can opt in to one extra attempt against the raw,
// non-transformed URL via `fallbackToOriginalUrlOnError`.
const ORIGINAL_URL_RETRY_ATTEMPT = MAX_REMOTE_IMAGE_RETRIES + 1;

type RemoteImageProps = {
  fallback?: ReactElement;
  fallbackSource?: ImageSource;
  height?: number;
  onLoad?: (event: ImageLoadEventData) => void;
  recyclingKey?: null | string;
  cachePolicy?: null | 'disk' | 'memory-disk' | 'memory' | 'none';
  contentFit?: ImageContentFit;
  contentPosition?: ImageContentPosition;
  // When true, after the standard cache-busted retry against the Cloudflare-
  // transformed URL fails, we make one more attempt against the raw `uri`
  // (skipping `getCloudflareImageUrl`). This recovers third-party images
  // that Cloudflare's image proxy can't transform — e.g. `.ico` favicons,
  // SPA hosts that return HTML (`cf-resized: err=9412`), or transient
  // resize errors — but that `expo-image` can still decode.
  //
  // Tradeoff: the raw fetch bypasses our `anim=false` and `w=N` safeguards,
  // so a developer-controlled URL that is e.g. a large animated GIF will
  // download and render at its original size. Only opt in for callers where
  // the image is bounded in practice (small icons like `MiniAppIcon`,
  // `TokenIcon`). Ignored when `dangerouslySkipCloudinary` is already true.
  shouldAttemptToUncloudifyOnError?: boolean;
  shouldFadeIn?: boolean;
  showLoadingIndicator?: boolean;
  // Watch out: this is applied twice - once on the outer and once on the inner component
  style?: (ImageStyle & ViewStyle)[];
  containerStyle?: ViewStyle[];
  fallbackStyleOverrides?: (ImageStyle & ViewStyle)[];
  uri: string | undefined;
  width?: number;
  dangerouslyAllowAnimation?: boolean;
  dangerouslySkipCloudinary?: boolean;
  onError?: (event: ImageErrorEventData) => void;
};

const RemoteImage: FC<RemoteImageProps> = memo(
  ({
    fallback,
    fallbackSource,
    height,
    onLoad,
    recyclingKey,
    showLoadingIndicator,
    style,
    containerStyle,
    fallbackStyleOverrides,
    uri,
    width,
    contentFit,
    contentPosition,
    onError,
    dangerouslyAllowAnimation = false,
    dangerouslySkipCloudinary = false,
    shouldAttemptToUncloudifyOnError = false,
  }) => {
    const [hasLoaded, setHasLoaded] = useState(false);
    const t = useTheme();

    const [failedToLoadImage, setFailedToLoadImage] = useState<boolean>(false);
    const [retryAttempt, setRetryAttempt] = useState<number>(0);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const watchdogTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    // Reset state when uri changes (important for FlashList recycling)
    useEffect(() => {
      setFailedToLoadImage(false);
      setHasLoaded(false);
      setRetryAttempt(0);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
    }, [uri]);

    useEffect(() => {
      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        if (watchdogTimeoutRef.current) {
          clearTimeout(watchdogTimeoutRef.current);
          watchdogTimeoutRef.current = null;
        }
      };
    }, []);

    const willTryOriginalUrlFallback =
      shouldAttemptToUncloudifyOnError && !dangerouslySkipCloudinary;
    const maxRetryAttempts = willTryOriginalUrlFallback
      ? ORIGINAL_URL_RETRY_ATTEMPT
      : MAX_REMOTE_IMAGE_RETRIES;

    useEffect(() => {
      if (hasLoaded || failedToLoadImage) {
        return;
      }
      if (retryAttempt >= maxRetryAttempts) {
        return;
      }
      if (!uri) {
        return;
      }
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
      }
      watchdogTimeoutRef.current = setTimeout(() => {
        setRetryAttempt((previous) => previous + 1);
      }, REMOTE_IMAGE_LOAD_WATCHDOG_MS);
      return () => {
        if (watchdogTimeoutRef.current) {
          clearTimeout(watchdogTimeoutRef.current);
          watchdogTimeoutRef.current = null;
        }
      };
    }, [failedToLoadImage, hasLoaded, maxRetryAttempts, retryAttempt, uri]);

    const source = useMemo((): ImageSource | undefined => {
      if (uri?.endsWith('.svg')) {
        return undefined;
      }

      // Final attempt only: skip Cloudflare so third-party images rejected
      // by `wrpcd.net/cdn-cgi/image` (e.g. .ico, HTML SPA fallbacks,
      // transient cf-resized errors) get a chance via expo-image directly.
      // Note: this is *only* for the new fallback attempt; existing
      // `dangerouslySkipCloudinary` callers must still get their normal
      // cache-busted retry on attempt 1.
      const isOriginalUrlFallbackAttempt =
        willTryOriginalUrlFallback &&
        retryAttempt >= ORIGINAL_URL_RETRY_ATTEMPT;

      const baseUri =
        uri &&
        (dangerouslySkipCloudinary || isOriginalUrlFallbackAttempt
          ? uri
          : getCloudflareImageUrl({
              url: uri,
              windowWidth: width || 300,
              width: width,
              blockAnimated: !dangerouslyAllowAnimation,
              proxySimImages: Platform.OS === 'web',
            }));

      // No point cache-busting on the original-URL fallback attempt — it's
      // already a brand-new URL from expo-image's perspective. All other
      // attempts (including `dangerouslySkipCloudinary` ones) still need
      // the `?_r=N` cache-bust to flip expo-image's bitmap on retry.
      const computedUri =
        baseUri &&
        (isOriginalUrlFallbackAttempt
          ? baseUri
          : buildRetriedUri(baseUri, retryAttempt));
      const shouldOmitHeaders =
        Platform.OS === 'web' &&
        computedUri?.startsWith(SIM_COLLECTIBLE_IMAGE_PREFIX);

      // Gate on computedUri so a missing source resolves to fallbackSource
      // (when a caller provides one): expo-image fires no onError for an
      // undefined uri, so failedToLoadImage would never flip and fallbackSource
      // would otherwise never render. Callers without a fallbackSource still
      // degrade to a blank source.
      return {
        ...(!failedToLoadImage && computedUri
          ? { uri: computedUri }
          : fallbackSource),
        ...(!shouldOmitHeaders ? { headers: imageRequestHeaders } : {}),
      };
    }, [
      dangerouslyAllowAnimation,
      dangerouslySkipCloudinary,
      failedToLoadImage,
      fallbackSource,
      retryAttempt,
      uri,
      width,
      willTryOriginalUrlFallback,
    ]);

    // Honor caller-provided recyclingKey (incl. explicit null to opt out);
    // otherwise fall back to the computed source URI so the retry suffix
    // (`?_r=N`) flips the key and forces expo-image to swap the bitmap.
    const effectiveRecyclingKey: string | null =
      recyclingKey !== undefined ? recyclingKey : (source?.uri ?? null);

    const imageViewToRender = useMemo(() => {
      if (!source) {
        return null;
      }

      return (
        <View
          style={[
            t.relative,
            {
              width,
              height,
            },
            t.bgElevated,
            style,
            containerStyle,
          ]}
        >
          <Image
            transition={0}
            contentFit={contentFit}
            contentPosition={contentPosition}
            source={source}
            cachePolicy="memory-disk"
            recyclingKey={effectiveRecyclingKey}
            style={[t.hFull, t.wFull, style, containerStyle]}
            onLoad={(e) => {
              setHasLoaded(true);
              if (watchdogTimeoutRef.current) {
                clearTimeout(watchdogTimeoutRef.current);
                watchdogTimeoutRef.current = null;
              }
              if (onLoad) {
                onLoad(e);
              }
            }}
            onError={async (error) => {
              if (retryAttempt < maxRetryAttempts) {
                if (retryTimeoutRef.current) {
                  clearTimeout(retryTimeoutRef.current);
                }
                retryTimeoutRef.current = setTimeout(() => {
                  setRetryAttempt((previous) => previous + 1);
                }, REMOTE_IMAGE_RETRY_DELAY_MS);
                return;
              }

              setFailedToLoadImage(true);

              if (onError) {
                onError(error);
              }
            }}
          />
          {failedToLoadImage && (
            <View
              style={[t.absolute, t.inset0, t.justifyCenter, t.itemsCenter]}
            >
              <Image
                transition={0}
                source={fallbackSource}
                cachePolicy="memory-disk"
                style={[
                  t.hFull,
                  t.wFull,
                  typeof fallbackStyleOverrides !== 'undefined'
                    ? fallbackStyleOverrides
                    : [style, containerStyle],
                ]}
              />
            </View>
          )}
        </View>
      );
    }, [
      containerStyle,
      contentFit,
      contentPosition,
      effectiveRecyclingKey,
      failedToLoadImage,
      fallbackSource,
      fallbackStyleOverrides,
      height,
      maxRetryAttempts,
      onError,
      onLoad,
      retryAttempt,
      source,
      style,
      t.absolute,
      t.bgElevated,
      t.hFull,
      t.inset0,
      t.itemsCenter,
      t.justifyCenter,
      t.relative,
      t.wFull,
      width,
    ]);

    if (source && (!failedToLoadImage || !fallback)) {
      return (
        <>
          {showLoadingIndicator && !hasLoaded && (
            <View style={[t.justifyCenter, { height, width }]}>
              <LoadingIndicator />
            </View>
          )}
          {imageViewToRender}
        </>
      );
    } else if (fallback) {
      return fallback;
    } else {
      return null;
    }
  },
);

RemoteImage.displayName = 'RemoteImage';

export { RemoteImage, type RemoteImageProps };
