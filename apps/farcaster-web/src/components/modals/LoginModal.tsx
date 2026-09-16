import { FC, memo } from 'react';

import { LoginWithMobile } from '~/components/login/LoginWithMobile';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';

type LoginModalProps = {
  onClose: () => void;
};

const LoginModal: FC<LoginModalProps> = memo(({ onClose }) => {
  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div className="flex size-full flex-col items-center justify-center p-4">
          <div
            className="relative flex w-full max-w-md flex-col items-start justify-center rounded-[12px] bg-[#141414] p-4"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <LoginWithMobile onClose={onClose} />
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
});

LoginModal.displayName = 'LoginModal';

export { LoginModal };
