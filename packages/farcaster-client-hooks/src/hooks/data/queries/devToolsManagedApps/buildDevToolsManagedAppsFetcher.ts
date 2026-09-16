import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildDevToolsManagedAppsFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.devToolsManagedApps({
      cursor,
      limit: 25,
    });

    return {
      items: response.data.result.apps,
      next: response.data.next,
    };
  });

export { buildDevToolsManagedAppsFetcher };
