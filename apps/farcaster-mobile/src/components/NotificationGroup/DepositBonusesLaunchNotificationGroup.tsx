import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiDepositBonusesLaunchNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { ChartColumnBig } from 'lucide-react-native';
import React, { FC, memo, useCallback } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NotificationDescriptionText } from './shared/NotificationDescriptionText';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type DepositBonusesLaunchNotificationGroupProps = {
  group: ApiDepositBonusesLaunchNotificationGroup;
};

const DepositBonusesLaunchNotificationGroup: FC<DepositBonusesLaunchNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();
    const navigate = useNavigate();

    const onPress = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, { type: group.type });
      navigate('DepositBonusesIntro', {});
    }, [trackEvent, group.type, navigate]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={onPress}>
        <NotificationIcon variant="purple">
          {(iconColor) => <ChartColumnBig size={24} color={iconColor} />}
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
            Deposit USDC now, earn up to $500
          </NotificationTitleText>
          <NotificationDescriptionText>
            This October, we're matching USDC deposits on Base by up to 10%
          </NotificationDescriptionText>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

DepositBonusesLaunchNotificationGroup.displayName =
  'DepositBonusesLaunchNotificationGroup';

export { DepositBonusesLaunchNotificationGroup };
