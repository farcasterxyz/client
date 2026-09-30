import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildStarterPacksFetcher } from './buildStarterPacksFetcher';
import { buildStarterPacksKey } from './buildStarterPacksKey';

const usePrefetchStarterPacks = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ fid }: { fid: number }) => {
      const queryKey = buildStarterPacksKey({ fid });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,
        queryFn: buildStarterPacksFetcher({
          apiClient,
          fid,
        }),
      });
    },
    [checkIfRecentlyPrefetched, queryClient, apiClient],
  );
};

export { usePrefetchStarterPacks };
