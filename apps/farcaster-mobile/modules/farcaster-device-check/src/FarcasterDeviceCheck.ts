/* eslint-disable import/no-default-export */
import { requireNativeModule } from 'expo-modules-core';

import { FarcasterDeviceCheckModule } from './FarcasterDeviceCheck.types';

/**
 * @hidden
 */
export default requireNativeModule<FarcasterDeviceCheckModule>(
  'FarcasterDeviceCheck',
);
