import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';

import { solanaConnection } from '../utils';

export const useSolanaBalance = ({
  address,
  enabled,
}: {
  address: string;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: ['solanaBalance', address],
    queryFn: async () => {
      const balance = await solanaConnection.getBalance(new PublicKey(address));
      return {
        value: BigInt(balance),
        decimals: 9,
        formatted: formatUnits(BigInt(balance), 9),
        symbol: 'SOL',
      };
    },
    enabled,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  });
