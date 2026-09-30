import {
  ApiDiscoveryAppCategory,
  ApiDiscoveryAppList,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildDiscoverAppsFetcher = ({
  apiClient,
  list,
  categoryFilter,
}: {
  apiClient: FarcasterApiClient;
  list: ApiDiscoveryAppList;
  categoryFilter?: ApiDiscoveryAppCategory;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.discoverApps({
      cursor,
      list,
      categoryFilter,
      limit: 15,
    });
    return response.data;
  });

export { buildDiscoverAppsFetcher };
