import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildWarpTransactionsFetcher } from './buildWarpTransactionsFetcher';
import { buildWarpTransactionsKey } from './buildWarpTransactionsKey';

const useWarpTransactions = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildWarpTransactionsKey(),

    queryFn: buildWarpTransactionsFetcher({
      apiClient,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useWarpTransactions };
