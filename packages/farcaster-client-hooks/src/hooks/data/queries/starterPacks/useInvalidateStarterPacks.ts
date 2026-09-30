import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildStarterPacksKey } from './buildStarterPacksKey';

const useInvalidateStarterPacks = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) => {
      return queryClient.invalidateQueries({
        queryKey: buildStarterPacksKey({ fid }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateStarterPacks };
