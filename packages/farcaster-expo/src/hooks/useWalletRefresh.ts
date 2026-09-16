import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useQueryClient } from '@tanstack/react-query';
import {
  ApiChain,
  apiChainToChainIdOrThrow,
  ApiEthFungibleTokenPosition,
  extractWalletChain,
  WalletChainId,
} from 'farcaster-client-data';
import { buildWalletPositionsKey } from 'farcaster-client-hooks';
import { useCallback } from 'react';
import { erc20Abi, formatUnits, Hex, parseUnits } from 'viem';

import {
  useEmbeddedWallet,
  usePublicClient,
  useSharedTelemetry,
} from '../contexts';
import {
  isNativeAsset,
  isSameAsset,
  solanaConnection,
  tokenPositionToMinimalToken,
} from '../utils';
import { useCurrentUserFid } from './useCurrentUser';

export type RefreshableToken = {
  chain: ApiChain;
  ca?: string;
  decimals?: number;
  // Used to manually add or subtract from the balance (i.e. for cross chain swaps)
  delta?: string;
  // Used if the user does not have a balance for this token yet
  position?: ApiEthFungibleTokenPosition;
};

type TokenWithBalance = RefreshableToken & {
  balance: bigint | undefined;
};

export const useWalletRefresh = () => {
  const fid = useCurrentUserFid();
  const { evmAddress, solanaAddress } = useEmbeddedWallet();
  const { getEthereumClient } = usePublicClient();
  const queryClient = useQueryClient();
  const { trackError } = useSharedTelemetry();

  const fetchSolanaBalance = useCallback(
    async (token: RefreshableToken): Promise<bigint | undefined> => {
      if (!solanaAddress) {
        return undefined;
      }

      try {
        if (isNativeAsset(token.ca)) {
          const balance = await solanaConnection.getBalance(
            new PublicKey(solanaAddress),
          );
          return BigInt(balance);
        } else {
          const mint = new PublicKey(token.ca!);
          const tokenAccount = await getAssociatedTokenAddress(
            mint,
            new PublicKey(solanaAddress),
          );

          const accountInfo =
            await solanaConnection.getTokenAccountBalance(tokenAccount);
          return BigInt(accountInfo.value.amount);
        }
      } catch (error) {
        // Return 0 balance if token account doesn't exist
        if (
          error instanceof Error &&
          error.message.includes('could not find account')
        ) {
          return BigInt(0);
        }
        throw error;
      }
    },
    [solanaAddress],
  );

  const fetchEvmBalance = useCallback(
    async (token: RefreshableToken): Promise<bigint | undefined> => {
      if (!evmAddress) {
        return undefined;
      }

      const chainId = Number(apiChainToChainIdOrThrow(token.chain));
      const viemChain = extractWalletChain({
        id: chainId as WalletChainId,
      });
      const client = getEthereumClient({ chain: viemChain });

      if (isNativeAsset(token.ca)) {
        return await client.getBalance({ address: evmAddress as Hex });
      } else {
        return await client.readContract({
          address: token.ca as Hex,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [evmAddress as Hex],
        });
      }
    },
    [getEthereumClient, evmAddress],
  );

  const fetchBalance = useCallback(
    async (token: RefreshableToken): Promise<bigint | undefined> => {
      try {
        if (token.chain === 'solana') {
          return await fetchSolanaBalance(token);
        } else {
          return await fetchEvmBalance(token);
        }
      } catch (error) {
        trackError(error);
        return undefined;
      }
    },
    [fetchSolanaBalance, fetchEvmBalance, trackError],
  );

  const calculateNewQuantity = useCallback(
    (
      token: TokenWithBalance,
      position: ApiEthFungibleTokenPosition,
    ): { float: number; int: string } => {
      const decimals = token.decimals ?? 18;

      // Handle manual delta adjustments
      if (token.delta) {
        const deltaInt = BigInt(token.delta);
        const deltaFloat = parseFloat(formatUnits(deltaInt, decimals));
        const newFloat = position.quantity.float + deltaFloat;
        const newInt = parseUnits(newFloat.toString(), decimals);

        return {
          float: newFloat,
          int: newInt.toString(),
        };
      }

      // Handle actual balance updates
      if (token.balance !== undefined) {
        const newFloat = parseFloat(formatUnits(token.balance, decimals));
        return {
          float: newFloat,
          int: token.balance.toString(),
        };
      }

      // No change if no balance or delta
      return position.quantity;
    },
    [],
  );

  const updateQueryCache = useCallback(
    (
      tokensWithBalances: TokenWithBalance[],
      updateNewPositionQuantities: boolean,
    ) => {
      const key = buildWalletPositionsKey({ fid });

      queryClient.setQueryData<{ positions: ApiEthFungibleTokenPosition[] }>(
        key,
        (prev) => {
          if (!prev) {
            return prev;
          }

          // Update existing positions
          const updatedPositions = prev.positions.map((position) => {
            const matchingToken = tokensWithBalances.find((token) =>
              isSameAsset({
                chain: token.chain,
                ca: token.ca,
                asset: tokenPositionToMinimalToken(position),
              }),
            );

            if (!matchingToken) {
              return position;
            }

            const newQuantity = calculateNewQuantity(matchingToken, position);

            return {
              ...position,
              quantity: newQuantity,
              value: position.price
                ? position.price * newQuantity.float
                : undefined,
              hidden: false,
            };
          });

          for (const token of tokensWithBalances) {
            const existingPosition = updatedPositions.find((position) =>
              isSameAsset({
                chain: token.chain,
                ca: token.ca,
                asset: tokenPositionToMinimalToken(position),
              }),
            );

            // Add the position if it doesn't exist and we have a template position
            if (!existingPosition && token.position) {
              const newQuantity = calculateNewQuantity(token, token.position);
              const newPosition = {
                ...token.position,

                // update
                value: !updateNewPositionQuantities
                  ? token.position.value
                  : token.position.price
                    ? token.position.price * newQuantity.float
                    : undefined,

                // update
                quantity: !updateNewPositionQuantities
                  ? token.position.quantity
                  : newQuantity,
              };

              updatedPositions.push(newPosition);
            }
          }

          // Filter out positions with zero balance
          return {
            ...prev,
            positions: updatedPositions
              .filter((position) => position.quantity.float > 0)
              .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
          };
        },
      );
    },
    [fid, queryClient, calculateNewQuantity],
  );

  return useCallback(
    async (tokens: RefreshableToken[], updateNewPositionQuantities = false) => {
      // Fetch all balances in parallel
      const tokensWithBalances: TokenWithBalance[] = await Promise.all(
        tokens.map(async (token) => {
          const balance = await fetchBalance(token);
          return {
            ...token,
            balance,
          };
        }),
      );

      updateQueryCache(tokensWithBalances, updateNewPositionQuantities);
    },
    [fetchBalance, updateQueryCache],
  );
};
