import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  AnimatedPressable,
  Text2,
  TypographyBody,
  useTheme,
} from 'farcaster-expo';
import { Check, Loader2 } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PressableGradient } from '~/components/FloatingSearch/PressableGradient';
import { imageRequestHeaders } from '~/constants/Images';
import { useAnimationPauseOnBackground } from '~/hooks/useAnimationPauseOnBackground';
import { MediaAsset } from '~/screens/CreateCast/OptimisticMediaEmbedsProvider';

type CastingToastProps = {
  status: 'in-progress' | 'published' | 'errored';
  castText: string;
  imageEmbeds: MediaAsset[];
  videoEmbeds: MediaAsset[];
  errorMessage?: string;
  onPress: () => void;
};

const MORE_STYLES_APPLIED = Platform.OS === 'ios';

function CastingToast({
  status,
  onPress,
  castText,
  imageEmbeds,
  videoEmbeds,
  errorMessage,
}: CastingToastProps) {
  const t = useTheme();

  const label = React.useMemo(() => {
    switch (status) {
      case 'in-progress':
        return 'Casting...';
      case 'errored':
        return 'Failed to cast';
      case 'published':
        return 'Sent';
    }
  }, [status]);

  const onPressWrapped = React.useCallback(() => {
    onPress();
  }, [onPress]);

  const trimmedCastText = castText.trim();
  const hasErrorMessage = status === 'errored' && !!errorMessage;

  const previewStackWidth = React.useMemo(() => {
    const PREVIEW_SIZE = 32;
    const PREVIEW_OVERLAP = 12;
    const previewCount = imageEmbeds.length + videoEmbeds.length;

    if (previewCount === 0) {
      return 0;
    }

    return PREVIEW_SIZE + (previewCount - 1) * PREVIEW_OVERLAP;
  }, [imageEmbeds.length, videoEmbeds.length]);

  return (
    <AnimatedPressable
      onPress={onPressWrapped}
      style={[
        // The media preview stack sizes itself with height '100%', so
        // non-error states need a definite height, not minHeight.
        hasErrorMessage ? { minHeight: 72 } : { height: 56 },
        t.flex,
        t.itemsCenter,
        t.flexRow,
        t.border,
        t.borders.secondary,
        t.mX2,
        { borderRadius: 100 },
        {
          ...(Platform.OS === 'android' && { overflow: 'hidden' }),
          ...(!t.dark && { backgroundColor: t.colors.background.secondary }),
        },
      ]}
      disableAnimation={Platform.OS === 'android'}
    >
      {t.dark && <PressableGradient />}
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.wFull,
          t.pX3,
          t.flex1,
        ]}
      >
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.gap2,
            t.flex1,
            {
              minWidth: 0,
            },
          ]}
        >
          {status !== 'errored' && (
            <View style={[t.itemsCenter, t.justifyCenter, { width: 34 }]}>
              {status === 'in-progress' && <CastingToastSpinner />}
              {status === 'published' && (
                <Check color={t.colors.text.primary} size={24} />
              )}
            </View>
          )}
          <View
            style={[
              t.flexCol,
              t.gap1,
              t.flex1,
              t.mR2,
              {
                minWidth: 0,
              },
            ]}
          >
            <TypographyBody label="Medium/Strong" color="primary">
              {label}
            </TypographyBody>
            {trimmedCastText !== '' && status === 'in-progress' && (
              <TypographyBody label="Small" color="tertiary" numberOfLines={1}>
                {trimmedCastText}
              </TypographyBody>
            )}
            {status === 'published' && (
              <TypographyBody label="Small" color="tertiary" numberOfLines={1}>
                Tap to view
              </TypographyBody>
            )}
            {hasErrorMessage && (
              <TypographyBody label="Small" color="tertiary" numberOfLines={2}>
                {errorMessage}
              </TypographyBody>
            )}
          </View>
        </View>
        <View
          style={[
            t.itemsEnd,
            t.justifyCenter,
            t.flexShrink0,
            previewStackWidth
              ? {
                  minWidth: previewStackWidth,
                }
              : undefined,
          ]}
        >
          {status !== 'errored' && previewStackWidth > 0 && (
            <View
              style={[
                t.relative,
                t.hFull,
                t.itemsCenter,
                t.justifyCenter,
                {
                  width: previewStackWidth,
                },
              ]}
            >
              {[...videoEmbeds].reverse().map((embed, index) => (
                <View
                  key={embed.src}
                  style={[
                    t.absolute,
                    {
                      right: index + imageEmbeds.length * 12,
                      zIndex: index + imageEmbeds.length + 1,
                    },
                  ]}
                >
                  <CastingToastVideoPreview media={embed} />
                </View>
              ))}
              {[...imageEmbeds].reverse().map((embed, index) => (
                <View
                  key={embed.src}
                  style={[
                    t.absolute,
                    {
                      right: index * 12,
                      zIndex: index + 1,
                    },
                  ]}
                >
                  <CastingToastImagePreview media={embed} />
                </View>
              ))}
            </View>
          )}
          {status === 'errored' && (
            <Pressable onPress={onPressWrapped}>
              <Text2 size="base" weight="semibold" color="brand">
                Try again
              </Text2>
            </Pressable>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

type CastingToastVideoPreviewProps = {
  media: MediaAsset;
};

function CastingToastVideoPreview({ media }: CastingToastVideoPreviewProps) {
  const t = useTheme();

  const player = useVideoPlayer({ uri: media.src });

  return (
    <View
      style={[
        t.relative,
        t.h8,
        { borderRadius: 4, minWidth: 32, maxWidth: 48 },
        t.borderDesignSystemDefault,
        t.border,
        t.overflowHidden,
        t.bgElevated,
        MORE_STYLES_APPLIED && { transform: [{ rotate: '4deg' }] },
      ]}
    >
      <VideoView
        style={{
          height: '100%',
          width: '100%',
        }}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsVideoFrameAnalysis={false}
        allowsPictureInPicture={false}
      />
      <View style={[t.itemsCenter, t.justifyCenter, t.absolute, t.inset0]}>
        <View
          style={[
            t.directCasts.bgImagePreview,
            t.itemsCenter,
            t.justifyCenter,
            t.roundedFull,
            { padding: 1 },
          ]}
        >
          <Ionicons name={'play'} size={6} color={t.colors.text.light} />
        </View>
      </View>
    </View>
  );
}

type CastingToastImagePreviewProps = {
  media: MediaAsset;
};

function CastingToastImagePreview({ media }: CastingToastImagePreviewProps) {
  const t = useTheme();

  return (
    <View
      style={[
        t.relative,
        t.h8,
        { borderRadius: 4, minWidth: 32, maxWidth: 48 },
        t.borderDesignSystemDefault,
        t.border,
        t.overflowHidden,
        t.bgElevated,
        MORE_STYLES_APPLIED && { transform: [{ rotate: '4deg' }] },
      ]}
    >
      <Image
        source={{ uri: media.src, headers: imageRequestHeaders }}
        style={[
          {
            height: '100%',
            width: '100%',
          },
        ]}
        cachePolicy="memory-disk"
        contentFit="cover"
        contentPosition="center"
      />
    </View>
  );
}

const TWO_PI = Math.PI * 2;

function CastingToastSpinner() {
  const t = useTheme();
  const rotation = useSharedValue(0);

  const startAnimation = React.useCallback(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(TWO_PI, {
        duration: 900,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const stopAnimation = React.useCallback(() => {
    cancelAnimation(rotation);
    rotation.value = 0;
  }, [rotation]);

  useAnimationPauseOnBackground({
    startAnimation,
    stopAnimation,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}rad` }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Loader2 color={t.colors.text.primary} size={24} strokeWidth={2} />
    </Animated.View>
  );
}

export { CastingToast };
