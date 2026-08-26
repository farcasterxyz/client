import { Octicons } from '@expo/vector-icons';
import { VideoView } from 'expo-video';
import { getImageAspectRatio } from 'farcaster-client-hooks';
import React from 'react';
import { ActivityIndicator, Dimensions, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '~/components/Text';
import { hitSlopLg } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { useVideoPlayer } from '~/contexts/VideoPlayerProvider';
import { MediaAsset } from '~/screens/CreateCast/OptimisticMediaEmbedsProvider';

type VideoEmbedCastAttachmentOptimisticPreviewProps = {
  optimisticVideo: MediaAsset;
  onCancelVideoUpload: () => void;
  uploadingStatus: string | undefined;
};

const VideoEmbedCastAttachmentOptimisticPreview: React.FC<
  VideoEmbedCastAttachmentOptimisticPreviewProps
> = ({ optimisticVideo, onCancelVideoUpload, uploadingStatus }) => {
  const { width: screenWidth } = Dimensions.get('window');

  const t = useTheme();
  const uploadPulse = useSharedValue(1);

  const [muted, setMuted] = React.useState<boolean>(true);
  const isUploading =
    optimisticVideo.uploadStatus === 'uploading' ||
    (optimisticVideo.uploadStatus !== 'failed' &&
      typeof uploadingStatus !== 'undefined');
  const uploadFailed = optimisticVideo.uploadStatus === 'failed';
  const uploadStatusLabel = uploadingStatus ?? 'Uploading';

  const aspectRatio = React.useMemo(() => {
    return getImageAspectRatio({
      w: optimisticVideo.w,
      h: optimisticVideo.h,
    });
  }, [optimisticVideo.h, optimisticVideo.w]);

  const player = useVideoPlayer({ uri: optimisticVideo.src }, (player) => {
    player.loop = true;
    player.play();
    player.muted = muted;
  });

  const onMutePress = React.useCallback(() => {
    setMuted((prevMuted) => !prevMuted);
  }, []);

  React.useEffect(() => {
    if (typeof player !== 'undefined' && player !== null) {
      player.muted = muted;
    }
  }, [muted, player]);

  React.useEffect(() => {
    if (!isUploading) {
      uploadPulse.value = withTiming(1, { duration: 180 });
      return;
    }

    uploadPulse.value = withRepeat(
      withTiming(0.55, {
        duration: 700,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [isUploading, uploadPulse]);

  const uploadPulseStyle = useAnimatedStyle(() => ({
    opacity: uploadPulse.value,
  }));

  const maxWidth = screenWidth - 32;

  return (
    <View
      style={[{ maxWidth }, uploadFailed && t.pB2, uploadFailed && { gap: 6 }]}
    >
      {uploadFailed && (
        <View style={[t.flexRow, t.itemsCenter, t.pX1, { gap: 4, maxWidth }]}>
          <Octicons name="alert" size={14} color={t.colors.text.danger} />
          <Text style={[t.texts.danger, t.textXs, t.flexShrink]}>
            {optimisticVideo.uploadError ?? 'Failed to upload video.'}
          </Text>
        </View>
      )}
      <View
        style={[
          t.relative,
          { maxHeight: 300, maxWidth },
          { borderRadius: 12 },
          t.borderDesignSystemDefault,
          t.border,
          t.overflowHidden,
          t.bgElevated,
        ]}
      >
        <Animated.View style={[{ aspectRatio }, uploadPulseStyle]}>
          <VideoView
            style={{
              borderRadius: 12,
              height: '100%',
              width: '100%',
            }}
            player={player}
            contentFit="cover"
            nativeControls={false}
            allowsVideoFrameAnalysis={false}
            allowsPictureInPicture={false}
          />
        </Animated.View>
        <Pressable
          style={[
            t.directCasts.bgImagePreview,
            t.itemsCenter,
            t.justifyCenter,
            t.roundedFull,
            t.absolute,
            t.right0,
            t.top0,
            t.mT1,
            t.mR1,
            { width: 24, height: 24 },
          ]}
          hitSlop={hitSlopLg}
          onPress={onCancelVideoUpload}
        >
          <Octicons name="x" size={14} color={t.colors.text.light} />
        </Pressable>
        <Pressable
          style={[
            t.directCasts.bgImagePreview,
            t.itemsCenter,
            t.justifyCenter,
            t.roundedFull,
            t.absolute,
            t.right0,
            t.bottom0,
            t.mB1,
            t.mR1,
            { width: 24, height: 24 },
          ]}
          hitSlop={hitSlopLg}
          onPress={onMutePress}
        >
          <Octicons
            name={muted ? 'mute' : 'unmute'}
            size={14}
            color={t.colors.text.light}
          />
        </Pressable>
        {isUploading && (
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.absolute,
              t.left0,
              t.top0,
              t.mT1,
              t.mL1,
            ]}
          >
            <View
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.justifyStart,
                t.directCasts.bgImagePreview,
                { borderRadius: 6 },
                t.pX2,
                t.h6,
                { gap: 4 },
              ]}
            >
              <ActivityIndicator size="small" color={t.colors.text.light} />
              <Text
                numberOfLines={1}
                style={[t.texts.light, t.textXs, t.overflowHidden]}
              >
                {uploadStatusLabel}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export { VideoEmbedCastAttachmentOptimisticPreview };
