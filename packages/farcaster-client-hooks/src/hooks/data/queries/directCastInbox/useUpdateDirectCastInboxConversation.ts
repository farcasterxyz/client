import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
  ApiGetDirectCastInbox200Response,
} from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback } from 'react';

import { DirectCastConversationUpdates } from '../../../../types';
import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';
import { useGetDirectCastInboxConversationByConversationId } from './useGetDirectCastInboxConversationByConversationId';

type UpdateDirectCastInboxConversation = (params: {
  fid: number;
  category?: ApiDirectCastConversationViewCategory;
  filter?: ApiDirectCastConversationFilter;
  updates: DirectCastConversationUpdates;
}) => void;

const useUpdateDirectCastInboxConversation =
  (): UpdateDirectCastInboxConversation => {
    const queryClient = useQueryClient();

    const getDirectCastInboxConversationByConversationId =
      useGetDirectCastInboxConversationByConversationId();

    return useCallback(
      ({
        fid,
        category,
        filter,
        updates,
      }: {
        fid: number;
        category?: ApiDirectCastConversationViewCategory;
        filter?: ApiDirectCastConversationFilter;
        updates: DirectCastConversationUpdates;
      }) => {
        const conversation = getDirectCastInboxConversationByConversationId({
          fid,
          conversationId: updates.conversationId,
          category,
          filter,
        });

        if (!conversation) {
          return;
        }

        queryClient.setQueryData(
          buildDirectCastInboxByAccountKey({
            fid,
            category,
            filter,
          }),
          (
            prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined,
          ) => {
            if (!prev) return undefined;
            return {
              ...prev,
              pages: prev.pages.map((p) => ({
                ...p,
                result: {
                  ...p.result,
                  conversations: p.result.conversations.map((c) =>
                    c.conversationId === updates.conversationId
                      ? merge({}, c, updates)
                      : c,
                  ),
                },
              })),
            };
          },
        );
      },
      [queryClient, getDirectCastInboxConversationByConversationId],
    );
  };

export { useUpdateDirectCastInboxConversation };
