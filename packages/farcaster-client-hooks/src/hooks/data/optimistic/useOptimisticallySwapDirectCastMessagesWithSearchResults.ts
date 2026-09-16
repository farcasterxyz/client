import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastMessageV3,
  ApiGetDirectCastConversationMessages200Response,
} from 'farcaster-client-data';
import * as React from 'react';

import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';

type DirectCastConversationMessagesQueryData =
  ApiGetDirectCastConversationMessages200Response;

type DirectCastConversationMessagesQueryInfiniteData =
  InfiniteData<DirectCastConversationMessagesQueryData>;

function useOptimisticallySwapDirectCastMessagesWithSearchResults() {
  const qc = useQueryClient();
  return React.useCallback(
    ({
      conversationId,
      searchResults,
      cursor,
    }: {
      conversationId: string;
      searchResults: ApiDirectCastMessageV3[];
      cursor: string;
    }) => {
      const defaultMessagesQueryKey = buildDirectCastConversationMessagesKey({
        conversationId: conversationId,
        messageId: undefined,
      });
      qc.setQueryData(
        defaultMessagesQueryKey,
        () =>
          ({
            pageParams: [null],
            pages: [
              {
                result: { messages: searchResults },
                next: { cursor },
              },
            ],
          }) satisfies DirectCastConversationMessagesQueryInfiniteData,
      );
    },
    [qc],
  );
}

export { useOptimisticallySwapDirectCastMessagesWithSearchResults };
