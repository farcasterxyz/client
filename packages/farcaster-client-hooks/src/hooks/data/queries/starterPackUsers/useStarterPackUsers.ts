import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildStarterPackUsersFetcher } from './buildStarterPackUsersFetcher';
import { buildStarterPackUsersKey } from './buildStarterPackUsersKey';

const useStarterPackUsers = ({ id }: { id: string }) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildStarterPackUsersKey({ id }),
    queryFn: buildStarterPackUsersFetcher({ id, apiClient }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useStarterPackUsers };
