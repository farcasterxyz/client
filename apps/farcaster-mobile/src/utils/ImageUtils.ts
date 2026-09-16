import {
  ImageManipulator,
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  useFetchImageUploadUrl,
  useTelemetry,
  WARPCAST_CLOUDFLARE_CDN_PREFIX,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';
import { Alert, Image, Platform } from 'react-native';
import { Image as ImageCompressor } from 'react-native-compressor';

import { trackError } from './ErrorUtils';
import { enqueueImageUploadUrlReservation } from './imageUploadUrlReservation';
import { openWarpcastSettings } from './UrlUtils';
import { ensureLocalFile } from './VideoUtils';

const WRPCDN_PREFIX = 'https://wrpcd.net/cdn-cgi/image';
const WRPCDN_REGEX =
  /^https:\/\/wrpcd.net\/cdn-cgi\/image\/(?<options>[^/]+)\/(?<originalUrl>.*)$/;

const TELEMETRY_EVENT_IMAGE_UPLOAD = 'images:upload';
const TELEMETRY_EVENT_IMAGE_UPLOAD_ERROR = 'images:upload:error';
const CLOUDFLARE_ANIMATION_TOO_LARGE_ERROR_CODE = 5443;
const IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE =
  'This GIF is too large to upload. Try a lower-resolution or shorter GIF.';

const uncloudifyUrl = (maybeCloudflareUrl: string) => {
  if (!maybeCloudflareUrl.startsWith(WRPCDN_PREFIX)) {
    return;
  }

  const match = maybeCloudflareUrl.match(WRPCDN_REGEX);
  if (match?.groups?.originalUrl) {
    return decodeURIComponent(match.groups.originalUrl);
  }

  return;
};

const removeBase64EncodingPrefix = (base64Data: string) =>
  base64Data.replace(/^data:.*;base64,/, '');

const requestMediaLibraryPermissions = async () => {
  if (Platform.OS === 'ios') {
    const cameraRollStatus =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    // Instead of checking `granted` we will check the privilidge as limited
    // iOS access should be sufficient enough.
    if (
      typeof cameraRollStatus.accessPrivileges === 'undefined' ||
      cameraRollStatus.accessPrivileges === 'none'
    ) {
      Alert.alert(
        'Farcaster needs permission to access your photos',
        undefined,
        [
          {
            text: 'Cancel',
          },
          {
            text: 'Open settings',
            onPress: openWarpcastSettings,
          },
        ],
      );
      throw new Error('Camera access not granted');
    }
  }
};

type ManuallySetDimensions = {
  width: number;
  height: number;
};

const SIZE_CACHE_MAX = 500;
const sizeCache: Map<string, ManuallySetDimensions> = new Map();
const activeRequests: Map<string, Promise<ManuallySetDimensions>> = new Map();

const sizeCacheSet = (uri: string, dims: ManuallySetDimensions) => {
  if (sizeCache.size >= SIZE_CACHE_MAX && !sizeCache.has(uri)) {
    const oldest = sizeCache.keys().next().value;
    if (oldest !== undefined) sizeCache.delete(oldest);
  }
  sizeCache.set(uri, dims);
};

const optimisticallySetFetchedDimension = ({
  uri,
  dimensions,
}: {
  uri: string;
  dimensions: ManuallySetDimensions;
}): void => {
  sizeCacheSet(uri, dimensions);
};

const manuallyFetchedDimension = ({
  uri,
}: {
  uri: string;
}): ManuallySetDimensions | undefined => {
  return sizeCache.get(uri);
};

const manuallyFetchDimensions = async ({
  uri,
}: {
  uri: string;
}): Promise<ManuallySetDimensions> => {
  const existingManuallySetDims = sizeCache.get(uri);
  if (existingManuallySetDims) {
    return existingManuallySetDims;
  }

  const existingPromiseOrCacheRes =
    activeRequests.get(uri) ||
    new Promise<ManuallySetDimensions>((resolve) => {
      Image.getSize(
        uri,
        (width: number, height: number) => resolve({ width, height }),
        () => {
          resolve({ width: 0, height: 0 });
        },
      );
    });

  activeRequests.set(uri, existingPromiseOrCacheRes);
  const res = await existingPromiseOrCacheRes;
  activeRequests.delete(uri);
  sizeCacheSet(uri, res);
  return res;
};

const getMinutesSecondsFromMilliseconds = (ms: number) => {
  // Ignore if we are trying to parse seconds from cases like these with
  // a "proper" default.
  if (ms < 0) {
    return '0:00';
  }

  const totalSeconds = ms / 1000;
  const seconds = String(Math.floor(totalSeconds % 60));
  const minutes = String(Math.floor(totalSeconds / 60));

  return minutes.padStart(1, '0') + ':' + seconds.padStart(2, '0');
};

export const IMAGE_EMBED_MAX_DIMENSIONS = {
  width: 2000,
  height: 2000,
  size: 5000000,
};

function containImageRes(
  w: number,
  h: number,
): [width: number, height: number] {
  let scale = 1;

  const { width: maxWidth, height: maxHeight } = IMAGE_EMBED_MAX_DIMENSIONS;
  if (w > maxWidth || h > maxHeight) {
    scale = w > h ? maxWidth / w : maxHeight / h;
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }

  return [w, h];
}

function getDataUriSize(uri: string): number {
  return Math.round((uri.length * 3) / 4);
}

function getFileExtension(value: string | undefined): string | undefined {
  if (typeof value === 'undefined') {
    return;
  }

  const cleanValue = value.split('?')[0]?.split('#')[0];
  const fileName = cleanValue?.split('/').pop();
  const extension = fileName?.split('.').pop()?.toLowerCase();

  return extension === fileName ? undefined : extension;
}

function getUploadImageFileInfo({
  uri,
  name,
  mimeType,
}: {
  uri: string;
  name: string;
  mimeType: string | undefined;
}): {
  fileName: string;
  fileType: string;
  possiblyGif: boolean;
} {
  const normalizedMimeType = mimeType?.toLowerCase();
  const fileExtension = getFileExtension(name) ?? getFileExtension(uri);
  const possiblyGif =
    normalizedMimeType?.includes('gif') === true || fileExtension === 'gif';

  if (possiblyGif) {
    return {
      fileName: getFileExtension(name) === 'gif' ? name : `${name}.gif`,
      fileType:
        normalizedMimeType?.includes('gif') === true ? mimeType! : 'image/gif',
      possiblyGif,
    };
  }

  return {
    fileName:
      typeof getFileExtension(name) === 'undefined' ? `${name}.jpg` : name,
    fileType: 'image/jpeg',
    possiblyGif,
  };
}

type CloudflareImagesErrorResponse = {
  errors?: { code?: number; message?: string }[];
};

async function safelyReadResponseBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function getCloudflareImagesUploadErrorMessage(
  responseBody: string,
): string | undefined {
  try {
    const parsed = JSON.parse(responseBody) as CloudflareImagesErrorResponse;
    const animationTooLargeError = parsed.errors?.find(
      (error) => error.code === CLOUDFLARE_ANIMATION_TOO_LARGE_ERROR_CODE,
    );

    if (typeof animationTooLargeError !== 'undefined') {
      return IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE;
    }

    return parsed.errors?.find((error) => error.message)?.message;
  } catch {
    return;
  }
}

function isUserFacingImageUploadError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (error.message === IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE ||
      error.name === 'CloudflareImagesUploadError')
  );
}

function trackUnexpectedImageUploadError(error: unknown) {
  if (!isUserFacingImageUploadError(error)) {
    trackError(error);
  }
}

type CompressedImage = {
  uri: string;
  width: number;
  height: number;
};

async function compressImage({
  source,
}: {
  source: {
    path: string;
    width: number;
    height: number;
  };
}): Promise<CompressedImage> {
  const [w, h] = containImageRes(source.width, source.height);

  // This should allow us to transform with scales instead of just doing a
  // single heavy one.
  for (let i = 10; i > 0; i--) {
    // Float precision
    const factor = i / 10;

    const res = await manipulateAsync(
      source.path,
      [{ resize: { width: w, height: h } }],
      {
        compress: factor,
        format: SaveFormat.JPEG,
        base64: true,
      },
    );

    const base64 = res.base64;

    if (
      base64 !== undefined &&
      getDataUriSize(base64) <= IMAGE_EMBED_MAX_DIMENSIONS.size
    ) {
      return {
        uri: res.uri,
        width: res.width,
        height: res.height,
      };
    }
  }

  throw new Error(`Unable to transform image`);
}

function useUploadImage(): ({
  uri,
  height,
  width,
  name,
  mimeType,
}: {
  uri: string;
  height: number;
  width: number;
  name: string;
  mimeType: string | undefined;
}) => Promise<string> {
  const { startAction, stopAction, addAction } = useTelemetry();

  const fetchImageUploadUrl = useFetchImageUploadUrl();

  return useCallback(
    async ({
      uri,
      name,
      mimeType,
    }: {
      uri: string;
      height: number;
      width: number;
      name: string;
      mimeType: string | undefined;
    }) => {
      try {
        const uploadStart = Date.now();

        startAction(TELEMETRY_EVENT_IMAGE_UPLOAD, undefined, uploadStart);

        const imageUploaderPromise = await enqueueImageUploadUrlReservation(
          () => fetchImageUploadUrl(),
        );

        const imageUploadUrl = imageUploaderPromise.url;
        const imageUrl = `${WARPCAST_CLOUDFLARE_CDN_PREFIX}/${imageUploaderPromise.optimisticImageId}/original`;

        const { uri: fileMovedToAppUri } = await ensureLocalFile(uri);

        let rotatedUri = fileMovedToAppUri;

        const { fileName, fileType, possiblyGif } = getUploadImageFileInfo({
          uri,
          name,
          mimeType,
        });

        // On Android (specifically Samsung) EXIF rotation is causing headaches when we compress
        // images later before uploading to Cloudflare. Alternatively we could start reading EXIF
        // from image picker but its very slow on Android so we will manually apply rotate here and
        // compression later is applied to correct orientation of image always.
        if (!possiblyGif && Platform.OS === 'android') {
          const imageManipulator =
            ImageManipulator.manipulate(fileMovedToAppUri);
          imageManipulator.rotate(0);
          const image = await imageManipulator.renderAsync();
          const rotatedImage = await image.saveAsync();
          rotatedUri = rotatedImage.uri;
        }

        const compressedImageAssetUri = possiblyGif
          ? undefined
          : await ImageCompressor.compress(rotatedUri, {
              compressionMethod: 'manual',
              maxWidth: 2000,
              maxHeight: 2000,
            });

        const fileUri = possiblyGif
          ? fileMovedToAppUri
          : compressedImageAssetUri;

        const file = {
          uri: fileUri,
          type: fileType,
          name: fileName,
        };

        const body = new FormData();
        body.append('file', file as unknown as File);

        try {
          const response = await fetch(imageUploadUrl, {
            method: 'POST',
            body,
          });

          if (!response.ok) {
            const responseBody = await safelyReadResponseBody(response);
            const cloudflareErrorMessage =
              getCloudflareImagesUploadErrorMessage(responseBody);
            const uploadError = new Error(
              cloudflareErrorMessage ?? 'Cloudflare failed to accept the image',
            );
            uploadError.name = 'CloudflareImagesUploadError';

            if (
              uploadError.message !== IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE
            ) {
              trackError(
                JSON.stringify({
                  ok: response.ok,
                  status: response.status,
                  statusText: response.statusText,
                  body: responseBody,
                }),
              );
            }

            addAction(TELEMETRY_EVENT_IMAGE_UPLOAD_ERROR, {
              error: JSON.stringify({
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                body: responseBody,
              }),
              message:
                'Cloudflare failed to accept the image - response not ok',
            });

            throw uploadError;
          }
        } catch (error) {
          trackUnexpectedImageUploadError(error);

          addAction(TELEMETRY_EVENT_IMAGE_UPLOAD_ERROR, {
            error,
            message: 'Cloudflare failed to accept the image',
          });

          if (isUserFacingImageUploadError(error)) {
            throw error;
          }

          throw new Error('Cloudflare failed to accept the image');
        }

        stopAction(TELEMETRY_EVENT_IMAGE_UPLOAD, {
          imageUrl,
          duration: Date.now() - uploadStart,
        });

        return imageUrl;
      } catch (error) {
        trackUnexpectedImageUploadError(error);

        addAction(TELEMETRY_EVENT_IMAGE_UPLOAD_ERROR, {
          error,
          message: 'Failed to upload image - non-Cloudflare',
        });

        if (isUserFacingImageUploadError(error)) {
          throw error;
        }

        throw new Error('Failed to upload image - non-Cloudflare');
      }
    },
    [addAction, fetchImageUploadUrl, startAction, stopAction],
  );
}

export {
  compressImage,
  getMinutesSecondsFromMilliseconds,
  IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE,
  manuallyFetchDimensions,
  manuallyFetchedDimension,
  ManuallySetDimensions,
  optimisticallySetFetchedDimension,
  removeBase64EncodingPrefix,
  requestMediaLibraryPermissions,
  TELEMETRY_EVENT_IMAGE_UPLOAD_ERROR,
  uncloudifyUrl,
  useUploadImage,
};

// Re-export standardized image URL functions from farcaster-expo
export {
  getStandardizedAvatarUrl,
  getStandardizedEmbedImageUrl,
} from 'farcaster-expo';
