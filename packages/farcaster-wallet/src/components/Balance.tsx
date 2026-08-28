import React, { useEffect } from 'react';
import { useWallet } from './WalletProvider';
import { getWalletService } from '../core/wallet';

export const Balance: React.FC = () => {
  const { address, balance, setBalance, isConnected } = useWallet();

  useEffect(() => {
    if (isConnected && address) {
      getWalletService()
        .getBalance()
        .then(setBalance)
        .catch((err) => console.error('Failed to fetch balance:', err));
    }
  }, [isConnected, address, setBalance]);

  if (!isConnected) {
    return <div className="text-sm text-gray-400">Not connected</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-gray-400">
        Address: {address?.slice(0, 6)}...{address?.slice(-4)}
      </div>
      <div className="text-lg font-bold">Balance: {balance ?? 'Loading...'}</div>
    </div>
  );
};
