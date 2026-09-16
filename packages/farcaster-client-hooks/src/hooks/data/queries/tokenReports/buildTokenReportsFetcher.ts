import { ApiChain, FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildTokenReportsFetcher = ({
  apiClient,
  chain,
  ca,
}: {
  apiClient: FarcasterApiClient;
  chain: ApiChain;
  ca: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getTokenReports({
      chain,
      ca,
      cursor,
      limit: 25,
    });

    return response.data;
  });

export { buildTokenReportsFetcher };
