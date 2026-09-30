import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildCastQuotesKey } from './buildCastQuotesKey';
import { useCastQuotes } from './useCastQuotes';
import { useInvalidateCastQuotes } from './useInvalidateCastQuotes';

const useCastQuotesWithRefreshOnMount = ({
  castHash,
}: {
  castHash: string;
}) => {
  const initialValue = useCastQuotes({ castHash });

  const queryKey = useMemo(() => buildCastQuotesKey({ castHash }), [castHash]);

  const invalidateCastQuotes = useInvalidateCastQuotes();
  const invalidate = useCallback(() => {
    invalidateCastQuotes({ castHash });
  }, [castHash, invalidateCastQuotes]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useCastQuotesWithRefreshOnMount };
