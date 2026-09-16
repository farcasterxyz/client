import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { VideoView } from 'expo-video';
import { getImageAspectRatio } from 'farcaster-client-hooks';
import * as React from 'react';
import { View, ViewStyle } from 'react-native';

import { imageRequestHeaders } from '~/constants/Images';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useVideoPlayer } from '~/contexts/VideoPlayerProvider';

type Props = {
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  videoStyle?: ViewStyle;
};

function DirectCastVideoPreview(props: Props) {
  const { url, thumbnailUrl, width, height, videoStyle } = props;
  const t = useTheme();

  const videoSource = React.useMemo(
    () => ({
      uri: url,
      headers: imageRequestHeaders,
    }),
    [url],
  );

  const player = useVideoPlayer(videoSource, (player) => {
    player.pause();
  });

  const [showPoster, setShowPoster] = React.useState(true);

  React.useEffect(() => {
    const statusListener = player.addListener('statusChange', (event) => {
      if (event.status === 'readyToPlay' && setShowPoster) {
        setShowPoster(false);
      }
    });
    return () => {
      statusListener.remove();
    };
  }, [player]);

  const fullVideoStyle = React.useMemo(
    () => [
      t.flex,
      {
        width: '100%',
        aspectRatio: getImageAspectRatio({
          w: width,
          h: height,
        }),
      },
      videoStyle,
    ],
    [t.flex, width, height, videoStyle],
  );

  return (
    <>
      {showPoster && thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={fullVideoStyle}
          contentFit="cover"
        />
      ) : (
        <VideoView
          player={player}
          style={fullVideoStyle}
          contentFit="cover"
          nativeControls={false}
          allowsVideoFrameAnalysis={false}
          allowsPictureInPicture={false}
        />
      )}
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
            { maxWidth: sizes.s18 },
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
    </>
  );
}

export { DirectCastVideoPreview };
