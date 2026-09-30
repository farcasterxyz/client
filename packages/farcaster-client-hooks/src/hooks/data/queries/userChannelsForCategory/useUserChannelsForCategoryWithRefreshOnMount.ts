import { ApiUserChannelsCategory } from 'farcaster-client-data';
import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildUserChannelsForCategoryKey } from './buildUserChannelsForCategoryKey';
import { useInvalidateUserChannelsForCategory } from './useInvalidateUserChannelsForCategory';
import { useUserChannelsForCategory } from './useUserChannelsForCategory';

const useUserChannelsForCategoryWithRefreshOnMount = ({
  fid,
  category,
}: {
  fid: number;
  category: ApiUserChannelsCategory;
}) => {
  const initialValue = useUserChannelsForCategory({ fid, category });

  const queryKey = useMemo(
    () => buildUserChannelsForCategoryKey({ fid, category }),
    [fid, category],
  );

  const invalidateUserChannelsForCategory =
    useInvalidateUserChannelsForCategory();

  const invalidate = useCallback(() => {
    invalidateUserChannelsForCategory({ fid, category });
  }, [fid, category, invalidateUserChannelsForCategory]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useUserChannelsForCategoryWithRefreshOnMount };
