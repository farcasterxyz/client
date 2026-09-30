import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiXPClaimReminderNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useCallback, useMemo } from 'react';

import { XpRewardIcon } from '~/components/icons/XpRewardIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type XPRewardPendingNotificationGroupProps = {
  notificationGroup: ApiXPClaimReminderNotificationGroup;
};

const XPRewardPendingNotificationGroup: FC<XPRewardPendingNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();
    const navigate = useNavigate();

    const usdcAmount = useMemo(() => {
      return notificationGroup.previewItems[0].content.totalUsdc;
    }, [notificationGroup.previewItems]);

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
        <div className="w-full min-w-0">
          <div className="my-1 flex size-full flex-row items-center">
            <div className="font-semibold text-default">
              ${usdcAmount} USDC reward waiting to be claimed
            </div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

XPRewardPendingNotificationGroup.displayName =
  'XPRewardPendingNotificationGroup';

export { XPRewardPendingNotificationGroup };
