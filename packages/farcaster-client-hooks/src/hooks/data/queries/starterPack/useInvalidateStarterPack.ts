import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildStarterPackKey } from './buildStarterPackKey';

const useInvalidateStarterPack = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ id }: { id: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildStarterPackKey({ id }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateStarterPack };
