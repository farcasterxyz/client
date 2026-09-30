import { Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';

type Timeout = ReturnType<typeof setTimeout>;

export const setBackgroundTimeout = (
  callback: () => void,
  delay: number,
): Timeout | (() => void) => {
  // if web, just use default setTimeout
  if (Platform.OS === 'web') {
    return setTimeout(callback, delay);
  }

  // BackgroundTimer library has different APIs for iOS and Android
  if (Platform.OS === 'ios') {
    BackgroundTimer.start();
  }

  let backgroundTimeout: null | number =
    Platform.OS === 'android'
      ? BackgroundTimer.setTimeout(callback, delay)
      : (setTimeout(callback, delay) as unknown as number);

  const clearBackgroundTimeout =
    Platform.OS === 'android'
      ? (handle?: number) => handle && BackgroundTimer.clearTimeout(handle)
      : clearTimeout;

  return function stopBackgroundTimeout() {
    if (backgroundTimeout) {
      clearBackgroundTimeout(backgroundTimeout);
      backgroundTimeout = null;
    }
    if (Platform.OS === 'ios') {
      BackgroundTimer.stop();
    }
  };
};
