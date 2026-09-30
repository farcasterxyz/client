import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, { FC, ReactNode } from 'react';

import { usePrefetchAuthedResourcesContext } from '~/components/PrefetchAuthedResources';

import { useUserDataPreloaderContext } from './UserDataPreloader';

type PreloadingContextValue = {
  completedPrefetches: boolean;
};

const PreloadingContext = React.createContext<PreloadingContextValue>({
  completedPrefetches: false,
});

export const usePreloading = () => {
  return React.useContext(PreloadingContext);
};

type NonBlockingPrefetchesProviderProps = {
  children: ReactNode;
};

const NonBlockingPrefetchesProvider: FC<NonBlockingPrefetchesProviderProps> = ({
  children,
}) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'NonBlockingPrefetchesProvider',
  });

  const { hasCompletedPrefetches: completedAuthedPrefetches } =
    usePrefetchAuthedResourcesContext();
  const { hasCompletedPrefetches: completedUserPreferencesPrefetch } =
    useUserDataPreloaderContext();

  const contextValue = React.useMemo(
    () => ({
      completedPrefetches:
        completedUserPreferencesPrefetch && completedAuthedPrefetches,
    }),
    [completedAuthedPrefetches, completedUserPreferencesPrefetch],
  );

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'NonBlockingPrefetchesProvider',
  });

  return (
    <PreloadingContext.Provider value={contextValue}>
      {children}
    </PreloadingContext.Provider>
  );
};

NonBlockingPrefetchesProvider.displayName = 'NonBlockingPrefetchesProvider';

export { NonBlockingPrefetchesProvider };
