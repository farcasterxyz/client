import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiConnectAccountNotificationGroup } from 'farcaster-client-data';
import { useGetXAuthLink } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { Linking, Platform, View } from 'react-native';

import { XTopHatIcon } from '~/components/images/XTopHatIcon';
import { Text, Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useHaptics } from '~/hooks/useHaptics';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type ConnectAccountNotificationGroupProps = {
  group: ApiConnectAccountNotificationGroup;
};

const ConnectAccountNotificationGroup: FC<ConnectAccountNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const { triggerImpactAsync } = useHaptics();
    const navigate = useNavigate();

    const getXAuthLink = useGetXAuthLink();

    const onNotificationPress = React.useCallback(async () => {
      triggerImpactAsync();

      trackEvent(AnalyticsEvent.SendUserToXToAuth, {
        via: 'notification',
      });

      const { result } = await getXAuthLink();

      if (Platform.OS === 'android') {
        Linking.openURL(result.url);
      } else {
        await openBrowserAsync(result.url, {
          dismissButtonStyle: 'done',
          readerMode: false,
          presentationStyle: WebBrowserPresentationStyle.POPOVER,
        });

        navigate('ConnectedAccounts', { success: true });
      }
    }, [getXAuthLink, navigate, trackEvent, triggerImpactAsync]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={onNotificationPress}
      >
        <NotificationIcon variant="gray">
          {(iconColor) => <XTopHatIcon size={24} color={iconColor} />}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View
            style={[
              t.mR1,
              t.flex,
              t.flexRow,
              t.texts.primary,
              t.flexWrap,
              t.mT1,
            ]}
          >
            <Text style={[t.texts.primary, t.fontSemibold]}>
              Connect your X (formerly Twitter) account
            </Text>
          </View>
          <View style={[t.mT2]}>
            <Text2 color="secondary">
              Reach more users by verifying that you own an X account.
            </Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ConnectAccountNotificationGroup.displayName = 'ConnectAccountNotificationGroup';

export { ConnectAccountNotificationGroup };
