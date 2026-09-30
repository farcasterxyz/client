import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { NotificationPermissionsStatus } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { useRegisterDevice, useUnregisterDevice } from 'farcaster-client-hooks';
import moment from 'moment';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { analyticsClient } from '~/analyticsClient';
import {
  deviceTokenStorageKey,
  lastEnsuredUpToDateDeviceTokenAtKey,
  lastFirebaseInstallationResetAtKey,
} from '~/constants/Storage';
import { useDeviceId } from '~/contexts/DeviceProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { resetFirebasePushInstallation } from '~/modules';
import {
  SyncPushNotificationsPermissionsError,
  UnregisterDevicePushTokenError,
} from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { logInDevOnly } from '~/utils/LogUtils';
import { getPushTokenRecoveryResultProperties } from '~/utils/PushNotificationAnalyticsUtils';
import {
  attemptFirebaseInstallationRecovery,
  isFirebaseInstallationsAuthError,
} from '~/utils/PushNotificationRecoveryUtils';
import { deleteItem, getItem, setItem } from '~/utils/StorageUtils';

import { useAuthToken } from './AuthTokenProvider';

type PushNotificationPermissionContext = {
  deviceToken: string | undefined;
  permission: NotificationPermissionsStatus | undefined;
  pushNotificationsEnabled: boolean;
  setPermission: (permission: NotificationPermissionsStatus) => void;
};

const PushNotificationPermissionContext =
  createContext<PushNotificationPermissionContext>({
    deviceToken: undefined,
    permission: undefined as never,
    pushNotificationsEnabled: false,
    setPermission: () => undefined,
  });

type PushNotificationPermissionProviderProps = {
  children: ReactNode;
};

const PushNotificationPermissionProvider: FC<PushNotificationPermissionProviderProps> =
  memo(({ children }) => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'PushNotificationPermissionProvider',
    });

    const { addSignOutListener } = useAuthToken();
    const { device } = useDeviceId();
    const currentUser = useCurrentUser_UNSAFE();

    const [permission, setPermission] =
      useState<NotificationPermissionsStatus>();
    const [deviceToken, setDeviceToken] = useState<string | undefined>(
      undefined,
    );
    const [isInitialized, setIsInitialized] = useState(false);
    const firebaseInstallationRecoveryInProgress = useRef(false);

    const registerDeviceWithApi = useRegisterDevice();
    const unregisterDeviceWithApi = useUnregisterDevice();

    const syncCurrentPermission = useCallback(async (): Promise<
      NotificationPermissionsStatus | undefined
    > => {
      const performSync = async (
        allowFirebaseInstallationRecovery: boolean,
      ): Promise<NotificationPermissionsStatus | undefined> => {
        let failureStage: 'permission' | 'firebase-token' | 'register' =
          'permission';

        try {
          // Snapshot before any await: the addPushTokenListener callback (in
          // usePushNotificationsTokensChangedListeners) writes this key on OS-driven
          // rotations, and rapid AppState→active transitions can re-enter this
          // function. Reading the key after our awaits would observe a post-rotation
          // value and we'd lose the previousDeviceToken hint that this fix targets.
          const lastStoredDeviceToken = await getItem<string | undefined>({
            key: deviceTokenStorageKey,
            fallback: undefined,
          });

          const currentPermission = await Notifications.getPermissionsAsync();
          setPermission(currentPermission);
          logInDevOnly('Registering device from syncCurrentPermission...');

          failureStage = 'firebase-token';
          const deviceTokenToSendToServer = currentPermission.granted
            ? (await Notifications.getDevicePushTokenAsync()).data
            : undefined;

          let expoPushTokenToSendToServer: string | undefined;
          if (deviceTokenToSendToServer) {
            try {
              const expoToken = await Notifications.getExpoPushTokenAsync();
              expoPushTokenToSendToServer = expoToken.data;
            } catch (error) {
              if (isFirebaseInstallationsAuthError(error)) {
                throw error;
              }
              trackError(error);
              // A prior known-good EPT remains usable. New/rotated raw tokens stay
              // non-deliverable until a later client-side mint succeeds.
            }
          }

          // addPushTokenListener doesn't fire while the app is suspended, so on
          // resume the OS may report a rotated token the listener never saw.
          // Forward the prior value so the backend can drop the stale row.
          const previousDeviceToken =
            deviceTokenToSendToServer &&
            lastStoredDeviceToken &&
            lastStoredDeviceToken !== deviceTokenToSendToServer
              ? lastStoredDeviceToken
              : undefined;

          failureStage = 'register';
          await registerDeviceWithApi({
            deviceId: device.deviceId,
            deviceModel: Device.modelName || '',
            deviceName: Device.deviceName || '',
            deviceOs: Device.osName || '',
            deviceToken: deviceTokenToSendToServer,
            expoPushToken: expoPushTokenToSendToServer,
            notificationsSystemEnabled: currentPermission.granted,
            previousDeviceToken,
          });

          // Sync React state + storage. setDeviceToken must run on rotation so
          // downstream consumers (notably unregisterDeviceTokenSafe via the context)
          // see the freshly-registered token; on AppState→active resumes, syncDeviceToken
          // does not run, so this is the only path that updates the state.
          if (deviceTokenToSendToServer) {
            setDeviceToken(deviceTokenToSendToServer);
            if (lastStoredDeviceToken !== deviceTokenToSendToServer) {
              // Persist the token before advancing the throttle so readers can
              // never observe a fresh sync timestamp paired with a stale token.
              await setItem({
                key: deviceTokenStorageKey,
                value: deviceTokenToSendToServer,
              });
            }
            await setItem({
              key: lastEnsuredUpToDateDeviceTokenAtKey,
              value: Date.now(),
            });
          }

          return currentPermission;
        } catch (error) {
          if (
            allowFirebaseInstallationRecovery &&
            failureStage === 'firebase-token' &&
            isFirebaseInstallationsAuthError(error)
          ) {
            let outcome: Awaited<
              ReturnType<typeof attemptFirebaseInstallationRecovery>
            >;

            if (firebaseInstallationRecoveryInProgress.current) {
              outcome = 'cooldown';
            } else {
              firebaseInstallationRecoveryInProgress.current = true;
              try {
                const lastAttemptAt = await getItem({
                  key: lastFirebaseInstallationResetAtKey,
                  fallback: 0,
                });
                outcome = await attemptFirebaseInstallationRecovery({
                  error,
                  isAndroid: Platform.OS === 'android',
                  now: Date.now(),
                  lastAttemptAt,
                  resetInstallation: resetFirebasePushInstallation,
                  // StorageUtils.setItem intentionally swallows write errors.
                  // Observe this safety-critical write so recovery cannot reset
                  // Firebase unless its cooldown marker is durable.
                  markAttempt: (attemptedAt) =>
                    AsyncStorage.setItem(
                      lastFirebaseInstallationResetAtKey,
                      JSON.stringify(attemptedAt),
                    ),
                  clearCachedTokens: async () => {
                    await Promise.all([
                      deleteItem({ key: deviceTokenStorageKey }),
                      deleteItem({
                        key: lastEnsuredUpToDateDeviceTokenAtKey,
                      }),
                    ]);
                    setDeviceToken(undefined);
                  },
                });
              } finally {
                firebaseInstallationRecoveryInProgress.current = false;
              }
            }

            DdRum.addAction(RumActionType.CUSTOM, 'push-token-fis-recovery', {
              outcome,
            });
            analyticsClient.capture(
              'push_token.recovery_result',
              getPushTokenRecoveryResultProperties({
                fid: currentUser?.fid,
                platform: Platform.OS,
                outcome,
              }),
            );

            if (outcome === 'success') {
              return performSync(false);
            }
          }

          trackError(new SyncPushNotificationsPermissionsError({ error }));
        }
      };

      return performSync(true);
    }, [currentUser?.fid, device, registerDeviceWithApi]);

    const permissionGranted = useMemo(
      () => typeof permission !== 'undefined' && permission.granted,
      [permission],
    );

    const shouldUpdateRegistrationStatus = useMemo(
      () =>
        !!(
          currentUser?.fid &&
          Device.isDevice &&
          permissionGranted !== undefined &&
          isInitialized
        ),
      [currentUser?.fid, isInitialized, permissionGranted],
    );

    const syncDeviceToken = useCallback(async () => {
      const savedToken = await getItem({
        key: deviceTokenStorageKey,
        fallback: undefined,
      });

      const lastEnsuredAt = await getItem({
        key: lastEnsuredUpToDateDeviceTokenAtKey,
        fallback: 0,
      });

      // We are limiting the frequency of setting the tokens becase getDevicePushTokenAsync
      // is potentially slow/unreliable, we don't want to block the app from loading on this operation.
      // From expo-notifications' documentation:
      // getDevicePushTokenAsync and getExpoPushTokenAsync can sometimes take a long time to resolve
      // on iOS. This is outside of expo - notifications's control, as stated in Apple's “Troubleshooting Push Notifications” technical note:
      // This is not necessarily an error condition. The system may not have Internet connectivity at all
      // because it is out of range of any cell towers or Wi - Fi access points, or it may be in airplane mode.
      // Instead of treating this as an error, your app should continue normally, disabling only that functionality
      // that relies on push notifications.
      if (
        typeof savedToken !== 'undefined' &&
        lastEnsuredAt !== 0 &&
        moment().diff(lastEnsuredAt, 'days') < 1
      ) {
        // If we've ensured that tokens in the last day - dont bother
        return setDeviceToken(savedToken);
      }

      if (Device.isDevice) {
        if (Platform.OS === 'android') {
          // This has to be called before we try to get push tokens below
          // See: https://docs.expo.dev/versions/latest/sdk/notifications/#android-1
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        try {
          const { data: newToken } =
            await Notifications.getDevicePushTokenAsync();

          setDeviceToken(newToken);

          // syncCurrentPermission owns persisting deviceTokenStorageKey post-register
          // so a failed registration keeps the rotation hint available for retry.
          // Bump the daily throttle when there's nothing to retry: either no prior
          // token (cold start / pre-permission, savedToken === undefined) or no
          // rotation (newToken === savedToken). Only leave the throttle stale on a
          // true rotation, so the next mount's syncDeviceToken re-fetches and gives
          // syncCurrentPermission another shot at the cleanup hint.
          if (typeof savedToken === 'undefined' || newToken === savedToken) {
            setItem({
              key: lastEnsuredUpToDateDeviceTokenAtKey,
              value: Date.now(),
            });
          }
        } catch (e) {
          trackError(e);
        }
      }
    }, []);

    const pushNotificationsEnabled = useMemo(() => {
      return permissionGranted;
    }, [permissionGranted]);

    // The app state will change to active after the user accepts/rejects permission,
    // so updating the current permission should happen automatically.
    const onAppStateChange = React.useCallback(
      (status: AppStateStatus) => {
        if (status === 'active') {
          syncCurrentPermission();
        }
      },
      [syncCurrentPermission],
    );

    const unregisterDeviceTokenSafe = React.useCallback(async () => {
      try {
        await unregisterDeviceWithApi({
          deviceId: device.deviceId,
          deviceToken,
        });
        logInDevOnly(
          `Unregistered device token, address: device id: ${device.deviceId}`,
        );
      } catch (error) {
        const unregisterError = new UnregisterDevicePushTokenError({
          error,
          deviceId: device.deviceId,
        });
        trackError(unregisterError);
      }
    }, [device.deviceId, deviceToken, unregisterDeviceWithApi]);

    // Initialize the provider state.
    useEffect(() => {
      const appStateSubscription = AppState.addEventListener(
        'change',
        onAppStateChange,
      );

      // Note that because this operation is potentially slow/unreliable, we do not want to block the app initialization on it.
      syncDeviceToken();

      syncCurrentPermission();

      setIsInitialized(true);

      return () => {
        appStateSubscription.remove();
      };
    }, [onAppStateChange, syncCurrentPermission, syncDeviceToken]);

    // Unregister the device token when the user signs out
    useEffect(() => {
      if (shouldUpdateRegistrationStatus) {
        return addSignOutListener(unregisterDeviceTokenSafe);
      }
    }, [
      addSignOutListener,
      shouldUpdateRegistrationStatus,
      unregisterDeviceTokenSafe,
    ]);

    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'PushNotificationPermissionProvider',
    });

    return (
      <PushNotificationPermissionContext.Provider
        value={{
          deviceToken,
          permission,
          pushNotificationsEnabled,
          setPermission,
        }}
      >
        {children}
      </PushNotificationPermissionContext.Provider>
    );
  });

PushNotificationPermissionProvider.displayName =
  'PushNotificationPermissionProvider';

const usePushNotificationPermission = () =>
  useContext(PushNotificationPermissionContext);

export { PushNotificationPermissionProvider, usePushNotificationPermission };

// Update 03/28/2025:
// We have way better understanding of the push flows and multiple handlers.
// Disabling the helper methods for the time being for push tokens to clean-up the code on the
// provider.
// const forceRegisterDeviceToken = useCallback(async () => {
//   if (Device.isDevice) {
//     const newToken = await fetchAndUpdateDeviceToken();
//     logInDevOnly('Registering device from forceRegisterDeviceToken...');
//     await registerDeviceWithApi({
//       deviceId: device.deviceId,
//       deviceModel: Device.modelName || '',
//       deviceName: Device.deviceName || '',
//       deviceOs: Device.osName || '',
//       deviceToken: newToken,
//     });
//   }
// }, [device.deviceId, fetchAndUpdateDeviceToken, registerDeviceWithApi]);

// const registerDeviceToken = useCallback(async () => {
//   if (!deviceToken) {
//     // [UPDATE 09/23]: We used to log this here however its just too frequent
//     // on app-loads and its crowding error reporting. It's not working as we originally
//     // intended so stopping the logging now. We can re-visit later if we notice
//     // push notification issues again.
//     // trackError(new MissingDeviceTokenError());
//     return;
//   }

//   try {
//     logInDevOnly('Registering device from registerDeviceToken...');
//     await registerDeviceWithApi({
//       deviceId: device.deviceId,
//       deviceModel: Device.modelName || '',
//       deviceName: Device.deviceName || '',
//       deviceOs: Device.osName || '',
//       deviceToken,
//     });

//     logInDevOnly(
//       `Registered device token, device id: ${device.deviceId}, device token: ${deviceToken}`,
//     );
//   } catch (error) {
//     const registerDeviceError = new RegisterDevicePushTokenError({
//       error,
//       deviceId: device.deviceId,
//       deviceToken,
//     });
//     trackError(registerDeviceError);
//     throw registerDeviceError;
//   }
// }, [device.deviceId, deviceToken, registerDeviceWithApi]);
