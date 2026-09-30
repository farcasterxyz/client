import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiReferralReminderNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { XpRewardIcon } from 'farcaster-expo';
import React, { FC, memo, useCallback } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type ReferralReminderNotificationGroupProps = {
  group: ApiReferralReminderNotificationGroup;
};

const ReferralReminderNotificationGroup: FC<ReferralReminderNotificationGroupProps> =
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

    const { checkUserAppContextGate } = useUserAppContextGate();

    const viewerCanAccessReferrals = checkUserAppContextGate('referrals').value;

    if (!viewerCanAccessReferrals) {
      return null;
    }

    return (
      <NotificationGroupOuterContainer group={group} onPress={onPress}>
        <NotificationIcon variant="purple">
          {(iconColor) => <XpRewardIcon color={iconColor} size={24} />}
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
          >
            Share your referral code to earn more rewards
          </NotificationTitleText>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ReferralReminderNotificationGroup.displayName =
  'ReferralReminderNotificationGroup';

export { ReferralReminderNotificationGroup };
