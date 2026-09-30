import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserKey } from './buildUserKey';

const useInvalidateUser = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid, isCurrentUser }: { fid: number; isCurrentUser?: boolean }) => {
      queryClient.invalidateQueries({
        queryKey: buildUserKey({ fid, isCurrentUser }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateUser };
