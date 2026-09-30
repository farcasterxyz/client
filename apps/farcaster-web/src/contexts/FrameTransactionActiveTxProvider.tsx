import { FrameTransaction } from 'farcaster-client-hooks';
import React from 'react';

type FrameTransactionActiveTxContextValue = {
  activeTx: FrameTransaction | undefined;
  setActiveTx: ({ tx }: { tx: FrameTransaction }) => void;
};

const FrameTransactionActiveTxContext =
  React.createContext<FrameTransactionActiveTxContextValue>({} as never);

interface FrameTransactionActiveTxProviderProps {
  children: React.ReactNode;
}

const FrameTransactionActiveTxProvider: React.FC<
  FrameTransactionActiveTxProviderProps
> = ({ children }) => {
  const [tx, setTx] = React.useState<FrameTransaction | undefined>(undefined);

  const setActiveTx = React.useCallback(({ tx }: { tx: FrameTransaction }) => {
    setTx(tx);
  }, []);

  return (
    <FrameTransactionActiveTxContext.Provider
      value={{
        activeTx: tx,
        setActiveTx,
      }}
    >
      {children}
    </FrameTransactionActiveTxContext.Provider>
  );
};

FrameTransactionActiveTxProvider.displayName =
  'FrameTransactionActiveTxProvider';

const useFrameTransactionActiveTx = () =>
  React.useContext(FrameTransactionActiveTxContext);

export { FrameTransactionActiveTxProvider, useFrameTransactionActiveTx };
