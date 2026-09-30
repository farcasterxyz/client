import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiChain, ApiWalletTransactionMetadata } from 'farcaster-client-data';
import { useCallback, useMemo, useState } from 'react';

import { ConnectionContext } from '../types';

type MiscTransactionMetadata = {
  type: 'misc';
  connectionContext?: ConnectionContext;
};

export type PendingTransactionMetadata =
  | ApiWalletTransactionMetadata
  | MiscTransactionMetadata;

type PendingTransactionStatus = 'pending' | 'confirmed' | 'reverted';

export interface PendingTransaction {
  chain: ApiChain;
  txHash: string;
  timestamp: number;
  metadata?: PendingTransactionMetadata;
  status: PendingTransactionStatus;
}

export type PendingTransactionData = Omit<
  PendingTransaction,
  'timestamp' | 'status'
>;

export type PendingTransactionResult =
  | {
      exists: true;
      chain: ApiChain;
      status: PendingTransactionStatus;
    }
  | {
      exists: false;
    };

const PENDING_TX_CACHE_KEY = ['pending-transactions'];

export const useWalletPendingTransactions = () => {
  const queryClient = useQueryClient();

  const { data = [] } = useQuery<PendingTransaction[]>({
    queryKey: PENDING_TX_CACHE_KEY,
    initialData: [],
  });

  const pendingTransactions = useMemo(() => {
    return data.filter((tx) => tx.status === 'pending');
  }, [data]);

  const addPendingTransaction = useCallback(
    (data: PendingTransactionData): PendingTransaction => {
      const pendingTransaction: PendingTransaction = {
        ...data,
        timestamp: Date.now(),
        status: 'pending',
      };

      queryClient.setQueryData<PendingTransaction[]>(
        PENDING_TX_CACHE_KEY,
        (old = []) => [...old, pendingTransaction],
      );

      return pendingTransaction;
    },
    [queryClient],
  );

  const removePendingTransaction = useCallback(
    (txHash: string) => {
      queryClient.setQueryData<PendingTransaction[]>(
        PENDING_TX_CACHE_KEY,
        (old = []) => old.filter((tx) => tx.txHash !== txHash),
      );
      return txHash;
    },
    [queryClient],
  );

  const getPendingTransaction = useCallback(
    (txHash: string): PendingTransactionResult => {
      const result = pendingTransactions.find((tx) => tx.txHash === txHash);
      if (!result) {
        return { exists: false };
      }
      return { exists: true, chain: result.chain, status: result.status };
    },
    [pendingTransactions],
  );

  return useMemo(
    () => ({
      pendingTransactions,
      addPendingTransaction,
      removePendingTransaction,
      getPendingTransaction,
    }),
    [
      pendingTransactions,
      addPendingTransaction,
      removePendingTransaction,
      getPendingTransaction,
    ],
  );
};

export const useWalletPendingTransaction = (txHash?: string) => {
  const { getPendingTransaction } = useWalletPendingTransactions();
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const { data } = useQuery({
    queryKey: ['pending-transaction', txHash],
    queryFn: async () => {
      if (!txHash) {
        return null;
      }

      const result = getPendingTransaction(txHash);
      if (!result.exists || result.status !== 'pending') {
        setShouldRefetch(false);
      }
      return result;
    },
    refetchInterval: shouldRefetch ? 200 : false,
    enabled: !!txHash,
  });

  return data;
};
