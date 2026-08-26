import { Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { imageRequestHeaders } from '~/constants/Images';
import { hitSlopLg } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { MediaAsset } from '~/screens/CreateCast/OptimisticMediaEmbedsProvider';

type ImageEmbedCastAttachmentOptimisticPreviewProps = {
  optimisticImage: MediaAsset;
  onCancelImageUpload: () => void;
};

const ImageEmbedCastAttachmentOptimisticPreview: React.FC<
  ImageEmbedCastAttachmentOptimisticPreviewProps
> = ({ optimisticImage, onCancelImageUpload }) => {
  const { width: screenWidth } = Dimensions.get('window');

  const t = useTheme();
  const uploadPulse = useSharedValue(1);
  const isUploading = optimisticImage.uploadStatus === 'uploading';

  const aspectRatio = React.useMemo(() => {
    return getImageAspectRatio({
      w: optimisticImage.w,
      h: optimisticImage.h,
    });
  }, [optimisticImage.h, optimisticImage.w]);

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

  return (
    <View
      style={[
        t.relative,
        { maxHeight: 300, maxWidth: screenWidth - 32 },
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.overflowHidden,
        t.bgElevated,
      ]}
    >
      <Animated.View
        style={[
          {
            aspectRatio,
          },
          uploadPulseStyle,
        ]}
      >
        <Image
          source={{ uri: optimisticImage.src, headers: imageRequestHeaders }}
          style={[
            {
              borderRadius: 12,
              height: '100%',
              width: '100%',
            },
          ]}
          cachePolicy="memory-disk"
          contentFit="cover"
          contentPosition="center"
        />
      </Animated.View>
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
            t.directCasts.bgImagePreview,
            t.pX2,
            t.h6,
            { borderRadius: 6, gap: 4 },
          ]}
        >
          <ActivityIndicator size="small" color={t.colors.text.light} />
          <Text style={[t.texts.light, t.textXs]} numberOfLines={1}>
            Uploading
          </Text>
        </View>
      )}
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
        onPress={onCancelImageUpload}
      >
        <Octicons name="x" size={14} color={t.colors.text.light} />
      </Pressable>
    </View>
  );
};

export { ImageEmbedCastAttachmentOptimisticPreview };
