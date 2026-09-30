import { useQueryClient } from '@tanstack/react-query';
import {
  ApiGetDirectCastConversation200Response,
  mergeExceptArrays,
  shouldUpdateCache,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import {
  DirectCastConversationUpdates,
  MergeIntoGloballyCachedDirectCastConversation,
} from '../../../../types';
import { buildDirectCastConversationKey } from './buildDirectCastConversationKey';
import { useGetDirectCastConversation } from './useGetDirectCastConversation';

const useAggressivelyUpdateDirectCastConversation =
  (): MergeIntoGloballyCachedDirectCastConversation => {
    const queryClient = useQueryClient();
    const getDirectCastConversation = useGetDirectCastConversation();

    return useCallback(
      ({ updates }: { updates: DirectCastConversationUpdates }) => {
        const prevConversation = getDirectCastConversation({
          conversationId: updates.conversationId,
        });

        if (
          typeof prevConversation !== 'undefined' &&
          shouldUpdateCache({ cache: prevConversation, updates })
        ) {
          queryClient.setQueryData(
            buildDirectCastConversationKey({
              conversationId: updates.conversationId,
            }),
            (prev: ApiGetDirectCastConversation200Response | undefined) => {
              const merged = mergeExceptArrays(
                mergeExceptArrays({}, prev?.result?.conversation),
                updates,
              );
              return {
                ...prev,
                result: {
                  ...prev?.result,
                  conversation: merged,
                },
              };
            },
          );
        }
      },
      [queryClient, getDirectCastConversation],
    );
  };

export { useAggressivelyUpdateDirectCastConversation };
