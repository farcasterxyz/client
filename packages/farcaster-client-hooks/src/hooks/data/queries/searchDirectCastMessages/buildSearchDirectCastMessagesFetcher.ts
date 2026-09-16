import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildSearchDirectCastMessagesFetcher = ({
  apiClient,
  query,
  limit,
}: {
  apiClient: FarcasterApiClient;
  query: string;
  limit: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.globalSearchForMessages({
      query,
      limit,
      cursor,
    });
    return response.data;
  });

export { buildSearchDirectCastMessagesFetcher };
