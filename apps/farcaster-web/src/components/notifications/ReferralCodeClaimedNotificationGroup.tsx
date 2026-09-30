import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiReferralCodeClaimedNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { PersonAddIcon } from '~/components/icons/PersonAddIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';
import { NotificationAvatars } from './shared/NotificationAvatars';
import { NotificationGroupUserNames } from './shared/NotificationGroupUserNames';

type ReferralCodeClaimedNotificationGroupProps = {
  notificationGroup: ApiReferralCodeClaimedNotificationGroup;
};

const ReferralCodeClaimedNotificationGroup: FC<ReferralCodeClaimedNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();
    const navigate = useNavigate();

    const onClick = () => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: notificationGroup.type,
      });
      navigate({
        to: 'referrals',
        options: { openInNewTab: false },
        params: {},
      });
    };

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={onClick}
      >
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
            predicate="used your referral link."
          />
          <div className="flex items-center">
            <div className="line-clamp-4 grow text-muted">
              You'll earn 20% of fees every time they trade.
            </div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

ReferralCodeClaimedNotificationGroup.displayName =
  'ReferralCodeClaimedNotificationGroup';

export { ReferralCodeClaimedNotificationGroup };
