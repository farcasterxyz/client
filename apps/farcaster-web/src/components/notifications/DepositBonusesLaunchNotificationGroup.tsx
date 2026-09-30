import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiDepositBonusesLaunchNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { ChartColumnBig } from 'lucide-react';
import { FC, memo, useCallback } from 'react';

import { useDepositBonusModal } from '~/components/modals/DepositBonusModal';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type DepositBonusesLaunchNotificationGroupProps = {
  notificationGroup: ApiDepositBonusesLaunchNotificationGroup;
};

const DepositBonusesLaunchNotificationGroup: FC<DepositBonusesLaunchNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();
    const { open, Component } = useDepositBonusModal();

    const onClick = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: notificationGroup.type,
      });
      open();
    }, [trackEvent, notificationGroup.type, open]);

    return (
      <>
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={onClick}
        >
          <NotificationIcon variant="purple">
            <ChartColumnBig
              size={NOTIFICATION_ICON_SIZE}
              color="currentColor"
            />
          </NotificationIcon>
          <div className="my-1 flex size-full flex-col">
            <div className="font-semibold text-default">
              Deposit USDC now, earn up to $500
            </div>
            <div className="text-subtle">
              This October, we're matching USDC deposits on Base by up to 10%.
            </div>
          </div>
        </NotificationGroupContainer>
        {Component}
      </>
    );
  });

DepositBonusesLaunchNotificationGroup.displayName =
  'DepositBonusesLaunchNotificationGroup';

export { DepositBonusesLaunchNotificationGroup };
