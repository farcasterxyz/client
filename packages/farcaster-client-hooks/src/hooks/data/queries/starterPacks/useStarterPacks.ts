import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildStarterPacksFetcher } from './buildStarterPacksFetcher';
import { buildStarterPacksKey } from './buildStarterPacksKey';

const useStarterPacks = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildStarterPacksKey({ fid }),
    queryFn: buildStarterPacksFetcher({ apiClient, fid }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useStarterPacks };
