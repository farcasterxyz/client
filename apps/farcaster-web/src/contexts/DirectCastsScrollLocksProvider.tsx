import React from 'react';

type ScrollLocks = { [conversationId: string]: boolean };

type DirectCastsScrollLocksContextValue = {
  lock: ({ conversationId }: { conversationId: string }) => void;
  unlock: ({ conversationId }: { conversationId: string }) => void;
  isScrollLocked: ({ conversationId }: { conversationId: string }) => boolean;
};

const DirectCastsScrollLocksContext =
  React.createContext<DirectCastsScrollLocksContextValue>({} as never);

type DirectCastsScrollLocksProviderProps = {
  children: React.ReactNode;
};

const DirectCastsScrollLocksProvider: React.FC<
  DirectCastsScrollLocksProviderProps
> = ({ children }) => {
  const [locks, setLocks] = React.useState<ScrollLocks>({});

  const isScrollLocked = React.useCallback(
    ({ conversationId }: { conversationId: string }) => {
      return (
        typeof locks[conversationId] !== 'undefined' && locks[conversationId]
      );
    },
    [locks],
  );

  const unlock = React.useCallback(
    ({ conversationId }: { conversationId: string }) => {
      setLocks((prev) => {
        delete prev[conversationId];
        return { ...prev };
      });
    },
    [],
  );

  const lock = React.useCallback(
    ({ conversationId }: { conversationId: string }) => {
      setLocks((prev) => ({ ...prev, [conversationId]: true }));
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      lock,
      unlock,
      isScrollLocked,
    }),
    [isScrollLocked, lock, unlock],
  );

  return (
    <DirectCastsScrollLocksContext.Provider value={value}>
      {children}
    </DirectCastsScrollLocksContext.Provider>
  );
};

const useDirectCastsScrollLocks = () =>
  React.useContext(DirectCastsScrollLocksContext);

export { DirectCastsScrollLocksProvider, useDirectCastsScrollLocks };
