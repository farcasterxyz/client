import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDisperse,
  chainIdToChain,
  chainIdToChainOrThrow,
  extractWalletChain,
  WalletChainId,
} from 'farcaster-client-data';
import { useRecordWalletTransaction } from 'farcaster-client-hooks';
import {
  useEmbeddedWallet,
  usePublicClient,
  useWalletRefresh,
} from 'farcaster-expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  encodeFunctionData,
  erc20Abi,
  Hex,
  parseUnits,
  TransactionExecutionError,
  WaitForTransactionReceiptTimeoutError,
} from 'viem';

import { disperseAppAbi } from '~/abis/DisperseAppAbi';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { trackError } from '~/utils/ErrorUtils';

export type DisperseState =
  | 'pending'
  | 'succeeded'
  | 'approval-reverted'
  | 'disperse-reverted'
  | 'error';

export type DisperseError = {
  type: 'validation' | 'simulation' | 'other';
  code: ErrorPattern;
};

export type DisperseTokensResult = {
  disperseTxHash?: Hex;
  approvalTxHash?: Hex;
  disperseState?: DisperseState;
  disperseError?: DisperseError;
  executeDisperse: (
    disperse: ApiDisperse,
    attributedDomain?: string,
  ) => Promise<void>;
};

type DisperseAnalyticsProperties = {
  version?: 'v1';
  tokenAddress?: string;
  tokenAmount?: string;
  tokenDecimals?: number;
  chainId?: number;
  recipients?: string[];
};

type ErrorPattern =
  | 'REPLACEMENT_UNDERPRICED'
  | 'FAILED_TO_SEND'
  | 'NO_HEALTHY_BACKEND'
  | 'NETWORK_DETECTION_FAILED'
  | 'WALLET_CONNECTION_TIMEOUT'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_GAS'
  | 'INTERNAL_ERROR'
  | 'OTHER'
  | 'TIMEOUT'
  | 'UNKNOWN';

const TRANSACTION_EXECUTION_ERROR_PATTERNS: {
  needle: string;
  shortMessage: ErrorPattern;
}[] = [
  {
    needle: 'replacement transaction underpriced',
    shortMessage: 'REPLACEMENT_UNDERPRICED',
  },
  { needle: 'failed to send tx', shortMessage: 'FAILED_TO_SEND' },
  {
    needle: 'no backend is currently healthy',
    shortMessage: 'NO_HEALTHY_BACKEND',
  },
  {
    needle: 'could not detect network',
    shortMessage: 'NETWORK_DETECTION_FAILED',
  },
  {
    needle: 'Operation reached timeout: wallets:connect',
    shortMessage: 'WALLET_CONNECTION_TIMEOUT',
  },
  {
    needle: 'The total cost (gas * gas fee + value)',
    shortMessage: 'INSUFFICIENT_FUNDS',
  },
  {
    needle: 'insufficient funds for gas * price + value',
    shortMessage: 'INSUFFICIENT_FUNDS',
  },
  {
    needle: 'The amount of gas provided for the transaction is too low',
    shortMessage: 'INSUFFICIENT_GAS',
  },
  { needle: 'An internal error was received', shortMessage: 'INTERNAL_ERROR' },
];

const WAIT_FOR_TRANSACTION_RECEIPT_TIMEOUT_PATTERNS: {
  needle: string;
  shortMessage: ErrorPattern;
}[] = [
  {
    needle: 'timed out while waiting for transaction',
    shortMessage: 'TIMEOUT',
  },
];

function getShortErrorMessage(error: unknown): [ErrorPattern, string] {
  if (!(error instanceof Error)) {
    return ['UNKNOWN', 'NotAnError'];
  }

  const errorName = error.name ?? 'NoErrorName';
  if (error instanceof TransactionExecutionError) {
    const pattern = TRANSACTION_EXECUTION_ERROR_PATTERNS.find((p) => {
      const message = error.message.toLowerCase();
      return message.includes(p.needle.toLowerCase());
    });
    const shortMessage = pattern?.shortMessage ?? 'OTHER';
    return [shortMessage, errorName];
  }

  if (error instanceof WaitForTransactionReceiptTimeoutError) {
    const pattern = WAIT_FOR_TRANSACTION_RECEIPT_TIMEOUT_PATTERNS.find((p) => {
      const message = error.message.toLowerCase();
      return message.includes(p.needle.toLowerCase());
    });
    const shortMessage = pattern?.shortMessage ?? 'OTHER';
    return [shortMessage, errorName];
  }

  return ['UNKNOWN', errorName];
}

export const useDisperseTokens = (): DisperseTokensResult => {
  const [approvalTxHash, setApprovalTxHash] = useState<Hex>();
  const [disperseTxHash, setDisperseTxHash] = useState<Hex>();
  const [disperseState, setDisperseState] = useState<DisperseState>();
  const [disperseError, setDisperseError] = useState<DisperseError>();
  const [disperse, setDisperse] = useState<ApiDisperse>();

  const {
    getWalletClient,
    evmAddress,
    addPendingTransaction,
    removePendingTransaction,
  } = useEmbeddedWallet();
  const { getEthereumClient } = usePublicClient();
  const { trackEvent } = useAnalytics();

  const recordWalletTransaction = useRecordWalletTransaction();
  const refreshWallet = useWalletRefresh();
  const attributedDomainRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (disperseState && disperseTxHash && disperse) {
      // Only record transactions that have a transaction hash
      if (
        disperseState !== 'succeeded' &&
        disperseState !== 'disperse-reverted'
      ) {
        return;
      }
      void recordWalletTransaction({
        params: {
          ethChainId: disperse.chainId,
          ethAddress: evmAddress as Hex,
          ethTxHash: disperseTxHash,
          provider: 'warpcast',
          attributedDomain: attributedDomainRef.current,
          metadata: {
            type: 'disperse',
            status: disperseState,
            tokenAddress: disperse.tokenAddress,
            chainId: disperse.chainId,
            amount: disperse.amount,
            recipients: disperse.recipients,
          },
        },
      }).catch((e) => {
        trackError(e);
      });
    }
  }, [
    disperseState,
    disperseTxHash,
    evmAddress,
    recordWalletTransaction,
    disperse,
    attributedDomainRef,
  ]);

  const executeDisperse = useCallback(
    async (disperse: ApiDisperse, attributedDomain?: string) => {
      setDisperseState('pending');
      setDisperseError(undefined);
      setDisperse(disperse);
      if (attributedDomain) {
        attributedDomainRef.current = attributedDomain;
      }

      const analyticsProperties: DisperseAnalyticsProperties = (() => {
        try {
          return {
            version: 'v1',
            tokenAddress: disperse.tokenAddress,
            tokenAmount: disperse.amount.toString(),
            tokenDecimals: disperse.tokenDecimals,
            chainId: disperse.chainId,
            recipients: disperse.recipients,
          };
        } catch {
          return {};
        }
      })();

      let disperseTxHash: Hex | undefined;

      try {
        const chain = extractWalletChain({
          id: disperse.chainId as WalletChainId,
        });
        const walletClient = await getWalletClient(chain);
        const publicClient = getEthereumClient({
          chain,
        });

        trackEvent(
          AnalyticsEvent.DisperseWalletTransaction,
          analyticsProperties,
        );

        const totalDispersed = disperse.amount * disperse.recipients.length;

        const disperseAppAddress = '0xD152f549545093347A162Dce210e7293f1452150'; // Disperse.app contract address
        const amountToApprove = parseUnits(
          totalDispersed.toString(),
          disperse.tokenDecimals,
        );

        const gasData = await publicClient.estimateFeesPerGas();

        const gasEstimate = await publicClient.estimateGas({
          account: evmAddress as Hex,
          to: disperse.tokenAddress as Hex,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [disperseAppAddress, amountToApprove],
          }),
          value: 0n,
        });

        const approvalData = {
          to: disperse.tokenAddress,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [disperseAppAddress, amountToApprove],
          }),
          value: '0',
          gas: gasEstimate.toString(),
          maxFeePerGas: gasData.maxFeePerGas.toString(),
          maxPriorityFeePerGas: gasData.maxPriorityFeePerGas.toString(),
        };

        const approvalRequest = {
          to: approvalData.to as Hex,
          data: approvalData.data as Hex,
          value: BigInt(approvalData.value),
          chain: chain,
          gas: approvalData.gas ? BigInt(approvalData.gas) : undefined,
          maxFeePerGas: approvalData.maxFeePerGas
            ? BigInt(approvalData.maxFeePerGas)
            : undefined,
          maxPriorityFeePerGas: approvalData.maxPriorityFeePerGas
            ? BigInt(approvalData.maxPriorityFeePerGas)
            : undefined,
        };

        const tempApprovalTxHash =
          await walletClient.sendTransaction(approvalRequest);

        setApprovalTxHash(tempApprovalTxHash);

        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: tempApprovalTxHash,
        });

        if (approvalReceipt.status !== 'success') {
          setDisperseState('approval-reverted');
          return;
        }

        const disperseAmounts = disperse.recipients.map(() =>
          parseUnits(disperse.amount.toString(), disperse.tokenDecimals),
        );

        const disperseData = encodeFunctionData({
          abi: disperseAppAbi,
          functionName: 'disperseToken',
          args: [
            disperse.tokenAddress as Hex,
            disperse.recipients as Hex[],
            disperseAmounts,
          ],
        });

        const disperseGasEstimate = await publicClient.estimateGas({
          account: evmAddress as Hex,
          to: disperseAppAddress as Hex,
          data: disperseData,
          value: 0n,
        });

        const txData = {
          to: disperseAppAddress,
          data: disperseData,
          value: '0',
          gas: disperseGasEstimate.toString(),
          maxFeePerGas: gasData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: gasData.maxPriorityFeePerGas?.toString(),
        };

        const request = {
          to: txData.to as Hex,
          data: txData.data as Hex,
          value: BigInt(txData.value),
          chain: chain,
          gas: txData.gas ? BigInt(txData.gas) : undefined,
          maxFeePerGas: txData.maxFeePerGas
            ? BigInt(txData.maxFeePerGas)
            : undefined,
          maxPriorityFeePerGas: txData.maxPriorityFeePerGas
            ? BigInt(txData.maxPriorityFeePerGas)
            : undefined,
        };

        disperseTxHash = await walletClient.sendTransaction(request);

        addPendingTransaction({
          chain: chainIdToChainOrThrow(chain.id.toString()),
          txHash: disperseTxHash,
          metadata: {
            type: 'disperse',
            tokenAddress: disperse.tokenAddress,
            chainId: chain.id,
            amount: disperse.amount,
            recipients: disperse.recipients,
          },
        });

        setDisperseTxHash(disperseTxHash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: disperseTxHash,
        });

        await removePendingTransaction(disperseTxHash);

        if (receipt.status === 'success') {
          const chain = chainIdToChain(disperse.chainId.toString());
          if (!chain) {
            return;
          }
          await refreshWallet([
            {
              chain,
              ca: disperse.tokenAddress,
              decimals: disperse.tokenDecimals,
            },
          ]);
          setDisperseState('succeeded');
          trackEvent(
            AnalyticsEvent.DisperseWalletTransactionSucceeded,
            analyticsProperties,
          );
        } else {
          setDisperseState('disperse-reverted');
          trackEvent(
            AnalyticsEvent.DisperseWalletTransactionReverted,
            analyticsProperties,
          );
        }
      } catch (e: unknown) {
        setDisperseState('error');

        trackEvent(AnalyticsEvent.DisperseWalletTransactionError, {
          error: e instanceof Error ? `${e.name}: ${e.message}` : 'unknown',
          ...analyticsProperties,
        });

        const [code] = getShortErrorMessage(e);
        setDisperseError({
          type: 'other',
          code,
        });

        if (e instanceof Error) {
          trackError(new Error(`error executing disperse: ${e.message}`), {
            cause: e,
          });
        }
      }
    },
    [
      getWalletClient,
      getEthereumClient,
      trackEvent,
      removePendingTransaction,
      addPendingTransaction,
      evmAddress,
      refreshWallet,
    ],
  );

  return {
    executeDisperse,
    approvalTxHash,
    disperseTxHash,
    disperseState,
    disperseError,
  };
};
