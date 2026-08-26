import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { NewsCache } from '../../../../types';
import { buildNewsFetcher } from './buildNewsFetcher';
import { buildNewsKey } from './buildNewsKey';

const usePrefetchNews = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({
      onResponse,
    }: {
      onResponse: ({ cache }: { cache: NewsCache }) => void;
    }) => {
      const queryKey = buildNewsKey();

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,
        queryFn: buildNewsFetcher({
          apiClient,
          onResponse,
        }),
      });
    },
    [apiClient, queryClient],
  );
};

export { usePrefetchNews };
