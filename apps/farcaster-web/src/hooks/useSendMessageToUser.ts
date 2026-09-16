import {
  buildNonGroupConversationId,
  useOptimisticallyAddNewDirectCastConversationToInbox,
} from 'farcaster-client-hooks';
import { ApiUser } from 'farcaster-cryptography';
import { useCallback } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';

export const useSendMessageToUser = () => {
  const currentUser = useCurrentUser();
  const navigateToDirectCastsConversation =
    useNavigateToDirectCastsConversation();
  const addNewOptimisticConversation =
    useOptimisticallyAddNewDirectCastConversationToInbox();

  return useCallback(
    ({ user }: { user: ApiUser }) => {
      const conversationId = buildNonGroupConversationId({
        participantFids: [user.fid, currentUser.fid],
      });

      addNewOptimisticConversation({
        currentUser,
        conversationId,
        counterParties: [user],
      });

      navigateToDirectCastsConversation({
        conversationId: conversationId,
      });
    },
    [
      addNewOptimisticConversation,
      currentUser,
      navigateToDirectCastsConversation,
    ],
  );
};
