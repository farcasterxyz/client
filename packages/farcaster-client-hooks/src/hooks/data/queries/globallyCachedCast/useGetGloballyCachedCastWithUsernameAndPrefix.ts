import { useQueryClient } from '@tanstack/react-query';
import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildGloballyCachedCastKey } from './buildGloballyCachedCastKey';

export function useGetGloballyCachedCastWithUsernameAndPrefix({
  username,
  castHashPrefix,
}: {
  username: string;
  castHashPrefix: string;
}): () => ApiCast | undefined {
  const queryClient = useQueryClient();

  return useCallback(() => {
    const queriesData = queryClient.getQueriesData({
      exact: false,
      queryKey: buildGloballyCachedCastKey({
        hash: undefined,
        recast: undefined,
      }),
    });
    for (const query of queriesData) {
      const queryKey = query[0];
      const data = query[1] as ApiCast | undefined;

      if (
        queryKey.length > 1 &&
        (queryKey[1] as string).includes(castHashPrefix)
      ) {
        // FIXME: Web client started to bug out since there seems to be a ApiCast coming with a
        // no author defined. Obviously we need to fix where this object is generated like
        // this but for now this should help us stop the bleeding.
        // See: https://sentry.io
        if (data?.author?.username?.toLowerCase() === username.toLowerCase()) {
          return data;
        }
      }
    }
    return undefined;
  }, [queryClient, castHashPrefix, username]);
}
