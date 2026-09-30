import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserLikedCastsKey } from './buildUserLikedCastsKey';

const useInvalidateUserLikedCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) => {
      queryClient.invalidateQueries({
        queryKey: buildUserLikedCastsKey({ fid }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateUserLikedCasts };
