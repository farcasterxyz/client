import {
  ApiNotificationNudgeAdvancedProtection,
  ApiNudgeAdvancedProtectionNotificationGroup,
  formatWholeDollars,
} from 'farcaster-client-data';
import { useTotpEnabledQuery } from 'farcaster-client-hooks';
import { ShieldIcon } from 'lucide-react-native';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

function getMessage(
  nudgeReason: ApiNotificationNudgeAdvancedProtection['content']['nudgeReason'],
  thresholdCrossed?: number,
) {
  switch (nudgeReason) {
    case 'followers':
      return thresholdCrossed
        ? `You have over ${thresholdCrossed.toLocaleString()} followers`
        : `Your follower count is growing`;
    case 'walletBalance':
      return thresholdCrossed
        ? `Your wallet holds over ${formatWholeDollars(thresholdCrossed)}`
        : `Your wallet balance is growing`;
    default:
      'Keep your account safe';
  }
}

type NudgeAdvancedProtectionNotificationGroupProps = {
  group: ApiNudgeAdvancedProtectionNotificationGroup;
};

const NudgeAdvancedProtectionNotificationGroup: FC<NudgeAdvancedProtectionNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();

    const notif = group.previewItems[0];
    const message = useMemo(
      () =>
        getMessage(notif.content.nudgeReason, notif.content.thresholdCrossed),
      [notif.content.thresholdCrossed, notif.content.nudgeReason],
    );

    const { data } = useTotpEnabledQuery();

    const navigate = useNavigate();
    const handlePress = useCallback(async () => {
      if (!data?.result.enabled) {
        navigate('SecureModeSetup', { source: 'nudge-notification' });
      }
    }, [data?.result.enabled, navigate]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={handlePress}>
        <NotificationIcon variant="purple">
          {(iconColor) => (
            <ShieldIcon size={24} fill={iconColor} color={iconColor} />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex1, { gap: 12 }]}>
            {data?.result.enabled ? (
              <Text2>
                You turned on Advanced Protection for your account and wallet.
              </Text2>
            ) : (
              <Text2>
                {message}—enable Advanced Protection for added security.
              </Text2>
            )}
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

NudgeAdvancedProtectionNotificationGroup.displayName =
  'NudgeAdvancedProtectionNotificationGroup';

export { NudgeAdvancedProtectionNotificationGroup };
