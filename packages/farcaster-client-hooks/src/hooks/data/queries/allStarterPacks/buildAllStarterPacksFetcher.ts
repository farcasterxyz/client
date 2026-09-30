import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildAllStarterPacksFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getAllStarterPacks({
      cursor,
      limit: 15,
    });
    return response.data;
  });

export { buildAllStarterPacksFetcher };
