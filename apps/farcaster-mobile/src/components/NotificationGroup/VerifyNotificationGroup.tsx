import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiVerifyNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useComposeVerificationUrl } from '~/hooks/useComposeVerificationUrl';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type VerifyNotificationGroupProps = {
  group: ApiVerifyNotificationGroup;
};

const VerifyNotificationGroup: FC<VerifyNotificationGroupProps> = memo(
  ({ group }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();

    const composeVerificationUrl = useComposeVerificationUrl();

    const onConnectPress = React.useCallback(async () => {
      const url = await composeVerificationUrl();

      Linking.openURL(url);
    }, [composeVerificationUrl]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={onConnectPress}>
        <NotificationIcon variant="blue">
          {(iconColor) => (
            <Octicons name="link" size={16} style={[{ color: iconColor }]} />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View style={[t.flex1, t.flexCol, t.justifyCenter, t.hFull]}>
            <Text style={[t.mR1, t.texts.primary, t.mB1, t.fontSemibold]}>
              1 day remaining to re-connect your Ethereum address!
            </Text>
            <Text style={[t.mR1, t.texts.primary, t.mB2]}>
              Please re-connect your Ethereum address to ensure you're eligible
              for the Active Badge, ENS, DAO notifications and other upcoming
              onchain features.
            </Text>
            <Button
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: group.type,
                  action: 'connect',
                });

                onConnectPress;
              }}
              title={'Connect'}
              variant="normal"
              size="xs"
              style={[t.w32]}
            />
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

VerifyNotificationGroup.displayName = 'VerifyNotificationGroup';

export { VerifyNotificationGroup };
