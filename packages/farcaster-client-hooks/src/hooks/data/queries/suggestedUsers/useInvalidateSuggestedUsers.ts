import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSuggestedUsersKey } from './buildSuggestedUsersKey';

const useInvalidateSuggestedUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      limit,
      randomized,
    }: {
      limit?: number | undefined;
      randomized: boolean | undefined;
    }) => {
      queryClient.invalidateQueries({
        queryKey: buildSuggestedUsersKey({ limit, randomized }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateSuggestedUsers };
