import React, { ComponentType, useCallback, useMemo, useState } from 'react';

import {
  DefaultButton,
  DefaultButtonProps,
} from '~/components/forms/buttons/DefaultButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import {
  DefaultModalHeader,
  DefaultModalHeaderProps,
} from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';

export function useConfirmationModal<T>({
  onConfirm,
  onCancel,
  extraData,
  ConfirmModal,
}: {
  onConfirm: () => void;
  onCancel?: () => void;
  extraData: T;
  ConfirmModal: ComponentType<{
    onBackdropClose: () => void;
    onCancel: () => void;
    onConfirm: () => void;
    extraData: T;
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onBackdropClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const wrappedOnCancel = useCallback(() => {
    setIsOpen(false);
    void onCancel?.();
  }, [onCancel]);

  const wrappedOnConfirm = useCallback(() => {
    setIsOpen(false);
    void onConfirm();
  }, [onConfirm]);

  const Component = useMemo(() => {
    if (isOpen) {
      return (
        <ConfirmModal
          onBackdropClose={onBackdropClose}
          onCancel={wrappedOnCancel}
          onConfirm={wrappedOnConfirm}
          extraData={extraData}
        />
      );
    }

    return null;
  }, [
    ConfirmModal,
    extraData,
    isOpen,
    onBackdropClose,
    wrappedOnCancel,
    wrappedOnConfirm,
  ]);

  return {
    isOpen,
    open,
    close,
    Component,
  };
}

export type ConfirmationModalProps<T> = {
  onCancel: () => void;
  onConfirm: () => void;
  onBackdropClose?: () => void;
  extraData: T;
};

type WrappedConfirmationModalProps = {
  body?: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: DefaultButtonProps['variant'];
  icon?: (size: { size: number }) => React.ReactNode;
  hideAreYouSure?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onBackdropClose?: () => void;
  isLoading?: boolean;
} & Partial<Pick<DefaultModalHeaderProps, 'title' | 'iconColor'>>;

const ConfirmationModal: React.FC<WrappedConfirmationModalProps> = React.memo(
  ({
    title,
    body,
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    hideAreYouSure = false,
    destructive = false,
    icon,
    onCancel,
    onConfirm,
    onBackdropClose,
    isLoading = false,
  }) => {
    const onContainerClose = React.useCallback(() => {
      if (typeof onBackdropClose === 'function') {
        onBackdropClose();
      } else {
        onCancel();
      }
    }, [onBackdropClose, onCancel]);

    const showAreYouSure = !hideAreYouSure;

    return (
      <Modal>
        <DefaultModalContainer onClose={onContainerClose}>
          <DefaultModalContent minHeightPx={120}>
            {title && (
              <DefaultModalHeader
                title={title}
                iconColor={destructive ? 'red' : 'purple'}
                icon={icon}
                onClose={onCancel}
                hideDefaultCloseModalButton={true}
              />
            )}
            <div className="w-full px-4 pb-4">
              {(body || showAreYouSure) && (
                <div className="mb-6">
                  {body && <div className="mb-4">{body}</div>}
                  {showAreYouSure && (
                    <div className="4 text-muted">
                      Are you sure you want to proceed?
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <DefaultButton
                  variant="muted"
                  onClick={() => {
                    onCancel();
                  }}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {cancelText}
                </DefaultButton>
                <DefaultButton
                  variant={destructive ? 'danger' : 'normal'}
                  onClick={() => {
                    onConfirm();
                  }}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {confirmText}
                </DefaultButton>
              </div>
            </div>
          </DefaultModalContent>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

ConfirmationModal.displayName = 'ConfirmationModal';

export { ConfirmationModal };
