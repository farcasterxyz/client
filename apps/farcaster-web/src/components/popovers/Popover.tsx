import { FC, memo, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { popoverRootId } from '~/constants/popovers';

type PopoverProps = {
  children: ReactNode;
};

const Popover: FC<PopoverProps> = memo(({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add('popover-open');
    return () => document.documentElement.classList.remove('popover-open');
  }, []);

  return createPortal(children, document.getElementById(popoverRootId)!);
});

Popover.displayName = 'Popover';

export { Popover };
