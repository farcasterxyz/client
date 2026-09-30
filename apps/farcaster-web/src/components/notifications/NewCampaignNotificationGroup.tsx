import { GiftIcon } from '@primer/octicons-react';
import { ApiNewCampaignNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo } from 'react';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';
import { NotificationGroupContainer } from './shared/NotificationGroupContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type NewCampaignNotificationGroupProps = {
  group: ApiNewCampaignNotificationGroup;
};

const NewCampaignNotificationGroup: FC<NewCampaignNotificationGroupProps> =
  memo(({ group }) => {
    const notification = group.previewItems[0];

    return (
      <NotificationGroupContainer notificationGroup={group} onClick={() => {}}>
        <NotificationIcon variant="purple">
          <GiftIcon size={NOTIFICATION_ICON_SIZE} />
        </NotificationIcon>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex w-full flex-row items-start justify-between">
            <div className="shrink">{notification.content.title}</div>
            <div className="text-faint" />
          </div>
          <div className="text-muted">Go to your mobile device to claim</div>
        </div>
      </NotificationGroupContainer>
    );
  });

NewCampaignNotificationGroup.displayName = 'NewCampaignNotificationGroup';

export { NewCampaignNotificationGroup };
