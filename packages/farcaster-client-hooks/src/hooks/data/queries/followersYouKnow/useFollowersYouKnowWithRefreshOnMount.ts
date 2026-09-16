import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildFollowersYouKnowKey } from './buildFollowersYouKnowKey';
import { useFollowersYouKnow } from './useFollowersYouKnow';
import { useInvalidateFollowersYouKnow } from './useInvalidateFollowersYouKnow';

const useFollowersYouKnowWithRefreshOnMount = ({
  fid,
  limit,
}: {
  fid: number;
  limit: number;
}) => {
  const initialValue = useFollowersYouKnow({ fid, limit });

  const queryKey = useMemo(
    () => buildFollowersYouKnowKey({ fid, limit }),
    [fid, limit],
  );

  const invalidateFollowersYouKnow = useInvalidateFollowersYouKnow();
  const invalidate = useCallback(() => {
    invalidateFollowersYouKnow({ fid, limit });
  }, [fid, limit, invalidateFollowersYouKnow]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useFollowersYouKnowWithRefreshOnMount };
