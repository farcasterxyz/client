import { requireNativeModule } from 'expo-modules-core';

type FarcasterPushNotificationRecoveryModule = {
  resetFirebasePushInstallation(): Promise<void>;
};

let nativeModule: FarcasterPushNotificationRecoveryModule | null = null;

try {
  nativeModule = requireNativeModule<FarcasterPushNotificationRecoveryModule>(
    'FarcasterPushNotificationRecovery',
  );
} catch {
  // The JS recovery can ship OTA before the native module is available.
  nativeModule = null;
}

const resetFirebasePushInstallation = nativeModule
  ? () => nativeModule.resetFirebasePushInstallation()
  : undefined;

export { resetFirebasePushInstallation };
