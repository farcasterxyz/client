import { useQueryClient } from '@tanstack/react-query';
import {
  ApiGetDirectCastConversation200Response,
  shouldUpdateCache,
} from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback } from 'react';

import {
  DirectCastConversationUpdates,
  MergeIntoGloballyCachedDirectCastConversation,
} from '../../../../types';
import { buildDirectCastConversationKey } from './buildDirectCastConversationKey';
import { useGetDirectCastConversation } from './useGetDirectCastConversation';

const useUpdateDirectCastConversation =
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
              const merged = merge({}, prev?.result?.conversation, updates);
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

export { useUpdateDirectCastConversation };
