import * as React from 'react';

import {
  OpenableWarpcastWalletContext,
  useOpenableWarpcastWallet,
} from './OpenableWarpcastWalletContext';

type SubordinateOpenableWarpcastWalletProviderProps = {
  children: React.ReactNode;
};

function SubordinateOpenableWarpcastWalletProvider({
  children,
}: SubordinateOpenableWarpcastWalletProviderProps) {
  const { isWarpcastWalletOpen: parentIsWarpcastWalletOpen } =
    useOpenableWarpcastWallet();
  const [isWarpcastWalletOpen, setIsWarpcastWalletOpen] = React.useState(
    parentIsWarpcastWalletOpen,
  );

  // Keep in sync with parent. NOTE: we don't do both directions to avoid infinite rendering loops.
  React.useEffect(() => {
    if (!parentIsWarpcastWalletOpen) {
      setIsWarpcastWalletOpen(false);
    }
  }, [parentIsWarpcastWalletOpen]);

  const openWarpcastWallet = React.useCallback(() => {
    setIsWarpcastWalletOpen(true);
  }, []);
  const closeWarpcastWallet = React.useCallback(() => {
    setIsWarpcastWalletOpen(false);
  }, []);

  const parentContext = useOpenableWarpcastWallet();
  const openMainWarpcastWallet = parentContext.openWarpcastWallet;

  const context = React.useMemo(
    () => ({
      isWarpcastWalletOpen,
      openWarpcastWallet,
      closeWarpcastWallet,
      openMainWarpcastWallet,
    }),
    [
      isWarpcastWalletOpen,
      openWarpcastWallet,
      closeWarpcastWallet,
      openMainWarpcastWallet,
    ],
  );

  return (
    <OpenableWarpcastWalletContext.Provider value={context}>
      {children}
    </OpenableWarpcastWalletContext.Provider>
  );
}

export { SubordinateOpenableWarpcastWalletProvider };
