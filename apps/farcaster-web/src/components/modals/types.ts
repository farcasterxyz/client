import { ReactNode } from 'react';

export type BaseModalProps = {
  children: ReactNode;
  hide: () => void;
  onHide?: () => void;
};
