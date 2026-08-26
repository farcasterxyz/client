import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserByFidKey } from './buildUserByFidKey';

const useInvalidateUserByFid = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) => {
      queryClient.invalidateQueries({
        queryKey: buildUserByFidKey({ fid }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateUserByFid };
