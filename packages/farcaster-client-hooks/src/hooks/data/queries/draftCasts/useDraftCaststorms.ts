import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildDraftCaststormsFetcher } from './buildDraftCaststormsFetcher';
import { buildDraftCaststormsKey } from './buildDraftCaststormsKey';

const useDraftCaststorms = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDraftCaststormsKey(),

    queryFn: buildDraftCaststormsFetcher({
      apiClient,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useDraftCaststorms };
