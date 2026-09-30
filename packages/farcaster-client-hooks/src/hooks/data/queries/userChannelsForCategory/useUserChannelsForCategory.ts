import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import {
  ApiUserChannelsCategory,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildUserChannelsForCategoryFetcher } from './buildUserChannelsForCategoryFetcher';
import { buildUserChannelsForCategoryKey } from './buildUserChannelsForCategoryKey';

const useUserChannelsForCategory = ({
  fid,
  category,
}: {
  fid: number;
  category: ApiUserChannelsCategory;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildUserChannelsForCategoryKey({ fid, category }),

    queryFn: buildUserChannelsForCategoryFetcher({
      fid,
      category,
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
};

export { useUserChannelsForCategory };
