import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildDraftCaststormsFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getDraftCaststorms({
      cursor,
      limit: 15,
    });

    return response.data;
  });

export { buildDraftCaststormsFetcher };
