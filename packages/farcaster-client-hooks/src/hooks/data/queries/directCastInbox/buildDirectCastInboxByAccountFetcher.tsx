import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { MergeIntoGloballyCachedDirectCastInbox } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildDirectCastInboxByAccountFetcher = ({
  apiClient,
  category,
  filter,
  mergeIntoGloballyCachedDirectCastInbox,
}: {
  apiClient: FarcasterApiClient;
  mergeIntoGloballyCachedDirectCastInbox: MergeIntoGloballyCachedDirectCastInbox;
  category?: ApiDirectCastConversationViewCategory;
  filter?: ApiDirectCastConversationFilter;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getDirectCastInbox({
      cursor: cursor,
      limit: 15,
      category,
      filter,
    });

    for (const conversation of response.data.result.conversations) {
      mergeIntoGloballyCachedDirectCastInbox({ updates: conversation });
    }

    return response.data;
  });

export { buildDirectCastInboxByAccountFetcher };
