import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildConnectedAccountsFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getConnectedAccounts({
      cursor,
      limit: 15,
    });
    return response.data;
  });

export { buildConnectedAccountsFetcher };
