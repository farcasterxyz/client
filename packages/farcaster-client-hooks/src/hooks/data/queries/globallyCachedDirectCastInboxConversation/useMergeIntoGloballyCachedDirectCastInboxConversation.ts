import { useQueryClient } from '@tanstack/react-query';
import {
  type ApiDirectCastInboxConversationInfoV3,
  mergeExceptArrays,
  shouldUpdateCache,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import type {
  DirectCastInboxUpdates,
  GloballyCachedDirectCastInboxCache,
  MergeIntoGloballyCachedDirectCastInbox,
} from '../../../../types';
import { buildGloballyCachedDirectCastInboxConversationKey } from './buildGloballyCachedDirectCastInboxConversationKey';
import { useGetGloballyCachedDirectCastInboxConversation } from './useGetGloballyCachedDirectCastInboxConversation';

const useMergeIntoGloballyCachedDirectCastInboxConversation =
  (): MergeIntoGloballyCachedDirectCastInbox => {
    const queryClient = useQueryClient();
    const getCachedDirectCastInbox =
      useGetGloballyCachedDirectCastInboxConversation();

    return useCallback(
      ({ updates }: { updates: DirectCastInboxUpdates }) => {
        const queryKey = buildGloballyCachedDirectCastInboxConversationKey({
          conversationId: updates.conversationId,
        });

        const cachedDirectCastInbox = getCachedDirectCastInbox({
          conversationId: updates.conversationId,
        });

        if (shouldUpdateCache({ cache: cachedDirectCastInbox, updates })) {
          queryClient.setQueryData<GloballyCachedDirectCastInboxCache>(
            queryKey,
            (prevInbox: ApiDirectCastInboxConversationInfoV3 | undefined) =>
              mergeExceptArrays(prevInbox, updates),
          );
        }
      },
      [getCachedDirectCastInbox, queryClient],
    );
  };

export { useMergeIntoGloballyCachedDirectCastInboxConversation };
