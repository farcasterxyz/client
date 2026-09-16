import { ApiDirectCastConversationAlterCategory } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';

const useBulkAlterPlaintextDirectCastConversationCategory = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();

  return useCallback(
    async ({
      fid,
      category,
    }: {
      fid: number;
      category: ApiDirectCastConversationAlterCategory;
    }) => {
      const { data } =
        await apiClient.postDirectCastConversationCategorizationBulkV3({
          category,
        });
      if (category !== 'deleted') {
        invalidateDirectCastInboxByAccount({ fid, category });
      }
      return data;
    },
    [apiClient, invalidateDirectCastInboxByAccount],
  );
};

export { useBulkAlterPlaintextDirectCastConversationCategory };
