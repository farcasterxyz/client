import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserCastsKey } from './buildUserCastsKey';

const usePurgeUserCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) =>
      queryClient.removeQueries({
        queryKey: buildUserCastsKey({ fid }),
      }),
    [queryClient],
  );
};

export { usePurgeUserCasts };
