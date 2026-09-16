import { ImageIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  IMAGE_PICKER_EXTENSIONS,
  IMAGE_VIDEO_PICKER_EXTENSIONS,
  useFetchImageUploadUrl,
} from 'farcaster-client-hooks';
import React from 'react';

import { showComposerAttachmentLimitToast } from '~/components/composer/composerAttachmentLimitToast';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type MediaComposerPickerProps = {
  disabled: boolean;
  onMediaUpload: ({
    file,
    imageUploaderPromise,
  }: {
    file: File;
    imageUploaderPromise?: Promise<{
      url: string;
      optimisticImageId: string;
    }>;
  }) => void | Promise<void>;
  getRemainingEmbedsCount: () => number;
  castEmbedLimit: number;
  className?: string;
};

const MediaComposerPicker: React.FC<MediaComposerPickerProps> = ({
  disabled,
  onMediaUpload,
  getRemainingEmbedsCount,
  castEmbedLimit,
  className,
}) => {
  const { canUploadVideo } = useUserAppContext();
  const { trackEvent } = useAnalytics();

  const fetchImageUploadUrl = useFetchImageUploadUrl();

  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [
    lastImagePickerClickImageUploaderPromise,
    setLastImagePickerClickImageUploaderPromise,
  ] = React.useState<
    Promise<{
      url: string;
      optimisticImageId: string;
    }>
  >();

  const onImagePickerClick = React.useCallback(() => {
    if (formRef.current && inputRef.current) {
      const remainingEmbeds = getRemainingEmbedsCount();
      trackEvent(AnalyticsEvent.CastComposerMediaPressed, {
        canUploadVideo,
        remainingEmbeds,
      });
      if (remainingEmbeds <= 0) {
        showComposerAttachmentLimitToast({ castEmbedLimit });
        return;
      }
      formRef.current.reset();
      inputRef.current.click();

      setLastImagePickerClickImageUploaderPromise(fetchImageUploadUrl());
    }
  }, [
    canUploadVideo,
    castEmbedLimit,
    fetchImageUploadUrl,
    getRemainingEmbedsCount,
    trackEvent,
  ]);

  const onFileInputChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files === null || files.length === 0) {
        return;
      }
      const remaining = getRemainingEmbedsCount();
      if (remaining <= 0) {
        showComposerAttachmentLimitToast({ castEmbedLimit });
        e.target.value = '';
        return;
      }
      if (files.length > remaining) {
        toast({
          message: `Only the first ${remaining} file${
            remaining === 1 ? '' : 's'
          } will be attached`,
          type: 'info',
          toastId: 'composer-attachment-truncated',
        });
      }
      const limit = Math.min(files.length, remaining);
      // Process files sequentially to avoid allModifyingEmbeds blocking concurrent uploads
      for (let i = 0; i < limit; i++) {
        try {
          const result = onMediaUpload({
            file: files[i],
            imageUploaderPromise:
              i === 0
                ? lastImagePickerClickImageUploaderPromise
                : fetchImageUploadUrl(),
          });
          if (result && typeof result.then === 'function') {
            await result;
          }
        } catch (err) {
          trackError(err);
        }
      }
      e.target.value = '';
    },
    [
      castEmbedLimit,
      fetchImageUploadUrl,
      getRemainingEmbedsCount,
      lastImagePickerClickImageUploaderPromise,
      onMediaUpload,
    ],
  );

  return (
    <DefaultButton
      title="Media"
      variant="muted"
      className={`border-0 text-muted ${className ? className : ''}`}
      disabled={disabled}
      onClick={onImagePickerClick}
    >
      <ImageIcon size={16} />
      <form ref={formRef} onSubmit={undefined} hidden>
        <input
          type="file"
          accept={
            canUploadVideo
              ? IMAGE_VIDEO_PICKER_EXTENSIONS
              : IMAGE_PICKER_EXTENSIONS
          }
          multiple
          hidden
          ref={inputRef}
          onChange={onFileInputChange}
        />
      </form>
    </DefaultButton>
  );
};

export { MediaComposerPicker };
