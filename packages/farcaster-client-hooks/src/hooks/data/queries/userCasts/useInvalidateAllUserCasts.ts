import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserCastsKey } from './buildUserCastsKey';

const useInvalidateAllUserCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: buildUserCastsKey({ fid: undefined }),
      }),
    [queryClient],
  );
};

export { useInvalidateAllUserCasts };
