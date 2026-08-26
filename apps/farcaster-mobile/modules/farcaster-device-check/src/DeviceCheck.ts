import { Platform } from 'react-native';

import FarcasterDeviceCheck from './FarcasterDeviceCheck';

/**
 * A boolean value that indicates whether a particular device provides the [Device Check](https://developer.apple.com/documentation/devicecheck/accessing-and-modifying-per-device-data) service.
 * Not all device types support the Device Check service, so check for support before using the service.
 * @platform ios
 */
export const isSupported =
  Platform.OS === 'ios' ? FarcasterDeviceCheck.isSupported : false;

/**
 * @platform ios
 */
export async function generateToken() {
  if (Platform.OS !== 'ios') {
    throw new Error('generateToken is only available on iOS');
  }
  return FarcasterDeviceCheck.generateToken();
}
