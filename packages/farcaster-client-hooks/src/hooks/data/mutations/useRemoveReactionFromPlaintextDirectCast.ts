import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import type {
  ApiDirectCastMessageReactionSummary,
  ApiGetDirectCastConversationMessages200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';

const useRemoveReactionFromPlaintextDirectCast = () => {
  const { apiClient } = useFarcasterApiClient();

  const queryClient = useQueryClient();

  return useCallback(
    async ({
      fid: _,
      conversationId,
      messageId,
      reaction,
    }: {
      fid: number;
      conversationId: string;
      messageId: string;
      reaction: string;
    }) => {
      queryClient.setQueryData(
        buildDirectCastConversationMessagesKey({
          conversationId,
          messageId: undefined,
        }),
        (
          prev:
            | InfiniteData<ApiGetDirectCastConversationMessages200Response>
            | undefined,
        ) =>
          prev
            ? {
                ...prev,
                pages: prev.pages.map((p) => {
                  const updatedMessages = p.result.messages.map((m) => {
                    const existingReactionIndex = m.reactions.findIndex(
                      (r) => r.reaction === reaction,
                    );

                    if (
                      m.messageId !== messageId ||
                      existingReactionIndex === -1
                    ) {
                      return m;
                    }

                    const existingReactionSliceIndex =
                      existingReactionIndex === -1
                        ? undefined
                        : existingReactionIndex;

                    const existingReaction: ApiDirectCastMessageReactionSummary =
                      m.reactions[existingReactionIndex];

                    const reactions: ApiDirectCastMessageReactionSummary[] = [
                      ...m.reactions.slice(0, existingReactionSliceIndex),
                      {
                        reaction,
                        count: existingReaction.count - 1,
                      },
                    ];

                    if (typeof existingReactionSliceIndex !== 'undefined') {
                      reactions.push(
                        ...m.reactions.slice(existingReactionSliceIndex + 1),
                      );
                    }

                    const cleanedUpReactions = reactions.filter(
                      (o) => o.count > 0,
                    );

                    return m.messageId === messageId
                      ? {
                          ...m,
                          reactions: cleanedUpReactions,
                          viewerContext: {
                            ...m.viewerContext,
                            reactions: m.viewerContext
                              ? m.viewerContext.reactions.filter(
                                  (r) => r !== reaction,
                                )
                              : [],
                          },
                        }
                      : m;
                  });

                  return {
                    next: p.next,
                    result: {
                      messages: updatedMessages,
                    },
                  };
                }),
              }
            : undefined,
      );

      const { data } = await apiClient.deleteDirectCastConversationReactionsV3({
        conversationId,
        messageId,
        reaction,
      });

      return data.result;
    },
    [queryClient, apiClient],
  );
};

export { useRemoveReactionFromPlaintextDirectCast };
