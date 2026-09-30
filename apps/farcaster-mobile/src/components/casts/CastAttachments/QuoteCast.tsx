import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ApiCastImageEmbed,
  ApiCastVideoEmbed,
  ApiMediaV2,
  ApiQuoteCastEmbed,
} from 'farcaster-client-data';
import {
  CastClickType,
  getCastSnap,
  processMediasForRendering,
  useHydratedQuoteCast,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import { RemoteImage } from 'farcaster-expo';
import React from 'react';
import { InteractionManager, PixelRatio, Pressable, View } from 'react-native';
import Animated, {
  AnimatedRef,
  measure,
  MeasuredDimensions,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { CastAvatar } from '~/components/casts/CastAvatar';
import { CastUsernameAndTimestamp } from '~/components/casts/CastUsernameAndTimestamp';
import { ScrollViewWithBackGesture } from '~/components/ScrollViewWithBackGesture';
import { SnapEmbedAttachment } from '~/components/Snap/SnapEmbedAttachment';
import { consumeRecentSnapLiftDismissal } from '~/components/Snap/snapLiftState';
import {
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/spaces/SpaceEmbedAttachment';
import { Text } from '~/components/Text';
import { useCastBodyTextStyle } from '~/constants/Cast';
import { imageRequestHeaders } from '~/constants/Images';
import { useDataSaver } from '~/contexts/DataSaverProvider';
import { useLightbox } from '~/contexts/LightboxProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useAnimatedImageFeedViewability } from '~/contexts/VideoFeedViewablilityProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePush } from '~/hooks/navigation/usePush';

// Fixed thumbnail dimension shared between the carousel ScrollView and its
// children. Hard-coding this on the wrapper (not just the children) keeps
// `contentSize.height === layoutHeight` so iOS cannot expose vertical
// pannability on recycled cells.
const QUOTE_CAST_CAROUSEL_HEIGHT = 128;

// Single cache-busted retry + stall watchdog; see CastImageThumbnail.
const MAX_QUOTE_IMAGE_RETRIES = 1;
const QUOTE_IMAGE_RETRY_DELAY_MS = 600;
const QUOTE_IMAGE_LOAD_WATCHDOG_MS = 5000;

const buildQuoteRetriedUri = (uri: string, retryAttempt: number): string => {
  if (retryAttempt <= 0) {
    return uri;
  }
  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}_r=${retryAttempt}`;
};

interface QuoteCastProps {
  cast: ApiQuoteCastEmbed;
  inversedTextColors?: boolean;
}

const QuoteCast: React.FC<QuoteCastProps> = ({
  cast,
  inversedTextColors = false,
}) => {
  const t = useTheme();
  const textStyles = useCastBodyTextStyle();
  const trackCastClick = useTrackCastClick();
  const push = usePush();
  const hydratedCast = useHydratedQuoteCast({ cast });

  const { regularCastByteLimit } = useUserAppContext();

  const author = React.useMemo(() => {
    return cast.author;
  }, [cast.author]);

  const quotedCastImageEmbeds = React.useMemo(() => {
    return hydratedCast.embeds?.images || [];
  }, [hydratedCast.embeds?.images]);

  const quoteCastVideoEmbeds = React.useMemo(() => {
    return hydratedCast.embeds?.videos || [];
  }, [hydratedCast.embeds?.videos]);

  const quotedCastSpaceEmbedUrls = React.useMemo(() => {
    return (hydratedCast.embeds?.urls || [])
      .map((urlEmbed) => urlEmbed.openGraph.url)
      .filter((url) => !!matchSpaceUrl(url));
  }, [hydratedCast.embeds?.urls]);

  // Prefers the new `embeds.snap` bucket (NEYN-10425), falls back to
  // walking `embeds.urls` for responses still on the legacy shape.
  const quotedCastSnap = React.useMemo(
    () => getCastSnap(hydratedCast.embeds),
    [hydratedCast.embeds],
  );

  const quotedCastText = React.useMemo(() => {
    const urls = hydratedCast.embeds?.urls || [];

    const urlEmbeds = urls.map((url) => url.openGraph.url) || [];

    let castText = hydratedCast.text;

    for (const url of urlEmbeds) {
      if (castText.endsWith(url)) {
        castText = castText.replace(url, '').trimEnd();
      }
    }

    const urlEmbedsWithoutInlineEmbeds = urlEmbeds.filter(
      (url) =>
        !quotedCastSpaceEmbedUrls.includes(url) &&
        // Strip the snap's source URL from the text so we don't render
        // both the snap card and a stray link to the same page.
        quotedCastSnap?.sourceUrl !== url,
    );

    const formattedUrlEmbeds = urlEmbedsWithoutInlineEmbeds.map((url) =>
      url.length > 30 ? `${url.substring(0, 27)}...` : url,
    );

    castText = [castText, ...formattedUrlEmbeds]
      .filter((castText) => typeof castText !== 'undefined' && castText !== '')
      .join(' ');

    return castText;
  }, [
    hydratedCast.embeds?.urls,
    hydratedCast.text,
    quotedCastSnap,
    quotedCastSpaceEmbedUrls,
  ]);

  const truncatedQuotedCastText = React.useMemo(() => {
    if (quotedCastText.length <= regularCastByteLimit) {
      return quotedCastText;
    }

    return quotedCastText.slice(0, regularCastByteLimit);
  }, [quotedCastText, regularCastByteLimit]);

  const shouldShowShowMoreIndicator = React.useMemo(() => {
    return (
      quotedCastImageEmbeds.length === 0 &&
      quoteCastVideoEmbeds.length === 0 &&
      quotedCastSpaceEmbedUrls.length === 0 &&
      !quotedCastSnap &&
      truncatedQuotedCastText === ''
    );
  }, [
    quoteCastVideoEmbeds.length,
    quotedCastImageEmbeds.length,
    quotedCastSpaceEmbedUrls.length,
    quotedCastSnap,
    truncatedQuotedCastText,
  ]);

  const hasAnyTextContentToShow = React.useMemo(() => {
    return shouldShowShowMoreIndicator || truncatedQuotedCastText !== '';
  }, [truncatedQuotedCastText, shouldShowShowMoreIndicator]);

  const isProUser = useUserLevel(author) === 'pro';

  return (
    <View style={[t.flex, t.flexCol, t.wFull]}>
      <Pressable
        onPress={() => {
          if (consumeRecentSnapLiftDismissal()) {
            return;
          }

          trackCastClick({ type: CastClickType.QuotedCast });

          push('Cast', { castHash: cast.hash });
        }}
      >
        <View
          style={[
            t.flexCol,
            t.pT3,
            !quotedCastSnap && quotedCastSpaceEmbedUrls.length === 0 && t.pB3,
          ]}
        >
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.pX3,
              { marginLeft: -0.5 },
            ]}
          >
            <CastAvatar avatarDiameter={20} user={author} />
            <View style={[t.flex1, t.mL1]}>
              <CastUsernameAndTimestamp
                fid={author.fid}
                username={author.username}
                timestamp={cast.timestamp}
                inversedTextColors={inversedTextColors}
                channel={cast.channel}
                isProUser={isProUser}
              />
            </View>
          </View>
          {hasAnyTextContentToShow && (
            <Text
              numberOfLines={5}
              style={[
                t.pX3,
                t.mT1,
                ...textStyles,
                shouldShowShowMoreIndicator
                  ? t.texts.tertiary
                  : inversedTextColors
                    ? { color: '#ffffff' }
                    : t.texts.primary,
              ]}
            >
              {shouldShowShowMoreIndicator
                ? 'Show more...'
                : truncatedQuotedCastText}
            </Text>
          )}
          {(quoteCastVideoEmbeds.length !== 0 ||
            quotedCastImageEmbeds.length !== 0) && (
            <ScrollViewWithBackGesture
              key={cast.hash}
              // Lock the carousel's *content* to the thumbnail height
              // (128) so contentSize.height === layoutHeight and iOS
              // can't expose vertical pannability on recycled FlashList
              // cells. Pin it on `contentContainerStyle` (not the outer
              // `style`) — putting the height on the outer ScrollView
              // through the doubly-wrapped Animated/GestureHandler
              // `AnimatedScrollView` causes child layout to collapse
              // for some quote-cast embeds (regression seen in the
              // feed where the image carousel area went blank).
              style={[t.wFull, t.flexRow, t.mT3, { gap: 8 }]}
              contentContainerStyle={[
                t.pX3,
                { gap: 8, height: QUOTE_CAST_CAROUSEL_HEIGHT },
              ]}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              removeClippedSubviews={false}
              directionalLockEnabled={true}
              alwaysBounceVertical={false}
            >
              {quoteCastVideoEmbeds.map((video, index) => (
                <QuoteCastVideoEmbed key={index} video={video} />
              ))}
              <QuoteCastImageEmbeds
                images={quotedCastImageEmbeds}
                castHash={cast.hash}
              />
            </ScrollViewWithBackGesture>
          )}
        </View>
      </Pressable>
      {quotedCastSnap && (
        // Sibling of the Pressable so snap taps don't race with the
        // quoted-cast navigation gesture.
        <View style={[t.pX3, t.pB3]}>
          <SnapEmbedAttachment
            snap={quotedCastSnap}
            castHash={cast.hash}
            castAuthorFid={cast.author.fid}
            enableLiftOnInteraction={true}
          />
        </View>
      )}
      {quotedCastSpaceEmbedUrls.length > 0 && (
        <View style={[t.pX3, t.pB3, { gap: 8 }]}>
          {quotedCastSpaceEmbedUrls.map((spaceUrl) => (
            <SpaceEmbedAttachment key={spaceUrl} url={spaceUrl} />
          ))}
        </View>
      )}
    </View>
  );
};

function QuoteCastVideoEmbed({ video }: { video: ApiCastVideoEmbed }) {
  const t = useTheme();

  return (
    <View
      style={[
        t.relative,
        {
          height: QUOTE_CAST_CAROUSEL_HEIGHT,
          width: QUOTE_CAST_CAROUSEL_HEIGHT,
        },
      ]}
    >
      <RemoteImage
        uri={video.thumbnailUrl}
        width={QUOTE_CAST_CAROUSEL_HEIGHT}
        height={QUOTE_CAST_CAROUSEL_HEIGHT}
        containerStyle={[
          t.borderHairline,
          { borderColor: t.colors.feed.threadLine },
          {
            borderRadius: 12,
          },
        ]}
        style={[
          {
            aspectRatio: 1,
            borderRadius: 12,
          },
        ]}
        cachePolicy="memory-disk"
        contentFit="cover"
        contentPosition="center"
      />
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
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyCenter,
            t.directCasts.bgImagePreview,
            t.h12,
            t.w12,
            t.roundedFull,
          ]}
        >
          <Ionicons
            name="play"
            size={24}
            style={[t.texts.light, { paddingLeft: 4 }]}
          />
        </View>
      </View>
    </View>
  );
}

function QuoteCastImageEmbeds({
  images,
  castHash,
}: {
  images: ApiCastImageEmbed[];
  castHash: string;
}) {
  const { openLightbox } = useLightbox();

  const mediaImageEmbeds = images.map((image) => {
    if (typeof image.media !== 'undefined') {
      return image.media as ApiMediaV2;
    }

    return {
      version: '2',
      staticRaster: image.url,
      height: 1000,
      width: 1000,
    } satisfies ApiMediaV2;
  });

  const imagesToRender = processMediasForRendering({
    medias: mediaImageEmbeds,
    pixelDensity: PixelRatio.get(),
    blockAnimated: false,
    useLowQualityImages: false,
  });

  const preloadImages = React.useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      Image.prefetch(
        imagesToRender.map((o) => o.original),
        {
          cachePolicy: 'memory-disk',
          headers: imageRequestHeaders,
        },
      );
    });
  }, [imagesToRender]);

  // There's no good way to attach distinct refs to each image, so we're
  // just hardcoding maximum embeds for now.
  const ref1 = useAnimatedRef<View>();
  const ref2 = useAnimatedRef<View>();
  const ref3 = useAnimatedRef<View>();
  const ref4 = useAnimatedRef<View>();

  const refs = [ref1, ref2, ref3, ref4].slice(0, images.length);

  const showLightbox = React.useCallback(
    (initialIndex: number) => {
      runOnUI(() => {
        'worklet';
        const rects: (MeasuredDimensions | null)[] = [];
        for (const ref of refs) {
          rects.push(measure(ref));
        }
        runOnJS(openLightbox)({
          images: imagesToRender.map((image, index) => ({
            ...image,
            rect: rects[index],
          })),
          index: initialIndex,
        });
      })();
    },
    [imagesToRender, openLightbox, refs],
  );

  return (
    <>
      {mediaImageEmbeds.map((media, index) => (
        <QuoteCastImageEmbed
          key={index}
          media={media}
          castHash={castHash}
          onPressIn={preloadImages}
          onPress={() => showLightbox(index)}
          ref={refs[index]}
        />
      ))}
    </>
  );
}
function QuoteCastImageEmbed({
  media,
  castHash,
  onPress,
  ref,
  onPressIn,
}: {
  media: ApiMediaV2;
  castHash: string;
  onPress: () => void;
  ref: AnimatedRef<View>;
  onPressIn: () => void;
}) {
  const t = useTheme();

  const { activeLightboxRef } = useLightbox();
  const { shouldLoadLowerQualityImages: useLowQualityImages } = useDataSaver();

  const image = React.useMemo(() => {
    const pixelDensity = PixelRatio.get();

    return processMediasForRendering({
      medias: [media],
      pixelDensity,
      blockAnimated: false,
      useLowQualityImages,
    })[0];
  }, [media, useLowQualityImages]);

  // Gate animation by feed viewability; see CastImageThumbnail.
  const imageRef = React.useRef<Image>(null);
  const shouldAnimateRef = React.useRef(false);

  const startAnimating = React.useCallback(() => {
    shouldAnimateRef.current = true;
    imageRef.current?.startAnimating();
  }, []);

  const stopAnimating = React.useCallback(() => {
    shouldAnimateRef.current = false;
    imageRef.current?.stopAnimating();
  }, []);

  // Gate every quote-cast thumbnail regardless of mimeType; see
  // CastImageThumbnail for why mime-based detection is unreliable.
  const animationGatedByViewability = useAnimatedImageFeedViewability({
    castHash,
    start: startAnimating,
    stop: stopAnimating,
    enabled: true,
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: activeLightboxRef.value === image.original ? withTiming(0) : 1,
    };
  });

  const [retryAttempt, setRetryAttempt] = React.useState(0);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const retryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const watchdogTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scheduleRetry = React.useCallback((reason: 'error' | 'stall') => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryTimeoutRef.current = setTimeout(
      () => {
        setRetryAttempt((previous) => previous + 1);
      },
      reason === 'stall' ? 0 : QUOTE_IMAGE_RETRY_DELAY_MS,
    );
  }, []);

  React.useEffect(() => {
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

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (hasLoaded) {
      return;
    }
    if (retryAttempt >= MAX_QUOTE_IMAGE_RETRIES) {
      return;
    }
    if (watchdogTimeoutRef.current) {
      clearTimeout(watchdogTimeoutRef.current);
    }
    watchdogTimeoutRef.current = setTimeout(() => {
      DdRum.addAction(RumActionType.CUSTOM, 'image-stalled-on-feed', {
        imageUrl: image.thumbnail,
        retryAttempt,
        source: 'quote-cast',
      });
      scheduleRetry('stall');
    }, QUOTE_IMAGE_LOAD_WATCHDOG_MS);
    return () => {
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
    };
  }, [hasLoaded, image.thumbnail, retryAttempt, scheduleRetry]);

  const handleImageError = React.useCallback(
    (error: { error?: string } | undefined) => {
      DdRum.addAction(RumActionType.CUSTOM, 'image-failed-to-load-on-feed', {
        error: error?.error,
        imageUrl: image.thumbnail,
        retryAttempt,
        source: 'quote-cast',
      });

      if (retryAttempt >= MAX_QUOTE_IMAGE_RETRIES) {
        return;
      }

      scheduleRetry('error');
    },
    [image.thumbnail, retryAttempt, scheduleRetry],
  );

  const handleImageLoad = React.useCallback(() => {
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

  const sourceUri = React.useMemo(
    () => buildQuoteRetriedUri(image.thumbnail, retryAttempt),
    [image.thumbnail, retryAttempt],
  );

  return (
    <Animated.View
      style={[
        { borderColor: t.colors.feed.threadLine },
        { borderRadius: 12, overflow: 'hidden' },
        animatedStyle,
      ]}
    >
      <Pressable ref={ref} onPress={onPress} onPressIn={onPressIn}>
        <Image
          ref={imageRef}
          source={{ uri: sourceUri, headers: imageRequestHeaders }}
          recyclingKey={image.thumbnail}
          style={[
            {
              width: QUOTE_CAST_CAROUSEL_HEIGHT,
              height: QUOTE_CAST_CAROUSEL_HEIGHT,
              aspectRatio: 1,
            },
          ]}
          cachePolicy="memory-disk"
          contentFit="cover"
          contentPosition="center"
          transition={150}
          autoplay={!animationGatedByViewability}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </Pressable>
    </Animated.View>
  );
}

export { QuoteCast };
