import {
  getMediaPickerLaunchErrorInfo,
  getMediaPickerMediaTypesForPlatform,
} from '../mediaPickerLaunchError';

describe('mediaPickerLaunchError', () => {
  describe('getMediaPickerLaunchErrorInfo', () => {
    it('classifies iOS Photos unavailable asset errors', () => {
      expect(
        getMediaPickerLaunchErrorInfo(
          new Error(
            'The operation could not be completed. (PHPhotosErrorDomain error 3164.)',
          ),
        ),
      ).toEqual({
        reason: 'ios_photos_asset_unavailable',
        userMessage:
          "Photos couldn't prepare that item. Try downloading it from iCloud first, or choose a different photo or video.",
      });
    });

    it('classifies Android mediaTypes cast errors', () => {
      expect(
        getMediaPickerLaunchErrorInfo(
          new Error(
            "Cannot cast 'Array' for field 'mediaTypes' ('kotlin.Array<expo.modules.imagepicker.JSMediaTypes>')",
          ),
        ),
      ).toEqual({
        reason: 'android_media_types_cast',
        userMessage:
          "We couldn't open your media picker on this app version. Please update Farcaster and try again.",
      });
    });

    it('classifies Android ImagePickerOptions cast errors', () => {
      expect(
        getMediaPickerLaunchErrorInfo(
          new Error(
            'The 1st argument cannot be cast to type expo.modules.imagepicker.ImagePickerOptions',
          ),
        ),
      ).toEqual({
        reason: 'android_media_types_cast',
        userMessage:
          "We couldn't open your media picker on this app version. Please update Farcaster and try again.",
      });
    });

    it('classifies Android unregistered launcher errors', () => {
      expect(
        getMediaPickerLaunchErrorInfo(
          new Error(
            'Attempting to launch an unregistered ActivityResultLauncher',
          ),
        ),
      ).toEqual({
        reason: 'android_unregistered_launcher',
        userMessage:
          "The media picker wasn't ready. Close the composer and try again.",
      });
    });

    it('classifies unreadable iOS representation errors', () => {
      expect(
        getMediaPickerLaunchErrorInfo(
          new Error(
            'Failed to read picked image -> Cannot load representation of type public.heic',
          ),
        ),
      ).toEqual({
        reason: 'ios_unreadable_representation',
        userMessage:
          "That photo format couldn't be read. Try saving it as a regular photo, or choose another item.",
      });
    });

    it('falls back for unknown errors', () => {
      expect(getMediaPickerLaunchErrorInfo(new Error('boom'))).toEqual({
        reason: 'unknown',
        userMessage: 'Failed to pick media',
      });
    });
  });

  describe('getMediaPickerMediaTypesForPlatform', () => {
    it('removes livePhotos on Android', () => {
      expect(
        getMediaPickerMediaTypesForPlatform(
          ['videos', 'images', 'livePhotos'],
          'android',
        ),
      ).toEqual(['videos', 'images']);
    });

    it('keeps livePhotos on iOS', () => {
      expect(
        getMediaPickerMediaTypesForPlatform(
          ['videos', 'images', 'livePhotos'],
          'ios',
        ),
      ).toEqual(['videos', 'images', 'livePhotos']);
    });
  });
});
