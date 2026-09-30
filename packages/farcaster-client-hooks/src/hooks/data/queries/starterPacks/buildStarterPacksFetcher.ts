import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildStarterPacksFetcher = ({
  apiClient,
  fid,
}: {
  apiClient: FarcasterApiClient;
  fid: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getStarterPacks({
      fid,
      cursor,
      limit: 15,
    });
    return response.data;
  });

export { buildStarterPacksFetcher };
