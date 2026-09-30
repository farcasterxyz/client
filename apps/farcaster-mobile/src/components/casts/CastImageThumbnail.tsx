import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ApiMediaV2 } from 'farcaster-client-data';
import {
  processMediasForRendering,
  useTelemetry,
} from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PixelRatio, Pressable, TouchableOpacity, View } from 'react-native';
import Animated, {
  AnimatedRef,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '~/components/Text';
import { imageRequestHeaders } from '~/constants/Images';
import { useComposerOptimisticImages } from '~/contexts/ComposerOptimisticImagesProvider';
import { useDataSaver } from '~/contexts/DataSaverProvider';
import { useLightbox } from '~/contexts/LightboxProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useAnimatedImageFeedViewability } from '~/contexts/VideoFeedViewablilityProvider';

type CastImageThumbnailsProps = {
  media: ApiMediaV2;
  castHash?: string;
  slimQuoteCastEmbed?: boolean;
  quoteCastEmbed?: boolean;
  focusedCastEmbed?: boolean;
  height?: number;
  width?: number;
  maxWidth?: number;
  maxWidthToApplyForHighAr: number;
  ignoreAspectRatio?: boolean;
  carouselIndex?: number;
  onPressIn: () => void;
  onPress: () => void;
  ref: AnimatedRef<View>;
};

const TOO_WIDE_ASPECT_RATIO_TARGET = 3.5;

// Single cache-busted retry + stall watchdog for expo-image silent stalls
// (neither onLoad nor onError fires after cache eviction / native loader stuck).
const MAX_IMAGE_RETRIES = 1;
const IMAGE_RETRY_DELAY_MS = 600;
const IMAGE_LOAD_WATCHDOG_MS = 5000;

const buildRetriedUri = (uri: string, retryAttempt: number): string => {
  if (retryAttempt <= 0) {
    return uri;
  }
  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}_r=${retryAttempt}`;
};

const CastImageThumbnail: FC<CastImageThumbnailsProps> = memo(
  ({
    media,
    castHash,
    height,
    width,
    maxWidth,
    maxWidthToApplyForHighAr,
    ignoreAspectRatio,
    onPressIn,
    onPress,
    ref,
  }) => {
    const telemetry = useTelemetry();
    const t = useTheme();

    const { shouldLoadLowerQualityImages: useLowQualityImages } =
      useDataSaver();
    const { images } = useComposerOptimisticImages();

    const image = React.useMemo(() => {
      const startTime = Date.now();
      const pixelDensity = PixelRatio.get();

      const composerImage = images.find(
        (image) => media.staticRaster === image.imageUrl,
      );

      let result;
      if (typeof composerImage !== 'undefined' && composerImage !== null) {
        result = {
          aspectRatio: composerImage.aspectRatio,
          original: composerImage.imageUrl,
          thumbnail: composerImage.previewUrl,
          width: 0,
        };
      } else {
        result = processMediasForRendering({
          medias: [media],
          pixelDensity,
          blockAnimated: false,
          useLowQualityImages,
        })[0];
      }

      const endTime = Date.now();
      telemetry.maybeAddFrameDroppingAction(
        'farcaster-mobile.CastImageThumbnail.processMediasForRendering',
        endTime - startTime,
      );
      return result;
    }, [images, media, useLowQualityImages, telemetry]);

    // Gate GIF/animated-WebP frame decoding by feed viewability: render with
    // autoplay={false} and start/stop the native animation as the cast
    // enters/leaves the viewport. expo-image's Android implementation only
    // consults `autoplay` at resource-ready time, so runtime control has to
    // go through the imperative startAnimating/stopAnimating API.
    const imageRef = useRef<Image>(null);
    const shouldAnimateRef = useRef(false);

    const startAnimating = useCallback(() => {
      shouldAnimateRef.current = true;
      imageRef.current?.startAnimating();
    }, []);

    const stopAnimating = useCallback(() => {
      shouldAnimateRef.current = false;
      imageRef.current?.stopAnimating();
    }, []);

    // Gate every feed thumbnail, not just mime-identified GIFs: backend
    // mimeType is unreliable (old casts report image/jpeg for animated
    // media) and URL-only embeds (e.g. Tenor GIFs) synthesize media with no
    // mimeType at all. autoplay={false} and start/stop are no-ops on static
    // images, so over-gating costs nothing.
    const animationGatedByViewability = useAnimatedImageFeedViewability({
      castHash,
      start: startAnimating,
      stop: stopAnimating,
      enabled: true,
    });

    const { activeLightboxRef } = useLightbox();

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: activeLightboxRef.value === image.original ? withTiming(0) : 1,
      };
    });

    const [retryAttempt, setRetryAttempt] = useState(0);
    const [hasLoaded, setHasLoaded] = useState(false);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const watchdogTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    const scheduleRetry = useCallback((reason: 'error' | 'stall') => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = setTimeout(
        () => {
          setRetryAttempt((previous) => previous + 1);
        },
        reason === 'stall' ? 0 : IMAGE_RETRY_DELAY_MS,
      );
    }, []);

    useEffect(() => {
      setRetryAttempt(0);
      setHasLoaded(false);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
    }, [image.thumbnail]);

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

    useEffect(() => {
      if (hasLoaded) {
        return;
      }
      if (retryAttempt >= MAX_IMAGE_RETRIES) {
        return;
      }
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
      }
      watchdogTimeoutRef.current = setTimeout(() => {
        DdRum.addAction(RumActionType.CUSTOM, 'image-stalled-on-feed', {
          imageUrl: image.thumbnail,
          retryAttempt,
        });
        scheduleRetry('stall');
      }, IMAGE_LOAD_WATCHDOG_MS);
      return () => {
        if (watchdogTimeoutRef.current) {
          clearTimeout(watchdogTimeoutRef.current);
          watchdogTimeoutRef.current = null;
        }
      };
    }, [hasLoaded, image.thumbnail, retryAttempt, scheduleRetry]);

    const handleImageError = useCallback(
      (error: { error?: string } | undefined) => {
        DdRum.addAction(RumActionType.CUSTOM, 'image-failed-to-load-on-feed', {
          error: error?.error,
          imageUrl: image.thumbnail,
          retryAttempt,
        });

        if (retryAttempt >= MAX_IMAGE_RETRIES) {
          return;
        }

        scheduleRetry('error');
      },
      [image.thumbnail, retryAttempt, scheduleRetry],
    );

    const handleImageLoad = useCallback(() => {
      setHasLoaded(true);
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
      // autoplay={false} halts the animation at resource-ready; if the cast
      // became viewable while the image was still loading, resume it now.
      if (shouldAnimateRef.current) {
        imageRef.current?.startAnimating();
      }
    }, []);

    const sourceUri = useMemo(
      () => buildRetriedUri(image.thumbnail, retryAttempt),
      [image.thumbnail, retryAttempt],
    );

    // Used to center the image when the width is too wide
    const marginLeft = useMemo(() => {
      if (!maxWidth || !height) {
        return 0;
      }

      const relativeWidth = height * image.aspectRatio;
      const offset = (maxWidth - relativeWidth) / 2;

      return offset < 0 ? offset : 0;
    }, [height, image.aspectRatio, maxWidth]);

    return (
      <Animated.View
        style={[
          t.bgElevated,
          { borderRadius: 12 },
          { borderColor: t.colors.feed.threadLine },
          t.border,
          t.overflowHidden,
          { alignSelf: 'flex-start' },
          animatedStyle,
        ]}
      >
        <Pressable
          ref={ref}
          onPress={onPress}
          onPressIn={onPressIn}
          style={[
            {
              maxHeight: height,
              // Pin to `height` (not undefined) on the carousel/vertical-media
              // path; otherwise the inner Image's `100%` resolves to 0 on
              // recycled FlashList cells and the slot stays blank.
              height:
                ignoreAspectRatio || typeof width === 'undefined'
                  ? height
                  : undefined,
              width,
              maxWidth:
                image.aspectRatio >= TOO_WIDE_ASPECT_RATIO_TARGET
                  ? maxWidthToApplyForHighAr
                  : maxWidth,
            },
          ]}
        >
          <Image
            ref={imageRef}
            source={{
              uri: sourceUri,
              headers: imageRequestHeaders,
            }}
            recyclingKey={image.thumbnail}
            cachePolicy="memory-disk"
            transition={150}
            autoplay={!animationGatedByViewability}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={[
              {
                height: typeof width !== 'undefined' ? undefined : '100%',
                width: typeof width !== 'undefined' ? width : undefined,
                aspectRatio: image.aspectRatio,
                marginLeft,
              },
            ]}
          />
          {image.mimeType === 'image/gif' && useLowQualityImages && (
            <View
              style={[
                t.wFull,
                t.hFull,
                t.absolute,
                t.justifyCenter,
                t.itemsCenter,
                t.flex,
                t.flexCol,
              ]}
            >
              <TouchableOpacity
                style={[
                  t.flex,
                  t.flexRow,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.directCasts.bgImagePreview,
                  t.h12,
                  t.w12,
                  { maxWidth: sizes.s18 },
                  t.roundedFull,
                ]}
                activeOpacity={0.75}
                disabled={true}
              >
                <Ionicons
                  name="play"
                  size={24}
                  style={[t.texts.light, { paddingLeft: 4 }]}
                />
              </TouchableOpacity>
              <View
                style={[
                  t.absolute,
                  t.bottom0,
                  t.right0,
                  t.mR2,
                  t.mB2,
                  t.bgBlack,
                  t.opacity50,
                  t.rounded,
                  t.pX2,
                  t.pY1,
                ]}
              >
                <Text style={[t.texts.light, t.textXs, t.fontMedium]}>GIF</Text>
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  },
);

CastImageThumbnail.displayName = 'CastImageThumbnail';

export { CastImageThumbnail };
