import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRegisterDevice } from 'farcaster-client-hooks';
import React from 'react';
import { Platform } from 'react-native';

import { analyticsClient } from '~/analyticsClient';
import {
  deviceTokenStorageKey,
  lastEnsuredUpToDateDeviceTokenAtKey,
} from '~/constants/Storage';
import { useDeviceId } from '~/contexts/DeviceProvider';
import { trackError } from '~/utils/ErrorUtils';
import { getPushTokenProviderPlatform } from '~/utils/PushNotificationAnalyticsUtils';
import { getItem, setItem } from '~/utils/StorageUtils';

import { useCurrentUser_UNSAFE } from './data/useCurrentUser';

export function usePushNotificationsTokensChangedListeners() {
  const currentUser = useCurrentUser_UNSAFE();

  const { device } = useDeviceId();

  const register = useRegisterDevice();
  const expoTokenMintsInProgress = React.useRef(new Set<string>());

  React.useEffect(() => {
    if (typeof currentUser === 'undefined') {
      return;
    }

    const subscription = Notifications.addPushTokenListener(
      async (devicePushToken: Notifications.DevicePushToken) => {
        const { data: deviceToken } = devicePushToken;
        // Skip lookup-triggered fires. getExpoPushTokenAsync (called by the
        // foreground sync path) internally re-emits DevicePushToken with the
        // same token; only register on real OS-driven rotations where the
        // device token actually changed.
        const lastToken = await getItem<string | undefined>({
          key: deviceTokenStorageKey,
          fallback: undefined,
        });
        if (lastToken === deviceToken) {
          return;
        }
        if (expoTokenMintsInProgress.current.has(deviceToken)) {
          return;
        }

        DdRum.addAction(RumActionType.CUSTOM, 'push-token-refreshed', {
          fid: currentUser.fid,
        });

        expoTokenMintsInProgress.current.add(deviceToken);
        let failureStage: 'expo_token_mint' | 'registration' | 'persistence' =
          'expo_token_mint';
        try {
          // Bind the Expo token mint to this exact rotation event. Without
          // this option Expo performs another native-token lookup, which can
          // observe a newer token when rotation events interleave.
          const expoPushToken = await Notifications.getExpoPushTokenAsync({
            devicePushToken,
          });
          failureStage = 'registration';
          await register({
            deviceId: device.deviceId,
            deviceModel: Device.modelName || '',
            deviceName: Device.deviceName || '',
            deviceOs: Device.osName || '',
            deviceToken,
            expoPushToken: expoPushToken.data,
            previousDeviceToken: lastToken,
          });

          failureStage = 'persistence';
          const now = Date.now();
          // Keep the in-progress guard until persistence finishes. Store the
          // token first so a fresh throttle can never point at a stale token.
          await setItem({ key: deviceTokenStorageKey, value: deviceToken });
          await setItem({
            key: lastEnsuredUpToDateDeviceTokenAtKey,
            value: now,
          });
          analyticsClient.capture('push_token.refresh_result', {
            fid: currentUser.fid,
            providerPlatform: getPushTokenProviderPlatform(
              String(devicePushToken.type),
              Platform.OS,
            ),
            outcome: 'success',
            handled: true,
          });
        } catch (error) {
          trackError(error);
          DdRum.addAction(RumActionType.CUSTOM, 'push-token-refreshed:failed', {
            fid: currentUser.fid,
          });
          analyticsClient.capture('push_token.refresh_result', {
            fid: currentUser.fid,
            providerPlatform: getPushTokenProviderPlatform(
              String(devicePushToken.type),
              Platform.OS,
            ),
            outcome: 'failure',
            failureStage,
            failureReason:
              error instanceof Error ? error.name : 'unknown_error',
            handled: false,
          });
        } finally {
          expoTokenMintsInProgress.current.delete(deviceToken);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [currentUser, device.deviceId, register]);
}
