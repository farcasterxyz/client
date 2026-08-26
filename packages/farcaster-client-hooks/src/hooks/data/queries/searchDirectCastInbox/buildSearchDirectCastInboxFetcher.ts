import {
  ApiDirectCastConversationViewCategory,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { MergeIntoGloballyCachedDirectCastInbox } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildSearchDirectCastInboxFetcher = ({
  q,
  category,
  limit,
  apiClient,
  mergeIntoGloballyCachedDirectCastInboxConversation,
}: {
  q: string;
  category: ApiDirectCastConversationViewCategory;
  limit: number;
  apiClient: FarcasterApiClient;
  mergeIntoGloballyCachedDirectCastInboxConversation: MergeIntoGloballyCachedDirectCastInbox;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.searchDirectCastInbox({
      q,
      category,
      cursor,
      limit,
    });

    for (const conversation of response.data.result.conversations) {
      mergeIntoGloballyCachedDirectCastInboxConversation({
        updates: conversation,
      });
    }

    return response.data;
  });

export { buildSearchDirectCastInboxFetcher };
