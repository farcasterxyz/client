import { FileMediaIcon, XIcon } from '@primer/octicons-react';
import React, { useEffect, useState } from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FileInput } from '~/components/forms/FileInput';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';

const GroupImageSelector = ({
  conversationImageURL,
  setConversationImageURL,
  onSubmittingPhotoStateChange,
}: {
  conversationImageURL: string | undefined;
  setConversationImageURL: (url: string | undefined) => void;
  onSubmittingPhotoStateChange?: (isSubmitting: boolean) => void;
}) => {
  const [submittingPhoto, setSubmittingPhoto] = useState<boolean>(false);

  useEffect(() => {
    if (onSubmittingPhotoStateChange) {
      onSubmittingPhotoStateChange(submittingPhoto);
    }
  }, [submittingPhoto, onSubmittingPhotoStateChange]);

  const uploadCloudflareImage = useUploadCloudflareImage();

  const handleImageUpload = () => {
    const input = document.getElementById('conversation-group-img-input');
    if (input) {
      input.click();
    }
  };

  const resetFileInput = () => {
    const fileInput = document.getElementById(
      'conversation-group-img-input',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 px-4 py-8">
      <div className="flex size-28 items-center justify-start gap-2.5 rounded-full bg-overlay-light">
        <div className="flex size-28 items-center justify-center">
          {submittingPhoto ? (
            <LoadingIndicator size="sm" />
          ) : (
            <div>
              {conversationImageURL ? (
                <div className="relative">
                  <AvatarImage
                    imgAlt="Conversation image"
                    imgUrl={conversationImageURL}
                    size="xl2"
                  />
                  <div
                    className="absolute -right-2 -top-2 flex cursor-pointer flex-col place-content-center rounded-full border-4 border-white bg-[#f4f4f5] p-1 hover:bg-[#e4e4e7] dark:border-black dark:bg-action-secondary"
                    onClick={() => {
                      setConversationImageURL(undefined);
                      resetFileInput();
                    }}
                  >
                    <XIcon size={20} className="text-default" />
                  </div>
                </div>
              ) : (
                <FileMediaIcon size={40} className="text-faint" />
              )}
            </div>
          )}
        </div>
      </div>
      <FileInput
        id={'conversation-group-img-input'}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];

          if (!file) {
            return;
          }

          try {
            setSubmittingPhoto(true);
            const uploadResult = await uploadCloudflareImage({
              file,
            });
            if (uploadResult?.imageUrl) {
              setConversationImageURL(uploadResult.imageUrl);
            }
          } finally {
            setSubmittingPhoto(false);
          }
        }}
      />
      {conversationImageURL ? (
        <div className="flex flex-row items-center justify-center gap-3">
          <DefaultButton
            className="flex flex-col place-content-center"
            onClick={handleImageUpload}
            variant="secondary"
          >
            <div className="flex flex-row items-center justify-center gap-2">
              <div className="text-base font-normal leading-snug text-default">
                Change image
              </div>
            </div>
          </DefaultButton>
        </div>
      ) : (
        <DefaultButton
          className="flex flex-col place-content-center"
          onClick={handleImageUpload}
          variant="secondary"
        >
          <div className="flex flex-row items-center justify-center gap-2">
            <div className="text-base font-normal leading-snug text-default">
              Upload image
            </div>
          </div>
        </DefaultButton>
      )}
    </div>
  );
};

export { GroupImageSelector };
