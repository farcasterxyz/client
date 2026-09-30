import { Persister } from '@tanstack/react-query-persist-client';
import { createContext, FC, memo, ReactNode, useContext, useMemo } from 'react';

type PersistQueryClientInstanceContextValue = {
  localStoragePersister: Persister | undefined;
};

const PersistQueryClientInstanceContext =
  createContext<PersistQueryClientInstanceContextValue>({
    localStoragePersister: undefined,
  });

type PersistQueryClientInstanceProviderProps = {
  children: ReactNode;
  localStoragePersister: Persister | undefined;
};

// Unfortunately, PersistQueryClientProvider does not seem to epxose the persister. We use our own provider to get access to the persister in the event that we need to remove storage (e.g. during signout).
const PersistQueryClientInstanceProvider: FC<PersistQueryClientInstanceProviderProps> =
  memo(({ children, localStoragePersister }) => {
    const value = useMemo(
      () => ({
        localStoragePersister,
      }),
      [localStoragePersister],
    );

    return (
      <PersistQueryClientInstanceContext.Provider value={value}>
        {children}
      </PersistQueryClientInstanceContext.Provider>
    );
  });

PersistQueryClientInstanceProvider.displayName =
  'PersistQueryClientInstanceProvider';

const usePersistQueryClientInstance = () =>
  useContext(PersistQueryClientInstanceContext);

export { PersistQueryClientInstanceProvider, usePersistQueryClientInstance };
