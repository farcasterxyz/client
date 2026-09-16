import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildSearchUsersForStarterPacksFetcher = ({
  search,
  apiClient,
}: {
  search: string | undefined;
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.searchUsersForStarterPacks({
      cursor,
      search: search,
      limit: 15,
    });

    return response.data;
  });

export { buildSearchUsersForStarterPacksFetcher };
