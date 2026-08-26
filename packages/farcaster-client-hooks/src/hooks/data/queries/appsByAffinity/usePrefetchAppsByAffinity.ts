import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { appsByAffinityDefaultQueryOptions } from './appsByAffinityDefaultQueryOptions';
import { buildAppsByAffinityFetcher } from './buildAppsByAffinityFetcher';
import { buildAppsByAffinityKey } from './buildAppsByAffinityKey';

const usePrefetchAppsByAffinity = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const prefetchAppsByAffinity = useCallback(
    ({ fidOverride, limit }: { fidOverride?: number; limit?: number }) => {
      return queryClient.prefetchQuery({
        ...appsByAffinityDefaultQueryOptions,
        queryKey: buildAppsByAffinityKey({ fidOverride, limit }),
        queryFn: buildAppsByAffinityFetcher({
          apiClient,
          fidOverride,
          limit,
        }),
      });
    },
    [apiClient, queryClient],
  );

  return { prefetchAppsByAffinity };
};

export { usePrefetchAppsByAffinity };
