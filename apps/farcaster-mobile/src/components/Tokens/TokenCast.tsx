import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastImageEmbed,
  ApiMediaV2,
  ApiTokenLink,
} from 'farcaster-client-data';
import {
  CastReactionType,
  formatShorthandNumber,
  formatTimeAgo,
  processMediasForRendering,
  resolveUsernameShort,
  UpdateCastLikeError,
  useCreateCastLike,
  useDeleteCastLike,
  useGloballyCachedCast,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  FarcasterProBadge,
  formatTokenDecimals,
  hitSlop,
  isSameAsset,
  parseTokenAmount,
  TextWithPress,
  useHaptics,
} from 'farcaster-expo';
import { Heart } from 'lucide-react-native';
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
import Svg, { Path } from 'react-native-svg';

import { FeedCastBody } from '~/components/casts/CastBody';
import { ScrollViewWithBackGesture } from '~/components/ScrollViewWithBackGesture';
import { Text2 } from '~/components/Text';
import { imageRequestHeaders } from '~/constants/Images';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDataSaver } from '~/contexts/DataSaverProvider';
import { useLightbox } from '~/contexts/LightboxProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useCastBody } from '~/hooks/useCastBody';
import { trackError } from '~/utils/ErrorUtils';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

interface TokenCastProps {
  cast: ApiCast;
  token: ApiTokenLink;
}

const TokenCast: React.FC<TokenCastProps> = ({ cast: fallbackCast, token }) => {
  const t = useTheme();
  const cast = useGloballyCachedCast({ fallback: fallbackCast });
  const { trackEvent } = useAnalytics();
  const push = usePush();
  const pushToUserProfile = usePushToUserProfile();
  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  const author = React.useMemo(() => {
    return cast.author;
  }, [cast.author]);

  const imageEmbeds = React.useMemo(() => {
    return cast.embeds?.images || [];
  }, [cast.embeds?.images]);

  const linkEmbeds = React.useMemo(() => {
    return cast.embeds?.urls || [];
  }, [cast.embeds?.urls]);

  const reacted = cast.viewerContext?.reacted || false;
  const reactionCount = cast.reactions?.count || 0;
  const isProUser = useUserLevel(author) === 'pro';

  const createCastLike = useCreateCastLike();
  const deleteCastLike = useDeleteCastLike();
  const trackCastReaction = useTrackCastReaction();
  const isSubmitting = React.useRef(false);

  const { triggerImpactAsync } = useHaptics();

  const handleLike = React.useCallback(async () => {
    if (isSubmitting.current) {
      return;
    }
    trackCastReaction({
      castHash: cast.hash,
      type: CastReactionType.Like,
      undo: reacted,
      castFid: cast.author.fid,
      chain: token.chain,
      ca: token.ca,
      feed: 'token',
    });
    isSubmitting.current = true;

    if (!reacted) {
      triggerImpactAsync();
    }

    try {
      if (reacted) {
        try {
          await deleteCastLike({ cast });
        } catch (error) {
          trackError(
            new UpdateCastLikeError({
              error,
              castHash: cast.hash,
            }),
          );
        }
      } else {
        try {
          await createCastLike({ cast });
        } catch (error) {
          trackError(
            new UpdateCastLikeError({
              error,
              castHash: cast.hash,
            }),
          );
        }
      }
    } finally {
      isSubmitting.current = false;
    }
  }, [
    cast,
    createCastLike,
    deleteCastLike,
    reacted,
    triggerImpactAsync,
    trackCastReaction,
    token.ca,
    token.chain,
  ]);

  const { bodyWithLinks, isTruncatedCastText, castText } = useCastBody({
    cast,
    isFocusedCast: false,
    skipTruncate: false,
    composerMode: false,
  });

  const handleProfileTap = React.useCallback(() => {
    pushToUserProfile({ fid: cast.author.fid });
  }, [pushToUserProfile, cast.author.fid]);

  const handleCastTap = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ViewTokenCast, {
      castHash: cast.hash,
      type: 'swap',
      via: 'token_screen',
    });

    push('Cast', { castHash: cast.hash });
  }, [push, cast.hash, trackEvent]);

  const { verb, value } = React.useMemo(() => {
    const tx = cast.embeds?.transactions?.[0];
    if (!tx) {
      return { verb: 'unknown', value: 0 };
    }

    const sellQuantity = parseTokenAmount(
      tx.sellAmount,
      formatTokenDecimals(tx.sellToken.chain, tx.sellToken.decimals),
    );
    const sellValue = sellQuantity * (tx.sellToken.priceUsd ?? 0);

    const buyQuantity = parseTokenAmount(
      tx.buyAmount,
      formatTokenDecimals(tx.buyToken.chain, tx.buyToken.decimals),
    );
    const buyValue = buyQuantity * (tx.buyToken.priceUsd ?? 0);

    const isBuy = isSameAsset({
      chain: tx.buyToken.chain,
      ca: tx.buyToken.ca,
      asset: token,
    });

    if (isBuy) {
      return {
        verb: 'bought',
        value: buyValue,
      };
    } else {
      return {
        verb: 'sold',
        value: sellValue,
      };
    }
  }, [cast, token]);

  return (
    <Pressable
      style={[t.flexRow, t.p3, { gap: 12 }]}
      onPress={handleCastTap}
      hitSlop={hitSlop}
    >
      <Pressable onPress={handleProfileTap} hitSlop={hitSlop}>
        <Avatar
          diameter={38}
          pfpUrl={cast.author.pfp?.url}
          isHighlighted={false}
          blockAnimated
        />
      </Pressable>
      <View style={[t.flex1, t.flexCol, { gap: 6 }]}>
        <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            {token.source?.creator?.fid === cast.author.fid && <CreatorBadge />}
            <Pressable onPress={handleProfileTap}>
              <Text2 weight="medium">
                {resolveUsernameShort({
                  username: cast.author.username,
                  fid: cast.author.fid,
                })}
              </Text2>
            </Pressable>
            {isProUser && (
              <FarcasterProBadge size={14} color={t.colors.text.brand} />
            )}
            {verb !== 'unknown' && (
              <>
                <Text2 color="secondary" weight="medium">
                  {verb}
                </Text2>
                <Text2
                  style={
                    verb === 'bought'
                      ? { color: t.colors.green450 }
                      : { color: t.colors.red500 }
                  }
                  weight="medium"
                >
                  {value < 0.01
                    ? '$0.01'
                    : `$${value.toLocaleString(undefined, {
                        minimumFractionDigits: value >= 100 ? 0 : 2,
                        maximumFractionDigits: value >= 100 ? 0 : 2,
                      })}`}
                </Text2>
              </>
            )}
            <Text2 weight="medium" size="sm" color="tertiary">
              {formatTimeAgo(cast.timestamp, 'floor')}
            </Text2>
          </View>
        </View>

        {castText !== '' && (
          <FeedCastBody
            key={cast.hash}
            bodyWithLinks={bodyWithLinks}
            isFocusedCast={false}
            isTruncatedCastText={isTruncatedCastText}
            onShowMorePress={() => {}}
            skipShowMoreCTA={true}
          />
        )}
        {linkEmbeds.map((link) => (
          <TextWithPress
            key={`link-${link.openGraph.url}`}
            style={[t.texts.brand]}
            onPress={() => {
              possiblyNavigateOrOpenUrl({ url: link.openGraph.url });
            }}
          >
            {link.openGraph.url}
          </TextWithPress>
        ))}
        {imageEmbeds.length !== 0 && (
          <ScrollViewWithBackGesture
            style={[t.wFull, t.flexRow, t.mT1, { gap: 8 }]}
            contentContainerStyle={[{ gap: 8 }]}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={false}
            directionalLockEnabled={true}
          >
            <QuoteCastImageEmbeds images={imageEmbeds} />
          </ScrollViewWithBackGesture>
        )}
      </View>

      <View style={[t.itemsCenter, { width: 28 }]}>
        <AnimatedPressable
          onPress={handleLike}
          style={[t.itemsCenter, { gap: 2 }]}
          hitSlop={hitSlop}
        >
          <Heart
            size={18}
            color={reacted ? t.colors.red500 : t.colors.text.tertiary}
            fill={reacted ? t.colors.red500 : 'transparent'}
          />
          {reactionCount > 0 && (
            <Text2 color="tertiary" size="xs" weight="medium">
              {formatShorthandNumber(reactionCount)}
            </Text2>
          )}
        </AnimatedPressable>
      </View>
    </Pressable>
  );
};

function QuoteCastImageEmbeds({ images }: { images: ApiCastImageEmbed[] }) {
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
  onPress,
  ref,
  onPressIn,
}: {
  media: ApiMediaV2;
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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: activeLightboxRef.value === image.original ? withTiming(0) : 1,
    };
  });

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
          source={{ uri: image.thumbnail, headers: imageRequestHeaders }}
          style={[
            {
              width: 128,
              height: 128,
              aspectRatio: 1,
            },
          ]}
          cachePolicy="memory-disk"
          contentFit="cover"
          contentPosition="center"
        />
      </Pressable>
    </Animated.View>
  );
}

function CreatorBadge() {
  return (
    <Svg width="17" height="16" viewBox="0 0 17 16" fill="none">
      <Path
        d="M10.708 8.41104C10.7521 8.27584 10.8382 8.15826 10.9539 8.07545C11.0695 7.99265 11.2085 7.94895 11.3507 7.95074C11.4929 7.95252 11.6308 7.9997 11.7443 8.08539C11.8578 8.17108 11.9409 8.29079 11.9816 8.42705L12.4733 9.39573C12.5211 9.4899 12.5906 9.57136 12.6761 9.63341C12.7616 9.69546 12.8606 9.73633 12.965 9.75265L14.0551 9.92344C14.1954 9.92399 14.332 9.9688 14.4455 10.0515C14.5589 10.1342 14.6433 10.2506 14.6868 10.384C14.7303 10.5175 14.7305 10.6613 14.6875 10.7949C14.6445 10.9285 14.5605 11.0452 14.4473 11.1283L13.6654 11.9075C13.5906 11.982 13.5345 12.0733 13.5018 12.1737C13.4691 12.2741 13.4607 12.3809 13.4773 12.4852L13.6501 13.5613C13.6976 13.6962 13.7006 13.8428 13.6585 13.9794C13.6164 14.1161 13.5315 14.2356 13.4163 14.3204C13.3011 14.4052 13.1618 14.4507 13.0188 14.4502C12.8758 14.4498 12.7367 14.4033 12.622 14.3179L11.6447 13.8175C11.5505 13.7693 11.4463 13.7441 11.3405 13.7441C11.2347 13.7441 11.1304 13.7693 11.0363 13.8175L10.0589 14.3179C9.94429 14.4026 9.80551 14.4485 9.66294 14.4486C9.52036 14.4488 9.38148 14.4033 9.26666 14.3188C9.15185 14.2342 9.06713 14.1151 9.02493 13.9789C8.98274 13.8428 8.98528 13.6966 9.0322 13.562L9.20432 12.4859C9.22094 12.3816 9.21255 12.2748 9.17984 12.1744C9.14713 12.0739 9.09104 11.9827 9.01618 11.9082L8.24498 11.139C8.128 11.0579 8.04 10.9416 7.99384 10.807C7.94768 10.6724 7.94577 10.5265 7.98839 10.3907C8.03102 10.255 8.11594 10.1364 8.23076 10.0523C8.34558 9.96824 8.48427 9.92308 8.62658 9.92344L9.71601 9.75265C9.82037 9.73633 9.91936 9.69546 10.0048 9.63341C10.0903 9.57136 10.1598 9.4899 10.2077 9.39573L10.708 8.41104Z"
        stroke="#4B97F7"
        stroke-width="1.33427"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M5.33714 10.0015H4.67C3.96226 10.0015 3.28351 10.2826 2.78306 10.7831C2.28261 11.2835 2.00146 11.9623 2.00146 12.67V14.0043"
        stroke="#4B97F7"
        stroke-width="1.33427"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M6.67147 7.33293C8.14526 7.33293 9.34001 6.13818 9.34001 4.66439C9.34001 3.19059 8.14526 1.99585 6.67147 1.99585C5.19767 1.99585 4.00293 3.19059 4.00293 4.66439C4.00293 6.13818 5.19767 7.33293 6.67147 7.33293Z"
        stroke="#4B97F7"
        stroke-width="1.33427"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </Svg>
  );
}

export { TokenCast };
