import { BellSlashIcon, DeviceMobileIcon } from '@primer/octicons-react';
import * as Dialog from '@radix-ui/react-dialog';
import { ApiFrame } from 'farcaster-client-data';
import React from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';

interface ConfirmRemoveFavoriteFrameDialogProps {
  frame: ApiFrame;
  onClose: () => void;
  onConfirm: () => void;
  renderInPortal?: boolean;
}

export const ConfirmRemoveFavoriteFrameDialog: React.FC<
  ConfirmRemoveFavoriteFrameDialogProps
> = ({ frame, onClose, onConfirm, renderInPortal = true }) => {
  if (renderInPortal) {
    return (
      <Dialog.Root
        defaultOpen
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-10 animate-overlay-show bg-overlay" />
          <Dialog.Content className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 animate-content-show">
            <ConfirmRemoveFavoriteFrameDialogInner
              frame={frame}
              onClose={onClose}
              onConfirm={onConfirm}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0 top-[60px] animate-overlay-show bg-black/30 dark:bg-white/30"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div
        className="absolute inset-x-4 bottom-4 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <ConfirmRemoveFavoriteFrameDialogInner
          frame={frame}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </div>
    </>
  );
};

const ConfirmRemoveFavoriteFrameDialogInner: React.FC<
  Omit<ConfirmRemoveFavoriteFrameDialogProps, 'renderInPortal'>
> = ({ frame, onClose, onConfirm }) => {
  return (
    <div className="mx-auto w-full max-w-[424px] animate-frame-action-content-show rounded-xl border p-6 pb-4 bg-app border-default">
      <div className="flex w-full flex-col items-center space-y-4">
        <div className="relative">
          <Image
            src={frame.iconUrl}
            alt={frame.name}
            className="size-[72px] rounded-lg"
          />
          <div className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full border-2 border-background bg-[#FBE7EB]">
            <span className="text-xl text-danger">×</span>
          </div>
        </div>
        <h3 className="text-center text-xl font-semibold">
          Remove Mini App: {frame.name}
        </h3>
      </div>

      <div className="mt-4 w-full space-y-3 rounded-lg p-3 bg-faint">
        {[
          {
            name: 'Remove from Farcaster',
            icon: <DeviceMobileIcon size={20} />,
          },
          {
            name: 'Disable notifications',
            icon: <BellSlashIcon size={20} />,
          },
        ].map(({ name, icon }) => (
          <div key={name} className="flex items-center space-x-2">
            <div className="flex size-8 items-center justify-center">
              {icon}
            </div>
            <div>{name}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex w-full flex-row space-x-2">
        <DefaultButton
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="h-[40px] w-[180px]"
          variant="inverted"
        >
          Cancel
        </DefaultButton>
        <DefaultButton
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          className="h-[40px] w-[180px]"
          variant="danger"
        >
          Remove
        </DefaultButton>
      </div>
    </div>
  );
};
