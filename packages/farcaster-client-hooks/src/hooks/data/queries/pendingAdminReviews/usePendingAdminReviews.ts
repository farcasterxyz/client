import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildPendingAdminReviewsFetcher } from './buildPendingAdminReviewsFetcher';
import { buildPendingAdminReviewsKey } from './buildPendingAdminReviewsKey';

const usePendingAdminReviews = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildPendingAdminReviewsKey(),

    queryFn: buildPendingAdminReviewsFetcher({
      apiClient,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { usePendingAdminReviews };
