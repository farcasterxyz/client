import { ApiChain, apiChainToViemChainOrThrow } from 'farcaster-client-data';
import { useCallback } from 'react';
import { erc20Abi, type Hex } from 'viem';

import { usePublicClient } from '../../../../contexts';
import { COW_VAULT_RELAYER } from './cowVaultRelayer';

const ALLOWANCE_POLL_INITIAL_DELAY_MS = 250;
const ALLOWANCE_POLL_MAX_DELAY_MS = 2_000;
const ALLOWANCE_POLL_MAX_DURATION_MS = 30_000;

export function useCowSellTokenApproval() {
  const { getEthereumClient } = usePublicClient();

  const readSellTokenAllowance = useCallback(
    async ({
      chain,
      tokenCa,
      owner,
    }: {
      chain: ApiChain;
      tokenCa: string;
      owner: Hex;
    }) => {
      const viemChain = apiChainToViemChainOrThrow(chain);
      const publicClient = getEthereumClient({ chain: viemChain });
      return publicClient.readContract({
        address: tokenCa as Hex,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, COW_VAULT_RELAYER],
      });
    },
    [getEthereumClient],
  );

  const needsSellTokenApproval = useCallback(
    async ({
      chain,
      tokenCa,
      owner,
      requiredAmount,
    }: {
      chain: ApiChain;
      tokenCa: string;
      owner: Hex;
      requiredAmount: bigint;
    }) => {
      const allowance = await readSellTokenAllowance({ chain, tokenCa, owner });
      return allowance < requiredAmount;
    },
    [readSellTokenAllowance],
  );

  const waitForSellTokenAllowance = useCallback(
    async ({
      chain,
      tokenCa,
      owner,
      requiredAmount,
      approvalTxHash,
    }: {
      chain: ApiChain;
      tokenCa: string;
      owner: Hex;
      requiredAmount: bigint;
      approvalTxHash?: Hex;
    }) => {
      const viemChain = apiChainToViemChainOrThrow(chain);
      const publicClient = getEthereumClient({ chain: viemChain });

      const hasSufficientAllowance = async () => {
        const allowance = await readSellTokenAllowance({
          chain,
          tokenCa,
          owner,
        });
        return allowance >= requiredAmount;
      };

      if (approvalTxHash) {
        try {
          const receipt = await publicClient.getTransactionReceipt({
            hash: approvalTxHash,
          });
          if (receipt.status !== 'success') {
            throw new Error('Approval transaction reverted');
          }
        } catch {
          // Receipt may not be indexed yet; fall through to allowance polling.
        }
      }

      if (await hasSufficientAllowance()) {
        return;
      }

      const startedAt = Date.now();
      let delayMs = ALLOWANCE_POLL_INITIAL_DELAY_MS;

      while (Date.now() - startedAt < ALLOWANCE_POLL_MAX_DURATION_MS) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        if (await hasSufficientAllowance()) {
          return;
        }
        delayMs = Math.min(delayMs * 2, ALLOWANCE_POLL_MAX_DELAY_MS);
      }

      throw new Error('Token approval not confirmed yet. Please try again.');
    },
    [getEthereumClient, readSellTokenAllowance],
  );

  return {
    readSellTokenAllowance,
    needsSellTokenApproval,
    waitForSellTokenAllowance,
  };
}
