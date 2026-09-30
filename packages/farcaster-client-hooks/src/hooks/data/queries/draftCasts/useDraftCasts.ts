import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildDraftCastsFetcher } from './buildDraftCastsFetcher';
import { buildDraftCastsKey } from './buildDraftCastsKey';

const useDraftCasts = ({ channelKey }: { channelKey: string | undefined }) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDraftCastsKey({ channelKey }),

    queryFn: buildDraftCastsFetcher({
      channelKey,
      apiClient,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useDraftCasts };
