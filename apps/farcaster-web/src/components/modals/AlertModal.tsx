import { FC, memo } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';

type AlertModalProps = {
  children: React.ReactNode;
  onOk: () => void;
  okText?: string;
};

const AlertModal: FC<AlertModalProps> = memo(({ children, onOk, okText }) => {
  return (
    <Modal>
      <DefaultModalContainer onClose={onOk}>
        <div className="flex size-full flex-col items-center justify-center p-4">
          <div
            className="flex w-96 flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="w-full text-center">{children}</div>
            <div className="mt-4 flex w-full flex-row justify-center space-x-2 ">
              <DefaultButton
                variant="normal"
                className="w-[180px] min-w-[140px]"
                onClick={() => {
                  onOk();
                }}
              >
                {okText || 'OK'}
              </DefaultButton>
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
});

AlertModal.displayName = 'AlertModal';

export { AlertModal };
