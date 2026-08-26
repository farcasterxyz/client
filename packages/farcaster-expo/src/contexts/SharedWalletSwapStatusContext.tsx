import { createContext, useContext } from 'react';

type SharedWalletSwapStatusContextType = {
  onSuccess: () => void;
};

export const SharedWalletSwapStatusContext =
  createContext<SharedWalletSwapStatusContextType>({
    onSuccess: () => {},
  });

export function useSharedWalletSwapStatusContext() {
  return useContext(SharedWalletSwapStatusContext);
}
