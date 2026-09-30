import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildTwitterFollowingFetcher } from './buildTwitterFollowingFetcher';
import { buildTwitterFollowingKey } from './buildTwitterFollowingKey';

const useTwitterFollowing = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildTwitterFollowingKey(),
    queryFn: buildTwitterFollowingFetcher({ apiClient }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useTwitterFollowing };
