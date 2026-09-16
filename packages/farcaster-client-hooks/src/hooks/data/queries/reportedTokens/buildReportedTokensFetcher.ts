import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildReportedTokensFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getReportedTokens({
      cursor,
      limit: 25,
    });

    return response.data;
  });

export { buildReportedTokensFetcher };
