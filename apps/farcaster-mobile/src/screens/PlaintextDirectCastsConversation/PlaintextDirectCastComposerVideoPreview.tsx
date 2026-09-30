import { Octicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ImagePickerAsset } from 'expo-image-picker';
import {
  ApiDirectCastMessageMetadata,
  ApiPrepareVideoUpload200Response,
} from 'farcaster-client-data';
import {
  useAbandonVideoUpload,
  useGetVideoState,
  usePrepareVideoUpload,
  VideoUploadError,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Upload } from 'tus-js-client';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useBottomTab } from '~/contexts/BottomTabProvider';
import {
  AssetToVideoUrlUpdateCallback,
  useDirectCastsVideoPreview,
} from '~/contexts/DirectCastsVideoUploadPreviewProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { trackError } from '~/utils/ErrorUtils';

import { DirectCastVideoPreview } from './DirectCastVideoPreview';

const MemoizedDirectCastVideoPreview = React.memo(DirectCastVideoPreview);

const createVideoUploadTraceId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `video-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const PlaintextDirectCastComposerVideoPreview: React.FC = () => {
  const {
    conversationName,
    existingNormalizedText,
    selectedAsset,
    reset,
    triggerAssetToVideoUrlCallback,
    resetAssetCallback,
  } = useDirectCastsVideoPreview();

  if (
    typeof selectedAsset === 'undefined' ||
    typeof conversationName === 'undefined' ||
    typeof existingNormalizedText === 'undefined' ||
    typeof triggerAssetToVideoUrlCallback === 'undefined'
  ) {
    return <></>;
  }

  return (
    <PlaintextDirectCastComposerVideoPreviewContent
      asset={selectedAsset}
      conversationName={conversationName}
      existingNormalizedText={existingNormalizedText}
      onCancelVideoSend={() => {
        if (typeof resetAssetCallback !== 'undefined') {
          resetAssetCallback();
        }
        reset();
      }}
      onVideoUrlFetched={triggerAssetToVideoUrlCallback}
    />
  );
};

type PlaintextDirectCastComposerVideoPreviewContentProps = {
  conversationName: string;
  existingNormalizedText: string;
  asset: ImagePickerAsset;
  onVideoUrlFetched: AssetToVideoUrlUpdateCallback;
  onCancelVideoSend: () => void;
};

const CaptionInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) => {
  const t = useTheme();

  return (
    <View style={[t.flexGrow, t.roundedLg, t.mX2, t.mY1, t.mB4, t.bgBlack]}>
      <TextInput
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
      />
    </View>
  );
};

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

const PlaintextDirectCastComposerVideoPreviewContent: React.FC<
  PlaintextDirectCastComposerVideoPreviewContentProps
> = ({
  conversationName,
  existingNormalizedText,
  asset,
  onVideoUrlFetched,
  onCancelVideoSend,
}) => {
  const t = useTheme();
  const toast = useRootToast();
  const { top } = useSafeAreaInsets();
  const { bottomTabBarHeight } = useBottomTab();

  const [directCastMessage, setDirectCastMessage] = React.useState<string>(
    existingNormalizedText,
  );

  const [uploading, setUploading] = React.useState<boolean>(false);

  const [activeUploadVideoInfo, setActiveUploadVideoInfo] = React.useState<
    ApiPrepareVideoUpload200Response['result'] | undefined
  >(undefined);
  const [activeUploadBlob, setActiveUploadBlob] = React.useState<
    Blob | undefined
  >(undefined);

  const prepareVideoUpload = usePrepareVideoUpload();
  const getVideoState = useGetVideoState();
  const abandonVideoUpload = useAbandonVideoUpload();

  const prepare = React.useCallback(async () => {
    const resp = await fetch(asset.uri);
    const blob = await resp.blob();
    const uploadTraceId = createVideoUploadTraceId();

    const videoInfo = await prepareVideoUpload({
      videoSizeBytes: blob.size,
      supportsDynamicUpload: true,
      clientUploadMetadata: {
        uploadTraceId,
        source: 'direct_cast_composer',
        platform: Platform.OS,
        blob: {
          size: blob.size,
          type: blob.type,
        },
        asset: {
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
          fileSize: asset.fileSize,
          type: asset.type,
        },
      },
    });

    setActiveUploadVideoInfo(videoInfo);

    setActiveUploadBlob(blob);
  }, [
    asset.duration,
    asset.fileSize,
    asset.height,
    asset.type,
    asset.uri,
    asset.width,
    prepareVideoUpload,
  ]);

  useFocusEffect(
    React.useCallback(() => {
      prepare();
    }, [prepare]),
  );

  const upload = React.useCallback(async () => {
    if (
      typeof activeUploadBlob === 'undefined' ||
      typeof activeUploadVideoInfo === 'undefined'
    ) {
      return;
    }

    setUploading(true);

    try {
      const videoId = activeUploadVideoInfo.videoId;

      const upload = new Upload(activeUploadBlob, {
        endpoint: activeUploadVideoInfo.uploadUrl,
        headers: activeUploadVideoInfo.headers as Record<string, string>,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filetype: (activeUploadBlob as File).type,
          name: (activeUploadBlob as File).name,
          uploadTraceId: activeUploadVideoInfo.uploadTraceId,
          ...(activeUploadVideoInfo.metadata as Record<string, string>),
        },
        chunkSize: 10485760,
        onError: function (error) {
          trackError(new VideoUploadError({ error }));

          setUploading(false);
        },
        onSuccess: async () => {
          const checkState = async () => {
            try {
              const video = await getVideoState({ videoId });

              if (
                video.state === 'ready' &&
                video.embed.width &&
                video.embed.height &&
                video.embed.thumbnailUrl
              ) {
                const videoMetadata: ApiDirectCastMessageMetadata = {
                  videos: [video.embed],
                };

                const message =
                  directCastMessage.trim() !== ''
                    ? `${video.embed.sourceUrl} ${directCastMessage.trim()}`
                    : video.embed.sourceUrl;

                await onVideoUrlFetched({
                  message: message,
                  metadata: videoMetadata,
                });

                setActiveUploadVideoInfo(undefined);

                setUploading(false);
              } else {
                if (video.state === 'failed') {
                  setUploading(false);
                } else if (video.state === 'processing') {
                  setTimeout(checkState, 1000);
                }
              }
            } catch (e: unknown) {
              setTimeout(checkState, 1000);

              trackError(new VideoUploadError({ error: e }));

              setUploading(false);
            }
          };

          checkState();
        },
      });

      upload.start();
    } catch (e) {
      toast.show('Failed to upload image', { type: 'danger' });

      trackError(e);

      setUploading(false);
    }
  }, [
    activeUploadBlob,
    activeUploadVideoInfo,
    directCastMessage,
    getVideoState,
    onVideoUrlFetched,
    toast,
  ]);

  const { isVisible: keyboardIsVisible, keyboardHeight } =
    useKeyboardVisibility();

  const handleCancel = React.useCallback(() => {
    if (typeof activeUploadVideoInfo !== 'undefined') {
      abandonVideoUpload({ videoId: activeUploadVideoInfo.videoId });
    }
    onCancelVideoSend();
  }, [activeUploadVideoInfo, abandonVideoUpload, onCancelVideoSend]);

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
          <View
            style={[t.relative, t.roundedLg, t.overflowHidden, t.bgDefault]}
          >
            <MemoizedDirectCastVideoPreview
              url={asset.uri}
              width={asset.width}
              height={asset.height}
            />
          </View>
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
        <HeaderOverlay onCancel={handleCancel} />
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

PlaintextDirectCastComposerVideoPreview.displayName =
  'PlaintextDirectCastComposerVideoPreview';

export { PlaintextDirectCastComposerVideoPreview };
