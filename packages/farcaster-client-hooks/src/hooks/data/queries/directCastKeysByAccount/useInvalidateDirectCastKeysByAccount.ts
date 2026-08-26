import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDirectCastKeysByAccountKey } from './buildDirectCastKeysByAccountKey';

const useInvalidateDirectCastKeysByAccount = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number | undefined }) => {
      queryClient.invalidateQueries({
        queryKey: buildDirectCastKeysByAccountKey({ fid }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateDirectCastKeysByAccount };
