/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable no-console */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

const ignoreWarnings = [
  "Constants.installationId has been deprecated in favor of generating and storing your own ID. Implement it using expo-application's androidId on Android and a storage API such as expo-secure-store on iOS and localStorage on the web. This API will be removed in SDK 44.",
  'Constants.deviceId has been deprecated in favor of generating and storing your own ID. This API will be removed in SDK 44.',
  'Constants.linkingUrl has been renamed to Constants.linkingUri. Consider using the Linking API directly. Constants.linkingUrl will be removed in SDK 44.',
];

global.console = {
  ...console,
  warn: (...args) => {
    if (ignoreWarnings.includes(args[0])) {
      return;
    }

    console.warn(...args);
  },
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

beforeEach(() => {
  jest.clearAllMocks();
});
