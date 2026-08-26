import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { GloballyCachedDirectCastInboxCache } from '../../../../types';
import { buildGloballyCachedDirectCastInboxConversationKey } from './buildGloballyCachedDirectCastInboxConversationKey';

const useGetGloballyCachedDirectCastInboxConversation = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      conversationId,
    }: {
      conversationId: string;
    }): GloballyCachedDirectCastInboxCache | undefined => {
      return queryClient.getQueryData<GloballyCachedDirectCastInboxCache>(
        buildGloballyCachedDirectCastInboxConversationKey({
          conversationId,
        }),
      );
    },
    [queryClient],
  );
};

export { useGetGloballyCachedDirectCastInboxConversation };
