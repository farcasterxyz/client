import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannelStreakEndedNotificationGroup } from 'farcaster-client-data';
import React from 'react';

import { ChannelStreaksIcon } from '~/components/casts/actions/icons/ChannelStreaksIcon';
import { ChannelStreaksModal } from '~/components/modals/ChannelStreaksModal';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type ChannelStreakEndedNotificationGroupProps = {
  notificationGroup: ApiChannelStreakEndedNotificationGroup;
};

const ChannelStreakEndedNotificationGroup: React.FC<ChannelStreakEndedNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const { trackEvent } = useAnalytics();

    return (
      <ChannelStreaksModal>
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: notificationGroup.type,
            });
          }}
        >
          <NotificationIcon variant="yellow">
            <ChannelStreaksIcon />
          </NotificationIcon>
          <div className="group w-full min-w-0">
            <div className="line-clamp-2 font-semibold break-gracefully">
              Streak ended
            </div>
            <div className="mt-1 text-sm text-action-purple group-hover:underline">
              Start new streak
            </div>
          </div>
        </NotificationGroupContainer>
      </ChannelStreaksModal>
    );
  });

ChannelStreakEndedNotificationGroup.displayName =
  'ChannelStreakEndedNotificationGroup';

export { ChannelStreakEndedNotificationGroup };
