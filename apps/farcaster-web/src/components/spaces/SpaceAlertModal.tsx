import React from 'react';

import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { Modal } from '~/components/modals/Modal';

type SpaceAlertModalProps = {
  open: boolean;
  title: string;
  body: string;
  buttonText?: string;
  onClose: () => void;
};

const SpaceAlertModal: React.FC<SpaceAlertModalProps> = ({
  open,
  title,
  body,
  buttonText = 'OK',
  onClose,
}) => {
  if (!open) {
    return null;
  }

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <DefaultModalContent minHeightPx={0}>
          <div className="w-full p-5">
            <div className="text-lg font-semibold text-default">{title}</div>
            <div className="mt-2 text-sm leading-relaxed text-faint">
              {body}
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-action-primary hover:opacity-90"
              onClick={onClose}
            >
              {buttonText}
            </button>
          </div>
        </DefaultModalContent>
      </DefaultModalContainer>
    </Modal>
  );
};

SpaceAlertModal.displayName = 'SpaceAlertModal';

export { SpaceAlertModal };
