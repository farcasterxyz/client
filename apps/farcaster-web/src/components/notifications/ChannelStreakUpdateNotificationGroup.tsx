import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannelStreakUpdateNotificationGroup } from 'farcaster-client-data';
import React from 'react';

import { ChannelStreaksIcon } from '~/components/casts/actions/icons/ChannelStreaksIcon';
import { UserChannelStreakModal } from '~/components/modals/UserChannelStreakModal';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type ChannelStreakUpdateNotificationGroupProps = {
  notificationGroup: ApiChannelStreakUpdateNotificationGroup;
};

const ChannelStreakUpdateNotificationGroup: React.FC<ChannelStreakUpdateNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const { trackEvent } = useAnalytics();

    const [showChannelStreakModal, setShowChannelStreakModal] =
      React.useState<boolean>(false);

    const streak = React.useMemo(
      () => notificationGroup.previewItems[0].content.streak,
      [notificationGroup.previewItems],
    );

    const streakSummary = React.useMemo(() => {
      if (streak.streakCount <= 1) {
        return `Started streak in /${streak.channel.key} (1 day)`;
      }

      return `Streak in /${streak.channel.key} continued! (${streak.streakCount} days)`;
    }, [streak.channel.key, streak.streakCount]);

    return (
      <>
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: notificationGroup.type,
            });

            setShowChannelStreakModal(true);
          }}
        >
          <NotificationIcon variant="yellow">
            <ChannelStreaksIcon />
          </NotificationIcon>
          <div className="group w-full min-w-0">
            <div className="line-clamp-2 font-semibold break-gracefully">
              {streakSummary}
            </div>
            <div className="mt-1 text-sm text-action-purple group-hover:underline">
              View streak details
            </div>
          </div>
        </NotificationGroupContainer>
        {showChannelStreakModal && (
          <UserChannelStreakModal
            onCancel={() => setShowChannelStreakModal(false)}
          />
        )}
      </>
    );
  });

ChannelStreakUpdateNotificationGroup.displayName =
  'ChannelStreakUpdateNotificationGroup';

export { ChannelStreakUpdateNotificationGroup };
