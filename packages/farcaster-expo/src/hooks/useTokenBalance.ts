import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiChain,
  apiChainToViemChainOrThrow,
  ApiOnchainTokenMinimal,
} from 'farcaster-client-data';
import {
  buildWalletPositionsKey,
  useNonSuspenseTokenWalletContext,
  WalletPositionsFetcherData,
} from 'farcaster-client-hooks';
import React from 'react';
import { erc20Abi, Hex } from 'viem';

import { useEmbeddedWallet, usePublicClient } from '../contexts';
import { isNativeAsset, isSameAsset } from '../utils';
import { useActiveWallet } from './useActiveWallet';
import { useCachedOrQueryToken } from './useCachedOrQueryToken';
import { useCurrentUserFid } from './useCurrentUser';
import { resolveTokenBalanceData } from './useTokenBalance.utils';

export type TokenBalance = {
  quantity: {
    float: number;
    int: string;
  };
  priceUsd: number;
  valueUsd: number;
  userHidden: boolean;
  token: ApiOnchainTokenMinimal;
};

export type UseTokenBalanceResult = {
  data: TokenBalance | undefined;
  isPending: boolean;
  refetch: () => Promise<void>;
};

export function useTokenBalance({
  fid,
  chain,
  ca,
  onchain = true,
  forceFreshPrice = false,
}: {
  fid?: number;
  chain?: ApiChain;
  ca?: string;
  onchain?: boolean;
  forceFreshPrice?: boolean;
}): UseTokenBalanceResult {
  const currentUserFid = useCurrentUserFid();
  const { activeWalletId } = useActiveWallet();
  // Active-wallet only for the current user; never override an explicit other-user fid.
  const effectiveWalletId =
    fid === undefined || fid === currentUserFid ? activeWalletId : undefined;
  const { evmAddress } = useEmbeddedWallet();
  const client = useQueryClient();
  const { getEthereumClient } = usePublicClient();
  const previousDataRef = React.useRef<TokenBalance | undefined>(undefined);

  const params = React.useMemo(() => {
    if (!!chain && !!ca) {
      return {
        chain,
        ca,
        fid,
      };
    }

    return null;
  }, [chain, ca, fid]);

  const onchainEnabled =
    !!params && onchain && chain !== 'solana' && fid === currentUserFid;
  const cachedPosition = React.useMemo(() => {
    if (!params) {
      return undefined;
    }

    const balances = client.getQueryData<WalletPositionsFetcherData>(
      buildWalletPositionsKey({
        fid: fid ?? currentUserFid,
        walletId: effectiveWalletId,
      }),
    );

    return balances?.positions.find((b) =>
      isSameAsset({
        chain: b.chain,
        ca: b.address,
        asset: { chain: chain!, ca },
      }),
    );
  }, [params, client, fid, currentUserFid, chain, ca, effectiveWalletId]);

  const {
    data: onchainBalance,
    isPending: isOnchainBalancePending,
    refetch: refetchOnchainBalance,
  } = useQuery({
    queryKey: ['onchainBalance', ca, chain, onchainEnabled],
    queryFn: async () => {
      if (!onchainEnabled) {
        return null;
      }

      const client = getEthereumClient({
        chain: apiChainToViemChainOrThrow(chain!),
      });

      if (isNativeAsset(ca)) {
        return await client.getBalance({
          address: evmAddress as Hex,
        });
      }

      return await client.readContract({
        address: ca as Hex,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [evmAddress as Hex],
      });
    },
    enabled: onchainEnabled,
  });

  const {
    data: tokenData,
    isPending: isTokenPending,
    refetch: refetchToken,
  } = useCachedOrQueryToken({
    chain: chain!,
    ca: ca!,
    query: {
      enabled: !!params,
      staleTime: forceFreshPrice ? 0 : undefined,
      refetchOnMount: forceFreshPrice ? 'always' : undefined,
      placeholderData: () => {
        const balances = client.getQueryData<WalletPositionsFetcherData>(
          buildWalletPositionsKey({
            fid: fid ?? currentUserFid,
            walletId: effectiveWalletId,
          }),
        );

        if (!balances) {
          return undefined;
        }

        const position = balances.positions.find((b) =>
          isSameAsset({
            chain: b.chain,
            ca: b.address,
            asset: { chain: chain!, ca },
          }),
        );

        if (!position) {
          return undefined;
        }

        return { token: position.token };
      },
    },
  });

  const {
    data: walletContext,
    isPending: isWalletContextPending,
    refetch: refetchTokenWalletContext,
  } = useNonSuspenseTokenWalletContext({
    params: {
      ca: ca!,
      chain: chain!,
      fid,
      walletId: effectiveWalletId,
    },
    query: {
      enabled: !!params,
      placeholderData: () => {
        const balances = client.getQueryData<WalletPositionsFetcherData>(
          buildWalletPositionsKey({
            fid: fid ?? currentUserFid,
            walletId: effectiveWalletId,
          }),
        );

        if (!balances) {
          return undefined;
        }

        const position = balances.positions.find((b) =>
          isSameAsset({
            chain: b.chain,
            ca: b.address,
            asset: { chain: chain!, ca },
          }),
        );

        if (!position) {
          return undefined;
        }

        return {
          result: {
            walletContext: {
              position: {
                quantity: position.quantity,
                valueUsd: position.value ?? 0,
              },
            },
          },
        };
      },
    },
  });

  const data = React.useMemo(() => {
    const resolvedData = resolveTokenBalanceData({
      chain,
      ca,
      tokenData,
      walletContext,
      onchainBalance,
      cachedPosition,
      previousData: previousDataRef.current,
    });

    if (resolvedData) {
      previousDataRef.current = resolvedData;
    }

    return resolvedData;
  }, [chain, ca, tokenData, walletContext, onchainBalance, cachedPosition]);

  const handleRefetch = React.useCallback(async () => {
    await Promise.all([
      refetchToken(),
      refetchTokenWalletContext(),
      refetchOnchainBalance(),
    ]);
  }, [refetchToken, refetchTokenWalletContext, refetchOnchainBalance]);

  const isPending =
    isWalletContextPending ||
    isTokenPending ||
    (onchainEnabled && isOnchainBalancePending);

  return { data, isPending, refetch: handleRefetch };
}
