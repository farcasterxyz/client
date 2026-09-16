import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildSuggestedStarterPacksFetcher } from './buildSuggestedStarterPacksFetcher';
import { buildSuggestedStarterPacksKey } from './buildSuggestedStarterPacksKey';

const useSuggestedStarterPacks = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSuggestedStarterPacksKey(),
    queryFn: buildSuggestedStarterPacksFetcher({ apiClient }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useSuggestedStarterPacks };
