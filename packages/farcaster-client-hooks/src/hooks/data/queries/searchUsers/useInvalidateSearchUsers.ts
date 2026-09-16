import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSearchUsersKey } from './buildSearchUsersKey';

const useInvalidateSearchUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ q, limit }: { limit?: number; q: string | undefined }) => {
      queryClient.invalidateQueries({
        queryKey: buildSearchUsersKey({ q, limit }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateSearchUsers };
