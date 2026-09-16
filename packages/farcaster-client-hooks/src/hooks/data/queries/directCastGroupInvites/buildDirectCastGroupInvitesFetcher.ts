import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildDirectCastGroupInvitesFetcher = ({
  apiClient,
  conversationId,
}: {
  apiClient: FarcasterApiClient;
  conversationId: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getDirectCastGroupInvites({
      conversationId,
      cursor: cursor,
      limit: 20,
    });

    return response.data;
  });

export { buildDirectCastGroupInvitesFetcher };
