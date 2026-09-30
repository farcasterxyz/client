import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildStarterPackUsersFetcher } from './buildStarterPackUsersFetcher';
import { buildStarterPackUsersKey } from './buildStarterPackUsersKey';

const usePrefetchStarterPackUsers = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ id }: { id: string }) => {
      const queryKey = buildStarterPackUsersKey({ id });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,
        queryFn: buildStarterPackUsersFetcher({
          apiClient,
          id,
        }),
      });
    },
    [checkIfRecentlyPrefetched, queryClient, apiClient],
  );
};

export { usePrefetchStarterPackUsers };
