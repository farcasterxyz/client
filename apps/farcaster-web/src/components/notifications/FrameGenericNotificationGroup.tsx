import { ChevronRightIcon } from '@primer/octicons-react';
import {
  ApiFrameGenericNotificationGroup,
  ApiNotificationFrameGeneric,
} from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { FrameIconImage } from '~/components/images/FrameIconImage';
import { NotificationGraphic } from '~/components/notifications/shared/NotificationGraphic';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useNavigateToNotificationGroupMiniApps } from '~/hooks/navigation/useNavigateToNotificationGroupMiniApps';

type FrameGenericNotificationGroupProps = {
  group: ApiFrameGenericNotificationGroup;
};

const FrameGenericNotificationGroup: FC<FrameGenericNotificationGroupProps> =
  memo(({ group }) => {
    if (group.previewItems.length === 1) {
      return (
        <SingleFrameGenericNotification
          notif={group.previewItems[0]}
          isUnread={group.isUnread}
        />
      );
    } else {
      return <MultipleFrameGenericNotifications group={group} />;
    }
  });
FrameGenericNotificationGroup.displayName = 'FrameGenericNotificationGroup';

interface SingleFrameGenericNotificationProps {
  notif: ApiNotificationFrameGeneric;
  isUnread?: boolean;
}

const SingleFrameGenericNotification: FC<
  SingleFrameGenericNotificationProps
> = ({ notif, isUnread }) => {
  const { launchMiniApp } = useMinimizableWindowContext();

  return (
    <NotificationGroupContainer
      notificationGroup={{
        type: 'frame-generic',
        isUnread: isUnread,
        previewItems: [notif],
      }}
      trackingProps={{
        domain: notif.content.frame.domain,
        name: notif.content.frame.name,
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
            name: notif.content.frame.name,
            url: notif.content.targetUrl,
            splashImageUrl: notif.content.frame.splashImageUrl,
            splashBackgroundColor: notif.content.frame.splashBackgroundColor,
            author: notif.content.frame.author,
          },
        });
      }}
    >
      <NotificationGraphic>
        <FrameIconImage imageUrl={notif.content.frame.iconUrl} size={44} />
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
          <div className="grow text-muted">{notif.content.body}</div>
        </div>
      </div>
    </NotificationGroupContainer>
  );
};
SingleFrameGenericNotification.displayName = 'SingleFrameGenericNotification';

const MultipleFrameGenericNotifications: FC<
  FrameGenericNotificationGroupProps
> = ({ group }) => {
  const navigateToNotificationGroupMiniApps =
    useNavigateToNotificationGroupMiniApps();

  const firstNotif = useMemo(() => group.previewItems[0], [group.previewItems]);

  return (
    <NotificationGroupContainer
      notificationGroup={group}
      trackingProps={{
        domain: firstNotif.content.frame.domain,
        name: firstNotif.content.frame.name,
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
        <FrameIconImage imageUrl={firstNotif.content.frame.iconUrl} size={44} />
      </NotificationGraphic>
      <div className="w-full self-center pt-1">
        {group.totalItemCount} updates from{' '}
        <span className="font-semibold">{firstNotif.content.frame.name}</span>
      </div>
      <div className="self-center pt-1">
        <ChevronRightIcon size={24} />
      </div>
    </NotificationGroupContainer>
  );
};
MultipleFrameGenericNotifications.displayName =
  'MultipleFrameGenericNotifications';

export { FrameGenericNotificationGroup };
