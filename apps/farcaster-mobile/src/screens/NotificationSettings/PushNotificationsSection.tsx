import * as Notifications from 'expo-notifications';
import { AnalyticsEvent } from 'farcaster-analytics';
import { AtomsButton } from 'farcaster-expo';
import React, { FC } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePushNotificationPermission } from '~/contexts/PushNotificationPermissionProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { openWarpcastSettings } from '~/utils/UrlUtils';

import { GranularPushNotificationsSection } from './GranularPushNotificationsSection';

const PushNotificationsSection: FC = () => {
  const t = useTheme();
  const toast = useToast();
  const { permission, pushNotificationsEnabled, setPermission } =
    usePushNotificationPermission();
  const { trackEvent } = useAnalytics();

  if (!permission) {
    return null;
  }

  const userHasPushNotificationsEnabled =
    pushNotificationsEnabled && permission.granted;

  return (
    <View style={[t.pX4]}>
      <View style={[t.flex, t.flexCol]}>
        <View style={[t.flexRow, t.itemsCenter, t.mB2, t.justifyBetween]}>
          <Text style={[t.texts.primary, t.textBase, t.fontBold]}>
            Push notifications
          </Text>
          {permission.canAskAgain && !userHasPushNotificationsEnabled && (
            <Switch
              newColors
              value={userHasPushNotificationsEnabled}
              onValueChange={(value) => {
                if (value) {
                  trackEvent(
                    AnalyticsEvent.EnabledPushNotificationsOnSettings,
                    undefined,
                  );
                } else {
                  trackEvent(
                    AnalyticsEvent.DisabledPushNotificationsOnSettings,
                    undefined,
                  );
                }

                if (permission.canAskAgain) {
                  Notifications.requestPermissionsAsync().then(
                    (nextPermission) => {
                      if (nextPermission.granted) {
                        toast.show(
                          `${
                            nextPermission.granted ? 'Enabled' : 'Disabled'
                          } push notifications`,
                        );
                      }
                      setPermission(nextPermission);
                    },
                  );
                }
              }}
            />
          )}
        </View>
        {userHasPushNotificationsEnabled && (
          <GranularPushNotificationsSection />
        )}
      </View>
      {!permission.canAskAgain && !userHasPushNotificationsEnabled && (
        <>
          <Text style={[t.texts.secondary, t.textSm]}>
            Farcaster push notifications are disabled in system settings.
          </Text>
          <AtomsButton
            style={[t.mT2]}
            size="s"
            onPress={() => {
              openWarpcastSettings();
            }}
          >
            Open Settings
          </AtomsButton>
        </>
      )}
    </View>
  );
};

export { PushNotificationsSection };
