import { Image } from 'expo-image';
import { ApiCastImageEmbed, ApiMediaV2 } from 'farcaster-client-data';
import {
  CastClickType,
  processMediasForRendering,
  useTelemetry,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import React from 'react';
import { InteractionManager, PixelRatio, View } from 'react-native';
import {
  measure,
  MeasuredDimensions,
  runOnJS,
  runOnUI,
  useAnimatedRef,
} from 'react-native-reanimated';

import { CastImageThumbnail } from '~/components/casts/CastImageThumbnail';
import { imageRequestHeaders } from '~/constants/Images';
import { useLightbox } from '~/contexts/LightboxProvider';

const ImageAttachments = React.memo(
  ({
    images,
    castHash,
    focusedCastMode,
    height,
    width,
    maxWidth,
    maxWidthToApplyForHighAr,
    ignoreAspectRatio,
  }: {
    images: ApiCastImageEmbed[];
    castHash?: string;
    focusedCastMode: boolean;
    width?: number;
    height?: number;
    maxWidth?: number;
    maxWidthToApplyForHighAr: number;
    ignoreAspectRatio: boolean;
  }) => {
    const telemetry = useTelemetry();

    const mediaImageEmbeds = React.useMemo(
      () =>
        images.map((image) => {
          if (typeof image.media !== 'undefined') {
            return image.media as ApiMediaV2;
          }
          return {
            version: '2',
            staticRaster: image.url,
            height: 1000,
            width: 1000,
          } satisfies ApiMediaV2;
        }),
      [images],
    );

    const imagesToRender = React.useMemo(() => {
      const startTime = Date.now();
      const result = processMediasForRendering({
        medias: mediaImageEmbeds,
        pixelDensity: PixelRatio.get(),
        blockAnimated: false,
        useLowQualityImages: false,
      });
      telemetry.maybeAddFrameDroppingAction(
        'farcaster-mobile.ImageAttachments.processMediasForRendering',
        Date.now() - startTime,
      );
      return result;
    }, [mediaImageEmbeds, telemetry]);

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

    const trackCastClick = useTrackCastClick();
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
        trackCastClick({ type: CastClickType.Image });
        runOnUI(() => {
          'worklet';
          const rects: (MeasuredDimensions | null)[] = [];
          for (const ref of refs) {
            rects.push(measure(ref));
          }
          runOnJS(openLightbox)({
            images: imagesToRender.map((image, index) => ({
              ...image,
              rect: rects[index],
            })),
            index: initialIndex,
          });
        })();
      },
      [imagesToRender, openLightbox, trackCastClick, refs],
    );

    return (
      <>
        {mediaImageEmbeds.map((media, imageIndex) => {
          return (
            <CastImageThumbnail
              key={imageIndex}
              carouselIndex={imageIndex}
              media={media}
              castHash={castHash}
              slimQuoteCastEmbed={false}
              quoteCastEmbed={false}
              focusedCastEmbed={focusedCastMode}
              height={imageIndex === 0 && !height ? undefined : height}
              width={imageIndex === 0 && width ? width : undefined}
              maxWidth={imageIndex === 0 && maxWidth ? maxWidth : undefined}
              maxWidthToApplyForHighAr={maxWidthToApplyForHighAr}
              ignoreAspectRatio={ignoreAspectRatio}
              onPressIn={preloadImages}
              onPress={() => showLightbox(imageIndex)}
              ref={refs[imageIndex]}
            />
          );
        })}
      </>
    );
  },
);

ImageAttachments.displayName = 'ImageAttachments';

export { ImageAttachments };
