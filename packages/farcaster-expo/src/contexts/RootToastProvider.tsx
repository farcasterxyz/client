import React, { createContext, FC, ReactNode, useContext } from 'react';
import ToastContainer, {
  ToastProvider as BaseToastProvider,
  useToast,
} from 'react-native-toast-notifications';
import { ToastProps } from 'react-native-toast-notifications/lib/typescript/toast';

import { useDefaultToastProviderProps } from '../hooks/useDefaultToastProviderProps';

type RootToastContextValue = Pick<
  ToastContainer,
  'show' | 'update' | 'hide' | 'hideAll'
>;

const RootToastContext = createContext<RootToastContextValue>({
  show: () => '',
  update: () => undefined,
  hide: () => undefined,
  hideAll: () => undefined,
});

type ProviderProps = {
  children: ReactNode;
  renderType?: Record<string, (toast: ToastProps) => React.ReactNode>;
  offsetTop?: number;
};

// The function of RootToastProvider is simply to pass through
// the context value of the nearest ToastProvider (from react-native-toast-notifications).
// We need this for the `CreateCastScreen`, which needs to reference both the root
// toast provider (which gets displayed under the modal) and a ToastProvider
// that wraps the screen, so we can display error messages on top of the modal.
const RootToastProvider: FC<ProviderProps> = ({ children }) => {
  const toast = useToast();

  return (
    <RootToastContext.Provider value={toast}>
      {children}
    </RootToastContext.Provider>
  );
};

const ToastProvider: FC<ProviderProps> = React.memo(({ children, ...rest }) => {
  const defaultToastProviderProps = useDefaultToastProviderProps();
  return (
    <BaseToastProvider {...defaultToastProviderProps} {...rest}>
      <RootToastProvider>{children}</RootToastProvider>
    </BaseToastProvider>
  );
});

const useRootToast = () => useContext(RootToastContext);

export { ToastProvider, useRootToast };
