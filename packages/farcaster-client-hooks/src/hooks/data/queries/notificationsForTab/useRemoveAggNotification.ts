import {
  InfiniteData,
  QueryClient,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ApiGetNotificationsForTab200Response,
  ApiGetNotificationsInGroup200Response,
  ApiNotificationGroup,
  ApiNotificationType,
  ApiUserAppContext,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildNotificationsInGroupKey } from '../notificationsInGroup';
import { buildUserAppContextKey } from '../userAppContext';
import { buildNotificationsForTabKey } from './buildNotificationsForTabKey';

export function useRemoveAggNotification() {
  const queryClient = useQueryClient();

  return useCallback(
    ({ type, id }: { type: ApiNotificationType; id: string }) => {
      const userAppContextCacheKey = buildUserAppContextKey();

      const userAppContext = queryClient.getQueryData(
        userAppContextCacheKey,
      ) as ApiUserAppContext | undefined;

      if (!userAppContext || !userAppContext.notificationTabsV2) return;

      const notificationTabs = userAppContext.notificationTabsV2.map(
        (tab) => tab.id,
      );

      for (const tab of notificationTabs) {
        const tabCacheKey = buildNotificationsForTabKey({ tab });

        const notificationsData:
          | InfiniteData<ApiGetNotificationsForTab200Response>
          | undefined = queryClient.getQueryData(tabCacheKey);

        if (!notificationsData) continue;

        const newPages = notificationsData.pages.slice();
        let pageMutated = false;

        notificationsData.pages.forEach((page, pageIndex) => {
          const mutatedNotifs = removeNotificationFromPage(
            type,
            id,
            queryClient,
            page,
          );

          if (mutatedNotifs) {
            // Mutate full page in order to trigger a re-render
            newPages[pageIndex] = {
              ...page,
              result: { ...page.result, notifications: mutatedNotifs },
            };
            pageMutated = true;
          }
        });

        if (pageMutated) {
          const newData: InfiniteData<ApiGetNotificationsForTab200Response> = {
            ...notificationsData,
            pages: newPages,
          };

          queryClient.setQueryData(tabCacheKey, newData);
        }
      }
    },
    [queryClient],
  );
}

function removeNotificationFromPage(
  type: ApiNotificationType,
  id: string,
  queryClient: QueryClient,
  page: ApiGetNotificationsForTab200Response,
): ApiNotificationGroup[] | undefined {
  const notifs = page.result.notifications;
  const mutatedNotifs = notifs.slice();
  let mutated = false;

  for (let i = notifs.length - 1; i >= 0; i--) {
    const notif = notifs[i];

    if (notif.type === type) {
      const index = notif.previewItems.findIndex(
        (previewItem) => previewItem.id === id,
      );

      if (index === -1) continue;

      mutated = true;

      if (notif.previewItems.length <= 1 && notif.totalItemCount <= 1) {
        // Only 1 item in group -> remove full group
        mutatedNotifs.splice(i, 1);
      } else {
        // Remove preview item and reduce total count
        const mutatedNotif = { ...notif };
        mutatedNotif.previewItems = notif.previewItems.slice();
        mutatedNotif.previewItems.splice(index, 1);
        mutatedNotif.totalItemCount -= 1;
        mutatedNotifs[i] = mutatedNotif;
      }

      // Remove from cache of NotificationsInGroupScreen is open
      removeNotificationFromNotificationInGroup(
        queryClient,
        type,
        id,
        notif.id,
      );
    }
  }

  if (mutated) {
    return mutatedNotifs;
  }
}

function removeNotificationFromNotificationInGroup(
  queryClient: QueryClient,
  type: ApiNotificationType,
  id: string,
  groupId: string,
) {
  const notificationsInGroupCacheKey = buildNotificationsInGroupKey({
    type,
    groupId,
  });
  const notificationsInGroupData = queryClient.getQueryData(
    notificationsInGroupCacheKey,
  ) as InfiniteData<ApiGetNotificationsInGroup200Response> | undefined;

  if (notificationsInGroupData) {
    const newPages = notificationsInGroupData.pages.slice();
    let pageMutated = false;

    notificationsInGroupData.pages.forEach((page, pageIndex) => {
      const notifs = page.result.notifications;
      const mutatedNotifs = notifs.slice();
      let mutated = false;

      for (let i = notifs.length - 1; i >= 0; i--) {
        const notif = notifs[i];

        if (notif.id === id) {
          // Remove the notification
          mutatedNotifs.splice(i, 1);
          mutated = true;
        }
      }

      if (mutated) {
        // Mutate full page in order to trigger a re-render
        newPages[pageIndex] = {
          ...page,
          result: { ...page.result, notifications: mutatedNotifs },
        };
        pageMutated = true;
      }
    });

    if (pageMutated) {
      const newData: InfiniteData<ApiGetNotificationsInGroup200Response> = {
        ...notificationsInGroupData,
        pages: newPages,
      };

      queryClient.setQueryData(notificationsInGroupCacheKey, newData);
    }
  }
}
