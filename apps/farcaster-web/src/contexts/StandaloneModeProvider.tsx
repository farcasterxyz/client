import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import {
  renderedAsStandaloneWindow,
  resetAppBadge,
  setAppBadge as navigatorSetAppBadge,
} from '~/utils/navigator/navigator';

type StandaloneModeContextValue = {
  inStandaloneMode: boolean;
  setAppBadge: ({ count }: { count: number }) => void;
  clearAppBadge: () => void;
};

const StandaloneModeContext = createContext<StandaloneModeContextValue>({
  inStandaloneMode: false,
  setAppBadge: (_: { count: number }) => {
    // eslint-disable-next-line no-console
    console.error(
      'StandaloneModeContext.setAppBadge() called before its initialized properly.',
    );
  },
  clearAppBadge: () => {
    // eslint-disable-next-line no-console
    console.error(
      'StandaloneModeContext.clearAppBadge() called before its initialized properly.',
    );
  },
});

interface StandaloneModeProviderProps {
  children: ReactNode;
}

const StandaloneModeProvider: FC<StandaloneModeProviderProps> = ({
  children,
}) => {
  const inStandaloneMode = useMemo(() => {
    return renderedAsStandaloneWindow();
  }, []);

  const setAppBadge = useCallback(({ count }: { count: number }) => {
    return navigatorSetAppBadge({ count });
  }, []);

  const clearAppBadge = useCallback(() => {
    return resetAppBadge();
  }, []);

  return (
    <StandaloneModeContext.Provider
      value={{
        inStandaloneMode,
        setAppBadge,
        clearAppBadge,
      }}
    >
      {children}
    </StandaloneModeContext.Provider>
  );
};

StandaloneModeProvider.displayName = 'StandaloneModeProvider';

const useStandaloneMode = (): StandaloneModeContextValue =>
  useContext(StandaloneModeContext);

export { StandaloneModeProvider, useStandaloneMode };
