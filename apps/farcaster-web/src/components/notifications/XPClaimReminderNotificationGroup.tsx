import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiXPClaimReminderNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useCallback } from 'react';

import { XpRewardIcon } from '~/components/icons/XpRewardIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type XPClaimReminderNotificationGroupProps = {
  notificationGroup: ApiXPClaimReminderNotificationGroup;
};

const XPClaimReminderNotificationGroup: FC<XPClaimReminderNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();
    const navigate = useNavigate();

    const onClick = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: notificationGroup.type,
      });
      navigate({
        to: 'referrals',
        options: { openInNewTab: false },
        params: {},
      });
    }, [trackEvent, navigate, notificationGroup.type]);

    const titleText = 'Claim your referral rewards!';
    const descriptionText = 'Unclaimed rewards will expire after 7 days';

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={onClick}
      >
        <NotificationIcon variant="purple">
          <XpRewardIcon size={NOTIFICATION_ICON_SIZE} color="currentColor" />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <div className="my-1 flex size-full flex-row items-center">
            <div className="font-semibold text-default">{titleText}</div>
          </div>
          <div className="flex items-center">
            <div className="line-clamp-4 grow text-muted">
              {descriptionText}
            </div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

XPClaimReminderNotificationGroup.displayName =
  'XPClaimReminderNotificationGroup';

export { XPClaimReminderNotificationGroup };
