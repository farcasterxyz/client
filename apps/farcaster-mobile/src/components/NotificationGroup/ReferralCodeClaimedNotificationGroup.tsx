import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiReferralCodeClaimedNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';

import ActionFollowIcon from '~/assets/icons/action-follow.svg';
import { usePush } from '~/hooks/navigation/usePush';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

import { NotificationDescriptionText } from './shared/NotificationDescriptionText';
import { NotificationGroupHeading } from './shared/NotificationGroupHeading';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type ReferralCodeClaimedNotificationGroupProps = {
  group: ApiReferralCodeClaimedNotificationGroup;
};

const ReferralCodeClaimedNotificationGroup: FC<ReferralCodeClaimedNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();
    const { trackEvent } = useTrackEvent();

    const onPress = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: group.type,
      });
      push('ReferralsOverview', {});
    }, [trackEvent, group.type, push]);

    const { checkUserAppContextGate } = useUserAppContextGate();

    const viewerCanAccessReferrals = checkUserAppContextGate('referrals').value;

    if (!viewerCanAccessReferrals) {
      return null;
    }

    return (
      <NotificationGroupOuterContainer group={group} onPress={onPress}>
        <NotificationIcon variant="blue">
          {(iconColor) => (
            <ActionFollowIcon
              color={iconColor}
              fill={iconColor}
              style={{
                color: iconColor,
                fill: iconColor,
                transform: [{ rotateY: '180deg' }],
              }}
              size={24}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate="used your referral link."
            totalItemCount={group.totalItemCount}
            type={group.type}
          />
          <NotificationDescriptionText>
            You'll earn 20% of fees every time they trade.
          </NotificationDescriptionText>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ReferralCodeClaimedNotificationGroup.displayName =
  'ReferralCodeClaimedNotificationGroup';

export { ReferralCodeClaimedNotificationGroup };
