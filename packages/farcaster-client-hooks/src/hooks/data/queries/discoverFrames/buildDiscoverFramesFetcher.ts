import {
  ApiDiscoveryFrameCategory,
  ApiDiscoveryFrameList,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildDiscoverFramesFetcher = ({
  apiClient,
  list,
  categoryFilter,
}: {
  apiClient: FarcasterApiClient;
  list: ApiDiscoveryFrameList;
  categoryFilter?: ApiDiscoveryFrameCategory;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.discoverFrames({
      cursor,
      list,
      categoryFilter,
      limit: 9,
    });
    return response.data;
  });

export { buildDiscoverFramesFetcher };
