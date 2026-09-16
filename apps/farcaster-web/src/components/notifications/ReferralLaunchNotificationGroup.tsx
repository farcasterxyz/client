import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiReferralLaunchNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useCallback } from 'react';

import { XpRewardIcon } from '~/components/icons/XpRewardIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type ReferralLaunchNotificationGroupProps = {
  notificationGroup: ApiReferralLaunchNotificationGroup;
};

const ReferralLaunchNotificationGroup: FC<ReferralLaunchNotificationGroupProps> =
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
        <div className="my-1 flex size-full flex-col">
          <div className="font-semibold text-default">
            Invite friends and earn rewards!
          </div>
          <div className="text-subtle">
            Earn 20% of fees when someone trades using your referral code.
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

ReferralLaunchNotificationGroup.displayName = 'ReferralLaunchNotificationGroup';

export { ReferralLaunchNotificationGroup };
