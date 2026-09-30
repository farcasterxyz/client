import React, { ReactNode } from 'react';

import {
  DefaultButton,
  DefaultButtonProps,
} from '~/components/forms/buttons/DefaultButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';

type AckModalProps = {
  onAck: () => void;
  title: string;
  body: ReactNode;
  ackText?: string;
  ackButtonVariant?: DefaultButtonProps['variant'];
  onBackdropClose: () => void;
};

const AckModal: React.FC<AckModalProps> = React.memo(
  ({
    title,
    body,
    onAck,
    ackText,
    onBackdropClose,
    ackButtonVariant = 'normal',
  }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onBackdropClose}>
          <div className="flex size-full flex-col items-center justify-center p-4">
            <div
              className="flex w-96 flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="mb-6 w-full">
                <div className="mb-2 text-xl font-semibold">{title}</div>
                <div>{body}</div>
              </div>
              <DefaultButton
                variant={ackButtonVariant}
                className="h-[56px] w-full"
                size="lg"
                onClick={() => {
                  onAck();
                }}
              >
                {ackText || 'Dismiss'}
              </DefaultButton>
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

AckModal.displayName = 'AckModal';

export { AckModal };
