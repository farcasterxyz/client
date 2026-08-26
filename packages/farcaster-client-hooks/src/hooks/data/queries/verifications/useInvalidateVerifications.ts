import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildVerificationsKey } from './buildVerificationsKey';

const useInvalidateVerifications = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number | undefined }) => {
      queryClient.invalidateQueries({
        queryKey: buildVerificationsKey({ fid }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateVerifications };
