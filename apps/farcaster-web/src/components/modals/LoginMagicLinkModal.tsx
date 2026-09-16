import { FC, memo } from 'react';

import { LoginWithMagicLink } from '~/components/login/LoginWithMagicLink';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';

type LoginMagicLinkModalProps = {
  onClose: () => void;
};

const LoginMagicLinkModal: FC<LoginMagicLinkModalProps> = memo(
  ({ onClose }) => {
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
              <LoginWithMagicLink onClose={onClose} />
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

LoginMagicLinkModal.displayName = 'LoginMagicLinkModal';

export { LoginMagicLinkModal };
