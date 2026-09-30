import { Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ImagePickerAsset } from 'expo-image-picker';
import { ApiDirectCastMessageMetadata } from 'farcaster-client-data';
import { getImageAspectRatio } from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React from 'react';
import { Keyboard, Pressable, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import { AutocorrectableTextInput } from '~/components/TextInput/AutocorrectableTextInput';
import { AutocorrectableTextInputRef } from '~/components/TextInput/AutocorrectableTextInputProps';
import { imageRequestHeaders } from '~/constants/Images';
import { hitSlop } from '~/constants/Pressable';
import { useBottomTab } from '~/contexts/BottomTabProvider';
import {
  AssetToImageUrlUpdateCallback,
  useDirectCastsImagePreview,
} from '~/contexts/DirectCastsImageUploadPreviewProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { trackError } from '~/utils/ErrorUtils';
import {
  compressImage,
  optimisticallySetFetchedDimension,
} from '~/utils/ImageUtils';

const MemoizedImage = React.memo(Image);

const ImagePreview = ({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) => {
  const t = useTheme();

  const imageSource = React.useMemo(
    () => ({ uri, headers: imageRequestHeaders }),
    [uri],
  );

  const imageStyle = React.useMemo(
    () => [
      t.flex,
      {
        width: '100%',
        aspectRatio: getImageAspectRatio({
          w: width,
          h: height,
        }),
      },
    ],
    [t.flex, width, height],
  );

  return (
    <MemoizedImage
      source={imageSource}
      recyclingKey={uri}
      cachePolicy="memory-disk"
      style={imageStyle}
    />
  );
};

const CaptionInput = React.forwardRef<
  AutocorrectableTextInputRef,
  {
    value: string;
    onChange: (text: string) => void;
    placeholderTextColor: string;
  }
>(({ value, onChange, placeholderTextColor }, ref) => {
  const t = useTheme();

  return (
    <View style={[t.flexGrow, t.roundedLg, t.mX2, t.mY1, t.mB4, t.bgBlack]}>
      <AutocorrectableTextInput
        style={[
          t.textBase,
          { color: '#ffffff' },
          t.bgTransparent,
          t.borderDefault,
          t.borderHairline,
          t.p2,
          t.roundedLg,
          {
            paddingTop: sizes.s2,
            // Android requires a height set otherwise it will collapse
            minHeight: 36,
            maxHeight: 30 * 3,
            textAlignVertical: 'top',
          },
        ]}
        autoFocus={false}
        autoCapitalize="none"
        value={value}
        onChangeText={onChange}
        multiline={false}
        placeholder={'Add a caption...'}
        placeholderTextColor={placeholderTextColor}
        ref={ref}
      />
    </View>
  );
});

CaptionInput.displayName = 'CaptionInput';

const HeaderOverlay = React.memo(({ onCancel }: { onCancel: () => void }) => {
  const t = useTheme();

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.pX2,
        t.absolute,
        t.h12,
        t.directCasts.bgImagePreview,
        t.wFull,
        t.top0,
      ]}
    >
      <TouchableOpacity
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          t.h8,
          t.w8,
          t.mB1,
          t.mR1,
          { maxWidth: sizes.s8, backgroundColor: '#1a202c' },
        ]}
        hitSlop={hitSlop}
        onPress={onCancel}
        activeOpacity={0.75}
      >
        <Octicons name="x" size={20} style={[t.texts.light]} />
      </TouchableOpacity>
    </View>
  );
});

HeaderOverlay.displayName = 'HeaderOverlay';

const BottomOverlay = React.memo(
  ({
    conversationName,
    uploading,
    onUpload,
  }: {
    conversationName: string;
    uploading: boolean;
    onUpload: () => void;
  }) => {
    const t = useTheme();

    return (
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.pX2,
          t.absolute,
          t.h14,
          t.directCasts.bgImagePreview,
          t.wFull,
          t.bottom0,
        ]}
      >
        <View
          style={[
            t.h8,
            t.pX4,
            t.flex,
            t.flexRow,
            t.itemsCenter,
            { maxWidth: '80%', backgroundColor: '#1a202c', borderRadius: 24 },
          ]}
        >
          <Text numberOfLines={1} style={[t.texts.light]}>
            {conversationName}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyCenter,
            t.bgAction,
            t.roundedFull,
            t.h8,
            t.w8,
          ]}
          hitSlop={hitSlop}
          onPress={onUpload}
          activeOpacity={0.75}
        >
          {uploading ? (
            <LoadingIndicator />
          ) : (
            <Octicons
              name="paper-airplane"
              size={18}
              style={[t.texts.light, { paddingLeft: 2 }]}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

BottomOverlay.displayName = 'BottomOverlay';

const PlaintextDirectCastComposerImagePreview: React.FC = () => {
  const {
    conversationName,
    existingNormalizedText,
    selectedAsset,
    reset,
    triggerAssetToImageUrlCallback,
    resetAssetCallback,
  } = useDirectCastsImagePreview();

  if (
    typeof selectedAsset === 'undefined' ||
    typeof conversationName === 'undefined' ||
    typeof existingNormalizedText === 'undefined' ||
    typeof triggerAssetToImageUrlCallback === 'undefined'
  ) {
    return <></>;
  }

  return (
    <PlaintextDirectCastComposerImagePreviewContent
      asset={selectedAsset}
      conversationName={conversationName}
      existingNormalizedText={existingNormalizedText}
      onCancelImageSend={() => {
        if (typeof resetAssetCallback !== 'undefined') {
          resetAssetCallback();
        }
        reset();
      }}
      onImageUrlFetched={triggerAssetToImageUrlCallback}
    />
  );
};

type PlaintextDirectCastComposerImagePreviewContentProps = {
  conversationName: string;
  existingNormalizedText: string;
  asset: ImagePickerAsset;
  onImageUrlFetched: AssetToImageUrlUpdateCallback;
  onCancelImageSend: () => void;
};

const PlaintextDirectCastComposerImagePreviewContent: React.FC<
  PlaintextDirectCastComposerImagePreviewContentProps
> = ({
  conversationName,
  existingNormalizedText,
  asset,
  onImageUrlFetched,
  onCancelImageSend,
}) => {
  const t = useTheme();
  const toast = useRootToast();
  const { top } = useSafeAreaInsets();
  const { bottomTabBarHeight } = useBottomTab();

  const [directCastMessage, setDirectCastMessage] = React.useState<string>(
    existingNormalizedText,
  );

  const [uploading, setUploading] = React.useState<boolean>(false);

  const uploadImageToCloudflare = useUploadCloudflareImage();

  const autocorrectableTextInputRef =
    React.useRef<AutocorrectableTextInputRef | null>(null);

  const upload = React.useCallback(async () => {
    setUploading(true);

    const autocorrectableTextInput = autocorrectableTextInputRef.current;
    if (!autocorrectableTextInput) {
      throw new Error('autocorrectableTextInput should be set in upload()');
    }
    const captionTextPromise = autocorrectableTextInput.getValue();

    try {
      const compressedImageAsset = await compressImage({
        source: {
          path: asset.uri,
          height: asset.height,
          width: asset.width,
        },
      });

      const result = await uploadImageToCloudflare({
        uri: compressedImageAsset.uri,
        name: 'direct-cast-image',
      });

      if (typeof result === 'undefined') {
        throw 'Failed to upload image';
      }

      if (typeof result !== 'undefined') {
        optimisticallySetFetchedDimension({
          uri: result.imageUrl,
          dimensions: {
            width: asset.width,
            height: asset.height,
          },
        });

        Image.prefetch([result.imageUrl], {
          headers: imageRequestHeaders,
          cachePolicy: 'memory-disk',
        });

        const imageUrl = result.imageUrl;
        const imageMetadata: ApiDirectCastMessageMetadata = {
          medias: [
            {
              height: asset.height,
              width: asset.width,
              staticRaster: imageUrl,
              version: '2',
            },
          ],
        };

        const captionText = await captionTextPromise;
        const message =
          captionText.trim() !== ''
            ? `${result.imageUrl} ${captionText.trim()}`
            : result.imageUrl;

        await onImageUrlFetched({
          message: message,
          metadata: imageMetadata,
        });
      }
    } catch (e) {
      toast.show('Failed to upload image', { type: 'danger' });

      trackError(e);
    } finally {
      setUploading(false);
    }
  }, [
    asset.height,
    asset.uri,
    asset.width,
    onImageUrlFetched,
    toast,
    uploadImageToCloudflare,
  ]);

  const { isVisible: keyboardIsVisible, keyboardHeight } =
    useKeyboardVisibility();

  return (
    <View
      style={[
        t.absolute,
        t.bgBlack,
        t.hFull,
        t.wFull,
        t.top0,
        {
          paddingTop: top,
          paddingBottom: keyboardIsVisible
            ? keyboardHeight
            : bottomTabBarHeight,
        },
      ]}
    >
      <View style={[t.relative, t.overflowHidden, t.flexGrow, t.justifyCenter]}>
        <View style={[t.overflowHidden, { maxHeight: '100%' }]}>
          <ImagePreview
            uri={asset.uri}
            width={asset.width}
            height={asset.height}
          />
          {keyboardIsVisible && (
            <Pressable
              style={[
                t.absolute,
                t.wFull,
                t.hFull,
                t.directCasts.bgImagePreview,
              ]}
              onPress={() => Keyboard.dismiss()}
            />
          )}
        </View>
        <HeaderOverlay onCancel={onCancelImageSend} />
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.absolute,
            t.wFull,
            t.bottom0,
            t.mB14,
          ]}
        >
          <CaptionInput
            value={directCastMessage}
            onChange={setDirectCastMessage}
            placeholderTextColor={t.colors.text.tertiary}
            ref={autocorrectableTextInputRef}
          />
        </View>
        <BottomOverlay
          conversationName={conversationName}
          uploading={uploading}
          onUpload={upload}
        />
      </View>
    </View>
  );
};

PlaintextDirectCastComposerImagePreview.displayName =
  'PlaintextDirectCastComposerImagePreview';

export { PlaintextDirectCastComposerImagePreview };
