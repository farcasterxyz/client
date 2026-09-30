import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannelStreakNotificationGroup } from 'farcaster-client-data';
import React from 'react';

import { ChannelStreaksIcon } from '~/components/casts/actions/icons/ChannelStreaksIcon';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { dayjs } from '~/utils/dayjs';

type ChannelStreakNotificationGroupProps = {
  notificationGroup: ApiChannelStreakNotificationGroup;
};

const ChannelStreakNotificationGroup: React.FC<ChannelStreakNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const { trackEvent } = useAnalytics();

    const firstPreviewItem = React.useMemo(
      () => notificationGroup.previewItems[0],
      [notificationGroup.previewItems],
    );

    const title = React.useMemo(() => {
      const metadata = firstPreviewItem.content.streak.metadata;

      if (typeof metadata === 'undefined') {
        return 'Keep your streak';
      }

      if (firstPreviewItem.content.streak.streakCount === 0) {
        return `Keep your streak in /${firstPreviewItem.content.streak.channel.key}`;
      }

      return `Keep your streak in /${firstPreviewItem.content.streak.channel.key} (${firstPreviewItem.content.streak.streakCount} ${firstPreviewItem.content.streak.streakCount === 1 ? 'day' : 'days'})`;
    }, [
      firstPreviewItem.content.streak.channel.key,
      firstPreviewItem.content.streak.metadata,
      firstPreviewItem.content.streak.streakCount,
    ]);

    const body = React.useMemo(() => {
      const metadata = firstPreviewItem.content.streak.metadata;

      if (
        typeof metadata === 'undefined' &&
        firstPreviewItem.content.streak.streakCount !== 0
      ) {
        return (
          <div className="line-clamp-3 text-sm text-muted break-gracefully">
            You've casted for {firstPreviewItem.content.streak.streakCount}{' '}
            {firstPreviewItem.content.streak.streakCount === 1 ? 'day' : 'days'}{' '}
            in /{firstPreviewItem.content.streak.channel.key}.
          </div>
        );
      }

      if (typeof metadata === 'undefined') {
        return;
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Custom thresholds are already configured in our dayjs setup
      const expiresInHours = dayjs(metadata.expiresAtTimestamp)
        .tz(tz)
        .fromNow(true);

      return (
        <div className="line-clamp-3 text-sm text-muted break-gracefully">
          Your streak expires in {expiresInHours}.
        </div>
      );
    }, [
      firstPreviewItem.content.streak.channel.key,
      firstPreviewItem.content.streak.metadata,
      firstPreviewItem.content.streak.streakCount,
    ]);

    const [composerVisible, setComposerVisible] =
      React.useState<boolean>(false);

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={() => {
          trackEvent(AnalyticsEvent.ClickNotification, {
            type: notificationGroup.type,
          });

          setComposerVisible(true);
        }}
      >
        <NotificationIcon variant="yellow">
          <ChannelStreaksIcon />
        </NotificationIcon>
        <div className="group w-full min-w-0">
          <div className="line-clamp-2 font-semibold break-gracefully">
            {title}
          </div>
          {body}
          <div className="mt-1 text-sm text-action-purple group-hover:underline">
            Cast now
          </div>
        </div>
        {composerVisible && (
          <ComposeCastModal
            onClose={() => {
              setComposerVisible(false);
            }}
            intent={{
              channelKey: firstPreviewItem.content.streak.channel.key,
            }}
          />
        )}
      </NotificationGroupContainer>
    );
  });

ChannelStreakNotificationGroup.displayName = 'ChannelStreakNotificationGroup';

export { ChannelStreakNotificationGroup };
