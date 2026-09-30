import { useQueryClient } from '@tanstack/react-query';
import {
  ApiCast,
  ApiGetCastCollectibleQueryParams,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedCast } from '../globallyCachedCast';
import { buildCastCollectibleFetcher } from './buildCastCollectibleFetcher';
import { buildCastCollectibleKey } from './buildCastCollectibleKey';

const useFetchCastCollectible = () => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedCast = useMergeIntoGloballyCachedCast();
  const queryClient = useQueryClient();

  return useCallback(
    async (params: ApiGetCastCollectibleQueryParams & { cast: ApiCast }) => {
      const { cast, ...queryParams } = params;
      const key = buildCastCollectibleKey(queryParams);
      const data = await buildCastCollectibleFetcher({
        apiClient,
        params: queryParams,
        cast,
        mergeIntoGloballyCachedCast,
      })();
      await queryClient.setQueryData(key, data);
      return data;
    },
    [apiClient, mergeIntoGloballyCachedCast, queryClient],
  );
};
export { useFetchCastCollectible };
