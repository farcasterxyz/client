import { NativeModule } from 'expo-modules-core/types';

/**
 * @hidden
 */
export interface FarcasterDeviceCheckModule extends NativeModule {
  // iOS
  isSupported: boolean;
  generateToken(): Promise<string>;
}
