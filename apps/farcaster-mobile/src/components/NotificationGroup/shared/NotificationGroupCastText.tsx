import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ApiCast, ApiMediaV2 } from 'farcaster-client-data';
import { processMediasForRendering } from 'farcaster-client-hooks';
import { RemoteImage } from 'farcaster-expo';
import { Languages } from 'lucide-react-native';
import React, { FC, memo, useMemo } from 'react';
import { PixelRatio, Pressable, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import {
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/spaces/SpaceEmbedAttachment';
import { Text, TextColor } from '~/components/Text';
import { imageRequestHeaders } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCastTranslationDisplay } from '~/hooks/useCastTranslationDisplay';

import { NotificationDescriptionText } from './NotificationDescriptionText';

type NotificationGroupCastTextProps = {
  color?: TextColor;
  cast: ApiCast;
};

const NotificationGroupCastText: FC<NotificationGroupCastTextProps> = memo(
  ({ cast, color = 'secondary' }) => {
    const t = useTheme();

    const {
      displayText,
      hasTranslation,
      isTranslationPending,
      showOriginal,
      sourceLanguageName,
      toggleLabel,
      toggleTranslation,
    } = useCastTranslationDisplay(cast);

    return (
      <View style={[t.mT2, { gap: 8 }]}>
        {(hasTranslation || isTranslationPending) && (
          <NotificationGroupCastTranslationState
            color={color}
            hasTranslation={hasTranslation}
            isTranslationPending={isTranslationPending}
            showOriginal={showOriginal}
            sourceLanguageName={sourceLanguageName}
            toggleLabel={toggleLabel}
            onToggle={toggleTranslation}
          />
        )}
        {displayText && (
          <NotificationDescriptionText color={color} numberOfLines={6}>
            {displayText}
          </NotificationDescriptionText>
        )}
        <NotificationGroupCastTextEmbedsV2 cast={cast} />
      </View>
    );
  },
);

type NotificationGroupCastTranslationStateProps = {
  color: TextColor;
  hasTranslation: boolean;
  isTranslationPending: boolean;
  showOriginal: boolean;
  sourceLanguageName: string;
  toggleLabel: string;
  onToggle: () => void;
};

const NotificationGroupCastTranslationState: FC<NotificationGroupCastTranslationStateProps> =
  memo(
    ({
      color,
      hasTranslation,
      isTranslationPending,
      showOriginal,
      sourceLanguageName,
      toggleLabel,
      onToggle,
    }) => {
      const t = useTheme();

      return (
        <View style={[t.flexRow, t.itemsCenter, t.justifyBetween, { gap: 8 }]}>
          <View
            style={[
              t.flex1,
              t.flexShrink,
              t.flexRow,
              t.itemsCenter,
              { gap: 4 },
            ]}
          >
            <Languages size={12} color={t.colors.text.tertiary} />
            <NotificationDescriptionText
              color={color}
              numberOfLines={1}
              style={[t.flexShrink]}
            >
              {isTranslationPending
                ? 'translation pending...'
                : `translated from ${sourceLanguageName}`}
            </NotificationDescriptionText>
          </View>
          {hasTranslation && !isTranslationPending && (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: showOriginal }}
              accessibilityLabel={
                showOriginal ? 'Show translated text' : 'Show original text'
              }
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation();
                onToggle();
              }}
            >
              <Text
                style={[
                  t.texts.brand,
                  t.fontMedium,
                  {
                    fontSize: 14,
                    lineHeight: 18,
                  },
                ]}
              >
                {toggleLabel}
              </Text>
            </Pressable>
          )}
        </View>
      );
    },
  );

type EmbedPill = {
  type: 'miniapp' | 'link';
  Icon: React.ReactNode;
  label: string;
};

type ImageEmbed = {
  type: 'image';
  imageUrl: string;
  aspectRatio: number;
};

type VideoEmbed = {
  type: 'video';
  thumbnailUrl: string | undefined;
  aspectRatio: number;
};

type Pill = ImageEmbed | EmbedPill | VideoEmbed;

const NotificationGroupCastTextEmbedsV2: FC<{
  cast: ApiCast;
}> = memo(({ cast }) => {
  const t = useTheme();
  const spaceUrl = useMemo(() => {
    const urls = cast.embeds?.urls ?? [];

    for (const urlEmbed of urls) {
      const url = urlEmbed.openGraph?.url;
      if (typeof url === 'string' && matchSpaceUrl(url)) {
        return url;
      }
    }

    return undefined;
  }, [cast.embeds?.urls]);

  const pills = useMemo(() => {
    const embeds = cast.embeds;
    if (!embeds) {
      return [];
    }

    const pills: Pill[] = [];
    if (embeds.images.length > 0) {
      const mediaImageEmbeds = embeds.images.map((image) => {
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

      for (const image of imagesToRender) {
        pills.push({
          type: 'image',
          imageUrl: image.thumbnail,
          aspectRatio: image.aspectRatio,
        });
      }
    }

    if (embeds.videos && embeds.videos.length > 0) {
      for (const video of embeds.videos) {
        pills.push({
          type: 'video',
          thumbnailUrl: video.thumbnailUrl,
          aspectRatio: 1,
        });
      }
    }

    return pills;
  }, [cast.embeds]);

  // calculate max height based on tallest image for image embeds
  // to make object fit cover work properly
  const maxHeight = useMemo(() => {
    let maxHeight = 0;
    for (const pill of pills) {
      if (pill.type === 'image') {
        const height = 128 / pill.aspectRatio;
        if (height > maxHeight) {
          maxHeight = height;
        }
      }
    }
    return Math.min(256, maxHeight);
  }, [pills]);

  if (pills.length === 0 && typeof spaceUrl === 'undefined') {
    return null;
  }

  return (
    <View style={{ gap: 8 }}>
      {pills.length > 0 && (
        <ScrollView
          style={[t.wFull, t.flexRow]}
          contentContainerStyle={{ gap: 8 }}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          directionalLockEnabled={true}
        >
          {pills.map((pill, index) => {
            if (pill.type === 'image') {
              return (
                <View
                  key={`${pill.type}-${index}`}
                  style={[
                    t.flexRow,
                    t.itemsCenter,
                    t.overflowHidden,
                    {
                      borderRadius: 12,
                      width: 128,
                      height: maxHeight,
                    },
                  ]}
                >
                  <Image
                    source={{
                      uri: pill.imageUrl,
                      headers: imageRequestHeaders,
                    }}
                    style={{
                      // yes, these both could be 100% but that adds a second layout calculation
                      // for no reason since we already have the dimensions. absolute values prevent a perf hit.
                      width: 128,
                      height: maxHeight,
                    }}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    contentPosition="center"
                  />
                </View>
              );
            }

            if (pill.type === 'video') {
              return (
                <View
                  key={`${pill.type}-${index}`}
                  style={[t.relative, { height: 128, width: 128 }]}
                >
                  <RemoteImage
                    uri={pill.thumbnailUrl}
                    width={128}
                    height={128}
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

            return (
              <View
                key={`${pill.type}-${index}`}
                style={[
                  t.flexRow,
                  t.roundedFull,
                  t.bgLightGray,
                  t.itemsCenter,
                  { paddingHorizontal: 6, paddingVertical: 2, gap: 2 },
                ]}
              >
                <NotificationDescriptionText>
                  {pill.label}
                </NotificationDescriptionText>
              </View>
            );
          })}
        </ScrollView>
      )}
      {typeof spaceUrl === 'string' && <SpaceEmbedAttachment url={spaceUrl} />}
    </View>
  );
});

NotificationGroupCastText.displayName = 'NotificationGroupCastText';

export { NotificationGroupCastText };
