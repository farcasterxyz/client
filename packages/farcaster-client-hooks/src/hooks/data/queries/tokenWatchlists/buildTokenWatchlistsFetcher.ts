import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildTokenWatchlistsFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getTokensInWatchlist({
      cursor,
      limit: 15,
    });

    return response.data;
  });

export { buildTokenWatchlistsFetcher };
