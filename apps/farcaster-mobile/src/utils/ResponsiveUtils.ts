import * as Device from 'expo-device';
import { Dimensions, StyleProp, ViewStyle } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

import { logInDevOnly } from './LogUtils';

export type ScreenSize = 'sm' | 'md' | 'lg' | 'xl';

export type ScreenAspectRatio = '16:9' | '19.5:9' | 'other';

// Define screen sizes with their order for comparison
export const SCREEN_SIZE_ORDER: ScreenSize[] = ['sm', 'md', 'lg', 'xl'];

/**
 * Returns true if the current screen size is greater than or equal to the given size
 * @param size The minimum screen size to check
 */
export const screenGreaterThanOrEqual = (size: ScreenSize): boolean => {
  const currentSize = getScreenSize();
  const targetIndex = SCREEN_SIZE_ORDER.indexOf(size);
  const currentIndex = SCREEN_SIZE_ORDER.indexOf(currentSize);
  return currentIndex >= targetIndex;
};

export const debugDumpDeviceDisplayInfo = ({
  insets,
  misc,
}: {
  insets?: EdgeInsets;
  misc?: Record<string, unknown>;
} = {}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  logInDevOnly(
    'Device DisplayInfo',
    JSON.stringify(
      {
        deviceName: Device.deviceName,
        screenWidth,
        screenHeight,
        screenSize: getScreenSize(),
        screenAspectRatio: getScreenAspectRatio(),
        screenRoundedAspectRatio:
          Math.round((screenHeight / screenWidth) * 10) / 10,
        insets,
        misc,
      },
      null,
      2,
    ),
  );
};

/**
 * Returns the current screen size based on device width
 */
export const getScreenSize = (): ScreenSize => {
  const { width: screenWidth } = Dimensions.get('window');
  if (screenWidth <= 375) {
    return 'sm';
  } else if (screenWidth <= 390) {
    return 'md';
  } else if (screenWidth <= 429) {
    return 'lg';
  } else {
    return 'xl';
  }
};

export const getRoundedScreenAspectRatio = (): number => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const ratio = screenHeight / screenWidth;
  return Math.round(ratio * 10) / 10; // Round to 1 decimal place
};

export const getScreenAspectRatio = (): ScreenAspectRatio => {
  const roundedRatio = getRoundedScreenAspectRatio();

  if (roundedRatio === 1.85) {
    return '16:9';
  } else if (roundedRatio === 2.2) {
    return '19.5:9';
  } else {
    return 'other';
  }
};

/**
 * Returns the style if the current screen size is greater than or equal to 'sm'
 * @param style The style to apply if the condition is met.
 */
export const sm = (style: StyleProp<ViewStyle>): StyleProp<ViewStyle> => {
  return screenGreaterThanOrEqual('sm') ? style : null;
};

/**
 * Returns the style if the current screen size is greater than or equal to 'md'
 * @param style The style to apply if the condition is met
 */
export const md = (style: StyleProp<ViewStyle>): StyleProp<ViewStyle> => {
  return screenGreaterThanOrEqual('md') ? style : null;
};

/**
 * Returns the style if the current screen size is greater than or equal to 'lg'
 * @param style The style to apply if the condition is met
 */
export const lg = (style: StyleProp<ViewStyle>): StyleProp<ViewStyle> => {
  return screenGreaterThanOrEqual('lg') ? style : null;
};

/**
 * Returns the style if the current screen size is greater than or equal to 'xl'
 * @param style The style to apply if the condition is met
 */
export const xl = (style: StyleProp<ViewStyle>): StyleProp<ViewStyle> => {
  return screenGreaterThanOrEqual('xl') ? style : null;
};
