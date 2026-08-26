import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiDirectCastMessageMetadata } from 'farcaster-client-data';
import { processMediasForRendering } from 'farcaster-client-hooks';
import React from 'react';
import {
  ImageSourcePropType,
  ImageStyle,
  InteractionManager,
  PixelRatio,
  Pressable,
  View,
  ViewStyle,
} from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';
import Animated, {
  measure,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { imageRequestHeaders } from '~/constants/Images';
import { useDataSaver } from '~/contexts/DataSaverProvider';
import { useLightbox } from '~/contexts/LightboxProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useV3DirectCastMetadata } from '~/hooks/data/directCasts/useDirectCastMetadata';

type DirectCastImageEmbedProps = {
  medias: NonNullable<ApiDirectCastMessageMetadata['medias']>;
  directCastIsPinned: boolean;
  selfDirectCast: boolean;
  timestamp: number;
  conversationIsMuted: boolean;
  conversationOtherPartyLastReadTime: number;
  shouldRenderMetadata: boolean;
  embedRoundingStyles: ViewStyle[];
  bubbleRef?: React.RefObject<View>;
  shouldCapMaxHeight: boolean;
};

const DirectCastImageEmbed: React.FC<DirectCastImageEmbedProps> = React.memo(
  ({
    medias,
    directCastIsPinned,
    selfDirectCast,
    timestamp,
    conversationIsMuted,
    conversationOtherPartyLastReadTime,
    shouldRenderMetadata,
    embedRoundingStyles,
    shouldCapMaxHeight,
  }) => {
    const t = useTheme();

    const { shouldLoadLowerQualityImages: useLowQualityImages } =
      useDataSaver();

    const metadata = useV3DirectCastMetadata({
      directCastIsPinned: directCastIsPinned,
      selfDirectCast,
      timestamp,
      conversationMuted: conversationIsMuted,
      conversationOtherPartyLastReadTime: conversationOtherPartyLastReadTime,
      wrappingContainerHasBRSpace: false,
      applyImageDirectCastStyles: true,
    });

    const imagesToRender = React.useMemo(() => {
      const pixelDensity = PixelRatio.get();

      return processMediasForRendering({
        medias: medias,
        pixelDensity,
        useLowQualityImages,
      });
    }, [medias, useLowQualityImages]);

    const imageToRender = React.useMemo(() => {
      if (imagesToRender.length === 0) {
        return undefined;
      }

      return imagesToRender[0];
    }, [imagesToRender]);

    const { openLightbox } = useLightbox();
    const ref = useAnimatedRef<View>();

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

    const onImagePress = React.useCallback(() => {
      if (typeof imageToRender === 'undefined') {
        return;
      }
      runOnUI(() => {
        'worklet';
        runOnJS(openLightbox)({
          images: [
            {
              ...imageToRender,
              rect: measure(ref),
            },
          ],
          index: 0,
        });
      })();
    }, [imageToRender, openLightbox, ref]);

    const imageToRenderSource: ImageSourcePropType | undefined =
      React.useMemo(() => {
        if (typeof imageToRender === 'undefined') {
          return undefined;
        }

        return {
          uri: imageToRender.thumbnail,
          headers: imageRequestHeaders,
        } satisfies ImageSourcePropType;
      }, [imageToRender]);

    const imageToRenderStyle = React.useMemo(() => {
      if (typeof imageToRender === 'undefined') {
        return undefined;
      }

      return [
        {
          width: '100%',
          aspectRatio: imageToRender.aspectRatio,
        },
        t.borderHairline,
        t.borderDefault,
        embedRoundingStyles,
      ] as ImageStyle;
    }, [embedRoundingStyles, imageToRender, t.borderDefault, t.borderHairline]);

    const imageWrappingViewStyle = React.useMemo(() => {
      return [
        t.relative,
        t.overflowHidden,
        {
          width: '100%',
          maxHeight: shouldCapMaxHeight ? 160 : 500,
        },
        embedRoundingStyles,
      ];
    }, [embedRoundingStyles, shouldCapMaxHeight, t.relative, t.overflowHidden]);

    const { colors, locations } = easeGradient({
      colorStops: {
        0.7882: {
          color: 'rgba(0, 0, 0, 0.00)',
        },
        1: {
          color: 'rgba(0, 0, 0, 0.40)',
        },
      },
    });

    const { activeLightboxRef } = useLightbox();

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity:
          activeLightboxRef.value === imageToRender?.original
            ? withTiming(0)
            : 1,
      };
    });

    if (
      typeof imageToRender === 'undefined' ||
      typeof imageToRenderSource === 'undefined'
    ) {
      return null;
    }

    return (
      <Animated.View style={[animatedStyle]}>
        <Pressable
          ref={ref}
          style={[
            t.relative,
            embedRoundingStyles,
            shouldRenderMetadata && [t.borderDefault, t.borderHairline],
          ]}
          onPress={onImagePress}
          onPressIn={preloadImages}
        >
          <View
            style={[
              t.overflowHidden,
              { maxHeight: shouldCapMaxHeight ? 160 : 500 },
            ]}
          >
            <View style={imageWrappingViewStyle}>
              <Image
                source={imageToRenderSource}
                style={imageToRenderStyle}
                cachePolicy="memory-disk"
                recyclingKey={imageToRenderSource.uri}
              />
              {shouldRenderMetadata && (
                <LinearGradient
                  colors={colors as unknown as [string, string, ...string[]]}
                  locations={
                    locations as unknown as [number, number, ...number[]]
                  }
                  style={[t.bottom0, t.absolute, t.hFull, t.wFull]}
                />
              )}
            </View>
          </View>
          {shouldRenderMetadata && (
            <View
              style={[
                t.absolute,
                t.bottom0,
                t.right0,
                { marginBottom: 8 },
                t.texts.light,
                t.roundedFull,
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.pX1,
              ]}
            >
              {metadata}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  },
);

DirectCastImageEmbed.displayName = 'DirectCastImageEmbed';

export { DirectCastImageEmbed };
