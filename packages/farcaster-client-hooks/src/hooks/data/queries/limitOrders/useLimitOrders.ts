import { useInfiniteQuery } from '@tanstack/react-query';
import { ApiLimitOrder, getNextPageCursor } from 'farcaster-client-data';
import { useEffect, useRef } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildLimitOrdersFetcher } from './buildLimitOrdersFetcher';
import { buildLimitOrdersKey } from './buildLimitOrdersKey';

const CANCEL_PENDING_REFETCH_INTERVAL_MS = 5_000;
const CANCEL_PENDING_POLL_DURATION_MS = CANCEL_PENDING_REFETCH_INTERVAL_MS * 12;

const limitOrderKeyExtractor = (order: ApiLimitOrder) => order.id;

const useLimitOrders = ({
  statuses,
  enabled = true,
}: { statuses?: string; enabled?: boolean } = {}) => {
  const { apiClient } = useFarcasterApiClient();
  const cancelPendingPollStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    cancelPendingPollStartedAtRef.current = null;
  }, [statuses]);

  const result = useInfiniteQuery({
    initialPageParam: undefined as string | undefined,
    queryKey: buildLimitOrdersKey({ statuses }),
    queryFn: buildLimitOrdersFetcher({
      apiClient,
      statuses,
    }),
    getNextPageParam: getNextPageCursor,
    enabled,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
    refetchInterval: (query) => {
      const orders =
        query.state.data?.pages.flatMap((page) => page.items) ?? [];
      const hasCancelPending = orders.some(
        (order) => order.status === 'cancel_pending',
      );

      if (!hasCancelPending) {
        cancelPendingPollStartedAtRef.current = null;
        return false;
      }

      const startedAt = cancelPendingPollStartedAtRef.current ?? Date.now();
      cancelPendingPollStartedAtRef.current = startedAt;

      if (Date.now() - startedAt >= CANCEL_PENDING_POLL_DURATION_MS) {
        return false;
      }

      return CANCEL_PENDING_REFETCH_INTERVAL_MS;
    },
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: limitOrderKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, {
    flatData,
    onEndReached,
  });
};

export { useLimitOrders };
