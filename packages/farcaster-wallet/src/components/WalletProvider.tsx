import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getWalletService } from '../core/wallet';

interface WalletContextType {
  address: string | null;
  balance: string | null;
  setBalance: (balance: string | null) => void;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  balance: null,
  setBalance: () => {},
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    const service = getWalletService();
    const addr = service.createWallet();
    setAddress(addr);
    setIsConnected(true);
  };

  const disconnect = () => {
    setAddress(null);
    setBalance(null);
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider value={{
      address,
      balance,
      setBalance,
      isConnected,
      connect,
      disconnect,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
