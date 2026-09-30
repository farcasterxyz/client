import { useQueryClient } from '@tanstack/react-query';
import { CastHashPrefix } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildUserThreadCastsKey } from './buildUserThreadCastsKey';

const useInvalidateUserThreadCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      castHashPrefix,
      username,
    }: {
      castHashPrefix: CastHashPrefix;
      username: string;
    }) => {
      queryClient.invalidateQueries({
        queryKey: buildUserThreadCastsKey({ castHashPrefix, username }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateUserThreadCasts };
