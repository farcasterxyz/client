import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationMessageTTLDays,
  ApiDirectCastInboxConversationInfoV3,
} from 'farcaster-client-data';
import {
  useDirectCastInboxByAccount,
  useInvalidateDirectCastInboxByAccount,
  useOptimisticallyAddNewDirectCastMessage,
  useOptimisticallyApplyConversationMessageTTL,
  useUnseen,
  useWebSockets,
} from 'farcaster-client-hooks';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

// Changing this to be every 5 minutes
const defaultRefreshUpdatesInterval = 300 * 1000;

export type PossiblyOptimisticDirectCast =
  ApiDirectCastInboxConversationInfoV3 & {
    optimistic?: boolean;
  };

type DirectCastsContextValue = {
  isInitializing: boolean;
  conversations: {
    [conversationId: string]: PossiblyOptimisticDirectCast | undefined;
  };
  onEndReached: () => void;
  isLoading: boolean;
  filter: ApiDirectCastConversationFilter | undefined;
  setFilter: (filter: ApiDirectCastConversationFilter | undefined) => void;
  hasArchived: boolean;
  requestsCount: number;
  voidCount: number;
  hasUnreadRequests: boolean;
  isEmpty: boolean;
};

const DirectCastsContext = createContext<DirectCastsContextValue>({
  isInitializing: true,
  conversations: {},
  onEndReached: () => undefined,
  isLoading: true,
  setFilter: () => undefined,
  filter: undefined,
  hasArchived: true,
  requestsCount: 0,
  voidCount: 0,
  isEmpty: true,
  hasUnreadRequests: false,
});

type DirectCastsProviderProps = {
  children: ReactNode;
};

const DirectCastsProvider: FC<DirectCastsProviderProps> = memo(
  ({ children }) => {
    const currentUser = useCurrentUser();

    const { inboxCount } = useUnseen();

    const [isInitializing, setIsInitializing] = useState<boolean>(true);

    const [optimisticConversations, setOptimisticConversations] = useState<
      PossiblyOptimisticDirectCast[]
    >([]);

    const optimisticallyApplyConversationMessageTTL =
      useOptimisticallyApplyConversationMessageTTL();

    const [filter, setFilter] = useState<
      ApiDirectCastConversationFilter | undefined
    >(undefined);

    const { data, onEndReached, refetch, isPending } =
      useDirectCastInboxByAccount({
        fid: currentUser.fid,
        category: 'default',
        filter,
      });

    const hasArchived = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.hasArchived;
      }

      return false;
    }, [data?.pages]);

    const requestsCount = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.requestsCount;
      }

      return 0;
    }, [data?.pages]);

    const voidCount = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.voidCount;
      }

      return 0;
    }, [data?.pages]);

    const hasUnreadRequests = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.hasUnreadRequests;
      }

      return false;
    }, [data?.pages]);

    const outdatedOptimistic = useMemo(() => {
      if (!optimisticConversations.length || !data?.pages.length) {
        return [];
      }

      return data.pages
        .flatMap((p) => p.result.conversations)
        .filter((c) =>
          optimisticConversations.find(
            (o) =>
              o.conversationId === c.conversationId &&
              ((o.lastMessage?.serverTimestamp || 0) <
                (c.lastMessage?.serverTimestamp || 0) ||
                (o.lastMessage?.messageId || '') ===
                  (c.lastMessage?.messageId || '')),
          ),
        );
    }, [data?.pages, optimisticConversations]);

    useEffect(() => {
      if (outdatedOptimistic.length > 0) {
        setOptimisticConversations((prev) =>
          prev.filter(
            (o) =>
              !outdatedOptimistic.find(
                (outdated) => outdated.conversationId === o.conversationId,
              ),
          ),
        );
      }
    }, [outdatedOptimistic]);

    const invalidateDirectCastInboxByAccount =
      useInvalidateDirectCastInboxByAccount();
    const optimisticallyAddNewDirectCastMessage =
      useOptimisticallyAddNewDirectCastMessage();

    const registeredWebSocketCallbacks = React.useRef<boolean>(false);

    const { registerOnMessageCallback } = useWebSockets();

    useEffect(() => {
      if (registeredWebSocketCallbacks.current) {
        return;
      }

      registerOnMessageCallback({
        messageType: 'refresh-direct-cast-conversation',
        cbReferenceId: 'DirectCastsProvider',
        cb: ({ message }) => {
          if (message.messageType !== 'refresh-direct-cast-conversation') {
            return;
          }

          invalidateDirectCastInboxByAccount({
            fid: currentUser.fid,
            category: 'default',
          });

          invalidateDirectCastInboxByAccount({
            fid: currentUser.fid,
            category: 'default',
            filter: 'unread',
          });

          invalidateDirectCastInboxByAccount({
            fid: currentUser.fid,
            category: 'archived',
          });

          optimisticallyAddNewDirectCastMessage({
            message: message.payload.message,
          });

          if (message.payload.message.type === 'message_ttl_change') {
            const messageTTLNumber = Number(message.payload.message.message);
            if (!isNaN(messageTTLNumber) && messageTTLNumber > 0) {
              optimisticallyApplyConversationMessageTTL({
                conversationId: message.payload.message.conversationId,
                messageTTL:
                  messageTTLNumber === Infinity
                    ? 'Infinity'
                    : (messageTTLNumber as ApiDirectCastConversationMessageTTLDays),
              });
            }
          }
        },
      });

      registerOnMessageCallback({
        messageType: 'refresh-self-direct-casts-inbox',
        cbReferenceId: 'DirectCastsProvider',
        cb: ({ message }) => {
          if (message.messageType !== 'refresh-self-direct-casts-inbox') {
            return;
          }

          refetch({ cancelRefetch: false });
        },
      });

      registeredWebSocketCallbacks.current = true;
    }, [
      currentUser.fid,
      invalidateDirectCastInboxByAccount,
      optimisticallyAddNewDirectCastMessage,
      refetch,
      registerOnMessageCallback,
      optimisticallyApplyConversationMessageTTL,
    ]);

    const combinedConversations = useMemo(() => {
      const result: { [key: string]: PossiblyOptimisticDirectCast } = {};

      // Add optimistic conversations
      for (const conv of optimisticConversations) {
        result[conv.conversationId] = conv;
      }

      // Add non-optimistic conversations from data
      if (data?.pages) {
        for (const page of data.pages) {
          for (const conv of page.result.conversations) {
            if (!result[conv.conversationId]) {
              result[conv.conversationId] = conv;
            }
          }
        }
      }

      return result;
    }, [data?.pages, optimisticConversations]);

    useEffect(() => {
      if (isInitializing) {
        setIsInitializing(
          Object.keys(combinedConversations).length === 0 && isPending,
        );
      }
    }, [combinedConversations, isInitializing, isPending]);

    useEffect(() => {
      let hasEffectCleanedUp = false;

      let timeout: ReturnType<typeof setTimeout>;

      const refresh = async () => {
        await refetch({
          cancelRefetch: false,
        });

        optimisticallyApplyConversationMessageTTL();

        if (!hasEffectCleanedUp) {
          timeout = setTimeout(refresh, defaultRefreshUpdatesInterval);
        }
      };

      timeout = setTimeout(refresh, defaultRefreshUpdatesInterval);

      return () => {
        hasEffectCleanedUp = true;
        clearTimeout(timeout);
      };
    }, [
      data?.pages,
      inboxCount,
      refetch,
      optimisticallyApplyConversationMessageTTL,
    ]);

    return (
      <DirectCastsContext.Provider
        value={{
          conversations: combinedConversations,
          isInitializing,
          onEndReached,
          isLoading: isPending,
          hasArchived,
          requestsCount,
          voidCount,
          hasUnreadRequests,
          filter,
          setFilter,
          isEmpty: Object.keys(combinedConversations).length === 0,
        }}
      >
        {children}
      </DirectCastsContext.Provider>
    );
  },
);

DirectCastsProvider.displayName = 'DirectCastsProvider';

const useDirectCasts = () => useContext(DirectCastsContext);

export { DirectCastsProvider, useDirectCasts };
