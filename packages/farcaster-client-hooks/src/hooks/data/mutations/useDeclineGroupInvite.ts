import { useMutation } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useAlterPlaintextDirectCastConversationCategory } from './useAlterPlaintextDirectCastConversationCategory';

const useDeclineGroupInvite = () => {
  const { apiClient } = useFarcasterApiClient();

  const alterPlaintextDirectCastConversationCategory =
    useAlterPlaintextDirectCastConversationCategory();

  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await apiClient.postDirectCastDeclineGroupInviteV3({
        conversationId,
      });
    },
    onMutate: async ({
      fid,
      conversationId,
    }: {
      fid: number;
      conversationId: string;
    }) => {
      alterPlaintextDirectCastConversationCategory({
        fid: fid,
        conversationId,
        fromCategory: 'request',
        toCategory: 'deleted',
        enabled: false,
      });
    },
  });
};

export { useDeclineGroupInvite };
