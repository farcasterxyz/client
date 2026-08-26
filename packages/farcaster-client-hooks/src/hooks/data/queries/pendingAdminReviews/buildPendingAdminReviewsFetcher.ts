import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildPendingAdminReviewsFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getPendingAdminReviews({
      cursor,
      limit: 15,
    });

    return response.data;
  });

export { buildPendingAdminReviewsFetcher };
