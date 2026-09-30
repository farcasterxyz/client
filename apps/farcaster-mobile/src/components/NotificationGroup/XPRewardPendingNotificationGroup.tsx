import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiXPClaimReminderNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { XpRewardIcon } from 'farcaster-expo';
import React, { FC, memo, useCallback, useMemo } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type XPRewardPendingNotificationGroupProps = {
  group: ApiXPClaimReminderNotificationGroup;
};

const XPRewardPendingNotificationGroup: FC<XPRewardPendingNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();
    const push = usePush();

    const usdcAmount = useMemo(() => {
      return group.previewItems[0].content.totalUsdc;
    }, [group.previewItems]);

    const onPress = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: group.type,
      });
      push('ReferralsOverview', {});
    }, [trackEvent, group.type, push]);

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
            You have ${usdcAmount} USDC waiting to be claimed
          </NotificationTitleText>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

XPRewardPendingNotificationGroup.displayName =
  'XPRewardPendingNotificationGroup';

export { XPRewardPendingNotificationGroup };
