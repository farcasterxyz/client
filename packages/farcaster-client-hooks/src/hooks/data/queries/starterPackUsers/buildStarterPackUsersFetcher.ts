import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildStarterPackUsersFetcher = ({
  id,
  apiClient,
}: {
  id: string;
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getStarterPackUsers({
      cursor,
      id: id,
      limit: 15,
    });

    return response.data;
  });

export { buildStarterPackUsersFetcher };
