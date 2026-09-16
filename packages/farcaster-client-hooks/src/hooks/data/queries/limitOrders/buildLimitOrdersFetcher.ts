import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const LIMIT_ORDERS_PAGE_SIZE = 25;

const buildLimitOrdersFetcher = ({
  apiClient,
  statuses,
}: {
  apiClient: FarcasterApiClient;
  statuses?: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getLimitOrders({
      statuses,
      cursor,
      limit: LIMIT_ORDERS_PAGE_SIZE,
    });

    return {
      items: response.data.result.orders,
      next: response.data.next,
    };
  });

export { buildLimitOrdersFetcher };
