import { useQueryClient } from '@tanstack/react-query';
import { ApiTrendingTopicCastsSort } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildTrendingTopicCastsKey } from './buildTrendingTopicCastsKey';

const useInvalidateTrendingTopicCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      topicId,
      sort,
    }: {
      topicId: string;
      sort: ApiTrendingTopicCastsSort;
    }) => {
      return queryClient.invalidateQueries({
        queryKey: buildTrendingTopicCastsKey({ topicId, sort }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateTrendingTopicCasts };
