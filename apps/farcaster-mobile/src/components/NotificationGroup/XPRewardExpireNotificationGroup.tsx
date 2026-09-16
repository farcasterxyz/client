import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiXPRewardExpireImminentNotificationGroup,
  ApiXPRewardExpireSoonNotificationGroup,
} from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { XpRewardIcon } from 'farcaster-expo';
import React, { FC, memo, useCallback, useMemo } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

import { NotificationDescriptionText } from './shared/NotificationDescriptionText';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type XPRewardExpireNotificationGroupProps = {
  group:
    | ApiXPRewardExpireSoonNotificationGroup
    | ApiXPRewardExpireImminentNotificationGroup;
};

const XPRewardExpireNotificationGroup: FC<XPRewardExpireNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();
    const push = usePush();

    const isExpireSoon = useMemo(() => {
      return group.type === 'xp-reward-expire-soon';
    }, [group.type]);

    const onPress = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: group.type,
      });
      push('ReferralsOverview', {});
    }, [trackEvent, group.type, push]);

    const titleText = useMemo(() => {
      if (isExpireSoon) {
        return `Unclaimed rewards expire tomorrow!`;
      }
      return `Unclaimed rewards expire in 6 hours!`;
    }, [isExpireSoon]);

    const { checkUserAppContextGate } = useUserAppContextGate();

    const viewerCanAccessReferrals = checkUserAppContextGate('referrals').value;

    if (!viewerCanAccessReferrals) {
      return null;
    }

    return (
      <NotificationGroupOuterContainer group={group} onPress={onPress}>
        <NotificationIcon variant={'purple'}>
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
          <NotificationDescriptionText>
            Tap to claim them to your wallet.
          </NotificationDescriptionText>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

XPRewardExpireNotificationGroup.displayName = 'XPRewardExpireNotificationGroup';

export { XPRewardExpireNotificationGroup };
