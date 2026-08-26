import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUserAppContextFetcher } from './buildUserAppContextFetcher';
import { buildUserAppContextKey } from './buildUserAppContextKey';
import { userAppContextDefaultQueryOptions } from './userAppContextDefaultQueryOptions';

const usePrefetchUserAppContext = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return queryClient.prefetchQuery({
      ...userAppContextDefaultQueryOptions,
      queryKey: buildUserAppContextKey(),
      queryFn: buildUserAppContextFetcher({ apiClient }),
    });
  }, [apiClient, queryClient]);
};

export { usePrefetchUserAppContext };
