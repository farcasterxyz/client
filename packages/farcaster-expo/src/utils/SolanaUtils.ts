import {
  SolanaCombinedTransaction,
  SolanaConnectRequestArguments,
  SolanaRequestFn,
  SolanaSignAndSendTransactionRequestArguments,
  SolanaSignMessageRequestArguments,
  SolanaSignTransactionRequestArguments,
} from '@farcaster/miniapp-core';
import {
  ComputeBudgetProgram,
  Connection as SolanaConnection,
  PublicKey,
  Transaction as LegacyTransaction,
  TransactionError,
} from '@solana/web3.js';

import { baseApiUrl } from '../constants/Api';
import {
  SolanaRequestFnWithConn,
  SolanaWalletProviderWithConn,
} from '../types';

export const isSolanaAddress = (address: string) => {
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const createSolanaWalletProviderWithConn = (
  request: SolanaRequestFnWithConn,
): SolanaWalletProviderWithConn => ({
  request,
  signMessage: (msg: string) =>
    request({ method: 'signMessage', params: { message: msg } }),
  signTransaction: <T extends SolanaCombinedTransaction>(transaction: T) =>
    request({ method: 'signTransaction', params: { transaction } }),
  signAndSendTransaction: (input: {
    transaction: SolanaCombinedTransaction;
    connection: SolanaConnection;
  }) =>
    request({
      method: 'signAndSendTransaction',
      params: input,
    }),
});

export const solanaConnection = new SolanaConnection(
  `${baseApiUrl}/solana-rpc`,
  'confirmed',
);

export function bindSolanaConnIntoRequestFn(
  requestFn: SolanaRequestFnWithConn,
): SolanaRequestFn {
  const wrappedRequestFn = async <T extends SolanaCombinedTransaction>(
    request:
      | SolanaConnectRequestArguments
      | SolanaSignMessageRequestArguments
      | SolanaSignAndSendTransactionRequestArguments
      | SolanaSignTransactionRequestArguments<T>,
  ) => {
    if (request.method === 'connect') {
      return await requestFn(request);
    } else if (request.method === 'signMessage') {
      return await requestFn(request);
    } else if (request.method === 'signAndSendTransaction') {
      return await requestFn({
        ...request,
        params: {
          ...request.params,
          connection: solanaConnection,
        },
      });
    } else if (request.method === 'signTransaction') {
      return await requestFn(request);
    }
  };
  return wrappedRequestFn as SolanaRequestFn;
}

export type SolanaTransactionStatus =
  | 'processed'
  | 'confirmed'
  | 'finalized'
  | 'reverted';

export type SolanaTransactionConfirmationOptions = {
  /**
   * The signature of the transaction.
   */
  signature: string;
  /**
   * Are we waiting for transaction to be processed or confirmed?
   */
  waitingFor: 'processed' | 'confirmed';
  /**
   * Optional callback to emit transaction status changes.
   */
  onStatusChange?: (status: SolanaTransactionStatus) => void;
  /**
   * Polling frequency (in ms).
   * @default 2000
   */
  pollingInterval?: number;
  /**
   * Number of times to retry if the transaction is not found.
   * @default 6
   */
  retryCount?: number;
  /**
   * Time to wait (in ms) between retries.
   * @default ({ count }) => ~~(1 << count) * 200
   */
  retryDelay?: (params: { count: number }) => number;
  /**
   * Optional timeout (in milliseconds) to wait before stopping polling.
   * @default 180_000
   */
  timeout?: number;
};

export type SolanaTransactionConfirmationResult = {
  signature: string;
  status: SolanaTransactionStatus;
  slot: number;
  err: TransactionError | null;
};

export class SolanaTransactionNotFoundError extends Error {
  name = 'SolanaTransactionNotFoundError';
  constructor(signature: string) {
    super(`Transaction not found: ${signature}`);
  }
}

export class SolanaTransactionTimeoutError extends Error {
  name = 'SolanaTransactionTimeoutError';
  constructor(signature: string) {
    super(`Transaction timed out: ${signature}`);
  }
}

export async function waitForSolanaTransaction({
  signature,
  waitingFor,
  onStatusChange,
  pollingInterval = 200,
  retryCount = 30,
  retryDelay = () => 200,
  timeout = 180_000,
}: SolanaTransactionConfirmationOptions): Promise<SolanaTransactionConfirmationResult> {
  const startTime = Date.now();
  let attempts = 0;

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      throw new SolanaTransactionTimeoutError(signature);
    }

    try {
      const status = await solanaConnection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      if (!status.value) {
        // Transaction not found, retry with exponential backoff
        if (attempts < retryCount) {
          attempts++;
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay({ count: attempts })),
          );
          continue;
        }
        throw new SolanaTransactionNotFoundError(signature);
      }

      // Handle transaction error
      if (status.value.err) {
        onStatusChange?.('reverted');
        throw new Error(
          `Transaction reverted: ${JSON.stringify(status.value.err)}`,
        );
      }

      // Check confirmation status
      const { confirmationStatus } = status.value;

      waitingFor;

      // Emit status change
      if (confirmationStatus) {
        onStatusChange?.(confirmationStatus as SolanaTransactionStatus);
        if (waitingFor === 'processed' || confirmationStatus !== 'processed') {
          // If we're waiting for the transaction to be processed, then any
          // confirmationStatus is sufficient (processed/confirmed/finalized).
          // If we're waiting for the transaction to be confirmed, then anything
          // other than processed (confirmed/finalized) is sufficient.
          return {
            signature,
            status: confirmationStatus as SolanaTransactionStatus,
            slot: status.value.slot,
            err: status.value.err,
          };
        }
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    } catch (error) {
      if (error instanceof SolanaTransactionNotFoundError) {
        throw error;
      }
      // For other errors, retry with exponential backoff
      if (attempts < retryCount) {
        attempts++;
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay({ count: attempts })),
        );
        continue;
      }
      throw error;
    }
  }
}

const MAX_PRIORITY_FEE = 75_000;
const MICRO_LAMPORTS_PER_LAMPORTS = 1_000_000;
const MIN_COMPUTE_UNIT_LIMIT = 500;

export function getComputeUnitInstructions(unitsConsumed = 0) {
  const computeUnitLimit = Math.max(
    Math.ceil(unitsConsumed * 1.2),
    MIN_COMPUTE_UNIT_LIMIT,
  );
  const computeUnitPrice = Math.floor(
    (MAX_PRIORITY_FEE * MICRO_LAMPORTS_PER_LAMPORTS) / computeUnitLimit,
  );

  return [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnitLimit,
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: computeUnitPrice,
    }),
  ];
}

export function serializeSolanaTransaction(
  transaction: SolanaCombinedTransaction,
): string {
  let bytes;
  if (transaction instanceof LegacyTransaction) {
    bytes = transaction.serialize({ requireAllSignatures: false });
  } else {
    const uint8Array = transaction.serialize();
    bytes = Buffer.from(uint8Array);
  }
  return bytes.toString('hex');
}

export function solanaTransactionToUint8Array(
  transaction: SolanaCombinedTransaction,
): Uint8Array {
  if (transaction instanceof LegacyTransaction) {
    const buffer = transaction.serialize({ requireAllSignatures: false });
    return new Uint8Array(buffer.buffer);
  } else {
    return transaction.serialize();
  }
}
