import { Ionicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiDepositBonusesIneligibleNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationDescriptionText } from './shared/NotificationDescriptionText';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type DepositBonusesIneligibleNotificationGroupProps = {
  group: ApiDepositBonusesIneligibleNotificationGroup;
};

const DepositBonusesIneligibleNotificationGroup: FC<DepositBonusesIneligibleNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();

    const onPress = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, { type: group.type });
      // Do nothing - ineligible notifications should not navigate anywhere
    }, [trackEvent, group.type]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={onPress}>
        <NotificationIcon variant="red">
          {(iconColor) => (
            <Ionicons
              name="alert"
              size={18}
              style={[{ color: iconColor, marginTop: 1, marginLeft: 2 }]}
            />
          )}
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
              t.mB1,
            ]}
          >
            Your account isn’t eligible for the deposit bonus
          </NotificationTitleText>
          <NotificationDescriptionText>
            Please check your email inbox for more details
          </NotificationDescriptionText>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

DepositBonusesIneligibleNotificationGroup.displayName =
  'DepositBonusesIneligibleNotificationGroup';

export { DepositBonusesIneligibleNotificationGroup };
