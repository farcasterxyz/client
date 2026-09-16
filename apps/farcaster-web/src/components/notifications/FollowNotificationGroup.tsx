import { ApiFollowNotificationGroup } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { PersonAddIcon } from '~/components/icons/PersonAddIcon';
import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationGroupUserNames } from '~/components/notifications/shared/NotificationGroupUserNames';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type FollowNotificationGroupProps = {
  notificationGroup: ApiFollowNotificationGroup;
};

const FollowNotificationGroup: FC<FollowNotificationGroupProps> = memo(
  ({ notificationGroup }) => {
    return (
      <NotificationGroupContainer notificationGroup={notificationGroup}>
        <NotificationIcon variant="blue">
          <PersonAddIcon
            size={NOTIFICATION_ICON_SIZE}
            filled={true}
            flipY={true}
            className="mb-px "
          />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={notificationGroup} />
          <NotificationGroupUserNames
            notificationGroup={notificationGroup}
            predicate="followed you"
          />
        </div>
      </NotificationGroupContainer>
    );
  },
);

FollowNotificationGroup.displayName = 'FollowNotificationGroup';

export { FollowNotificationGroup };
