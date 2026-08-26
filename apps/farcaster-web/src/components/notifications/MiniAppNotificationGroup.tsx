import {
  ApiMiniAppNotificationGroup,
  ApiNotificationMiniApp,
} from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { FrameIconImage } from '~/components/images/FrameIconImage';
import { NotificationGraphic } from '~/components/notifications/shared/NotificationGraphic';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useNavigateToNotificationGroupMiniApps } from '~/hooks/navigation/useNavigateToNotificationGroupMiniApps';

type MiniAppNotificationGroupProps = {
  group: ApiMiniAppNotificationGroup;
};

const MiniAppNotificationGroup: FC<MiniAppNotificationGroupProps> = memo(
  ({ group }) => {
    if (group.previewItems.length === 1) {
      return (
        <SingleMiniAppNotification
          notif={group.previewItems[0]}
          isUnread={group.isUnread}
        />
      );
    } else {
      return <MultipleMiniAppNotifications group={group} />;
    }
  },
);
MiniAppNotificationGroup.displayName = 'MiniAppNotificationGroup';

interface SingleMiniAppNotificationProps {
  notif: ApiNotificationMiniApp;
  isUnread?: boolean;
}

const SingleMiniAppNotification: FC<SingleMiniAppNotificationProps> = ({
  notif,
  isUnread,
}) => {
  const { launchMiniApp } = useMinimizableWindowContext();

  return (
    <NotificationGroupContainer
      notificationGroup={{
        type: 'mini-app',
        isUnread: isUnread,
        previewItems: [notif],
      }}
      trackingProps={{
        domain: notif.content.miniapp.domain,
        name: notif.content.miniapp.name,
      }}
      onClick={() => {
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
            splashBackgroundColor: notif.content.miniapp.splashBackgroundColor,
            author: notif.content.miniapp.author,
          },
        });
      }}
    >
      <NotificationGraphic>
        <FrameIconImage imageUrl={notif.content.miniapp.iconUrl} size={44} />
      </NotificationGraphic>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex w-full flex-row items-start gap-x-1">
          <div className="text-base font-semibold text-default">
            {notif.content.title}
          </div>
          <div className="text-faint">
            {formatTimeAgo(notif.timestamp, 'floor')}
          </div>
        </div>
        <div className="flex items-center">
          <div className="line-clamp-4 grow text-muted">
            {notif.content.body}
          </div>
        </div>
      </div>
    </NotificationGroupContainer>
  );
};
SingleMiniAppNotification.displayName = 'SingleMiniAppNotification';

const MultipleMiniAppNotifications: FC<MiniAppNotificationGroupProps> = ({
  group,
}) => {
  const navigateToNotificationGroupMiniApps =
    useNavigateToNotificationGroupMiniApps();

  const firstNotif = useMemo(() => group.previewItems[0], [group.previewItems]);

  return (
    <NotificationGroupContainer
      notificationGroup={group}
      trackingProps={{
        domain: firstNotif.content.miniapp.domain,
        name: firstNotif.content.miniapp.name,
      }}
      trackAsGroup={true}
      onClick={({ openInNewTab }) => {
        navigateToNotificationGroupMiniApps({
          groupId: group.id,
          openInNewTab,
        });
      }}
    >
      <NotificationGraphic centerVertically>
        <FrameIconImage
          imageUrl={firstNotif.content.miniapp.iconUrl}
          size={44}
        />
      </NotificationGraphic>
      <div className="w-full self-center pt-1">
        <span className="text-base font-semibold text-default">
          {firstNotif.content.title}
        </span>{' '}
        and {group.totalItemCount - 1} more from{' '}
        <span className="font-semibold">{firstNotif.content.miniapp.name}</span>
        <div className="flex items-center">
          <div className="line-clamp-4 grow text-muted">
            {firstNotif.content.body}
          </div>
        </div>
      </div>
    </NotificationGroupContainer>
  );
};
MultipleMiniAppNotifications.displayName = 'MultipleMiniAppNotifications';

export { MiniAppNotificationGroup };
