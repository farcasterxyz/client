import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildProfileSnapCastsKey } from './buildProfileSnapCastsKey';

const useInvalidateProfileSnapCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) =>
      queryClient.invalidateQueries({
        queryKey: buildProfileSnapCastsKey({ fid }),
      }),
    [queryClient],
  );
};

export { useInvalidateProfileSnapCasts };
