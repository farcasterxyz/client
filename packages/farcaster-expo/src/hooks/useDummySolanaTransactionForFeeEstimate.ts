import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as React from 'react';

import {
  getComputeUnitInstructions,
  solanaConnection,
} from '../utils/SolanaUtils';
import { useSolanaBlockhash } from './useSolanaBlockhash';

type Params = {
  enabled?: boolean;
  toAddress?: string;
  fromAddress?: string;
};
export function useDummySolanaTransactionForFeeEstimate(params: Params) {
  const enabled = params?.enabled ?? true;

  const canProceed = !!(enabled && params.fromAddress && params.toAddress);
  const blockhash = useSolanaBlockhash({ enabled: canProceed });

  const createTransaction = React.useCallback(
    (recentBlockhash: string) => {
      if (!enabled || !params.fromAddress || !params.toAddress) {
        return null;
      }

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(params.fromAddress),
          toPubkey: new PublicKey(params.toAddress),
          lamports: 1,
        }),
      );
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = new PublicKey(params.fromAddress);
      return transaction;
    },
    [enabled, params.fromAddress, params.toAddress],
  );

  const baseTransaction = React.useMemo(() => {
    if (!blockhash) {
      return null;
    }
    return createTransaction(blockhash);
  }, [blockhash, createTransaction]);

  const [unitsConsumed, setUnitsConsumed] = React.useState<
    number | undefined
  >();
  React.useEffect(() => {
    if (!baseTransaction) {
      return;
    }
    (async () => {
      const simulation =
        await solanaConnection.simulateTransaction(baseTransaction);
      if (simulation.value.err) {
        return;
      }
      setUnitsConsumed(simulation.value.unitsConsumed);
    })();
  }, [baseTransaction]);

  return React.useMemo(() => {
    if (!blockhash) {
      return null;
    }
    const transaction = createTransaction(blockhash);
    if (!transaction) {
      return null;
    }
    transaction.add(...getComputeUnitInstructions(unitsConsumed));
    return transaction;
  }, [blockhash, createTransaction, unitsConsumed]);
}
