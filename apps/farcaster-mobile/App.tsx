// Import PerfUtils below to see what is rendering and how many times:
// - Press `j` to get the grouped summary of render trees.
// - Check the props changing or data changing causing big updates.
// - Change references to props and data and see re-render updates are limited.
// - Avoid passing full objects (especially ones that are globally updated) as props.
// - Repeat.
// import './src/utils/PerfUtils';

// Note that we are using the default entry point (i.e. $ROOT/App.tsx)
// because custom entry points are currently not supported by EAS.
// https://docs.expo.dev/build-reference/migrating/#custom--main--entry-point-in

// Gesture handler import should allegedly be before everything else
// https://reactnavigation.org/docs/drawer-navigator/

import * as SplashScreen from 'expo-splash-screen';
import { initDateFns } from 'farcaster-client-hooks';
import { Platform } from 'react-native';
import { enableFreeze, enableScreens } from 'react-native-screens';

import { App } from '~/components/App';
import { initDebugTools } from '~/init/initDebugTools';
import { initLogBox } from '~/init/initLogBox';
import { initMoment } from '~/init/initMoment';

SplashScreen.preventAutoHideAsync();

enableScreens(true);
enableFreeze(Platform.OS !== 'ios');

initMoment();
initDateFns();

setTimeout(() => {
  initDebugTools();
  initLogBox();
}, 0);

// eslint-disable-next-line import/no-default-export
export default App;
