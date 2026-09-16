import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildSuggestedStarterPacksFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getSuggestedStarterPacks({
      cursor,
      limit: 15,
    });
    return response.data;
  });

export { buildSuggestedStarterPacksFetcher };
