import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useInvalidateSearchUsers } from '../searchUsers';
import { buildFollowersKey } from './buildFollowersKey';

const useInvalidateFollowers = () => {
  const queryClient = useQueryClient();
  const invalidateSearchUsers = useInvalidateSearchUsers();

  return useCallback(
    ({ fid }: { fid: number | undefined }) => {
      queryClient.invalidateQueries({
        queryKey: buildFollowersKey({ fid }),
      });
      invalidateSearchUsers({ q: undefined });
    },
    [invalidateSearchUsers, queryClient],
  );
};

export { useInvalidateFollowers };
