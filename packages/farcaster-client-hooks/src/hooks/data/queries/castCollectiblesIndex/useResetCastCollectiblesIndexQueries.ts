import { useQueryClient } from '@tanstack/react-query';
import { ApiGetCastCollectiblesIndexQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildCastCollectiblesIndexKey } from './buildCastCollectiblesIndexKey';

export const useResetCastCollectiblesIndexQueries = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (params?: ApiGetCastCollectiblesIndexQueryParams | null) => {
      if (!params) {
        return queryClient.resetQueries({
          predicate: (query) => {
            return (
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === 'castCollectiblesIndex'
            );
          },
        });
      }

      // Invalidate specific query
      return queryClient.resetQueries({
        queryKey: buildCastCollectiblesIndexKey(params),
      });
    },
    [queryClient],
  );
};
