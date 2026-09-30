import { useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationInfoV3,
  shouldUpdateCache,
} from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback } from 'react';

import {
  DirectCastConversationUpdates,
  MergeIntoGloballyCachedDirectCastConversation,
} from '../../../../types';
import { buildGloballyCachedDirectCastInboxConversationKey } from './buildGloballyCachedDirectCastInboxConversationKey';
import { useGetGloballyCachedDirectCastInboxConversation } from './useGetGloballyCachedDirectCastInboxConversation';

const useUpdateGloballyCachedDirectCastInboxConversation =
  (): MergeIntoGloballyCachedDirectCastConversation => {
    const queryClient = useQueryClient();
    const getCachedDirectCastConversation =
      useGetGloballyCachedDirectCastInboxConversation();

    return useCallback(
      ({ updates }: { updates: DirectCastConversationUpdates }) => {
        const queryKey = buildGloballyCachedDirectCastInboxConversationKey({
          conversationId: updates.conversationId,
        });

        const cachedDirectCastConversation = getCachedDirectCastConversation({
          conversationId: updates.conversationId,
        });

        if (
          // Main difference between mergeInto* and udpate* is this line. We only want
          // to update global conversations if we already have a proper full cache on
          // the storage.
          typeof cachedDirectCastConversation !== 'undefined' &&
          shouldUpdateCache({ cache: cachedDirectCastConversation, updates })
        ) {
          queryClient.setQueryData<ApiDirectCastConversationInfoV3>(
            queryKey,
            (prevConversation: ApiDirectCastConversationInfoV3 | undefined) =>
              merge({}, prevConversation, updates),
          );
        }
      },
      [getCachedDirectCastConversation, queryClient],
    );
  };

export { useUpdateGloballyCachedDirectCastInboxConversation };
