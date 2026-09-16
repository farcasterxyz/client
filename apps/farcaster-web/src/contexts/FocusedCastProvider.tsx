import { ApiCast } from 'farcaster-client-data';
import { createContext, FC, ReactNode, useContext } from 'react';

type FocusedCastContextValue = {
  focusedCast: ApiCast | undefined;
};

const FocusedCastContext = createContext<FocusedCastContextValue>({
  focusedCast: undefined,
});

type FocusedCastProviderProps = {
  children: ReactNode;
  focusedCast: ApiCast | undefined;
};

const FocusedCastProvider: FC<FocusedCastProviderProps> = ({
  children,
  focusedCast,
}) => {
  return (
    <FocusedCastContext.Provider value={{ focusedCast }}>
      {children}
    </FocusedCastContext.Provider>
  );
};

FocusedCastProvider.displayName = 'FocusedCastProvider';

const useFocusedCast = () => useContext(FocusedCastContext);

export { FocusedCastProvider, useFocusedCast };
