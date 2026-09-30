import { useQueryClient } from '@tanstack/react-query';
import {
  ApiGetWalletChainNativeAssetQueryParams,
  FarcasterError,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletChainNativeAssetFetcher } from './buildWalletChainNativeAssetFetcher';
import { buildWalletChainNativeAssetKey } from './buildWalletChainNativeAssetKey';
import { walletChainNativeAssetDefaultQueryOptions } from './walletChainNativeAssetQueryDefaultOptions';

export const useFetchWalletChainNativeAsset = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiGetWalletChainNativeAssetQueryParams) => {
      const queryKey = buildWalletChainNativeAssetKey(params);
      const fetcher = buildWalletChainNativeAssetFetcher({ params, apiClient });

      try {
        const data = await queryClient.fetchQuery({
          queryKey,
          queryFn: fetcher,
          ...walletChainNativeAssetDefaultQueryOptions,
        });

        return {
          data,
          error: null as null,
        };
      } catch (error) {
        return {
          data: null as null,
          error: error as FarcasterError,
        };
      }
    },
    [queryClient, apiClient],
  );
};
