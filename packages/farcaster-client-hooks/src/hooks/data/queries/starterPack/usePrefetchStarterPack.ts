import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildStarterPackFetcher } from './buildStarterPackFetcher';
import { buildStarterPackKey } from './buildStarterPackKey';

const usePrefetchStarterPack = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ id }: { id: string }) => {
      const queryKey = buildStarterPackKey({ id });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchQuery({
        queryKey: queryKey,
        queryFn: buildStarterPackFetcher({
          apiClient,
          id,
        }),
      });
    },
    [checkIfRecentlyPrefetched, queryClient, apiClient],
  );
};

export { usePrefetchStarterPack };
