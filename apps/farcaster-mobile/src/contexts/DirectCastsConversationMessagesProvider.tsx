import { useFocusEffect } from '@react-navigation/native';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
} from 'farcaster-client-data';
import {
  OnCreateFallback,
  useDirectCastConversationHistoricalMessages,
  useDirectCastConversationRecentMessagesWithRefreshOnMount,
  useInvalidateDirectCastConversationMessages,
  useOptimisticallySwapDirectCastMessagesWithArbitraryPoint,
  useOptimisticallySwapDirectCastMessagesWithRecent,
  usePrefetchDirectCastConversationHistoricalMessages,
  usePrefetchDirectCastConversationMessages,
  useSuspenseDirectCastConversationMessages,
} from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';

import { useDirectCasts } from '~/contexts/DirectCastsProvider';
import { useAppState } from '~/hooks/useAppState';

type ConversationState = {
  isLoading: boolean;
  conversationId: string;
  messages: ApiDirectCastMessageV3[];
  focusedMessageIndex: number;
  shouldRenderUnreadMarkerMessageId: string | undefined;
};

const MIN_ITEMS_IN_LIST_TO_SHOW_UNREAD_MARKERS = 1;

export const HISTORICAL_MESSAGE_FETCH_LIMIT = 8;

// Larger than backend default (15) to halve round trips during fast upward
// scroll through old messages on Android.
const DC_INFINITE_PAGE_SIZE = 30;

type DirectCastsConversationMessagesContextValue = {
  conversationState: ConversationState;
  conversationRef: ApiDirectCastConversationInfoV3;
  fetchOlderMessages: () => void;
  fetchNewerMessages: () => void;
  refetchFullConversation: () => void;
  load: ({ messageId }: { messageId: string }) => { scrollToIndex: number };
  hasOlderMessages: boolean;
  hasNewerMessages: boolean;
  isFetchingOlderMessages: boolean;
  error: Error | null;
  isError: boolean;
};

const DirectCastsConversationMessagesContext =
  React.createContext<DirectCastsConversationMessagesContextValue>({} as never);

type DirectCastsConversationMessagesProviderProps = {
  currentUserFid: number;
  conversation: ApiDirectCastConversationInfoV3;
  shouldRefetchOnFocus?: boolean;
  children: React.ReactNode;
};

const onCreateFallback: OnCreateFallback = { messages: [] };

const DirectCastsConversationMessagesProvider: React.FC<
  DirectCastsConversationMessagesProviderProps
> = ({ currentUserFid, conversation, shouldRefetchOnFocus, children }) => {
  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    isFetchingPreviousPage,
    isPending,
    isFetching,
    isRefetching,
    refetch,
    hasNextPage,
    hasPreviousPage,
    error,
    isError,
  } = useSuspenseDirectCastConversationMessages({
    conversationId: conversation.conversationId,
    messageId: undefined,
    limit: DC_INFINITE_PAGE_SIZE,
    onCreateFallback,
  });

  const prefetchConversationMessages =
    usePrefetchDirectCastConversationMessages();

  const prefetchConversationHistoricalMessages =
    usePrefetchDirectCastConversationHistoricalMessages();

  // We are fetching the recent messages in-case user wants to jump to
  // latest. We could also do some prefetching but this works fine for
  // now.
  useDirectCastConversationRecentMessagesWithRefreshOnMount({
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
    limit: HISTORICAL_MESSAGE_FETCH_LIMIT,
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

  const { optimisticPendingDirectCasts } = useDirectCasts();

  const messages = React.useMemo(() => {
    const reactQueryMessages =
      data?.pages.flatMap((d) => d.result.messages) || [];
    if (optimisticPendingDirectCasts.length === 0) {
      return reactQueryMessages;
    }

    // We do an initial pass to determine if any optimistic pending DCs are
    // already in the list
    const messageIdsInReactQuery = new Set<string>(
      reactQueryMessages.map(({ messageId }) => messageId),
    );
    const optimisticPendingDCsNotInListAndInConversation =
      optimisticPendingDirectCasts.filter(
        (optimisticPendingDC) =>
          !messageIdsInReactQuery.has(optimisticPendingDC.messageId) &&
          optimisticPendingDC.conversationId === conversation.conversationId,
      );
    if (optimisticPendingDCsNotInListAndInConversation.length === 0) {
      return reactQueryMessages;
    }

    // Then we merge all optimistic messages based on timestamp
    const allMessages = [
      ...optimisticPendingDCsNotInListAndInConversation,
      ...reactQueryMessages,
    ];
    allMessages.sort((a, b) => b.serverTimestamp - a.serverTimestamp);
    return allMessages;
  }, [conversation.conversationId, data?.pages, optimisticPendingDirectCasts]);

  const [initializedState, setInitializedState] =
    React.useState<boolean>(false);

  const [unreadMarkerMessageIndex, setUnreadMarkerMessageIndex] =
    React.useState<number>(0);
  const [unreadMarkerMessageId, setUnreadMarkerMessageId] = React.useState<
    string | undefined
  >();

  React.useLayoutEffect(() => {
    const earliestMessageByViewer = messages.findIndex(
      (directCast) => directCast.senderFid === currentUserFid,
    );

    const lastReadMessageIndexMatch = messages.findIndex(
      (directCast, index) => {
        const idx = index;
        const previousDirectCast = messages[idx + 1];

        const shouldRenderNewMessageMarker =
          typeof directCast !== 'undefined' &&
          typeof previousDirectCast !== 'undefined' &&
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

  const [isLocalFetching, setIsLocalFetching] = useState(false);

  // Synchronous guard so a rapid onEndReached burst can't slip past the
  // lagging React state guards and double-fire fetchNextPage.
  const isFetchingOlderRef = React.useRef(false);
  const hasNextPageRef = React.useRef(hasNextPage);
  React.useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);
  // Eager prefetch is gated on >=2 user fetches so a user who opens a
  // conversation and immediately bounces doesn't burn an extra round trip.
  const userInitiatedFetchCountRef = React.useRef(0);

  // Ref to the latest runFetchOlder so the recursive prefetch dispatch
  // inside .finally always uses the freshest closure (not the stale one
  // captured when the user fetch started).
  const runFetchOlderRef = React.useRef<(source: 'user' | 'prefetch') => void>(
    () => undefined,
  );

  const runFetchOlder = useCallback(
    (source: 'user' | 'prefetch') => {
      if (isFetchingOlderRef.current || isFetchingNextPage || isLocalFetching) {
        return;
      }

      isFetchingOlderRef.current = true;
      if (source === 'user') {
        userInitiatedFetchCountRef.current += 1;
      }
      setIsLocalFetching(true);
      fetchNextPage().finally(() => {
        isFetchingOlderRef.current = false;
        setIsLocalFetching(false);
        // Chain at depth 1 only (never off a prefetch) so cache stays one
        // page ahead without runaway prefetching.
        if (
          source === 'user' &&
          userInitiatedFetchCountRef.current >= 2 &&
          hasNextPageRef.current
        ) {
          setTimeout(() => runFetchOlderRef.current('prefetch'), 0);
        }
      });
    },
    [fetchNextPage, isFetchingNextPage, isLocalFetching],
  );

  React.useEffect(() => {
    runFetchOlderRef.current = runFetchOlder;
  }, [runFetchOlder]);

  const fetchOlderMessages = useCallback(
    () => runFetchOlder('user'),
    [runFetchOlder],
  );

  const fetchNewerMessages = React.useCallback(() => {
    // Direct casts are coming from the server inverted so its a bit confusing but previous means newer
    // messages in the convo
    if (!isFetchingPreviousPage && !isLocalFetching) {
      setIsLocalFetching(true);
      fetchPreviousPage().finally(() => {
        setIsLocalFetching(false);
      });
    }
  }, [fetchPreviousPage, isFetchingPreviousPage, isLocalFetching]);

  const quotesToPrefetch = React.useMemo(() => {
    return messages.filter(
      ({ inReplyTo }) =>
        typeof inReplyTo !== 'undefined' &&
        messages.findIndex((o) => o.messageId === inReplyTo.messageId) === -1,
    );
  }, [messages]);

  // Defer quote prefetches off the conversation-open critical path. With a
  // 30-message page these can fire 10–30 React Query prefetches in parallel
  // synchronously on the JS thread, which is the dominant contributor to the
  // 2–5s freeze the user sees right after tapping a DC tile to open it.
  // The prefetches are a tap-latency optimization for jumping to a quoted
  // message — fine to run after first paint settles.
  React.useEffect(() => {
    if (quotesToPrefetch.length === 0) {
      return;
    }
    let cancelled = false;
    const handle = InteractionManager.runAfterInteractions(() => {
      if (cancelled) {
        return;
      }
      for (const quoteToPrefetch of quotesToPrefetch) {
        if (typeof quoteToPrefetch.inReplyTo !== 'undefined') {
          prefetchConversationHistoricalMessages({
            conversationId: conversation.conversationId,
            messageId: quoteToPrefetch.inReplyTo.messageId,
            limit: HISTORICAL_MESSAGE_FETCH_LIMIT,
          });
        }
      }
    });
    return () => {
      cancelled = true;
      handle.cancel();
    };
  }, [
    conversation.conversationId,
    prefetchConversationHistoricalMessages,
    quotesToPrefetch,
  ]);

  const conversationState = React.useMemo(() => {
    return {
      isLoading: !initializedState || isFetching || isPending || isRefetching,
      conversationId: conversation.conversationId,
      focusedMessageIndex: unreadMarkerMessageIndex,
      messages: messages,
      shouldRenderUnreadMarkerMessageId: unreadMarkerMessageId,
    } satisfies ConversationState;
  }, [
    conversation.conversationId,
    initializedState,
    isFetching,
    isPending,
    isRefetching,
    messages,
    unreadMarkerMessageId,
    unreadMarkerMessageIndex,
  ]);

  const appState = useAppState();
  const isActive = appState === 'active';

  useFocusEffect(
    React.useCallback(() => {
      if (isActive && shouldRefetchOnFocus !== false) {
        // Cancel everything that may have ran previously.
        refetch({ cancelRefetch: true });
      }
    }, [isActive, refetch, shouldRefetchOnFocus]),
  );

  // Fallback poll while focused; WebSocket delivery can be delayed/missed.
  // Skip ticks while a fetch (initial / next page / refetch) is already in
  // flight so we don't pile refetches on top of an active fetchNextPage and
  // jank the scroll. Interval is lengthened to 30s to halve background cost.
  const isFetchingRef = React.useRef(isFetching);
  React.useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);
  React.useEffect(() => {
    if (!isActive || shouldRefetchOnFocus === false) {
      return;
    }
    const interval = setInterval(() => {
      if (isFetchingRef.current || isFetchingOlderRef.current) {
        return;
      }
      refetch({ cancelRefetch: true });
    }, 30_000);
    return () => clearInterval(interval);
  }, [isActive, refetch, shouldRefetchOnFocus]);

  React.useEffect(() => {
    return () => {
      prefetchConversationMessages({
        conversationId: conversation.conversationId,
        messageId: undefined,
      });
    };
  }, [conversation.conversationId, prefetchConversationMessages]);

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

  const value = React.useMemo(
    () =>
      ({
        conversationState,
        conversationRef: conversation,
        hasOlderMessages: typeof hasNextPage !== 'undefined' && hasNextPage,
        hasNewerMessages:
          typeof hasPreviousPage !== 'undefined' && hasPreviousPage,
        isFetchingOlderMessages: isFetchingNextPage,
        fetchOlderMessages,
        fetchNewerMessages,
        refetchFullConversation,
        load,
        error,
        isError,
      }) satisfies DirectCastsConversationMessagesContextValue,
    [
      conversation,
      conversationState,
      fetchNewerMessages,
      fetchOlderMessages,
      hasNextPage,
      hasPreviousPage,
      isFetchingNextPage,
      load,
      refetchFullConversation,
      error,
      isError,
    ],
  );

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
