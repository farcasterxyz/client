import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiXPRewardExpireImminentNotificationGroup,
  ApiXPRewardExpireSoonNotificationGroup,
} from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useCallback, useMemo } from 'react';

import { XpRewardIcon } from '~/components/icons/XpRewardIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type XPRewardExpireNotificationGroupProps = {
  notificationGroup:
    | ApiXPRewardExpireSoonNotificationGroup
    | ApiXPRewardExpireImminentNotificationGroup;
};

const XPRewardExpireNotificationGroup: FC<XPRewardExpireNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();
    const navigate = useNavigate();

    const isExpireSoon = useMemo(() => {
      return notificationGroup.type === 'xp-reward-expire-soon';
    }, [notificationGroup.type]);

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

    const titleText = useMemo(() => {
      if (isExpireSoon) {
        return `Unclaimed rewards expire tomorrow!`;
      }
      return `Unclaimed rewards expire in 6 hours!`;
    }, [isExpireSoon]);

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
              Tap to claim them to your wallet.
            </div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

XPRewardExpireNotificationGroup.displayName = 'XPRewardExpireNotificationGroup';

export { XPRewardExpireNotificationGroup };
