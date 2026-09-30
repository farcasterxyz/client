import { ApiDirectCastGroupInviteCriteria } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateDirectCastConversationMessages } from '../queries/directCastConversationMessages/useInvalidateDirectCastConversationMessages';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useInvalidatePlaintextDirectCastGroupInvite } from '../queries/plaintextDirectCastGroupInvite/useInvalidatePlaintextDirectCastGroupInvite';

const useCreatePlaintextDirectCastGroupInvite = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();
  const invalidateExistingInvite =
    useInvalidatePlaintextDirectCastGroupInvite();
  const invalidateDirectCastConversationMessages =
    useInvalidateDirectCastConversationMessages();

  return useCallback(
    async ({
      fid,
      conversationId,
      inviteCode,
      criteria,
    }: {
      fid: number;
      conversationId: string;
      inviteCode?: string;
      criteria?: ApiDirectCastGroupInviteCriteria;
    }) => {
      const { data } = await apiClient.putDirectCastGroupInviteV3({
        conversationId,
        inviteCode,
        criteria,
      });
      invalidateExistingInvite({ fid, conversationId });
      invalidateDirectCastInboxByAccount({ fid, category: 'default' });
      invalidateDirectCastInboxByAccount({
        fid,
        category: 'archived',
      });
      invalidateDirectCastConversationMessages({
        conversationId: conversationId,
        messageId: undefined,
      });
      return data.result.inviteCode;
    },
    [
      apiClient,
      invalidateExistingInvite,
      invalidateDirectCastInboxByAccount,
      invalidateDirectCastConversationMessages,
    ],
  );
};

export { useCreatePlaintextDirectCastGroupInvite };
