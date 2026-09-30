import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiXPClaimReminderNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { XpRewardIcon } from 'farcaster-expo';
import React, { FC, memo, useCallback } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

import { NotificationDescriptionText } from './shared/NotificationDescriptionText';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type XPClaimReminderNotificationGroupProps = {
  group: ApiXPClaimReminderNotificationGroup;
};

const XPClaimReminderNotificationGroup: FC<XPClaimReminderNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();
    const push = usePush();

    const onPress = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: group.type,
      });
      push('ReferralsOverview', {});
    }, [trackEvent, group.type, push]);

    const titleText = 'Claim your referral rewards!';
    const descriptionText = 'Unclaimed rewards will expire after 7 days';

    const { checkUserAppContextGate } = useUserAppContextGate();

    const viewerCanAccessReferrals = checkUserAppContextGate('referrals').value;

    if (!viewerCanAccessReferrals) {
      return null;
    }

    return (
      <NotificationGroupOuterContainer group={group} onPress={onPress}>
        <NotificationIcon variant="purple">
          {(iconColor) => <XpRewardIcon size={24} color={iconColor} />}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationTitleText
            style={[
              t.mR1,
              t.flex,
              t.flexRow,
              t.texts.primary,
              t.flexWrap,
              t.itemsCenter,
            ]}
            numberOfLines={2}
          >
            {titleText}
          </NotificationTitleText>
          <NotificationDescriptionText
            style={[
              t.mR1,
              t.flex,
              t.flexRow,
              t.texts.primary,
              t.flexWrap,
              t.itemsCenter,
            ]}
          >
            {descriptionText}
          </NotificationDescriptionText>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

XPClaimReminderNotificationGroup.displayName =
  'XPClaimReminderNotificationGroup';

export { XPClaimReminderNotificationGroup };
