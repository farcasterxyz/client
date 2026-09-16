import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import {
  ApiDiscoveryFrameCategory,
  ApiDiscoveryFrameList,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useFlatPaginatedResults } from '../../helpers';
import { buildDiscoverFramesFetcher } from './buildDiscoverFramesFetcher';
import { buildDiscoverFramesKey } from './buildDiscoverFramesKey';

const useDiscoverFrames = ({
  list,
  categoryFilter,
}: {
  list: ApiDiscoveryFrameList;
  categoryFilter?: ApiDiscoveryFrameCategory;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDiscoverFramesKey({ list, categoryFilter }),

    queryFn: buildDiscoverFramesFetcher({
      apiClient,
      list,
      categoryFilter,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const flatData = useFlatPaginatedResults({
    data: result.data,
    key: 'frames',
  });

  return extendResult(result, { flatData });
};

export { useDiscoverFrames };
