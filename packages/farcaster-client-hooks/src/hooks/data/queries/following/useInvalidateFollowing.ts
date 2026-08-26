import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useInvalidateSearchUsers } from '../searchUsers';
import { buildFollowingKey } from './buildFollowingKey';

const useInvalidateFollowing = () => {
  const queryClient = useQueryClient();
  const invalidateSearchUsers = useInvalidateSearchUsers();

  return useCallback(
    ({ fid }: { fid: number }) => {
      queryClient.invalidateQueries({
        queryKey: buildFollowingKey({ fid }),
      });
      invalidateSearchUsers({ q: undefined });
    },
    [invalidateSearchUsers, queryClient],
  );
};

export { useInvalidateFollowing };
