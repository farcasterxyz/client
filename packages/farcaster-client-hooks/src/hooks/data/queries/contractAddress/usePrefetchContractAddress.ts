import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildContractAddressFetcher } from './buildContractAddressFetcher';
import { buildContractAddressKey } from './buildContractAddressKey';

const usePrefetchContractAddress = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ ca }: { ca: string }) => {
      const queryKey = buildContractAddressKey({ ca });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchQuery({
        queryKey: queryKey,
        queryFn: buildContractAddressFetcher({
          apiClient,
          ca,
        }),
      });
    },
    [checkIfRecentlyPrefetched, queryClient, apiClient],
  );
};

export { usePrefetchContractAddress };
