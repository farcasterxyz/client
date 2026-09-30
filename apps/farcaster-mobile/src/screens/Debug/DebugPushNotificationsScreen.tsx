import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { AtomsButton } from 'farcaster-expo';
import React, { FC } from 'react';
import { ScrollView, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Divider } from '~/components/Divider';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useDeviceId } from '~/contexts/DeviceProvider';
import { usePushNotificationPermission } from '~/contexts/PushNotificationPermissionProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useSendTestPushNotification } from '~/hooks/useSendTestPushNotification';
import { CommonStackParamList } from '~/types';

type DebugPushNotificationsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugPushNotifications'
>;

const DebugPushNotificationsScreen =
  buildScreen<DebugPushNotificationsScreenProps>(
    { name: 'DebugPushNotifications' },
    () => {
      const t = useTheme();
      const toast = useToast();

      const { device } = useDeviceId();
      const { deviceToken, permission, pushNotificationsEnabled } =
        usePushNotificationPermission();

      const sendTestPushNotification = useSendTestPushNotification();

      return (
        <View style={[t.hFull, t.p4, t.justifyBetween]}>
          <ScrollView>
            <PushNotificationInfoRow label="deviceId" value={device.deviceId} />
            <PushNotificationInfoRow label="deviceToken" value={deviceToken} />
            <Divider />
            <PushNotificationInfoRow
              label="enabled"
              value={pushNotificationsEnabled}
            />
            <Divider />
            <PushNotificationInfoRow
              label="android"
              value={JSON.stringify(permission?.android)}
            />
            <PushNotificationInfoRow
              label="canAskAgain"
              value={permission?.canAskAgain}
            />
            <PushNotificationInfoRow
              label="expires"
              value={permission?.expires.toString()}
            />
            <PushNotificationInfoRow
              label="granted"
              value={permission?.granted}
            />
            <PushNotificationInfoRow
              label="ios"
              value={JSON.stringify(permission?.ios)}
            />
            <PushNotificationInfoRow
              label="status"
              value={permission?.status}
            />
          </ScrollView>
          <View>
            <AtomsButton
              style={[t.mB2]}
              onPress={async () => {
                try {
                  await sendTestPushNotification();
                  toast.show('Successfully triggered', { placement: 'top' });
                } catch {
                  toast.show('Failed to trigger push notification', {
                    type: 'danger',
                    placement: 'top',
                  });
                }
              }}
              size="m"
              hierarchy="secondary"
            >
              Trigger local push notification
            </AtomsButton>
            <AtomsButton
              style={[t.mB2]}
              onPress={async () => {
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'Look at that notification',
                    body: "I'm so proud of myself!",
                  },
                  trigger: null,
                });
              }}
              size="m"
              hierarchy="secondary"
            >
              Trigger scheduled push notification
            </AtomsButton>
          </View>
        </View>
      );
    },
  );

type PushNotificationInfoRowProps = {
  label: string;
  value: string | boolean | undefined | null;
};

const PushNotificationInfoRow: FC<PushNotificationInfoRowProps> = ({
  label,
  value,
}) => {
  const t = useTheme();
  return (
    <View style={[t.flexRow]}>
      <Text
        style={[
          t.texts.primary,
          t.fontMono,
          t.fontSemibold,
          t.textXs,
          t.textRight,
          t.w32,
          t.mR2,
          t.mB1,
        ]}
      >
        {label}:
      </Text>
      <Text
        style={[t.texts.primary, t.fontSemibold, t.textXs, t.flexShrink]}
        selectable
      >
        {value?.toString() || '–'}
      </Text>
    </View>
  );
};

DebugPushNotificationsScreen.displayName = 'DebugPushNotificationsScreen';

export { DebugPushNotificationsScreen };
