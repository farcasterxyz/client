import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildBlockedUsersFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getBlockedUsers({
      cursor,
      limit: 100,
    });
    return response.data;
  });

export { buildBlockedUsersFetcher };
