import { RELAY_SOLANA_CHAIN_ID } from 'farcaster-client-data';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';

import { useSolanaBalance } from './useSolanaBalance';

const WEI = 1n;

export const useWalletNativeBalance = ({
  chainId,
  address,
  forceLowBalance = false,
}: {
  chainId?: number;
  address: string;
  forceLowBalance?: boolean;
}) => {
  const { data } = useBalance({
    chainId,
    address: address as `0x${string}`,
    query: {
      enabled: !!chainId && chainId !== RELAY_SOLANA_CHAIN_ID,
      refetchInterval: 1000 * 2,
      staleTime: 0,
    },
  });

  const { data: solanaData } = useSolanaBalance({
    address,
    enabled: !!chainId && chainId === RELAY_SOLANA_CHAIN_ID,
  });

  if (forceLowBalance) {
    return {
      value: WEI,
      decimals: 18,
      formatted: formatUnits(WEI, 9),
      symbol: 'ETH',
    };
  }

  return chainId === RELAY_SOLANA_CHAIN_ID ? solanaData : data;
};
