import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildSearchUsersForStarterPacksFetcher } from './buildSearchUsersForStarterPacksFetcher';
import { buildSearchUsersForStarterPacksKey } from './buildSearchUsersForStarterPacksKey';

const useSearchUsersForStarterPacks = ({
  search,
}: {
  search: string | undefined;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchUsersForStarterPacksKey({ search }),
    queryFn: buildSearchUsersForStarterPacksFetcher({ search, apiClient }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useSearchUsersForStarterPacks };
