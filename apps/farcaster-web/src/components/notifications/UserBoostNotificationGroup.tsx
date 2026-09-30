import { RocketIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserBoostNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useState } from 'react';

import { UserBoostInfoModal } from '~/components/modals/UserBoostInfoModal';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type UserBoostNotificationGroupProps = {
  notificationGroup: ApiUserBoostNotificationGroup;
};

const UserBoostNotificationGroup: FC<UserBoostNotificationGroupProps> = memo(
  ({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const [showInfo, setShowInfo] = useState(false);

    return (
      <>
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: notificationGroup.type,
            });

            setShowInfo(true);
          }}
        >
          <NotificationIcon variant="yellow">
            <RocketIcon size={NOTIFICATION_ICON_SIZE} className="mb-px" />
          </NotificationIcon>
          <div className="w-full min-w-0">
            <div className="font-semibold">
              {notificationGroup.previewItems[0].content.title}
            </div>
            <div className="text-muted">
              {notificationGroup.previewItems[0].content.body}
            </div>
          </div>
        </NotificationGroupContainer>
        <UserBoostInfoModal
          open={showInfo}
          onOpenChange={(open) => setShowInfo(open)}
        />
      </>
    );
  },
);

UserBoostNotificationGroup.displayName = 'UserBoostNotificationGroup';

export { UserBoostNotificationGroup };
