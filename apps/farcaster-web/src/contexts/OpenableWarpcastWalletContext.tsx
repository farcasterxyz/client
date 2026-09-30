import * as React from 'react';

const OpenableWarpcastWalletContext = React.createContext({
  isWarpcastWalletOpen: false,
  openWarpcastWallet: () => {},
  closeWarpcastWallet: () => {},
  openMainWarpcastWallet: () => {},
});

const useOpenableWarpcastWallet = () =>
  React.useContext(OpenableWarpcastWalletContext);

export { OpenableWarpcastWalletContext, useOpenableWarpcastWallet };
