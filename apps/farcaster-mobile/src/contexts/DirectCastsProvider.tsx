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

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import {
  useCurrentUser,
  useCurrentUser_UNSAFE,
} from '~/hooks/data/useCurrentUser';
import {
  usePendingDirectCasts,
  UsePendingDirectCastsReturn,
} from '~/hooks/usePendingDirectCasts';

type DirectCastsContextValue = UsePendingDirectCastsReturn & {
  currentUserFid: number;
  conversations: ApiDirectCastInboxConversationInfoV3[];
  conversationsById: {
    [key: string]: ApiDirectCastInboxConversationInfoV3 | undefined;
  };
  isPending: boolean;
  requestsCount: number;
  voidCount: number;
  hasUnreadRequests: boolean;
  refetch: () => void;
  setFilter: (filter: ApiDirectCastConversationFilter | undefined) => void;
  filter: ApiDirectCastConversationFilter | undefined;
  onEndReached: () => void;
};

const DirectCastsContext = createContext<DirectCastsContextValue>({} as never);

const defaultPollInterval = 300 * 1000;

type DirectCastsProviderProps = {
  children: ReactNode;
};

const DirectCastsProvider: FC<DirectCastsProviderProps> = memo(
  ({ children }) => {
    const currentUser = useCurrentUser();

    if (typeof currentUser === 'undefined') {
      return (
        <FullScreenLoadingIndicator debugName="DirectCastsProvider#CurrentUser" />
      );
    }

    return <DirectCastsProviderInner>{children}</DirectCastsProviderInner>;
  },
);

const DirectCastsProviderInner: FC<DirectCastsProviderProps> = memo(
  ({ children }) => {
    const currentUser = useCurrentUser_UNSAFE();
    const invalidateDirectCastInboxByAccount =
      useInvalidateDirectCastInboxByAccount();
    const optimisticallyAddNewDirectCastMessage =
      useOptimisticallyAddNewDirectCastMessage();
    const optimisticallyApplyConversationMessageTTL =
      useOptimisticallyApplyConversationMessageTTL();

    const [filter, setFilter] = useState<
      ApiDirectCastConversationFilter | undefined
    >(undefined);

    const { data, refetch, isPending, onEndReached } =
      useDirectCastInboxByAccount({
        fid: currentUser.fid,
        category: 'default',
        filter,
        refetchOnMount: true,
        retry: 2,
      });

    const conversations = useMemo(() => {
      return data?.pages.flatMap((p) => p.result.conversations) ?? [];
    }, [data]);

    const requestsCount = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.requestsCount;
      }

      return 0;
    }, [data]);

    const voidCount = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.voidCount;
      }

      return 0;
    }, [data]);

    const hasUnreadRequests = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.hasUnreadRequests;
      }

      return false;
    }, [data]);

    // reducing these to objects / hash maps for faster lookups
    const conversationsById = useMemo(
      () =>
        conversations.reduce(
          (acc, c) => {
            acc[c.conversationId] = c;
            return acc;
          },
          {} as {
            [key: string]: ApiDirectCastInboxConversationInfoV3 | undefined;
          },
        ),
      [conversations],
    );

    const { registerOnMessageCallback, unregisterOnMessageCallback } =
      useWebSockets();

    useEffect(() => {
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

          refetch({
            cancelRefetch: false,
          });
        },
      });

      return () => {
        unregisterOnMessageCallback({
          messageType: 'refresh-direct-cast-conversation',
          cbReferenceId: 'DirectCastsProvider',
        });
        unregisterOnMessageCallback({
          messageType: 'refresh-self-direct-casts-inbox',
          cbReferenceId: 'DirectCastsProvider',
        });
      };
    }, [
      currentUser.fid,
      invalidateDirectCastInboxByAccount,
      optimisticallyAddNewDirectCastMessage,
      refetch,
      registerOnMessageCallback,
      unregisterOnMessageCallback,
      optimisticallyApplyConversationMessageTTL,
    ]);

    // Polling for new messages
    useEffect(() => {
      let hasUnmounted = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const update = async () => {
        if (hasUnmounted) {
          return;
        }

        await refetch({
          cancelRefetch: false,
        });

        optimisticallyApplyConversationMessageTTL();

        timeout = setTimeout(update, defaultPollInterval);
      };

      timeout = setTimeout(update, defaultPollInterval);

      return () => {
        hasUnmounted = true;
        clearTimeout(timeout);
      };
    }, [currentUser.fid, refetch, optimisticallyApplyConversationMessageTTL]);

    const { sendDirectCast, optimisticPendingDirectCasts } =
      usePendingDirectCasts();

    return React.useMemo(
      () => (
        <DirectCastsContext.Provider
          value={{
            currentUserFid: currentUser.fid,
            conversations,
            conversationsById,
            isPending,
            requestsCount,
            voidCount,
            hasUnreadRequests,
            filter,
            refetch,
            setFilter,
            sendDirectCast,
            optimisticPendingDirectCasts,
            onEndReached,
          }}
        >
          {children}
        </DirectCastsContext.Provider>
      ),
      [
        currentUser.fid,
        conversations,
        conversationsById,
        isPending,
        requestsCount,
        voidCount,
        hasUnreadRequests,
        filter,
        refetch,
        setFilter,
        sendDirectCast,
        optimisticPendingDirectCasts,
        children,
        onEndReached,
      ],
    );
  },
);

DirectCastsProvider.displayName = 'DirectCastsProvider';

const useDirectCasts = () => useContext(DirectCastsContext);

export { DirectCastsProvider, useDirectCasts };
