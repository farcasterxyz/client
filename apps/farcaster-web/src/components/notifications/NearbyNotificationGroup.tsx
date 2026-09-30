import { LocationIcon } from '@primer/octicons-react';
import { ApiNearbyNotificationGroup } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationGroupUserNames } from '~/components/notifications/shared/NotificationGroupUserNames';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';
type NearbyNotificationGroupProps = {
  notificationGroup: ApiNearbyNotificationGroup;
};

const NearbywNotificationGroup: FC<NearbyNotificationGroupProps> = memo(
  ({ notificationGroup }) => {
    const { description } = notificationGroup.previewItems[0].content.location;
    const title =
      notificationGroup.previewItems[0].content.location.description;

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        title={title}
      >
        <NotificationIcon variant="brown">
          <LocationIcon size={NOTIFICATION_ICON_SIZE} className="mb-px" />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={notificationGroup} />
          <NotificationGroupUserNames
            title={title}
            notificationGroup={notificationGroup}
            singularPredicate={
              <>
                is now in{' '}
                <span className="text-default hover:underline">
                  {description}
                </span>
              </>
            }
            pluralPredicate={
              <>
                are now in{' '}
                <span className="text-default hover:underline">
                  {description}
                </span>
              </>
            }
          />
        </div>
      </NotificationGroupContainer>
    );
  },
);

NearbywNotificationGroup.displayName = 'NearbywNotificationGroup';

export { NearbywNotificationGroup };
