import { GiftIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCreatorRewardNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useState } from 'react';

import { CreatorRewardModal } from '~/components/modals/CreatorRewardModal';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type CreatorRewardNotificationGroupProps = {
  notificationGroup: ApiCreatorRewardNotificationGroup;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const CreatorRewardNotificationGroup: FC<CreatorRewardNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const [showInfo, setShowInfo] = useState(false);

    return (
      <>
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: notificationGroup.type,
            });

            setShowInfo(true);
          }}
        >
          <NotificationIcon variant="purple">
            <GiftIcon size={NOTIFICATION_ICON_SIZE} />
          </NotificationIcon>
          <div className="w-full min-w-0">
            <div className="font-semibold">
              You earned{' '}
              {Math.floor(
                notificationGroup.previewItems[0].content.rewardCents / 100,
              )}{' '}
              USDC!
            </div>
            <div className="text-muted">
              Farcaster sent you a reward for being a top caster on{' '}
              {dateFormatter.format(
                new Date(notificationGroup.previewItems[0].content.rewardDate),
              )}
              .
            </div>
          </div>
        </NotificationGroupContainer>
        <CreatorRewardModal
          open={showInfo}
          onOpenChange={(open) => setShowInfo(open)}
          txChainId={notificationGroup.previewItems[0].content.txChainId}
          txHash={notificationGroup.previewItems[0].content.txHash}
          rewardDate={notificationGroup.previewItems[0].content.rewardDate}
          rewardCents={notificationGroup.previewItems[0].content.rewardCents}
        />
      </>
    );
  });

CreatorRewardNotificationGroup.displayName = 'CreatorRewardNotificationGroup';

export { CreatorRewardNotificationGroup };
