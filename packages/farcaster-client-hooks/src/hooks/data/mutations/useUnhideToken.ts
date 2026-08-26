import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { WalletPositionsCache } from '../../../types';
import { buildWalletPositionsKey } from '../../data/queries';

const useUnhideToken = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  return useCallback(
    async ({
      fid,
      ca,
      chain,
    }: {
      fid: number;
      ca: string;
      chain: ApiChain;
    }) => {
      qc.setQueryData<WalletPositionsCache>(
        buildWalletPositionsKey({ fid: fid }),
        (data) => {
          if (!data) {
            return;
          }

          const { positions, totalBalance } = data;

          const updatedPositions = [];
          let updatedTotalBalance = totalBalance;

          for (const p of positions) {
            if (p.chain === chain && p.address === ca) {
              if (typeof p.value !== 'undefined') {
                updatedTotalBalance += p.value;
              }

              updatedPositions.push({ ...p, userHidden: false });
            } else {
              updatedPositions.push(p);
            }
          }

          const updatedData = {
            ...data,
            positions: updatedPositions,
            totalBalance: updatedTotalBalance,
          };

          return updatedData;
        },
      );

      await apiClient.unhideToken({ ca, chain });
    },
    [apiClient, qc],
  );
};

export { useUnhideToken };
