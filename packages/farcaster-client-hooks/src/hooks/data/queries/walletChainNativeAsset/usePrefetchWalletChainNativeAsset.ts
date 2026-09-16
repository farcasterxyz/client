import { useQueryClient } from '@tanstack/react-query';
import { ApiGetWalletChainNativeAssetQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletChainNativeAssetFetcher } from './buildWalletChainNativeAssetFetcher';
import { buildWalletChainNativeAssetKey } from './buildWalletChainNativeAssetKey';
import { walletChainNativeAssetDefaultQueryOptions } from './walletChainNativeAssetQueryDefaultOptions';

const usePrefetchWalletChainNativeAsset = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiGetWalletChainNativeAssetQueryParams) => {
      return queryClient.prefetchQuery({
        queryKey: buildWalletChainNativeAssetKey(params),
        queryFn: buildWalletChainNativeAssetFetcher({ apiClient, params }),
        ...walletChainNativeAssetDefaultQueryOptions,
      });
    },
    [apiClient, queryClient],
  );
};

export { usePrefetchWalletChainNativeAsset };
