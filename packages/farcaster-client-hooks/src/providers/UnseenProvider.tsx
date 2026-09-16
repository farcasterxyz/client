import {
  ApiChannelFeedUnseenStatus,
  ApiNotificationTabUnseenStatus,
} from 'farcaster-client-data';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useRecordExploreFeedSeen } from '../hooks';
import { useMarkAllNotificationsRead } from '../hooks/data/mutations/useMarkAllNotificationsRead';
import { useMarkAllWarpTransactionsRead } from '../hooks/data/mutations/useMarkAllWarpTransactionsRead';
import { useMarkNotificationTabSeen } from '../hooks/data/mutations/useMarkNotificationTabSeen';
import { useInvalidateDirectCastInboxByAccount } from '../hooks/data/queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useFetchUnseen } from '../hooks/data/queries/unseen/useFetchUnseen';
import { useWebSockets } from './WebSocketsProvider';

type NotificationsCountUpdate = {
  notificationsCount: number;
};

type BadgeCountUpdate = {
  notificationsCount: number;
  inboxCount: number;
};

type NotificationsCountListener = (update: NotificationsCountUpdate) => void;

type OnNotificationsCountCallbackReferences = {
  [referenceId: string]: NotificationsCountListener;
};

type BadgeCountListener = (update: BadgeCountUpdate) => void;

type OnBadgeCountChangeCallbackReferences = {
  [referenceId: string]: BadgeCountListener;
};

type UnseenContextValue = {
  notificationsCount: number;
  resetNotificationsCount: () => void;
  unseenNotificationTabs: string[];
  resetNotificationTabUnseenStatus: (tab: string) => void;
  inboxCount: number;
  decreaseInboxCount: () => void;
  incrementInboxCount: () => void;
  articlesCount: number;
  recordAllArticlesSeen: () => void;
  channelFeedsUnseenStatus: Record<string, { hasNewItems: boolean }>;
  resetFeedUnseenStatus: (feedKey: string) => void;
  refreshGlobalCountsStatus: () => void;
  warpTransactionCount: number;
  resetWarpTransactionCount: () => void;
  registerBadgeCountListener: ({
    cbReferenceId,
    listener,
  }: {
    cbReferenceId: string;
    listener: BadgeCountListener;
  }) => void;
  registerNotificationsCountListener: ({
    cbReferenceId,
    listener,
  }: {
    cbReferenceId: string;
    listener: NotificationsCountListener;
  }) => void;
};

type ChannelFeedsStatus = Record<
  string,
  Omit<ApiChannelFeedUnseenStatus, 'channelKey'>
>;

const UnseenContext = createContext<UnseenContextValue>({} as never);

type UnseenProviderProps = {
  fid: number;
  onNullUnseenResponse: () => void;
  children: ReactNode;
};

const UnseenProvider: FC<UnseenProviderProps> = memo(
  ({ fid, children, onNullUnseenResponse }) => {
    const hasStartedPollingRef = useRef(false);
    const [notificationsCount, baseSetNotificationsCount] = useState(0);
    const [inboxCount, baseSetInboxCount] = useState(0);
    const [articlesCount, baseSetArticlesCount] = useState(0);
    const [channelFeedsUnseenStatus, setChannelFeedsUnseenStatus] =
      useState<ChannelFeedsStatus>({});
    // We expect these to be very few, so faster to iterate a list then do a set/object lookup
    const [unseenNotificationTabs, setUnseenNotificationTabs] = useState<
      string[]
    >([]);
    const [warpTransactionCount, setWarpTransactionCount] = useState(0);
    const warpTransactionCountRef = useRef(0);

    const fetchUnseen = useFetchUnseen();
    const { registerOnMessageCallback } = useWebSockets();

    const markApiNotificationsRead = useMarkAllNotificationsRead();
    const markNotificationTabSeen = useMarkNotificationTabSeen();
    const markAllWarpTransactionsRead = useMarkAllWarpTransactionsRead();
    const recordExploreFeedSeen = useRecordExploreFeedSeen();

    const badgeCountListenersRef =
      React.useRef<OnBadgeCountChangeCallbackReferences>(
        {} as OnBadgeCountChangeCallbackReferences,
      ).current;

    const notificationsCountListenersRef =
      React.useRef<OnNotificationsCountCallbackReferences>(
        {} as OnNotificationsCountCallbackReferences,
      ).current;

    const registerBadgeCountListener = useCallback(
      ({
        cbReferenceId,
        listener,
      }: {
        cbReferenceId: string;
        listener: BadgeCountListener;
      }) => {
        badgeCountListenersRef[cbReferenceId] = listener;

        return () => {
          delete badgeCountListenersRef[cbReferenceId];
        };
      },
      [badgeCountListenersRef],
    );

    const registerNotificationsCountListener = useCallback(
      ({
        cbReferenceId,
        listener,
      }: {
        cbReferenceId: string;
        listener: NotificationsCountListener;
      }) => {
        notificationsCountListenersRef[cbReferenceId] = listener;

        return () => {
          delete notificationsCountListenersRef[cbReferenceId];
        };
      },
      [notificationsCountListenersRef],
    );

    const notificationsCountRef = useRef(0);
    const inboxCountRef = useRef(0);

    const setNotificationsCount = useCallback(
      (notifCount: number) => {
        if (notifCount === notificationsCountRef.current) return;
        notificationsCountRef.current = notifCount;
        baseSetNotificationsCount(notifCount);

        const badgeListeners = Object.values(badgeCountListenersRef);

        for (const listener of badgeListeners) {
          listener({
            notificationsCount: notifCount,
            inboxCount: inboxCountRef.current,
          });
        }

        const notificationsCountListeners = Object.values(
          notificationsCountListenersRef,
        );

        for (const listener of notificationsCountListeners) {
          listener({
            notificationsCount: notifCount,
          });
        }
      },
      [badgeCountListenersRef, notificationsCountListenersRef],
    );

    const setInboxCount = useCallback(
      (newInboxCount: number) => {
        if (newInboxCount === inboxCountRef.current) return;
        inboxCountRef.current = newInboxCount;
        baseSetInboxCount(newInboxCount);

        const badgeListeners = Object.values(badgeCountListenersRef);

        for (const listener of badgeListeners) {
          listener({
            notificationsCount: notificationsCountRef.current,
            inboxCount: newInboxCount,
          });
        }
      },
      [badgeCountListenersRef],
    );

    const articlesCountRef = useRef(0);

    const setArticlesCount = useCallback((newArticlesCount: number) => {
      if (newArticlesCount === articlesCountRef.current) return;
      articlesCountRef.current = newArticlesCount;
      baseSetArticlesCount(newArticlesCount);
    }, []);

    const invalidateDirectCastInboxByAccount =
      useInvalidateDirectCastInboxByAccount();

    const refreshUnseenStatus = useCallback(async () => {
      hasStartedPollingRef.current = true;

      const data = await fetchUnseen();
      if (data === null) {
        onNullUnseenResponse();
        // eslint-disable-next-line no-console
        console.warn('data was null: UnseenProvider:fetchUnseen');
      }
      const { result } = data;

      setNotificationsCount(result.notificationsCount);
      setUnseenNotificationTabs((currentValue) =>
        mergeUnseenNotificationTabUpdates(
          currentValue,
          result.notificationTabs,
        ),
      );
      setInboxCount(result.inboxCount);
      setArticlesCount(result.articlesCount);
      setChannelFeedsUnseenStatus((currentValue) =>
        mergeChannelFeedsUnseenStatusUpdates(currentValue, result.channelFeeds),
      );
      if (result.warpTransactionCount !== warpTransactionCountRef.current) {
        warpTransactionCountRef.current = result.warpTransactionCount;
        setWarpTransactionCount(result.warpTransactionCount);
      }
    }, [
      fetchUnseen,
      onNullUnseenResponse,
      setArticlesCount,
      setInboxCount,
      setNotificationsCount,
    ]);

    const refreshGlobalCountsStatus = useCallback(async () => {
      hasStartedPollingRef.current = true;

      const data = await fetchUnseen();
      if (data === null) {
        onNullUnseenResponse();
        // eslint-disable-next-line no-console
        console.warn('data was null: UnseenProvider:fetchUnseen');
      }
      const { result } = data;

      setNotificationsCount(result.notificationsCount);

      setInboxCount(result.inboxCount);
    }, [
      fetchUnseen,
      onNullUnseenResponse,
      setInboxCount,
      setNotificationsCount,
    ]);

    useEffect(() => {
      // Initial poll (this should fire only once if refreshUnseenStatus is correctly set): delay it a bit
      // so that the backend settles after our requests, as we are subject to race conditions, e.g.
      // getting home feed status as unseen while fetching it concurrently
      const timeoutId = setTimeout(refreshUnseenStatus, 2000);

      return () => {
        clearTimeout(timeoutId);
      };
    }, [refreshUnseenStatus]);

    // Feed unseen status changes are not proactively pushed by the backend via websockets (unlike notifications
    // & DCs) because the calculations are very expensive. We have to keep checking on a regular schedule
    // that's not related to the websocket otherwise we'll miss updates. A previous version set a timer
    // for 30 seconds after the last websocket message but that had 2 failure modes:
    // - 30 seconds pass and we call /unseen. Unseen statuses for important feeds are cached, so we
    //   hit the cache and don't issue a websocket update. A new poll is never scheduled until the next
    //   DC/notification triggers a websocket message which could be in a very long time.
    // - there is a new DC/notification every <30 seconds so the poll gets rescheduled over and over and we
    //   never get to check for channel status updates
    useEffect(() => {
      const interval = setInterval(refreshUnseenStatus, 30000);

      return () => {
        clearInterval(interval);
      };
    }, [refreshUnseenStatus]);

    useEffect(() => {
      registerOnMessageCallback({
        messageType: 'unseen',
        cbReferenceId: 'UnseenProvider',
        cb: ({ message }) => {
          if (message.messageType !== 'unseen') {
            return;
          }

          try {
            const data = JSON.parse(message.data);
            if (!data) {
              return;
            }

            if (data.unreadNotificationsCount !== undefined) {
              setNotificationsCount(data.unreadNotificationsCount);
            }

            if (data.inboxCount !== undefined) {
              const prevInboxCount = inboxCountRef.current;
              setInboxCount(data.inboxCount);
              if (prevInboxCount !== data.inboxCount) {
                invalidateDirectCastInboxByAccount({
                  fid,
                  category: 'default',
                });
              }
            }

            if (data.channelFeedsUnseenStatus !== undefined) {
              setChannelFeedsUnseenStatus((prev) =>
                mergeChannelFeedsUnseenStatusUpdates(
                  prev,
                  data.channelFeedsUnseenStatus as ApiChannelFeedUnseenStatus[],
                ),
              );
            }

            if (data.warpTransactionCount !== undefined) {
              warpTransactionCountRef.current = data.warpTransactionCount;
              setWarpTransactionCount(data.warpTransactionCount);
            }
          } catch {
            refreshUnseenStatus();
          }
        },
      });

      registerOnMessageCallback({
        messageType: 'notification-tab-unseen',
        cbReferenceId: 'NotificationTabUnseenProvider',
        cb: ({ message }) => {
          if (message.messageType !== 'notification-tab-unseen') {
            return;
          }

          try {
            setUnseenNotificationTabs((currentValue) => {
              const tab = message.payload.tab;
              const currentUnseen = currentValue.includes(tab);
              const newUnseen = message.payload.unseenNotificationsCount > 0;

              if (newUnseen && !currentUnseen) {
                return [...currentValue, tab];
              }

              if (!newUnseen && currentUnseen) {
                return currentValue.filter((t) => t !== tab);
              }

              return currentValue;
            });
          } catch {
            refreshUnseenStatus();
          }
        },
      });
    }, [
      fid,
      invalidateDirectCastInboxByAccount,
      refreshUnseenStatus,
      registerOnMessageCallback,
      setInboxCount,
      setNotificationsCount,
    ]);

    const resetNotificationsCount = useCallback(() => {
      setNotificationsCount(0);
      markApiNotificationsRead();
    }, [markApiNotificationsRead, setNotificationsCount]);

    const resetNotificationTabUnseenStatus = useCallback(
      (tab: string) => {
        setUnseenNotificationTabs((currentUnseen) => {
          if (currentUnseen.includes(tab)) {
            return currentUnseen.filter((t) => t !== tab);
          } else {
            return currentUnseen;
          }
        });
        markNotificationTabSeen({ tab });
      },
      [markNotificationTabSeen],
    );

    const decreaseInboxCount = useCallback(() => {
      const newCount = Math.max(inboxCountRef.current - 1, 0);
      setInboxCount(newCount);
    }, [setInboxCount]);

    const incrementInboxCount = useCallback(() => {
      const newCount = inboxCountRef.current + 1;
      setInboxCount(newCount);
    }, [setInboxCount]);

    const resetFeedUnseenStatus = useCallback((feedKey: string) => {
      setChannelFeedsUnseenStatus((currentStatus) => {
        // Only mutate object if we are switching from true to false to
        // prevent unnecessary effects
        if (
          currentStatus &&
          currentStatus[feedKey] &&
          currentStatus[feedKey].hasNewItems === true
        ) {
          const newStatus = { ...currentStatus };
          newStatus[feedKey].hasNewItems = false;
          return newStatus;
        }
        return currentStatus;
      });
    }, []);

    const resetWarpTransactionCount = useCallback(() => {
      warpTransactionCountRef.current = 0;
      setWarpTransactionCount(0);
      markAllWarpTransactionsRead();
    }, [markAllWarpTransactionsRead]);

    const recordAllArticlesSeen = useCallback(() => {
      setArticlesCount(0);
      recordExploreFeedSeen();
    }, [recordExploreFeedSeen, setArticlesCount]);

    const value = useMemo(
      () => ({
        notificationsCount,
        resetNotificationsCount,
        unseenNotificationTabs,
        resetNotificationTabUnseenStatus,
        inboxCount,
        decreaseInboxCount,
        incrementInboxCount,
        channelFeedsUnseenStatus,
        resetFeedUnseenStatus,
        warpTransactionCount,
        resetWarpTransactionCount,
        registerBadgeCountListener,
        registerNotificationsCountListener,
        refreshGlobalCountsStatus,
        articlesCount,
        recordAllArticlesSeen,
      }),
      [
        articlesCount,
        channelFeedsUnseenStatus,
        decreaseInboxCount,
        inboxCount,
        incrementInboxCount,
        notificationsCount,
        recordAllArticlesSeen,
        refreshGlobalCountsStatus,
        registerBadgeCountListener,
        registerNotificationsCountListener,
        resetFeedUnseenStatus,
        resetNotificationTabUnseenStatus,
        resetNotificationsCount,
        resetWarpTransactionCount,
        unseenNotificationTabs,
        warpTransactionCount,
      ],
    );

    return (
      <UnseenContext.Provider value={value}>{children}</UnseenContext.Provider>
    );
  },
);
UnseenProvider.displayName = 'UnseenProvider';

// Return a new array only if there are updates
function mergeUnseenNotificationTabUpdates(
  currentUnseenTabs: string[],
  updates: ApiNotificationTabUnseenStatus[],
): string[] {
  // Flatten to an array of tabs
  const newUnseenTabs = updates.reduce((acc, { tab, unseenCount }) => {
    if (unseenCount > 0) {
      acc.push(tab);
    }
    return acc;
  }, [] as string[]);

  // Should be very few tabs so a pairwise comparison will not be expensive
  if (
    currentUnseenTabs.length !== newUnseenTabs.length ||
    newUnseenTabs.some((tab) => !currentUnseenTabs.includes(tab))
  ) {
    return newUnseenTabs;
  }

  return currentUnseenTabs;
}

// Merge the updates, generating new variable if there are changes, or returning the original one if not so that
// React doesn't trigger effects
function mergeChannelFeedsUnseenStatusUpdates(
  currentValue: ChannelFeedsStatus,
  updates: ApiChannelFeedUnseenStatus[],
): ChannelFeedsStatus {
  const newValue = { ...currentValue };
  let updated = false;
  updates.forEach((updatedStatus) => {
    const currentStatus = currentValue[updatedStatus.channelKey];
    if (
      currentStatus === undefined ||
      currentStatus.hasNewItems !== updatedStatus.hasNewItems
    ) {
      updated = true;
      newValue[updatedStatus.channelKey] = updatedStatus;
    }
  });
  return updated ? newValue : currentValue;
}

const useUnseen = () => useContext(UnseenContext);

export { UnseenProvider, useUnseen };
