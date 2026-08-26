import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
} from 'farcaster-client-data';
import {
  OnCreateFallback,
  useDirectCastConversationHistoricalMessages,
  useDirectCastConversationMessages,
  useDirectCastConversationRecentMessages,
  useInvalidateDirectCastConversationMessages,
  useOptimisticallySwapDirectCastMessagesWithArbitraryPoint,
  useOptimisticallySwapDirectCastMessagesWithRecent,
  usePrefetchDirectCastConversationHistoricalMessages,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useState } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

type ConversationState = {
  isLoading: boolean;
  conversationId: string;
  messages: ApiDirectCastMessageV3[];
  focusedMessageIndex: number;
  shouldRenderUnreadMarkerMessageId: string | undefined;
  mostRecentlyFetchedPageMessageCount: number;
};

const MIN_ITEMS_IN_LIST_TO_SHOW_UNREAD_MARKERS = 1;

type DirectCastsConversationMessagesContextValue = {
  conversationState: ConversationState;
  fetchOlderMessages: () => void;
  fetchNewerMessages: () => void;
  isFetchingOlderMessages: boolean;
  isFetchingNewerMessages: boolean;
  refetchFullConversation: () => void;
  load: ({ messageId }: { messageId: string }) => { scrollToIndex: number };
  hasOlderMessages: boolean;
  hasNewerMessages: boolean;
};

const DirectCastsConversationMessagesContext =
  React.createContext<DirectCastsConversationMessagesContextValue>({} as never);

type DirectCastsConversationMessagesProviderProps = {
  conversation: ApiDirectCastConversationInfoV3;
  children: React.ReactNode;
};

const onCreateFallback: OnCreateFallback = { messages: [] };

const DirectCastsConversationMessagesProvider: React.FC<
  DirectCastsConversationMessagesProviderProps
> = ({ conversation, children }) => {
  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    isFetchingPreviousPage,
    isPending,
    isFetching,
    isRefetching,
    hasPreviousPage,
    hasNextPage,
    refetch,
  } = useDirectCastConversationMessages({
    conversationId: conversation.conversationId,
    messageId: undefined,
    onCreateFallback: onCreateFallback,
    limit: 50,
  });

  const prefetchConversationHistoricalMessages =
    usePrefetchDirectCastConversationHistoricalMessages();

  // We are fetching the recent messages in-case user wants to jump to
  // latest. We could also do some prefetching but this works fine for
  // now.
  useDirectCastConversationRecentMessages({
    conversationId: conversation.conversationId,
  });

  // FIXME: We are defaulting to a single pinned message for now so this works.
  const conversationPinnedMessageId =
    conversation.pinnedMessages.length !== 0
      ? conversation.pinnedMessages[0].messageId
      : undefined;

  useDirectCastConversationHistoricalMessages({
    conversationId: conversation.conversationId,
    messageId: conversationPinnedMessageId,
    limit: 50,
  });

  const optimisticallySwapDirectCastMessagesWithRecent =
    useOptimisticallySwapDirectCastMessagesWithRecent({
      conversationId: conversation.conversationId,
    });

  const swap = useOptimisticallySwapDirectCastMessagesWithArbitraryPoint({
    conversationId: conversation.conversationId,
  });

  const invalidateDirectCastConversationMessages =
    useInvalidateDirectCastConversationMessages();

  const messages = React.useMemo(() => {
    return data?.pages.flatMap((d) => d.result.messages) || [];
  }, [data?.pages]);

  const [initializedState, setInitializedState] =
    React.useState<boolean>(false);

  const [unreadMarkerMessageIndex, setUnreadMarkerMessageIndex] =
    React.useState<number>(0);
  const [unreadMarkerMessageId, setUnreadMarkerMessageId] = React.useState<
    string | undefined
  >();

  const { fid: currentUserFid } = useCurrentUser();

  React.useLayoutEffect(() => {
    const earliestMessageByViewer = messages.findIndex(
      (directCast) => directCast.senderFid === currentUserFid,
    );

    const lastReadMessageIndexMatch = messages.findIndex(
      (directCast, index) => {
        const idx = index;
        const nextDirectCast = messages[idx - 1];

        const shouldRenderNewMessageMarker =
          typeof directCast !== 'undefined' &&
          typeof nextDirectCast !== 'undefined' &&
          typeof directCast.viewerContext !== 'undefined' &&
          directCast.viewerContext.isLastReadMessage;

        return shouldRenderNewMessageMarker;
      },
    );

    if (
      (earliestMessageByViewer === -1 ||
        earliestMessageByViewer >= lastReadMessageIndexMatch) &&
      lastReadMessageIndexMatch !== -1 &&
      lastReadMessageIndexMatch > MIN_ITEMS_IN_LIST_TO_SHOW_UNREAD_MARKERS
    ) {
      const message = messages[lastReadMessageIndexMatch];
      if (message && message.messageId !== unreadMarkerMessageId) {
        setUnreadMarkerMessageId(message.messageId);
        setUnreadMarkerMessageIndex(lastReadMessageIndexMatch);
      }
    }

    setInitializedState(true);
  }, [currentUserFid, messages, unreadMarkerMessageId]);

  // If the last message is from the current user, we should clear the unread marker.
  useEffect(() => {
    if (conversation.lastMessage?.senderFid === currentUserFid) {
      setUnreadMarkerMessageId(undefined);
      setUnreadMarkerMessageIndex(0);
    }
  }, [conversation.lastMessage, currentUserFid, unreadMarkerMessageId]);

  const [isLocalFetching, setIsLocalFetching] = useState(false);

  const fetchOlderMessages = useCallback(() => {
    // Direct casts are coming from the server inverted so its a bit confusing but next page
    // contains older messages in the convo
    if (!isFetchingNextPage && !isLocalFetching) {
      setIsLocalFetching(true);
      fetchNextPage().finally(() => {
        setIsLocalFetching(false);
      });
    }
  }, [fetchNextPage, isFetchingNextPage, isLocalFetching]);

  const fetchNewerMessages = useCallback(() => {
    // Direct casts are coming from the server inverted so its a bit confusing but previous means newer
    // messages in the convo
    if (!isFetchingPreviousPage && !isLocalFetching) {
      setIsLocalFetching(true);
      fetchPreviousPage().finally(() => {
        setIsLocalFetching(false);
      });
    }
  }, [fetchPreviousPage, isFetchingPreviousPage, isLocalFetching]);

  const refetchFullConversation = React.useCallback(() => {
    optimisticallySwapDirectCastMessagesWithRecent();

    invalidateDirectCastConversationMessages({
      conversationId: conversation.conversationId,
      messageId: undefined,
    });

    refetch();
  }, [
    conversation.conversationId,
    invalidateDirectCastConversationMessages,
    optimisticallySwapDirectCastMessagesWithRecent,
    refetch,
  ]);

  const load = React.useCallback(
    ({ messageId }: { messageId: string }) => {
      const { messageIndex } = swap({
        messageId: messageId,
      });

      return { scrollToIndex: messageIndex };
    },
    [swap],
  );

  const mostRecentlyFetchedPageMessageCount = React.useMemo(() => {
    return typeof data !== 'undefined' && typeof data.pages[0] !== 'undefined'
      ? data.pages[0].result.messages.length
      : 0;
  }, [data]);

  const conversationState = React.useMemo(() => {
    return {
      isLoading: !initializedState || isFetching || isPending || isRefetching,
      conversationId: conversation.conversationId,
      focusedMessageIndex: unreadMarkerMessageIndex,
      messages: messages,
      mostRecentlyFetchedPageMessageCount: mostRecentlyFetchedPageMessageCount,
      shouldRenderUnreadMarkerMessageId: unreadMarkerMessageId,
    } satisfies ConversationState;
  }, [
    conversation.conversationId,
    initializedState,
    isFetching,
    isPending,
    isRefetching,
    messages,
    mostRecentlyFetchedPageMessageCount,
    unreadMarkerMessageId,
    unreadMarkerMessageIndex,
  ]);

  const value = React.useMemo(
    () => ({
      conversationState,
      hasOlderMessages: typeof hasNextPage !== 'undefined' && hasNextPage,
      hasNewerMessages:
        typeof hasPreviousPage !== 'undefined' && hasPreviousPage,
      fetchOlderMessages,
      fetchNewerMessages,
      isFetchingOlderMessages: isFetchingNextPage,
      isFetchingNewerMessages: isFetchingPreviousPage,
      refetchFullConversation,
      load,
    }),
    [
      conversationState,
      hasNextPage,
      hasPreviousPage,
      isFetchingNextPage,
      isFetchingPreviousPage,
      fetchNewerMessages,
      fetchOlderMessages,
      refetchFullConversation,
      load,
    ],
  );

  const quotesToPrefetch = React.useMemo(() => {
    return messages.filter(
      ({ inReplyTo }) =>
        typeof inReplyTo !== 'undefined' &&
        messages.findIndex((o) => o.messageId === inReplyTo.messageId) === -1,
    );
  }, [messages]);

  React.useEffect(() => {
    for (const quoteToPrefetch of quotesToPrefetch) {
      if (typeof quoteToPrefetch.inReplyTo !== 'undefined') {
        prefetchConversationHistoricalMessages({
          conversationId: conversation.conversationId,
          messageId: quoteToPrefetch.inReplyTo.messageId,
          limit: 50,
        });
      }
    }
  }, [
    conversation.conversationId,
    prefetchConversationHistoricalMessages,
    quotesToPrefetch,
  ]);

  return (
    <DirectCastsConversationMessagesContext.Provider value={value}>
      {children}
    </DirectCastsConversationMessagesContext.Provider>
  );
};

const useDirectCastsConversationMessages = () =>
  React.useContext(DirectCastsConversationMessagesContext);

export {
  DirectCastsConversationMessagesProvider,
  useDirectCastsConversationMessages,
};
