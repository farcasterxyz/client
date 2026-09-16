import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LoadingIndicator } from 'farcaster-expo';
import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { RemoteImage } from '~/components/RemoteImage';
import { useLightbox } from '~/contexts/LightboxProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  prefetchAllVariants,
  useOptimisticUploadCloudflareImage,
} from '~/hooks/data/useOptimisticUploadCloudflareImage';
import { trackError } from '~/utils/ErrorUtils';
import {
  compressImage,
  manuallyFetchDimensions,
  manuallyFetchedDimension,
} from '~/utils/ImageUtils';

export const coverImageHeight = 140;

export type ImageUploaderInterface = {
  startHeaderImageUpload: () => void;
};

type HeaderImageProps = {
  currentImageUrl: string | undefined;
  onImageChange:
    | (({ imageUrl }: { imageUrl: string }) => Promise<void>)
    | undefined;
  viewerCanUpdate: boolean;
  disabled: boolean;
  imageUploaderRef: React.Ref<ImageUploaderInterface>;
  defaultImageSource?: string | undefined;
};

const HeaderImage: React.FC<HeaderImageProps> = React.memo(
  ({
    currentImageUrl,
    onImageChange,
    viewerCanUpdate,
    disabled,
    imageUploaderRef,
    defaultImageSource,
  }) => {
    const t = useTheme();
    const toast = useToast();
    const uploadImageToCloudflare = useOptimisticUploadCloudflareImage();

    const { openLightbox } = useLightbox();

    const [uploading, setUploading] = React.useState<boolean>(false);

    const openPicker = React.useCallback(async () => {
      let response: ImagePicker.ImagePickerResult | undefined;
      try {
        response = await ImagePicker.launchImageLibraryAsync({
          exif: false,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: Platform.OS === 'android' ? 1 : 0.8,
          aspect: [3, 1],
          legacy: true,
        });
      } catch (e) {
        trackError(e);
        toast.show('Failed to pick image', { type: 'danger' });
        return;
      }

      return (response?.assets ?? [])
        .slice(0, 1)
        .filter((asset) => {
          if (
            !asset.mimeType?.startsWith('image/') ||
            (!asset.mimeType?.endsWith('jpeg') &&
              !asset.mimeType?.endsWith('jpg') &&
              !asset.mimeType?.endsWith('png'))
          ) {
            // ERR: Unsupported pfp type
            return false;
          }
          return true;
        })
        .map((image) => ({
          mime: 'image/jpeg',
          height: image.height,
          width: image.width,
          path: image.uri,
          size: image.fileSize,
        }));
    }, [toast]);

    const onUploadHeaderImagePress = React.useCallback(async () => {
      if (!viewerCanUpdate) {
        return;
      }

      const items = await openPicker();
      const image = items?.[0];
      if (!image) {
        return;
      }

      setUploading(true);

      try {
        const compressedImage = await compressImage({
          source: {
            path: image.path,
            height: image.height,
            width: image.width,
          },
        });

        const result = await uploadImageToCloudflare({
          uri: compressedImage.uri,
          name: 'onboarding-user-avatar-v2',
        });

        if (typeof result === 'undefined') {
          setUploading(false);
          throw 'Failed to upload banner image';
        }

        await result.uploadPromise.then(async (r) => {
          const response: { success: boolean; result: { variants: string[] } } =
            await r.json();

          if (
            typeof response === 'undefined' ||
            !response.success ||
            typeof response.result.variants === 'undefined' ||
            response.result.variants.length === 0
          ) {
            throw new Error('Cloudflare failed to upload image');
          }

          void prefetchAllVariants({ variants: response.result.variants });
        });

        if (typeof onImageChange === 'function') {
          await onImageChange({ imageUrl: result.imageUrl });
        }
      } catch {
        setUploading(false);
      } finally {
        setUploading(false);
      }
    }, [onImageChange, openPicker, uploadImageToCloudflare, viewerCanUpdate]);

    const onHeaderImagePress = React.useCallback(async () => {
      if (viewerCanUpdate) {
        onUploadHeaderImagePress();
        return;
      }
      if (typeof currentImageUrl === 'undefined') {
        return;
      }
      // V2 lightbox needs a non-zero `width` so Android pinch / pan /
      // double-tap gestures don't early-return, and a real aspect ratio so
      // the max-zoom math is correct. Use the cached dimension if we have
      // one, otherwise resolve via Image.getSize before opening.
      const cached = manuallyFetchedDimension({ uri: currentImageUrl });
      const dims =
        cached ?? (await manuallyFetchDimensions({ uri: currentImageUrl }));
      const width = dims.width > 0 ? dims.width : 1080;
      const aspectRatio =
        dims.width > 0 && dims.height > 0 ? dims.width / dims.height : 3;
      openLightbox({
        images: [
          {
            original: currentImageUrl,
            thumbnail: currentImageUrl,
            aspectRatio,
            width,
            rect: null,
          },
        ],
        index: 0,
      });
    }, [
      currentImageUrl,
      onUploadHeaderImagePress,
      openLightbox,
      viewerCanUpdate,
    ]);

    React.useImperativeHandle(
      imageUploaderRef,
      () =>
        ({
          startHeaderImageUpload: onHeaderImagePress,
        }) satisfies ImageUploaderInterface,
    );

    if (uploading) {
      return (
        <View
          style={[
            t.wFull,
            t.bgLightPurple,
            t.itemsCenter,
            t.justifyCenter,
            { aspectRatio: 3 / 1 },
          ]}
        >
          <LoadingIndicator size="large" />
        </View>
      );
    }

    if (disabled && typeof currentImageUrl === 'undefined') {
      return (
        <View style={[t.wFull, t.bgLightPurple]}>
          <Image
            style={[t.wFull, { aspectRatio: 3 / 1 }]}
            source={defaultImageSource}
            contentFit="cover"
            contentPosition="bottom center"
          />
        </View>
      );
    }

    if (disabled && typeof currentImageUrl !== 'undefined') {
      return (
        <View style={[t.wFull, t.bgLightPurple]}>
          <RemoteImage
            uri={currentImageUrl}
            contentFit="cover"
            contentPosition="bottom"
            style={[
              t.wFull,
              {
                aspectRatio: 3 / 1,
              },
            ]}
          />
        </View>
      );
    }

    if (typeof currentImageUrl === 'undefined') {
      return (
        <Pressable
          onPress={onUploadHeaderImagePress}
          style={[t.wFull, t.bgLightPurple]}
        >
          <Image
            style={[t.wFull, { aspectRatio: 3 / 1 }]}
            source={defaultImageSource}
            contentFit="cover"
            contentPosition="bottom center"
          />
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={onHeaderImagePress}
        style={[t.wFull, t.bgLightPurple]}
      >
        <RemoteImage
          uri={currentImageUrl}
          contentFit="cover"
          contentPosition="center"
          style={[
            t.wFull,
            {
              aspectRatio: 3 / 1,
            },
          ]}
        />
      </Pressable>
    );
  },
);

HeaderImage.displayName = 'HeaderImage';

export { HeaderImage };
