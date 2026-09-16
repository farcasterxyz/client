import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSuggestedUsersKey } from './buildSuggestedUsersKey';

const usePurgeSuggestedUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      limit,
      randomized,
    }: {
      limit?: number;
      randomized: boolean | undefined;
    }) =>
      queryClient.removeQueries({
        queryKey: buildSuggestedUsersKey({ limit, randomized }),
      }),
    [queryClient],
  );
};

export { usePurgeSuggestedUsers };
