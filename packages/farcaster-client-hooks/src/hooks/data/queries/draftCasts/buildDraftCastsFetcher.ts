import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildDraftCastsFetcher = ({
  apiClient,
  channelKey,
}: {
  apiClient: FarcasterApiClient;
  channelKey: string | undefined;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getDraftCasts({
      channelKey,
      cursor,
      limit: 15,
    });

    return response.data;
  });

export { buildDraftCastsFetcher };
