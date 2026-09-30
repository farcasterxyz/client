import * as React from 'react';

type WalletLockedListener = (locked: boolean) => void;

type WalletLockedContextType = {
  lockWallet: () => void;
  addWalletLockedListener: (listener: WalletLockedListener) => () => void;
};

const WalletLockedContext = React.createContext<
  WalletLockedContextType | undefined
>(undefined);

function useWalletLocked() {
  const walletLockedContext = React.useContext(WalletLockedContext);
  if (!walletLockedContext) {
    throw new Error('no WalletLockedContext');
  }
  return walletLockedContext;
}

type WalletLockedProviderProps = {
  children: React.ReactNode;
};

function WalletLockedProvider({ children }: WalletLockedProviderProps) {
  const walletLockListeners = React.useRef<WalletLockedListener[]>([]);

  const addWalletLockedListener = React.useCallback(
    (listener: WalletLockedListener) => {
      walletLockListeners.current.push(listener);
      return () => {
        walletLockListeners.current = walletLockListeners.current.filter(
          (l) => l !== listener,
        );
      };
    },
    [],
  );

  const setWalletLocked = React.useCallback((locked: boolean) => {
    for (const listener of walletLockListeners.current) {
      listener(locked);
    }
  }, []);

  const lockWallet = React.useCallback(
    () => setWalletLocked(true),
    [setWalletLocked],
  );

  const context = React.useMemo(
    () => ({
      lockWallet,
      addWalletLockedListener,
    }),
    [lockWallet, addWalletLockedListener],
  );

  return (
    <WalletLockedContext.Provider value={context}>
      {children}
    </WalletLockedContext.Provider>
  );
}

export { useWalletLocked, WalletLockedProvider };
