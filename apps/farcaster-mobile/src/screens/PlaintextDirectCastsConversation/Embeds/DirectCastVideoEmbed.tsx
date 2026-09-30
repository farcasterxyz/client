import { LinearGradient } from 'expo-linear-gradient';
import { ApiDirectCastMessageMetadata } from 'farcaster-client-data';
import { getImageAspectRatio } from 'farcaster-client-hooks';
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';

import { VideoPlayer } from '~/components/Video/VideoPlayer';
import { useTheme } from '~/contexts/ThemeProvider';
import { useVideoFeedSound } from '~/contexts/VideoFeedSoundProvider';
import { useV3DirectCastMetadata } from '~/hooks/data/directCasts/useDirectCastMetadata';

type DirectCastVideoEmbedProps = {
  videos: NonNullable<ApiDirectCastMessageMetadata['videos']>;
  directCastIsPinned: boolean;
  selfDirectCast: boolean;
  timestamp: number;
  conversationIsMuted: boolean;
  conversationOtherPartyLastReadTime: number;
  shouldRenderMetadata: boolean;
  embedRoundingStyles: ViewStyle[];
  shouldCapMaxHeight: boolean;
  bubbleRef?: React.RefObject<View>;
};

const DirectCastVideoEmbed: React.FC<DirectCastVideoEmbedProps> = React.memo(
  ({
    bubbleRef,
    videos,
    directCastIsPinned,
    selfDirectCast,
    timestamp,
    conversationIsMuted,
    conversationOtherPartyLastReadTime,
    shouldRenderMetadata,
    embedRoundingStyles,
  }) => {
    const t = useTheme();
    const { videoFeedIsMuted, videoFeedToggleSound } = useVideoFeedSound();

    const metadata = useV3DirectCastMetadata({
      directCastIsPinned: directCastIsPinned,
      selfDirectCast,
      timestamp,
      conversationMuted: conversationIsMuted,
      conversationOtherPartyLastReadTime: conversationOtherPartyLastReadTime,
      wrappingContainerHasBRSpace: false,
      applyImageDirectCastStyles: true,
    });

    const video = React.useMemo(() => {
      if (videos.length === 0) {
        return undefined;
      }

      return videos[0];
    }, [videos]);

    const aspectRatio = React.useMemo(() => {
      if (typeof video === 'undefined') {
        return undefined;
      }

      return getImageAspectRatio({ w: video.width || 0, h: video.height || 0 });
    }, [video]);

    const source = React.useMemo(() => {
      if (typeof video === 'undefined') {
        return undefined;
      }

      return {
        uri: video.sourceUrl,
      };
    }, [video]);

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

    if (
      typeof video === 'undefined' ||
      typeof source === 'undefined' ||
      typeof aspectRatio === 'undefined'
    ) {
      return null;
    }

    return (
      <View
        ref={bubbleRef}
        style={[
          t.relative,
          embedRoundingStyles,
          shouldRenderMetadata && [t.borderDefault, t.borderHairline],
        ]}
      >
        <View
          style={[
            t.relative,
            t.roundedLg,
            t.overflowHidden,
            t.bgDefault,
            t.wFull,
            { aspectRatio },
          ]}
        >
          <VideoPlayer
            castHash={'0x0'}
            source={source}
            aspectRatio={aspectRatio}
            poster={video.thumbnailUrl}
            duration={video.duration || 0}
            quoteCastMode={false}
            isLooping={false}
            hideMetadata={true}
            muted={videoFeedIsMuted}
            onMuteToggle={videoFeedToggleSound}
          />
          {shouldRenderMetadata && (
            <LinearGradient
              pointerEvents="none"
              colors={colors as unknown as [string, string, ...string[]]}
              locations={locations as unknown as [number, number, ...number[]]}
              style={[t.bottom0, t.absolute, t.hFull, t.wFull]}
            />
          )}
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
      </View>
    );
  },
);

DirectCastVideoEmbed.displayName = 'DirectCastVideoEmbed';

export { DirectCastVideoEmbed };
