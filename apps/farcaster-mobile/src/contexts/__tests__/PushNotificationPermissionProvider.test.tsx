import { DdRum } from '@datadog/mobile-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { AppState, Platform, Text } from 'react-native';

import {
  deviceTokenStorageKey,
  lastEnsuredUpToDateDeviceTokenAtKey,
  lastFirebaseInstallationResetAtKey,
} from '~/constants/Storage';
import { resetFirebasePushInstallation } from '~/modules';

import { PushNotificationPermissionProvider } from '../PushNotificationPermissionProvider';

const mockRegisterDevice = jest.fn();
const mockUnregisterDevice = jest.fn();
const mockAddSignOutListener = jest.fn();
const mockTrackError = jest.fn();
const mockAppStateAddEventListener = jest.fn(() => ({ remove: jest.fn() }));
const mockDeviceContext = { device: { deviceId: 'device-id' } };
const mockStorage = new Map<string, unknown>();
const mockAnalyticsCapture = jest.fn();

jest.mock('@datadog/mobile-react-native', () => ({
  DdRum: {
    addAction: jest.fn(),
    startAction: jest.fn(),
    stopAction: jest.fn(),
  },
  RumActionType: { CUSTOM: 'custom' },
}));

jest.mock('~/analyticsClient', () => ({
  analyticsClient: {
    capture: (...args: unknown[]) => mockAnalyticsCapture(...args),
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'Pixel',
  deviceName: 'Test phone',
  osName: 'Android',
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: { MAX: 5 },
  getDevicePushTokenAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

jest.mock('farcaster-client-hooks', () => ({
  useRegisterDevice: () => mockRegisterDevice,
  useUnregisterDevice: () => mockUnregisterDevice,
}));

jest.mock('~/contexts/DeviceProvider', () => ({
  useDeviceId: () => mockDeviceContext,
}));

jest.mock('~/hooks/data/useCurrentUser', () => ({
  useCurrentUser_UNSAFE: () => ({ fid: 123 }),
}));

jest.mock('~/modules', () => ({
  resetFirebasePushInstallation: jest.fn(),
}));

jest.mock('~/types', () => ({
  SyncPushNotificationsPermissionsError: class SyncPushNotificationsPermissionsError extends Error {},
  UnregisterDevicePushTokenError: class UnregisterDevicePushTokenError extends Error {},
}));

jest.mock('~/utils/ErrorUtils', () => ({
  trackError: (...args: unknown[]) => mockTrackError(...args),
}));

jest.mock('~/utils/LogUtils', () => ({ logInDevOnly: jest.fn() }));

jest.mock('~/utils/StorageUtils', () => ({
  deleteItem: jest.fn(async ({ key }: { key: string }) => {
    mockStorage.delete(key);
  }),
  getItem: jest.fn(
    async ({ key, fallback }: { key: string; fallback: unknown }) =>
      mockStorage.has(key) ? mockStorage.get(key) : fallback,
  ),
  setItem: jest.fn(async ({ key, value }: { key: string; value: unknown }) => {
    mockStorage.set(key, value);
  }),
}));

jest.mock('../AuthTokenProvider', () => ({
  useAuthToken: () => ({ addSignOutListener: mockAddSignOutListener }),
}));

describe('PushNotificationPermissionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation(mockAppStateAddEventListener as never);
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    mockStorage.clear();
    mockStorage.set(deviceTokenStorageKey, 'stale-raw-token');
    mockStorage.set(lastEnsuredUpToDateDeviceTokenAtKey, 0);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);

    let installationWasReset = false;
    jest.mocked(resetFirebasePushInstallation!).mockImplementation(async () => {
      installationWasReset = true;
    });
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ granted: true } as never);
    jest
      .mocked(Notifications.getDevicePushTokenAsync)
      .mockImplementation(async () => ({
        data: installationWasReset ? 'fresh-raw-token' : 'stale-raw-token',
        type: 'fcm',
      }));
    jest
      .mocked(Notifications.getExpoPushTokenAsync)
      .mockImplementation(async () => {
        if (!installationWasReset) {
          throw new Error(
            'java.util.concurrent.ExecutionException: java.io.IOException: FIS_AUTH_ERROR',
          );
        }
        return { data: 'ExponentPushToken[fresh]' } as never;
      });
    jest
      .mocked(Notifications.setNotificationChannelAsync)
      .mockResolvedValue(null);
    mockRegisterDevice.mockResolvedValue(undefined);
    mockUnregisterDevice.mockResolvedValue(undefined);
  });

  it('resets Firebase and retries the complete token registration flow once', async () => {
    render(
      <PushNotificationPermissionProvider>
        <Text>child</Text>
      </PushNotificationPermissionProvider>,
    );

    await waitFor(() => expect(mockRegisterDevice).toHaveBeenCalledTimes(1));

    expect(resetFirebasePushInstallation).toHaveBeenCalledTimes(1);
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(2);
    expect(mockRegisterDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceToken: 'fresh-raw-token',
        expoPushToken: 'ExponentPushToken[fresh]',
      }),
    );
    expect(mockStorage.get(deviceTokenStorageKey)).toBe('fresh-raw-token');
    expect(mockStorage.get(lastEnsuredUpToDateDeviceTokenAtKey)).toEqual(
      expect.any(Number),
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      lastFirebaseInstallationResetAtKey,
      expect.any(String),
    );
    expect(DdRum.addAction).toHaveBeenCalledWith(
      'custom',
      'push-token-fis-recovery',
      { outcome: 'success' },
    );
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'push_token.recovery_result',
      {
        fid: 123,
        providerPlatform: 'fcm',
        outcome: 'success',
        handled: true,
      },
    );
  });

  it('does not reset Firebase when the cooldown marker cannot be persisted', async () => {
    jest
      .mocked(AsyncStorage.setItem)
      .mockRejectedValueOnce(new Error('storage failed'));

    render(
      <PushNotificationPermissionProvider>
        <Text>child</Text>
      </PushNotificationPermissionProvider>,
    );

    await waitFor(() =>
      expect(DdRum.addAction).toHaveBeenCalledWith(
        'custom',
        'push-token-fis-recovery',
        { outcome: 'failure' },
      ),
    );

    expect(resetFirebasePushInstallation).not.toHaveBeenCalled();
    expect(mockRegisterDevice).not.toHaveBeenCalled();
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(1);
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'push_token.recovery_result',
      {
        fid: 123,
        providerPlatform: 'fcm',
        outcome: 'failure',
        failureStage: 'firebase_installation_recovery',
        failureReason: 'failure',
        handled: false,
      },
    );
  });
});
