import {
  ApiPlatformType,
  ApiWalletChain,
  ApiWalletTransactionAnnotation,
  ApiWalletTransactionMetadata,
} from 'farcaster-client-data';
import {
  usePutMiniAppEvent,
  useRecordWalletTransaction,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';
import { Hex } from 'viem';

import { logErrorInDevOnly } from '../utils/LogUtils';

export function useRecordTransaction() {
  const recordWalletTransaction = useRecordWalletTransaction();
  const putMiniAppEvent = usePutMiniAppEvent();
  return useCallback(
    async (params: {
      // Common parameters
      txHash?: string;
      walletAddress: string;
      domain?: string;
      metadata?: ApiWalletTransactionMetadata | undefined;
      annotation?: ApiWalletTransactionAnnotation | undefined;
      platformType: ApiPlatformType;

      // Chain-specific parameters
      chain: ApiWalletChain;
      chainId?: number; // Only for EVM
    }) => {
      const {
        txHash,
        walletAddress,
        domain,
        metadata,
        annotation,
        chain,
        chainId,
        platformType,
      } = params;

      // Record wallet transaction
      const recordPromises = [];
      if (chain === 'eth') {
        recordPromises.push(
          recordWalletTransaction({
            params: {
              ethAddress: walletAddress,
              ethChainId: chainId!,
              ethTxHash: txHash as Hex,
              attributedDomain: domain,
              provider: 'warpcast',
              metadata,
              annotation,
            },
          }),
        );
      } else if (chain === 'solana') {
        recordPromises.push(
          recordWalletTransaction({
            params: {
              solAddress: walletAddress,
              solTxHash: txHash,
              attributedDomain: domain,
              provider: 'warpcast',
              metadata,
              annotation,
            },
          }),
        );
      } else {
        logErrorInDevOnly(
          new Error('Invalid chain specified for transaction recording'),
        );
      }

      // Record mini app transaction
      if (domain && txHash) {
        recordPromises.push(
          putMiniAppEvent({
            domain,
            event: 'tx',
            platformType,
            metadata: {
              type: 'tx',
              id: txHash,
              walletChain: chain,
              walletAddress,
              provider: 'warpcast',
              ...(chain === 'eth' && { chainId }),
            },
          }),
        );
      }

      // Wait for all record promises to resolve
      await Promise.allSettled(recordPromises);
    },
    [putMiniAppEvent, recordWalletTransaction],
  );
}
