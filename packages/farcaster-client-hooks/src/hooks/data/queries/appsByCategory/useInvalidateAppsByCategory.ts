import { useQueryClient } from '@tanstack/react-query';
import { ApiAppsSortBy } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildAppsByCategoryKey } from './buildAppsByCategoryKey';

const useInvalidateAppsByCategory = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      category,
      sortByKey,
      limit,
    }: {
      category: string;
      sortByKey: ApiAppsSortBy;
      limit?: number;
    }) => {
      queryClient.invalidateQueries({
        queryKey: buildAppsByCategoryKey({ category, sortByKey, limit }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateAppsByCategory };
