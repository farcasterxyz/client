import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildVerificationsFetcher = ({
  apiClient,
  fid,
}: {
  apiClient: FarcasterApiClient;
  fid: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getVerifications({
      cursor,
      fid,
      limit: 15,
    });
    return response.data;
  });

export { buildVerificationsFetcher };
