import { ApiCastVideoEmbed } from 'farcaster-client-data';
import {
  getCloudflareImageUrl,
  getImageAspectRatio,
} from 'farcaster-client-hooks';
import React from 'react';
import { useWindowDimensions, View } from 'react-native';

import { VideoPlayer } from '~/components/Video/VideoPlayer';
import { useTheme } from '~/contexts/ThemeProvider';
import { useVideoFeedSound } from '~/contexts/VideoFeedSoundProvider';

type VideoAttachmentProps = {
  focusedCastMode: boolean;
  quoteCastMode: boolean;
  castHash: string;
  videoIndex: number;
  video: ApiCastVideoEmbed;
  height?: number;
  maxHeight?: number;
  renderWidth?: number;
  maxWidth?: number;
};

const VideoAttachment: React.FC<VideoAttachmentProps> = React.memo(
  ({
    quoteCastMode,
    castHash,
    videoIndex,
    video,
    height,
    maxHeight,
    renderWidth,
    maxWidth,
  }) => {
    const t = useTheme();
    const { videoFeedIsMuted, videoFeedToggleSound } = useVideoFeedSound();
    const { width: windowWidth } = useWindowDimensions();

    const aspectRatio = React.useMemo(() => {
      return getImageAspectRatio({ w: video.width || 0, h: video.height || 0 });
    }, [video.height, video.width]);

    const source = React.useMemo(() => {
      return {
        uri: video.sourceUrl,
      };
    }, [video.sourceUrl]);

    const thumbnailUrl = React.useMemo(() => {
      if (typeof video.thumbnailUrl === 'undefined') {
        return '';
      }

      return getCloudflareImageUrl({
        url: video.thumbnailUrl,
        windowWidth: windowWidth,
        blockAnimated: true,
        increasedWidth: false,
        width: 2000,
      });
    }, [video.thumbnailUrl, windowWidth]);

    const player = React.useMemo(() => {
      return (
        <VideoPlayer
          castHash={castHash}
          videoIndex={videoIndex}
          source={source}
          aspectRatio={aspectRatio}
          poster={thumbnailUrl}
          duration={video.duration || 0}
          quoteCastMode={quoteCastMode}
          isLooping={true}
          // FIXME: Learn why did we turn these off for the feed before? Turning it back on for now. TBD.
          hideMetadata={false}
          muted={videoFeedIsMuted}
          onMuteToggle={videoFeedToggleSound}
        />
      );
    }, [
      aspectRatio,
      castHash,
      quoteCastMode,
      source,
      thumbnailUrl,
      video.duration,
      videoFeedIsMuted,
      videoFeedToggleSound,
      videoIndex,
    ]);

    return (
      <View
        style={[
          t.flexCol,
          { borderRadius: 12, alignSelf: 'flex-start' },
          t.borderDesignSystemDefault,
          t.border,
          t.overflowHidden,
        ]}
      >
        <View
          style={[
            t.bgElevated,
            {
              width: renderWidth,
              height: height,
              maxHeight: maxHeight,
              maxWidth: maxWidth,
              aspectRatio:
                typeof renderWidth !== 'undefined' ? undefined : aspectRatio,
            },
          ]}
        >
          {player}
        </View>
      </View>
    );
  },
);

export { VideoAttachment };
