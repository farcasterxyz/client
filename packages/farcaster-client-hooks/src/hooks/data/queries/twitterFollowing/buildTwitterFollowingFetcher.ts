import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildTwitterFollowingFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getTwitterFollowing({
      cursor,
      limit: 15,
    });

    return response.data;
  });

export { buildTwitterFollowingFetcher };
