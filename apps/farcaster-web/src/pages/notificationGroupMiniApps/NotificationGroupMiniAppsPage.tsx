import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNotificationMiniApp } from 'farcaster-client-data';
import {
  formatTimeAgo,
  useNotificationsInGroup,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { FrameIconImage } from '~/components/images/FrameIconImage';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

const NotificationGroupMiniAppsPage = memo(() => {
  const { groupId } = useSearchParams('notificationGroupMiniApps');

  const { data, onEndReached, isFetchingNextPage } = useNotificationsInGroup({
    groupId: groupId!,
    type: 'mini-app',
  });

  const notifications = useMemo(
    () =>
      data?.pages
        .flatMap((page) => page.result.notifications)
        // Make sure we got what we expected and appease the type system
        .filter(
          (notif): notif is ApiNotificationMiniApp => notif.type === 'mini-app',
        ),
    [data?.pages],
  );

  const firstNotif = useMemo(() => notifications?.[0], [notifications]);

  if (!firstNotif) {
    return null;
  }

  return (
    <Page
      meta={{
        title: `Farcaster / Notifications from ${firstNotif.content.miniapp.name}`,
      }}
    >
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>
            <BackButton />
            Notifications from {firstNotif.content.miniapp.name}
          </PageTitle>
        </PageHeader>
        <DebugLogger
          name="Notification Mini App Generic"
          data={notifications}
          position="top-left"
        />
        <FlatList
          data={notifications}
          emptyView={
            <DefaultEmptyListView message="Could not find any notifications" />
          }
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
        />
      </BorderedMainContent>
    </Page>
  );
});
NotificationGroupMiniAppsPage.displayName = 'NotificationGroupMiniAppsPage';

const renderItem = ({ item }: { item: ApiNotificationMiniApp }) => (
  <ListMiniAppNotification notif={item} />
);

interface ListMiniAppNotificationProps {
  notif: ApiNotificationMiniApp;
}

const ListMiniAppNotification: FC<ListMiniAppNotificationProps> = memo(
  ({ notif }) => {
    const { trackEvent } = useTrackEvent();
    const { launchMiniApp } = useMinimizableWindowContext();

    return (
      <div
        className="flex cursor-pointer flex-row gap-3 border-b p-3 border-default hover:bg-overlay-faint"
        onClick={() => {
          trackEvent(AnalyticsEvent.ClickNotification, {
            type: notif.type,
            domain: notif.content.miniapp.domain,
            name: notif.content.miniapp.name,
          });

          launchMiniApp({
            context: {
              type: 'notification',
              notification: {
                notificationId: notif.content.notificationId,
                title: notif.content.title,
                body: notif.content.body,
              },
            },
            launchConfig: {
              type: 'standalone',
              name: notif.content.miniapp.name,
              url: notif.content.targetUrl,
              splashImageUrl: notif.content.miniapp.splashImageUrl,
              splashBackgroundColor:
                notif.content.miniapp.splashBackgroundColor,
              author: notif.content.miniapp.author,
            },
          });
        }}
      >
        <FrameIconImage imageUrl={notif.content.miniapp.iconUrl} size={44} />
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex w-full flex-row items-start justify-between">
            <div className="text-base font-semibold text-default">
              {notif.content.title}
            </div>
            <div className="text-faint">
              {formatTimeAgo(notif.timestamp, 'floor')}
            </div>
          </div>
          <div className="line-clamp-4 text-muted">{notif.content.body}</div>
        </div>
      </div>
    );
  },
);
ListMiniAppNotification.displayName = 'ListMiniAppNotification';

export { NotificationGroupMiniAppsPage };
