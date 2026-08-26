import { DefaultButton } from '~/components/forms/buttons/DefaultButton';

import { DefaultModalContainer } from './DefaultModalContainer';
import { Modal } from './Modal';

const CantLeaveGroupModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div className="flex size-full flex-col items-center justify-center p-4">
          <div
            className="flex w-96 flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="w-full text-center">
              You're the only group admin, please add another admin before
              leaving.
            </div>
            <div className="mt-4 flex w-full">
              <DefaultButton className="!h-10 w-full" onClick={onClose}>
                OK
              </DefaultButton>
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
};

export { CantLeaveGroupModal };
