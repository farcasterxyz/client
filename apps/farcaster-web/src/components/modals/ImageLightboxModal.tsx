import { ArrowLeftIcon, ArrowRightIcon } from '@primer/octicons-react';
import React from 'react';

import { Image } from '~/components/images/Image';
import { DefaultModalContainer } from '~/components/modals//DefaultModalContainer';
import { Modal } from '~/components/modals//Modal';
import { useGlobalKeyPress } from '~/contexts/GlobalKeyPressProvider';

type ImageLightboxModalProps = {
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
  title: string;
};

const ImageLightboxModal: React.FC<ImageLightboxModalProps> = React.memo(
  ({ title, imageUrls, initialIndex, onClose }) => {
    const [visibleImageIndex, setVisibleImageIndex] =
      React.useState(initialIndex);

    const imageUrl = React.useMemo(() => {
      return imageUrls[visibleImageIndex];
    }, [imageUrls, visibleImageIndex]);

    const { addKeyPressListener } = useGlobalKeyPress();

    const arrowLeftPress = React.useCallback(() => {
      if (visibleImageIndex !== 0) {
        setVisibleImageIndex(
          visibleImageIndex > 0
            ? (visibleImageIndex - 1) % imageUrls.length
            : imageUrls.length - 1,
        );
      }
    }, [imageUrls.length, visibleImageIndex]);

    const arrowRightPress = React.useCallback(() => {
      if (visibleImageIndex !== imageUrls.length - 1) {
        setVisibleImageIndex((visibleImageIndex + 1) % imageUrls.length);
      }
    }, [imageUrls.length, visibleImageIndex]);

    React.useEffect(() => {
      const unsubscribe = addKeyPressListener((e) => {
        if (e.code === 'ArrowLeft') {
          arrowLeftPress();
        } else if (e.code === 'ArrowRight') {
          arrowRightPress();
        }
      });

      return () => {
        unsubscribe();
      };
    }, [addKeyPressListener, arrowLeftPress, arrowRightPress]);

    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <div className="relative flex size-full flex-row items-center justify-center p-4 py-6">
            {visibleImageIndex !== 0 && (
              <div
                className="absolute left-0 ml-6 flex cursor-pointer justify-center rounded-full p-0.5 bg-overlay-heavy"
                onClick={(e) => {
                  e.stopPropagation();

                  arrowLeftPress();
                }}
              >
                <ArrowLeftIcon size={32} className="font-semibold text-white" />
              </div>
            )}
            {/* The w-full is necessary on Safari, otherwise the image is tiny. */}
            <div className="flex max-h-full w-full flex-col items-center justify-center">
              <Image
                src={imageUrl}
                title={title}
                alt={title}
                className="max-h-[75%] overflow-hidden rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                loading="eager"
              />
            </div>
            {visibleImageIndex !== imageUrls.length - 1 && (
              <div
                className="absolute right-0 mr-6 flex cursor-pointer justify-center rounded-full p-0.5 bg-overlay-heavy"
                onClick={(e) => {
                  e.stopPropagation();

                  arrowRightPress();
                }}
              >
                <ArrowRightIcon
                  size={32}
                  className="font-semibold text-white"
                />
              </div>
            )}
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

ImageLightboxModal.displayName = 'ImageLightboxModal';

export { ImageLightboxModal };
