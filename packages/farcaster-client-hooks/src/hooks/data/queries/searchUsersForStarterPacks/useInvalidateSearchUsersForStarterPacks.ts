import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSearchUsersForStarterPacksKey } from './buildSearchUsersForStarterPacksKey';

const useInvalidateSearchUsersForStarterPacks = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ search }: { search: string | undefined }) => {
      queryClient.invalidateQueries({
        queryKey: buildSearchUsersForStarterPacksKey({ search }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateSearchUsersForStarterPacks };
