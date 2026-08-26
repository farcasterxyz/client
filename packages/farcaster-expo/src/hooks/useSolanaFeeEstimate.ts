import { SolanaCombinedTransaction } from '@farcaster/miniapp-core';
import { VersionedTransaction } from '@solana/web3.js';
import * as React from 'react';

import { SOLANA_NATIVE_ASSET_ADDRESS, solanaConnection } from '../utils';
import { useWalletBalances } from './useWalletBalances';

type EstimatedFees = {
  isLoading: boolean;
  estimatedFee?: number;
  estimatedFeeUsd?: number;
  error?: Error;
};

type EstimatedFeeFetch =
  | { status: 'pending' }
  | { status: 'error'; error: Error | undefined }
  | { status: 'success'; lamports: number };

const lamportsInSolana = 1e9;

export type SolanaFeeEstimateParams = {
  enabled?: boolean;
  transaction?: SolanaCombinedTransaction;
};

export function useSolanaFeeEstimate({
  enabled = true,
  transaction,
}: SolanaFeeEstimateParams): EstimatedFees {
  const {
    balances,
    isPending: solanaPriceIsPending,
    isError: solanaPriceIsError,
  } = useWalletBalances();
  const solanaPrice = React.useMemo(
    () =>
      balances.find(
        (p) =>
          p.address === SOLANA_NATIVE_ASSET_ADDRESS && p.chain === 'solana',
      )?.price,
    [balances],
  );

  const [estimatedFee, setEstimatedFee] = React.useState<EstimatedFeeFetch>({
    status: 'pending',
  });

  const message = React.useMemo(() => {
    if (!enabled) {
      return '';
    }
    if (!transaction) {
      throw new Error('no transaction in enabled useSolanaFeeEstimate query');
    }
    if (transaction instanceof VersionedTransaction) {
      return transaction.message;
    }
    return transaction.compileMessage();
  }, [enabled, transaction]);

  React.useEffect(() => {
    if (!message) {
      return;
    }
    setEstimatedFee({ status: 'pending' });
    (async () => {
      try {
        const { value } = await solanaConnection.getFeeForMessage(message);
        if (value === null) {
          setEstimatedFee({
            status: 'error',
            error: new Error('failed to estimate Solana fees'),
          });
          return;
        }
        setEstimatedFee({ status: 'success', lamports: value });
      } catch (e) {
        const error = e instanceof Error ? e : undefined;
        setEstimatedFee({ status: 'error', error });
      }
    })();
  }, [message]);

  return React.useMemo(() => {
    if (!enabled) {
      return { isLoading: false };
    } else if (estimatedFee.status === 'error') {
      return { isLoading: false, error: estimatedFee.error };
    } else if (estimatedFee.status === 'pending') {
      return { isLoading: true };
    } else if (solanaPrice) {
      return {
        isLoading: false,
        estimatedFee: estimatedFee.lamports,
        estimatedFeeUsd:
          (estimatedFee.lamports * solanaPrice) / lamportsInSolana,
      };
    } else if (solanaPriceIsPending) {
      return { isLoading: true, estimatedFee: estimatedFee.lamports };
    } else if (solanaPriceIsError) {
      return {
        isLoading: false,
        estimatedFee: estimatedFee.lamports,
        error: new Error('failed to get Solana price'),
      };
    } else {
      return { isLoading: false };
    }
  }, [
    enabled,
    estimatedFee,
    solanaPrice,
    solanaPriceIsPending,
    solanaPriceIsError,
  ]);
}
