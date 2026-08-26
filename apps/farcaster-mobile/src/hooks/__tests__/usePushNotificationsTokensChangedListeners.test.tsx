import { act, renderHook } from '@testing-library/react-native';
import { DevicePushToken } from 'expo-notifications';

import {
  deviceTokenStorageKey,
  lastEnsuredUpToDateDeviceTokenAtKey,
} from '~/constants/Storage';

import { usePushNotificationsTokensChangedListeners } from '../usePushNotificationsTokensChangedListeners';

const mockRegister = jest.fn();
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();
const mockAnalyticsCapture = jest.fn();
let pushTokenListener: ((token: DevicePushToken) => Promise<void>) | undefined;

jest.mock('@datadog/mobile-react-native', () => ({
  DdRum: { addAction: jest.fn() },
  RumActionType: { CUSTOM: 'custom' },
}));

jest.mock('~/analyticsClient', () => ({
  analyticsClient: {
    capture: (...args: unknown[]) => mockAnalyticsCapture(...args),
  },
}));

jest.mock('expo-device', () => ({
  modelName: 'Pixel',
  deviceName: 'Test phone',
  osName: 'Android',
}));

jest.mock('expo-notifications', () => ({
  addPushTokenListener: jest.fn(
    (listener: (token: DevicePushToken) => Promise<void>) => {
      pushTokenListener = listener;
      return { remove: jest.fn() };
    },
  ),
  getExpoPushTokenAsync: (...args: unknown[]) =>
    mockGetExpoPushTokenAsync(...args),
}));

jest.mock('farcaster-client-hooks', () => ({
  useRegisterDevice: () => mockRegister,
}));

jest.mock('~/contexts/DeviceProvider', () => ({
  useDeviceId: () => ({ device: { deviceId: 'device-id' } }),
}));

jest.mock('~/utils/ErrorUtils', () => ({ trackError: jest.fn() }));

jest.mock('~/utils/StorageUtils', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: (...args: unknown[]) => mockSetItem(...args),
}));

jest.mock('../data/useCurrentUser', () => ({
  useCurrentUser_UNSAFE: () => ({ fid: 123 }),
}));

describe('usePushNotificationsTokensChangedListeners', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pushTokenListener = undefined;
    mockGetItem.mockResolvedValue('old-device-token');
    mockRegister.mockResolvedValue(undefined);
    mockSetItem.mockResolvedValue(undefined);
  });

  it('mints and registers the Expo token atomically without recursive registration', async () => {
    const devicePushToken = {
      data: 'new-device-token',
      type: 'fcm',
    } as const;
    mockGetExpoPushTokenAsync.mockImplementation(async () => {
      // Expo may re-emit the raw token while minting. The in-flight guard must
      // make this nested listener invocation a no-op.
      await pushTokenListener?.(devicePushToken);
      return { data: 'ExponentPushToken[new]' };
    });

    renderHook(() => usePushNotificationsTokensChangedListeners());

    await act(async () => {
      await pushTokenListener?.(devicePushToken);
    });

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledTimes(1);
    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({
      devicePushToken,
    });
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'device-id',
        deviceToken: 'new-device-token',
        expoPushToken: 'ExponentPushToken[new]',
        previousDeviceToken: 'old-device-token',
      }),
    );
    expect(mockSetItem).toHaveBeenCalledTimes(2);
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'push_token.refresh_result',
      {
        fid: 123,
        providerPlatform: 'fcm',
        outcome: 'success',
        handled: true,
      },
    );
  });

  it('keeps the mint guard active while persisting the token before the throttle', async () => {
    mockGetExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[new]',
    });
    mockSetItem.mockImplementationOnce(async () => {
      // A token notification during the first storage write must still see the
      // in-progress guard and avoid a second mint/registration.
      await pushTokenListener?.({
        data: 'new-device-token',
        type: 'fcm',
      });
    });

    renderHook(() => usePushNotificationsTokensChangedListeners());

    await act(async () => {
      await pushTokenListener?.({ data: 'new-device-token', type: 'fcm' });
    });

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenNthCalledWith(1, {
      key: deviceTokenStorageKey,
      value: 'new-device-token',
    });
    expect(mockSetItem).toHaveBeenNthCalledWith(2, {
      key: lastEnsuredUpToDateDeviceTokenAtKey,
      value: expect.any(Number),
    });
  });

  it('binds each Expo mint to its native token when rotations interleave', async () => {
    let resolveFirstMint!: (value: { data: string }) => void;
    let resolveSecondMint!: (value: { data: string }) => void;
    const firstMint = new Promise<{ data: string }>((resolve) => {
      resolveFirstMint = resolve;
    });
    const secondMint = new Promise<{ data: string }>((resolve) => {
      resolveSecondMint = resolve;
    });
    const firstDevicePushToken = {
      data: 'device-token-a',
      type: 'fcm',
    } as const;
    const secondDevicePushToken = {
      data: 'device-token-b',
      type: 'fcm',
    } as const;

    mockGetExpoPushTokenAsync
      .mockReturnValueOnce(firstMint)
      .mockReturnValueOnce(secondMint);

    renderHook(() => usePushNotificationsTokensChangedListeners());

    await act(async () => {
      const firstRotation = pushTokenListener?.(firstDevicePushToken);
      await Promise.resolve();

      const secondRotation = pushTokenListener?.(secondDevicePushToken);
      await Promise.resolve();

      // A second event for token A must remain guarded even though token B
      // started minting after it.
      await pushTokenListener?.(firstDevicePushToken);
      expect(mockGetExpoPushTokenAsync).toHaveBeenCalledTimes(2);
      expect(mockGetExpoPushTokenAsync).toHaveBeenNthCalledWith(1, {
        devicePushToken: firstDevicePushToken,
      });
      expect(mockGetExpoPushTokenAsync).toHaveBeenNthCalledWith(2, {
        devicePushToken: secondDevicePushToken,
      });

      resolveFirstMint({ data: 'ExponentPushToken[a]' });
      resolveSecondMint({ data: 'ExponentPushToken[b]' });
      await Promise.all([firstRotation, secondRotation]);
    });

    expect(mockRegister).toHaveBeenCalledTimes(2);
    expect(mockRegister).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        deviceToken: 'device-token-a',
        expoPushToken: 'ExponentPushToken[a]',
        previousDeviceToken: 'old-device-token',
      }),
    );
    expect(mockRegister).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        deviceToken: 'device-token-b',
        expoPushToken: 'ExponentPushToken[b]',
        previousDeviceToken: 'old-device-token',
      }),
    );
  });

  it('does not persist or register a rotated token when Expo minting fails', async () => {
    mockGetExpoPushTokenAsync.mockRejectedValue(new Error('mint failed'));
    renderHook(() => usePushNotificationsTokensChangedListeners());

    await act(async () => {
      await pushTokenListener?.({ data: 'new-device-token', type: 'fcm' });
    });

    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'push_token.refresh_result',
      {
        fid: 123,
        providerPlatform: 'fcm',
        outcome: 'failure',
        failureStage: 'expo_token_mint',
        failureReason: 'Error',
        handled: false,
      },
    );
  });
});
