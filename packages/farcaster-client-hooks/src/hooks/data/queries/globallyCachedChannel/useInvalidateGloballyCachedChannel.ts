import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildGloballyCachedChannelKey } from './buildGloballyCachedChannelKey';

const useInvalidateGloballyCachedChannel = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ key }: { key: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildGloballyCachedChannelKey({ key }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateGloballyCachedChannel };
