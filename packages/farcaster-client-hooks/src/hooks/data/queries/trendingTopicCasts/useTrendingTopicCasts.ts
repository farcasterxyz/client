import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiTrendingTopicCastsSort,
  getNextPageCursor,
} from 'farcaster-client-data';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildTrendingTopicCastsFetcher } from './buildTrendingTopicCastsFetcher';
import { buildTrendingTopicCastsKey } from './buildTrendingTopicCastsKey';

const useTrendingTopicCasts = ({
  topicId,
  sort,
}: {
  topicId: string;
  sort: ApiTrendingTopicCastsSort;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildTrendingTopicCastsKey({ topicId, sort }),
    queryFn: buildTrendingTopicCastsFetcher({ apiClient, topicId, sort }),

    getNextPageParam: getNextPageCursor,
    staleTime: MILLIS_PER_SECOND * 30,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useTrendingTopicCasts };
