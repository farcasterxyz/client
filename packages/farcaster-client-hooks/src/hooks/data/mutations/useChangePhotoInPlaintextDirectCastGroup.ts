import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { useInvalidateDirectCastConversationMessages } from '../queries/directCastConversationMessages/useInvalidateDirectCastConversationMessages';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useUpdateGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation/useUpdateGloballyCachedDirectCastInboxConversation';

const useChangePhotoInPlaintextDirectCastGroup = () => {
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
      photoUrl,
    }: {
      fid: number;
      conversationId: string;
      photoUrl?: string;
    }) => {
      optimisticallyUpdateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          photoUrl: photoUrl,
        },
      });

      updateGloballyCachedDirectCastInboxConversation({
        updates: {
          conversationId: conversationId,
          photoUrl: photoUrl,
        },
      });

      const { data } = await apiClient.postDirectCastGroupPhotoUrlV3({
        conversationId,
        photoUrl,
      });

      invalidateDirectCastInboxByAccount({
        fid,
        category: 'default',
      });
      invalidateDirectCastInboxByAccount({
        fid,
        category: 'archived',
      });
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

export { useChangePhotoInPlaintextDirectCastGroup };
