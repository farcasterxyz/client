import { useQueryClient } from '@tanstack/react-query';
import { ApiUserChannelsCategory } from 'farcaster-client-data';
import { useCallback } from 'react';

import { apiChannelKeyExtractor } from '../../channels';
import { removeItemFromPaginatedResultCaches } from '../../helpers';
import { buildUserChannelsForCategoryKey } from './buildUserChannelsForCategoryKey';

const useRemoveFromUserChannelsForCategoryCache = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      fid,
      category,
      channelKey,
    }: {
      fid: number;
      category: ApiUserChannelsCategory;
      channelKey: string;
    }) => {
      const queryKey = buildUserChannelsForCategoryKey({ fid, category });

      removeItemFromPaginatedResultCaches({
        queryClient,
        queryKey,
        removeKey: channelKey,
        keyExtractor: apiChannelKeyExtractor,
      });
    },
    [queryClient],
  );
};

export { useRemoveFromUserChannelsForCategoryCache };
