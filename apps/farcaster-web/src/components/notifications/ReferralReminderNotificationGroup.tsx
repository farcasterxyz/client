import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiReferralReminderNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useCallback } from 'react';

import { XpRewardIcon } from '~/components/icons/XpRewardIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type ReferralReminderNotificationGroupProps = {
  notificationGroup: ApiReferralReminderNotificationGroup;
};

const ReferralReminderNotificationGroup: FC<ReferralReminderNotificationGroupProps> =
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

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={onClick}
      >
        <NotificationIcon variant="purple">
          <XpRewardIcon size={NOTIFICATION_ICON_SIZE} color="currentColor" />
        </NotificationIcon>
        <div className="my-1 flex size-full flex-row items-center">
          <div className="font-semibold text-default">
            Share your referral code to earn more rewards
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

ReferralReminderNotificationGroup.displayName =
  'ReferralReminderNotificationGroup';

export { ReferralReminderNotificationGroup };
