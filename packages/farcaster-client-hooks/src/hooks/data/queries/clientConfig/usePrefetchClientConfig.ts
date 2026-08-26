import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildClientConfigFetcher } from './buildClientConfigFetcher';
import { buildClientConfigKey } from './buildClientConfigKey';
import { clientConfigDefaultQueryOptions } from './clientConfigDefaultQueryOptions';

const usePrefetchClientConfig = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return queryClient.prefetchQuery({
      ...clientConfigDefaultQueryOptions,
      queryKey: buildClientConfigKey(),
      queryFn: buildClientConfigFetcher({ apiClient }),
    });
  }, [apiClient, queryClient]);
};

export { usePrefetchClientConfig };
