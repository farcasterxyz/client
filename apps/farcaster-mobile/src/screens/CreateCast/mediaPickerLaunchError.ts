import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type MediaPickerLaunchErrorReason =
  | 'ios_photos_asset_unavailable'
  | 'android_media_types_cast'
  | 'android_unregistered_launcher'
  | 'ios_unreadable_representation'
  | 'unknown';

type MediaPickerLaunchErrorInfo = {
  reason: MediaPickerLaunchErrorReason;
  userMessage: string;
};

const DEFAULT_MEDIA_PICKER_LAUNCH_ERROR_INFO: MediaPickerLaunchErrorInfo = {
  reason: 'unknown',
  userMessage: 'Failed to pick media',
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const getMediaPickerLaunchErrorInfo = (
  error: unknown,
): MediaPickerLaunchErrorInfo => {
  const message = getErrorMessage(error);

  if (message.includes('PHPhotosErrorDomain') && message.includes('3164')) {
    return {
      reason: 'ios_photos_asset_unavailable',
      userMessage:
        "Photos couldn't prepare that item. Try downloading it from iCloud first, or choose a different photo or video.",
    };
  }

  if (
    message.includes('ImagePickerOptions') ||
    (message.includes('Cannot cast') && message.includes('mediaTypes'))
  ) {
    return {
      reason: 'android_media_types_cast',
      userMessage:
        "We couldn't open your media picker on this app version. Please update Farcaster and try again.",
    };
  }

  if (message.includes('unregistered ActivityResultLauncher')) {
    return {
      reason: 'android_unregistered_launcher',
      userMessage:
        "The media picker wasn't ready. Close the composer and try again.",
    };
  }

  if (
    message.includes('Cannot load representation of type') ||
    message.includes('Failed to read picked image')
  ) {
    return {
      reason: 'ios_unreadable_representation',
      userMessage:
        "That photo format couldn't be read. Try saving it as a regular photo, or choose another item.",
    };
  }

  return DEFAULT_MEDIA_PICKER_LAUNCH_ERROR_INFO;
};

export const getMediaPickerMediaTypesForPlatform = (
  mediaTypes: ImagePicker.MediaType[],
  platform: typeof Platform.OS = Platform.OS,
): ImagePicker.MediaType[] => {
  if (platform !== 'android') {
    return mediaTypes;
  }

  return mediaTypes.filter((mediaType) => mediaType !== 'livePhotos');
};
