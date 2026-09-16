import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildExploreFeedFetcher } from './buildExploreFeedFetcher';
import { buildExploreFeedKey } from './buildExploreFeedKey';

const usePrefetchExploreFeed = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    const queryKey = buildExploreFeedKey();

    return queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn: buildExploreFeedFetcher({
        apiClient,
      }),
    });
  }, [apiClient, queryClient]);
};

export { usePrefetchExploreFeed };
