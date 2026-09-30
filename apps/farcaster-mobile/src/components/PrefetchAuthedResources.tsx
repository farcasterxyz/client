import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ConnectionStatus,
  useConnectionStatus,
} from '~/contexts/ConnectionStatusProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePrefetchAuthedResources } from '~/hooks/data/usePrefetchAuthedResources';

type PrefetchAuthedResourcesProps = {
  children: ReactNode;
};

type PrefetchAuthedResourcesContextValue = {
  hasCompletedPrefetches: boolean;
};

const PrefetchAuthedResourcesContext = createContext<
  PrefetchAuthedResourcesContextValue | undefined
>(undefined);

const PrefetchAuthedResources: FC<PrefetchAuthedResourcesProps> = ({
  children,
}) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'PrefetchAuthedResources',
  });

  const currentUser = useCurrentUser_UNSAFE();
  const prefetchAuthedResources = usePrefetchAuthedResources();
  const hasInitiatedPrefetchesRef = useRef(false);
  const [hasCompletedPrefetches, setHasCompletedPrefetches] = useState(false);
  const { checkConnection } = useConnectionStatus();

  useEffect(() => {
    const prefetchData = async () => {
      if (!hasInitiatedPrefetchesRef.current) {
        hasInitiatedPrefetchesRef.current = true;

        if (checkConnection) {
          const isOffline =
            (await checkConnection()) === ConnectionStatus.OFFLINE;
          if (isOffline) {
            setHasCompletedPrefetches(true);
            return;
          }
        }

        if (currentUser) {
          prefetchAuthedResources(
            { fid: currentUser.fid },
            { invalidateBeforePrefetch: true },
          ).finally(() => {
            setHasCompletedPrefetches(true);
          });
        } else {
          setHasCompletedPrefetches(true);
        }
      }
    };

    prefetchData();
  }, [currentUser, prefetchAuthedResources, checkConnection]);

  useEffect(() => {
    if (hasCompletedPrefetches) {
      DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
        name: 'PrefetchAuthedResources',
      });
    }
  }, [hasCompletedPrefetches]);

  return (
    <PrefetchAuthedResourcesContext.Provider value={{ hasCompletedPrefetches }}>
      {children}
    </PrefetchAuthedResourcesContext.Provider>
  );
};

PrefetchAuthedResources.displayName = 'PrefetchAuthedResources';

const usePrefetchAuthedResourcesContext = () => {
  const context = useContext(PrefetchAuthedResourcesContext);
  if (context === undefined) {
    throw new Error(
      'usePrefetchAuthedResourcesContext must be used within a PrefetchAuthedResources',
    );
  }
  return context;
};

export { PrefetchAuthedResources, usePrefetchAuthedResourcesContext };
