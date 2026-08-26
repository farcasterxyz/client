import { Ionicons } from '@expo/vector-icons';
import { ApiCastUrlEmbed } from 'farcaster-client-data';
import {
  CastClickType,
  formatTimeAgo,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import { Avatar, RemoteImage, useHaptics } from 'farcaster-expo';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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

import { XTopHatIcon } from '~/components/images/XTopHatIcon';
import { Text } from '~/components/Text';
import {
  bodyFontSize,
  bodyLineHeight,
  useCastBodyTextStyle,
} from '~/constants/Cast';
import { useLightbox } from '~/contexts/LightboxProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

// Fixed thumbnail dimension shared between the carousel ScrollView and its
// children. Hard-coding this on the wrapper (not just the children) keeps
// `contentSize.height === layoutHeight` so iOS cannot expose vertical
// pannability on recycled cells.
const QUOTE_TWEET_CAROUSEL_HEIGHT = 128;

interface QuoteTweetProps {
  url: string;
  title: string;
  tweet: string;
  skipWrapperStyles?: boolean;
  variant?: 'default' | 'direct-cast';
  tweetPayload?: ApiCastUrlEmbed['tweet'];
  disabled?: boolean;
}

const QuoteTweet: React.FC<QuoteTweetProps> = ({
  url,
  title,
  tweet,
  tweetPayload,
  disabled,
}) => {
  if (
    typeof tweetPayload !== 'undefined' &&
    typeof tweetPayload.payloadV2 !== 'undefined'
  ) {
    const tweet = convertTweet(tweetPayload.payloadV2);

    if (tweet) {
      return <QuoteTweetV2 url={url} tweet={tweet} disabled={disabled} />;
    }
  }

  return (
    <QuoteTweetV1 url={url} title={title} tweet={tweet} disabled={disabled} />
  );
};

function QuoteTweetV2({
  url,
  tweet,
  disabled,
}: {
  url: string;
  tweet: ParsedTweetPayload;
  disabled?: boolean;
}) {
  const t = useTheme();

  const textStyles = useCastBodyTextStyle();

  const trackCastClick = useTrackCastClick();

  const { triggerImpactAsync } = useHaptics();

  const navigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  return (
    <Pressable
      style={[
        t.flex,
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.flexCol,
        t.wFull,
        t.pY3,
        t.relative,
      ]}
      onPress={() => {
        if (disabled) {
          return;
        }

        trackCastClick({ type: CastClickType.ExtLink });

        triggerImpactAsync();

        navigateOrOpenUrl({ url });
      }}
    >
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          { marginLeft: 11.5, marginRight: 12 },
        ]}
      >
        <View
          style={[
            t.flex1,
            t.flexRow,
            t.itemsCenter,
            t.overflowHidden,
            { gap: 4 },
          ]}
        >
          <Avatar pfpUrl={tweet.avatar} blockAnimated={true} diameter={20} />
          <Text
            numberOfLines={1}
            style={[...textStyles, t.fontSemibold, t.texts.primary]}
          >
            {tweet.displayName}
          </Text>
          {/* <Text numberOfLines={1} style={[...textStyles, t.texts.tertiary]}>
            @{tweet.username}
          </Text> */}
          <Text style={[...textStyles, t.texts.tertiary]}>
            {tweet.createdAtDisplay}
          </Text>
        </View>
        <XTopHatIcon color={t.colors.text.primary} size={12} />
      </View>
      {tweet.text.length !== 0 && (
        <Text
          numberOfLines={10}
          style={[t.pX3, t.mT1, ...textStyles, t.texts.primary]}
        >
          {tweet.text}
        </Text>
      )}
      {tweet.attachments.length !== 0 && (
        <ScrollView
          // Lock the carousel's *content* to the thumbnail height
          // (128) so contentSize.height === layoutHeight and iOS can't
          // expose vertical pannability on recycled FlashList cells.
          // Pin it on `contentContainerStyle` (not the outer `style`)
          // for parity with QuoteCast.tsx — putting the height on the
          // outer ScrollView caused child layout to collapse and the
          // carousel area went blank in some embeds.
          style={[t.wFull, t.flexRow, t.mT3, { gap: 8 }]}
          contentContainerStyle={[
            t.pX3,
            { gap: 8, height: QUOTE_TWEET_CAROUSEL_HEIGHT },
          ]}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          removeClippedSubviews={false}
          directionalLockEnabled={true}
        >
          {tweet.attachments
            .filter((o) => o.type === 'video')
            .map((video, index) => (
              <QuoteTweetVideoEmbed key={index} video={video} />
            ))}
          <QuoteTweetImageEmbeds
            images={tweet.attachments.filter((o) => o.type === 'photo')}
          />
        </ScrollView>
      )}
    </Pressable>
  );
}

function QuoteTweetImageEmbeds({ images }: { images: Attachment[] }) {
  const { openLightbox } = useLightbox();

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
          images: images.map((image, index) => ({
            width: image.width ?? 128,
            rect: rects[index],
            thumbnail: image.url,
            original: image.url,
            aspectRatio:
              image.width && image.height ? image.width / image.height : 1,
          })),
          index: initialIndex,
        });
      })();
    },
    [images, openLightbox, refs],
  );

  return (
    <>
      {images.map((image, index) => (
        <QuoteTweetImageEmbed
          key={index}
          image={image}
          onPress={() => showLightbox(index)}
          ref={refs[index]}
        />
      ))}
    </>
  );
}

function QuoteTweetVideoEmbed({ video }: { video: Attachment }) {
  const t = useTheme();

  return (
    <View
      style={[
        t.relative,
        {
          height: QUOTE_TWEET_CAROUSEL_HEIGHT,
          width: QUOTE_TWEET_CAROUSEL_HEIGHT,
        },
      ]}
    >
      <RemoteImage
        uri={video.url}
        width={QUOTE_TWEET_CAROUSEL_HEIGHT}
        height={QUOTE_TWEET_CAROUSEL_HEIGHT}
        containerStyle={[
          t.borderHairline,
          t.borderDesignSystemDefault,
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

function QuoteTweetImageEmbed({
  image,
  onPress,
  ref,
}: {
  image: Attachment;
  onPress: () => void;
  ref: AnimatedRef<View>;
}) {
  const t = useTheme();

  const { activeLightboxRef } = useLightbox();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: activeLightboxRef.value === image.url ? withTiming(0) : 1,
    };
  });

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        style={[
          t.relative,
          {
            height: QUOTE_TWEET_CAROUSEL_HEIGHT,
            width: QUOTE_TWEET_CAROUSEL_HEIGHT,
          },
        ]}
        onPress={onPress}
        ref={ref}
      >
        <RemoteImage
          uri={image.url}
          width={QUOTE_TWEET_CAROUSEL_HEIGHT}
          height={QUOTE_TWEET_CAROUSEL_HEIGHT}
          containerStyle={[
            t.borderHairline,
            t.borderDesignSystemDefault,
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
      </Pressable>
    </Animated.View>
  );
}

function QuoteTweetV1({ url, title, tweet, disabled }: QuoteTweetProps) {
  const t = useTheme();
  const trackCastClick = useTrackCastClick();
  const textStyles = useCastBodyTextStyle();
  const navigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  const titleFormatted = React.useMemo(() => {
    return title.indexOf('on Twitter') !== -1
      ? title.split('on Twitter')[0]
      : title.split('on X')[0];
  }, [title]);

  const displayNameFromTitleFormatted = React.useMemo(() => {
    return titleFormatted.indexOf(' (@') !== -1
      ? titleFormatted.split(' (@')[0]
      : titleFormatted;
  }, [titleFormatted]);

  const usernameFromTitleFormatted = React.useMemo(() => {
    return titleFormatted.indexOf(' (@') !== -1
      ? titleFormatted.split(' (@')[1].split(')')[0]
      : undefined;
  }, [titleFormatted]);

  return (
    <Pressable
      style={[
        t.flex,
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.flexRow,
        t.wFull,
      ]}
      onPress={() => {
        if (disabled) {
          return;
        }

        trackCastClick({ type: CastClickType.ExtLink });

        navigateOrOpenUrl({ url });
      }}
    >
      <View style={[t.flexCol, t.pB3, t.pT2, t.flexShrink, t.flexGrow]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <View style={[t.roundedSm, t.mL3]}>
            <XTopHatIcon size={12} color={t.colors.text.secondary} />
          </View>
          <Text
            style={[
              t.mL1,
              t.texts.primary,
              t.fontSemibold,
              { lineHeight: bodyLineHeight, fontSize: bodyFontSize },
              { maxWidth: '90%' },
            ]}
            numberOfLines={1}
          >
            {displayNameFromTitleFormatted}{' '}
            {typeof usernameFromTitleFormatted !== 'undefined' && (
              <Text
                style={[
                  ...textStyles,
                  t.fontNormal,
                  {
                    color: t.colors.feed.muted,
                  },
                ]}
              >
                @{usernameFromTitleFormatted}
              </Text>
            )}
          </Text>
        </View>
        <Text style={[t.pX3, ...textStyles, t.texts.primary]} numberOfLines={5}>
          {tweet}
        </Text>
      </View>
    </Pressable>
  );
}

export { QuoteTweet };

type MediaType = 'photo' | 'video' | 'animated_gif';

interface RawMedia {
  media_url_https?: string;
  url?: string;
  type?: MediaType;
  original_info?: { width?: number; height?: number };
}

interface RawTweetUser {
  name: string;
  screen_name: string;
  profile_image_url_https: string;
}

interface RawTweet {
  id_str: string;
  text: string;
  created_at: string;
  user: RawTweetUser;
  mediaDetails?: RawMedia[];
  extended_entities?: { media?: RawMedia[] };
  entities?: { media?: RawMedia[] };
}

export interface Attachment {
  url: string;
  type: MediaType;
  width?: number;
  height?: number;
}

export interface ParsedTweetPayload {
  id: string;
  text: string;
  displayName: string;
  username: string;
  avatar: string;
  createdAtDisplay: string;
  attachments: Attachment[];
}

const htmlDecode = (s: string): string =>
  s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (_, e) => {
    if (e[0] === '#') {
      const code =
        e[1].toLowerCase() === 'x'
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10);
      return String.fromCharCode(code);
    }
    const map: Record<string, string> = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
      nbsp: '\u00A0',
    };
    return map[e] ?? _;
  });

const isRawTweet = (o: unknown): o is RawTweet => {
  if (typeof o !== 'object' || !o) {
    return false;
  }
  const t = o as Partial<RawTweet>;
  return (
    typeof t.id_str === 'string' &&
    typeof t.text === 'string' &&
    t.user !== undefined &&
    typeof t.user.name === 'string' &&
    typeof t.user.screen_name === 'string' &&
    typeof t.user.profile_image_url_https === 'string'
  );
};

const convertTweet = (input: string | unknown): ParsedTweetPayload | null => {
  const raw: unknown = typeof input === 'string' ? JSON.parse(input) : input;
  if (!isRawTweet(raw)) {
    return null;
  }

  const attachments: Attachment[] = [];
  const collect = (arr?: RawMedia[]) => {
    if (!arr) {
      return;
    }
    for (const m of arr) {
      if (
        typeof m.original_info?.width !== 'undefined' &&
        typeof m.original_info?.height !== 'undefined' &&
        m.type !== 'animated_gif'
      ) {
        attachments.push({
          url: m.media_url_https ?? m.url ?? '',
          type: m.type ?? 'photo',
          width: m.original_info?.width,
          height: m.original_info?.height,
        });
      }
    }
  };

  collect(raw.mediaDetails);
  collect(raw.extended_entities?.media);
  collect(raw.entities?.media);

  const created = new Date(raw.created_at).getTime();

  return {
    id: raw.id_str,
    text: htmlDecode(raw.text),
    displayName: raw.user.name,
    username: raw.user.screen_name,
    avatar: raw.user.profile_image_url_https.replace('_normal', ''),
    createdAtDisplay: formatTimeAgo(created),
    attachments,
  };
};
