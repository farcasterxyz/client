import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';
import { defaultLimit } from './shared';

const buildWarpTransactionsFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getWarpTransactions({
      cursor,
      limit: defaultLimit,
    });

    return response.data;
  });

export { buildWarpTransactionsFetcher };
