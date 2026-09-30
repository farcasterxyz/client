import { useQueryClient } from '@tanstack/react-query';
import { ApiGetCastCollectiblesIndexQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildCastCollectiblesIndexKey } from './buildCastCollectiblesIndexKey';

const useInvalidateCastCollectiblesIndex = () => {
  const queryClient = useQueryClient();

  const invalidateCastCollectiblesIndex = useCallback(
    (params?: ApiGetCastCollectiblesIndexQueryParams | null) => {
      if (params === null || params === undefined) {
        // Invalidate all castCollectiblesIndex queries
        return queryClient.invalidateQueries({
          predicate: (query) => {
            return (
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === 'castCollectiblesIndex'
            );
          },
        });
      }

      // Invalidate specific query
      return queryClient.invalidateQueries({
        queryKey: buildCastCollectiblesIndexKey(params),
      });
    },
    [queryClient],
  );

  return { invalidateCastCollectiblesIndex };
};

export { useInvalidateCastCollectiblesIndex };
