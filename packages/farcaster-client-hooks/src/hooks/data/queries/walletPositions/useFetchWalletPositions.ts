import { useQueryClient } from '@tanstack/react-query';
import { ApiGetWalletPositionsQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedTokens } from '../globallyCachedToken';
import { buildWalletPositionsFetcher } from './buildWalletPositionsFetcher';
import { buildWalletPositionsKey } from './buildWalletPositionsKey';

const useFetchWalletPositions = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();
  const queryClient = useQueryClient();

  return useCallback(
    async (params: ApiGetWalletPositionsQueryParams) => {
      const result = await buildWalletPositionsFetcher({
        params,
        apiClient,
        batchMergeIntoGloballyCachedTokens,
      })();

      queryClient.setQueryData(buildWalletPositionsKey(params), result);

      return result;
    },
    [apiClient, batchMergeIntoGloballyCachedTokens, queryClient],
  );
};

export { useFetchWalletPositions };
