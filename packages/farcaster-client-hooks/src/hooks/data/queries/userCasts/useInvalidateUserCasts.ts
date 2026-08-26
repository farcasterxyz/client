import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserCastsKey } from './buildUserCastsKey';

const useInvalidateUserCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) =>
      queryClient.invalidateQueries({
        queryKey: buildUserCastsKey({ fid }),
      }),
    [queryClient],
  );
};

export { useInvalidateUserCasts };
