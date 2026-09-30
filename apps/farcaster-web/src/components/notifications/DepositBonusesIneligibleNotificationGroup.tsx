import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiDepositBonusesIneligibleNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { AlertTriangle } from 'lucide-react';
import { FC, memo, useCallback } from 'react';

import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type DepositBonusesIneligibleNotificationGroupProps = {
  notificationGroup: ApiDepositBonusesIneligibleNotificationGroup;
};

const DepositBonusesIneligibleNotificationGroup: FC<DepositBonusesIneligibleNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const onClick = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: notificationGroup.type,
      });
      // Do nothing - ineligible notifications should not navigate anywhere
    }, [trackEvent, notificationGroup.type]);

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={onClick}
      >
        <NotificationIcon variant="red">
          <AlertTriangle size={NOTIFICATION_ICON_SIZE} color="currentColor" />
        </NotificationIcon>
        <div className="my-1 flex size-full flex-col">
          <div className="font-semibold text-default">
            Your account isn’t eligible for the deposit bonus
          </div>
          <div className="text-secondary">
            Please check your email inbox for more details
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

DepositBonusesIneligibleNotificationGroup.displayName =
  'DepositBonusesIneligibleNotificationGroup';

export { DepositBonusesIneligibleNotificationGroup };
