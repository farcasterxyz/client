import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation';
import { useInvalidateDirectCastConversationMessages } from '../queries/directCastConversationMessages/useInvalidateDirectCastConversationMessages';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useUpdateGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation';

const useRenamePlaintextDirectCastGroup = () => {
  const { apiClient } = useFarcasterApiClient();

  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();
  const invalidateDirectCastConversationMessages =
    useInvalidateDirectCastConversationMessages();

  const optimisticallyUpdateDirectCastConversation =
    useUpdateDirectCastConversation();

  const updateGloballyCachedDirectCastInboxConversation =
    useUpdateGloballyCachedDirectCastInboxConversation();

  return useCallback(
    async ({
      fid,
      conversationId,
      name,
      description,
    }: {
      fid: number;
      conversationId: string;
      name: string;
      description?: string;
    }) => {
      optimisticallyUpdateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          name: name,
          description: description,
        },
      });
      updateGloballyCachedDirectCastInboxConversation({
        updates: {
          conversationId: conversationId,
          name: name,
          description: description,
        },
      });

      const { data } = await apiClient.postDirectCastGroupNameV3({
        conversationId,
        name,
        description,
      });

      invalidateDirectCastInboxByAccount({ fid, category: 'default' });
      invalidateDirectCastInboxByAccount({ fid, category: 'archived' });
      // This is to get the new message to show of the rename change
      // TODO: Convert this to an optimistic update
      invalidateDirectCastConversationMessages({
        conversationId: conversationId,
        messageId: undefined,
      });

      return data;
    },
    [
      apiClient,
      invalidateDirectCastInboxByAccount,
      invalidateDirectCastConversationMessages,
      optimisticallyUpdateDirectCastConversation,
      updateGloballyCachedDirectCastInboxConversation,
    ],
  );
};

export { useRenamePlaintextDirectCastGroup };
