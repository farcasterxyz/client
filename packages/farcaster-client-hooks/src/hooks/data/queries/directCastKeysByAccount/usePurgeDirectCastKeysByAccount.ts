import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDirectCastKeysByAccountKey } from './buildDirectCastKeysByAccountKey';

const usePurgeDirectCastKeysByAccount = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number | undefined }) => {
      queryClient.removeQueries({
        queryKey: buildDirectCastKeysByAccountKey({ fid }),
      });
    },
    [queryClient],
  );
};

export { usePurgeDirectCastKeysByAccount };
