import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildContractAddressFetcher } from './buildContractAddressFetcher';
import { buildContractAddressKey } from './buildContractAddressKey';

const useFetchContractAddress = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({ ca }: { ca: string }) => {
      const queryKey = buildContractAddressKey({ ca });

      return queryClient.fetchQuery({
        queryKey: queryKey,
        queryFn: buildContractAddressFetcher({
          apiClient,
          ca,
        }),
      });
    },
    [apiClient, queryClient],
  );
};

export { useFetchContractAddress };
