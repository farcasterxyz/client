import { useQueryClient } from '@tanstack/react-query';
import { ApiUserChannelsCategory } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildUserChannelsForCategoryKey } from './buildUserChannelsForCategoryKey';

const useInvalidateUserChannelsForCategory = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid, category }: { fid: number; category: ApiUserChannelsCategory }) => {
      return queryClient.invalidateQueries({
        queryKey: buildUserChannelsForCategoryKey({ fid, category }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateUserChannelsForCategory };
