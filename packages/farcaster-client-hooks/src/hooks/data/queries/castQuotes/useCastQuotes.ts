import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildCastQuotesFetcher } from './buildCastQuotesFetcher';
import { buildCastQuotesKey } from './buildCastQuotesKey';

const useCastQuotes = ({ castHash }: { castHash: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildCastQuotesKey({ castHash }),

    queryFn: buildCastQuotesFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      castHash,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useCastQuotes };
