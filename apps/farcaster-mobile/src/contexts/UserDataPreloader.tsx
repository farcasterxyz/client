import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { usePrefetchAuthedUserResources } from '~/hooks/usePrefetchAuthedUserResources';
import { logInDevOnly } from '~/utils/LogUtils';

import {
  ConnectionStatus,
  useConnectionStatus,
} from './ConnectionStatusProvider';

type UserDataPreloaderProps = {
  children: ReactNode;
};

type UserDataPreloaderContextValue = {
  hasCompletedPrefetches: boolean;
};

const UserDataPreloaderContext = createContext<
  UserDataPreloaderContextValue | undefined
>(undefined);

const UserDataPreloader: FC<UserDataPreloaderProps> = memo(({ children }) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'UserDataPreloader',
  });

  const isSignedIn = useIsSignedIn();
  const { checkConnection } = useConnectionStatus();

  const prefetchAuthedUserResources = usePrefetchAuthedUserResources();

  const hasInitiatedPrefetchesRef = useRef(false);
  const [hasCompletedPrefetches, setHasCompletedPrefetches] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    if (!hasInitiatedPrefetchesRef.current) {
      hasInitiatedPrefetchesRef.current = true;

      const prefetchData = async () => {
        if (checkConnection) {
          const isOffline =
            (await checkConnection()) === ConnectionStatus.OFFLINE;
          if (isOffline) {
            setHasCompletedPrefetches(true);
            return;
          }
        }
        try {
          prefetchAuthedUserResources().finally(() => {
            setHasCompletedPrefetches(true);
          });
        } catch (error) {
          logInDevOnly('UserDataPreloader:prefetchData:error', error);
        }
      };

      prefetchData();
    }
  }, [isSignedIn, prefetchAuthedUserResources, checkConnection]);

  useEffect(() => {
    if (hasCompletedPrefetches) {
      DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
        name: 'UserDataPreloader',
      });
    }
  }, [hasCompletedPrefetches]);

  return (
    <UserDataPreloaderContext.Provider value={{ hasCompletedPrefetches }}>
      {children}
    </UserDataPreloaderContext.Provider>
  );
});

UserDataPreloader.displayName = 'UserDataPreloader';

const useUserDataPreloaderContext = () => {
  const context = useContext(UserDataPreloaderContext);
  if (context === undefined) {
    throw new Error(
      'useUserDataPreloaderContext must be used within a UserDataPreloader',
    );
  }
  return context;
};

export { UserDataPreloader, useUserDataPreloaderContext };
