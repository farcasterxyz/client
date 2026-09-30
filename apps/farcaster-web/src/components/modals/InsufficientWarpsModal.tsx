import { FC, memo } from 'react';

import { ConfirmationModal } from '~/components/modals/ConfirmationModal';

type InsufficientWarpsModelProps = {
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText: string;
  confirmText: string;
};

const InsufficientWarpsModal: FC<InsufficientWarpsModelProps> = memo(
  ({ description, onCancel, onConfirm, cancelText, confirmText }) => {
    return (
      <ConfirmationModal
        onCancel={() => {
          onCancel();
        }}
        onConfirm={async () => {
          onConfirm();
        }}
        cancelText={cancelText}
        confirmText={confirmText}
        title="Insufficient warps"
        body={description}
      />
    );
  },
);

InsufficientWarpsModal.displayName = 'ConfirmationModal';

export { InsufficientWarpsModal };
