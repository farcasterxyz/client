import { Image } from 'expo-image';
import {
  ApiDirectCastMessageMetadata,
  ApiDirectCastUrlEmbedDisplayMode,
} from 'farcaster-client-data';
import {
  getImageAspectRatio,
  isSnapEmbed,
  sleep,
  useProcessDirectCastMessageMetadata,
} from 'farcaster-client-hooks';
import { SkeletonPlaceholder } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { QuoteCast } from '~/components/casts/CastAttachments/QuoteCast';
import { SnapEmbedAttachment } from '~/components/Snap/SnapEmbedAttachment';
import { Text } from '~/components/Text';
import { imageRequestHeaders } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';

import { DirectCastVideoPreview } from './DirectCastVideoPreview';
import { DirectCastGroupInviteEmbeds } from './Embeds/DirectCastGroupInviteEmbeds';
import { DirectCastsOpenGraphCastAttachment } from './Embeds/DirectCastURLEmbedRenderer';

export type DirectCastComposerEmbedPreviewsInterface = {
  getCurrentMessageMetadata: () => ApiDirectCastMessageMetadata | undefined;
};

type DirectCastsComposerEmbedPreviewsProps = {
  message: string;
  embedPreviewsRef: React.Ref<DirectCastComposerEmbedPreviewsInterface>;
  omitUrlPreview: boolean;
  urlEmbedDisplayMode: ApiDirectCastUrlEmbedDisplayMode;
  onResolvedMetadata?: (
    metadata: ApiDirectCastMessageMetadata | undefined,
  ) => void;
};

const DirectCastsComposerEmbedPreviews: React.FC<DirectCastsComposerEmbedPreviewsProps> =
  React.memo(
    ({
      message,
      embedPreviewsRef,
      omitUrlPreview,
      urlEmbedDisplayMode,
      onResolvedMetadata,
    }) => {
      const t = useTheme();

      const processDirectCastMessageMetadata =
        useProcessDirectCastMessageMetadata();

      const [fetchingMetadata, setFetchingMetadata] =
        React.useState<boolean>(true);

      const [messageMetadata, setMessageMetadata] = React.useState<
        ApiDirectCastMessageMetadata | undefined
      >();

      React.useImperativeHandle(embedPreviewsRef, () => {
        return {
          getCurrentMessageMetadata: () => {
            if (typeof messageMetadata === 'undefined') {
              return undefined;
            }
            if (omitUrlPreview) {
              const { urls: _urls, ...rest } = messageMetadata;
              return Object.keys(rest).length > 0 ? rest : undefined;
            }
            return {
              ...messageMetadata,
              urlEmbedDisplayMode,
            };
          },
        };
      }, [messageMetadata, omitUrlPreview, urlEmbedDisplayMode]);

      // Monotonically-increasing request id so out-of-order fetch resolutions
      // (e.g. from a rapidly-changing `message` while typing) cannot overwrite
      // state produced by a newer in-flight request.
      const latestRequestIdRef = React.useRef(0);

      const fetch = React.useCallback(async () => {
        const requestId = ++latestRequestIdRef.current;
        const start = Date.now();

        setFetchingMetadata(true);
        onResolvedMetadata?.(undefined);
        const response = await processDirectCastMessageMetadata({ message });

        if (Date.now() - start < 2_000) {
          await sleep(1_500);
        }

        if (latestRequestIdRef.current !== requestId) {
          return;
        }

        setMessageMetadata(response.result.metadata);
        onResolvedMetadata?.(response.result.metadata);

        setFetchingMetadata(false);
      }, [message, onResolvedMetadata, processDirectCastMessageMetadata]);

      React.useLayoutEffect(() => {
        fetch();
        return () => {
          // Invalidate any in-flight fetch on unmount / message change so
          // its result is dropped.
          latestRequestIdRef.current += 1;
        };
      }, [fetch]);
      const { progress } = useReanimatedKeyboardAnimation();

      const animatedMaxHeight = useAnimatedStyle(() => {
        return {
          maxHeight: interpolate(progress.value, [0, 1], [400, 200]),
        };
      });

      const embeds = React.useMemo(() => {
        if (fetchingMetadata) {
          return (
            <SkeletonPlaceholder style={[t.h24, t.flexGrow]} variant="darker" />
          );
        }

        if (typeof messageMetadata === 'undefined') {
          return null;
        }

        if (
          typeof messageMetadata.casts !== 'undefined' &&
          messageMetadata.casts.length !== 0
        ) {
          const cast = messageMetadata.casts[0];

          // Currently the embeds have a fixed height
          // the composer also has a fixed height so we need to make sure the embeds are not too tall
          // but allow scrolling if they are too tall
          return (
            <Animated.ScrollView
              contentContainerStyle={[t.flex]}
              style={[
                t.wFull,
                t.bgDefault,
                {
                  borderRadius: 8,
                },
                animatedMaxHeight,
              ]}
              bounces={false}
            >
              <QuoteCast cast={cast} inversedTextColors={false} />
            </Animated.ScrollView>
          );
        }

        if (
          typeof messageMetadata.groupInvites !== 'undefined' &&
          messageMetadata.groupInvites.length !== 0
        ) {
          const groupInvite = messageMetadata.groupInvites[0];

          return (
            <View style={[t.wFull, t.bgDefault, { borderRadius: 8 }]}>
              <DirectCastGroupInviteEmbeds groupInviteEmbeds={[groupInvite]} />
            </View>
          );
        }

        if (
          !omitUrlPreview &&
          typeof messageMetadata.urls !== 'undefined' &&
          messageMetadata.urls.length !== 0
        ) {
          const urlEmbed = messageMetadata.urls[0];

          if (isSnapEmbed(urlEmbed)) {
            return (
              <View style={[t.wFull, t.bgDefault, { borderRadius: 8 }]}>
                <SnapEmbedAttachment embed={urlEmbed} />
              </View>
            );
          }

          return (
            <View style={[t.wFull, t.bgDefault, { borderRadius: 8 }]}>
              <DirectCastsOpenGraphCastAttachment
                urlEmbed={urlEmbed}
                disabled={true}
                variant="direct-cast"
                layout={urlEmbedDisplayMode === 'large' ? 'large' : 'compact'}
              />
            </View>
          );
        }

        if (
          omitUrlPreview &&
          typeof messageMetadata.urls !== 'undefined' &&
          messageMetadata.urls.length !== 0
        ) {
          return (
            <Text style={[t.textSm, t.texts.secondary]}>
              Link preview removed for send
            </Text>
          );
        }

        if (messageMetadata.medias && messageMetadata.medias.length !== 0) {
          const { staticRaster, width, height } = messageMetadata.medias[0];
          return (
            <Image
              source={{ uri: staticRaster, headers: imageRequestHeaders }}
              recyclingKey={staticRaster}
              cachePolicy="memory-disk"
              style={[
                t.flex,
                {
                  width: '100%',
                  maxHeight: 100,
                  aspectRatio: getImageAspectRatio({
                    w: width,
                    h: height,
                  }),
                },
              ]}
            />
          );
        }

        if (messageMetadata.videos && messageMetadata.videos.length !== 0) {
          const { url, thumbnailUrl, width, height } =
            messageMetadata.videos[0];
          if (width !== undefined && height !== undefined) {
            return (
              <DirectCastVideoPreview
                url={url}
                thumbnailUrl={thumbnailUrl}
                width={width}
                height={height}
                videoStyle={{ maxHeight: 100 }}
              />
            );
          }
        }

        return null;
      }, [
        animatedMaxHeight,
        fetchingMetadata,
        messageMetadata,
        omitUrlPreview,
        t.bgDefault,
        t.flex,
        t.flexGrow,
        t.h24,
        t.textSm,
        t.texts.secondary,
        t.wFull,
        urlEmbedDisplayMode,
      ]);

      const opacity = useSharedValue(0);
      const translateY = useSharedValue(50);

      React.useEffect(() => {
        opacity.value = withTiming(1, { duration: 350 });
        translateY.value = withSpring(0, {
          stiffness: 450,
          damping: 30,
        });
      }, [opacity, translateY]);

      const animatedStyle = useAnimatedStyle(() => {
        return {
          opacity: opacity.value,
          transform: [{ translateY: translateY.value }],
        };
      });

      if (embeds === null) {
        return null;
      }

      return (
        <Animated.View
          style={[
            animatedStyle,
            t.wFull,
            t.itemsCenter,
            t.justifyCenter,
            t.mT2,
            t.pX3,
          ]}
          pointerEvents={'none'}
        >
          <View style={[{ borderRadius: 12 }, t.overflowHidden, t.wFull]}>
            {embeds}
          </View>
        </Animated.View>
      );
    },
  );

DirectCastsComposerEmbedPreviews.displayName =
  'DirectCastsComposerEmbedPreviews';

export { DirectCastsComposerEmbedPreviews };
