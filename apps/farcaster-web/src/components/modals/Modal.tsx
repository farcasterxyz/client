import { FC, memo, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { modalRootId } from '~/constants/modals';

type ModalProps = {
  children: ReactNode;
  active?: boolean;
};

const Modal: FC<ModalProps> = memo(({ children, active = true }) => {
  useEffect(() => {
    if (!active) {
      document.documentElement.classList.remove('modal-open');
      return;
    }

    document.documentElement.classList.add('modal-open');
    return () => document.documentElement.classList.remove('modal-open');
  }, [active]);

  return createPortal(
    <>
      {children}
      {active ? <RemoveScrollBar gapMode="margin" /> : null}
    </>,
    document.getElementById(modalRootId)!,
  );
});

Modal.displayName = 'Modal';

export { Modal };
