import { PaperAirplaneIcon } from '@primer/octicons-react';
import React, { useEffect } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { Image } from '~/components/images/Image';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { MAX_DIRECT_CAST_TEXT_LENGTH } from '~/constants/casts';
import { useGlobalKeyPress } from '~/contexts/GlobalKeyPressProvider';

import { DefaultCloseModalButton } from './DefaultCloseModalButton';

type DirectCastsImagePreviewModalProps = {
  existingNormalizedText: string;
  selectedImage: string;
  onClose: () => void;
  onSendImage: ({ message }: { message: string | undefined }) => void;
};

const DirectCastsImagePreviewModal: React.FC<DirectCastsImagePreviewModalProps> =
  React.memo(
    ({ existingNormalizedText, selectedImage, onClose, onSendImage }) => {
      const [directCastMessage, setDirectCastMessage] = React.useState<string>(
        existingNormalizedText,
      );

      useEffect(() => {
        setDirectCastMessage(existingNormalizedText);
      }, [existingNormalizedText]);

      const [uploadingImage, setUploadingImage] =
        React.useState<boolean>(false);

      const onSendClick = React.useCallback(() => {
        if (uploadingImage) {
          return;
        }
        setUploadingImage(true);

        onSendImage({ message: directCastMessage });
      }, [uploadingImage, directCastMessage, onSendImage]);

      const { addKeyPressListener } = useGlobalKeyPress();

      React.useEffect(() => {
        const unsubscribe = addKeyPressListener((e) => {
          if (e.code === 'Enter') {
            onSendClick();
          }
        });

        return () => {
          unsubscribe();
        };
      }, [addKeyPressListener, onSendClick]);

      const inputRef = React.useRef<HTMLInputElement>(null);

      React.useEffect(() => {
        const focusInput = () => {
          if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus();
          }
        };

        // Initial focus
        focusInput();

        // Set up interval to maintain focus
        const intervalId = setInterval(focusInput, 100);

        return () => clearInterval(intervalId);
      }, []);

      const handleTextChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const newText = e.target.value;
          setDirectCastMessage(newText);
        },
        [],
      );

      return (
        <Modal>
          <DefaultModalContainer onClose={onClose}>
            <div className="flex size-full flex-col items-center justify-center p-4">
              <div
                className="scroll-vert relative flex max-h-[95vh] w-[450px] flex-col items-center justify-start overflow-y-auto rounded-lg border p-4 bg-app border-default"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="-ml-4 flex w-full flex-row items-center justify-start">
                  <DefaultCloseModalButton onClick={onClose} className="p-2" />
                  <span className="text-xl font-bold">Send image</span>
                </div>
                <div className="my-2 max-h-[90%] w-full grow overflow-hidden">
                  <Image
                    alt="Image to share"
                    className="max-h-[500px] w-full overflow-hidden rounded border object-cover object-left-top shadow border-default"
                    src={selectedImage}
                  />
                </div>
                <div className="flex w-full flex-row items-center space-x-2">
                  <TextInput
                    ref={inputRef}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onChange={handleTextChange}
                    maxLength={MAX_DIRECT_CAST_TEXT_LENGTH}
                    value={directCastMessage}
                    autoFocus
                    placeholder={'Add a caption...'}
                    className="border px-[12px] py-[10px] border-faint"
                  />
                  <DefaultButton
                    className="!mb-px flex size-[40px] max-h-[40px] min-h-[40px] min-w-[40px] items-center justify-center self-end !p-0 bg-action !text-action-purple disabled:!bg-overlay-medium"
                    isLoading={uploadingImage}
                    onClick={onSendClick}
                  >
                    <PaperAirplaneIcon
                      size={24}
                      className="pl-[3px] text-light"
                    />
                  </DefaultButton>
                </div>
              </div>
            </div>
          </DefaultModalContainer>
        </Modal>
      );
    },
  );

DirectCastsImagePreviewModal.displayName = 'DirectCastsImagePreviewModal';

export { DirectCastsImagePreviewModal };
