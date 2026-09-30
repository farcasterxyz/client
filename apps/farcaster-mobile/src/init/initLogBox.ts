import { LogBox } from 'react-native';
import { configureReanimatedLogger } from 'react-native-reanimated';

const initLogBox = () => {
  LogBox.ignoreLogs([
    "Module MnemonicKey requires main queue setup since it overrides `init` but doesn't implement `requiresMainQueueSetup`. In a future release React Native will default to initializing all native modules on a background thread unless explicitly opted-out of.",
    'RCTBridge required dispatch_sync to load RCTDevLoadingView. This may lead to deadlocks',
    "The provided value 'moz-chunked-arraybuffer' is not a valid",
    "The provided value 'ms-stream' is not a valid",
    'Setting a timer for a long period of time, i.e. multiple minutes, is a performance and correctness issue on Android as it keeps the timer module awake, and timers can only be called when the app is in the foreground. See https://github.com/facebook/react-native/issues/12981 for more info.', // React Query does this for its garbage collection.
    'Browserslist: caniuse-lite is outdated.',
    "EventEmitter.removeListener('change', ...): Method has been deprecated. Please instead use `remove()` on the subscription returned by `EventEmitter.addListener`.",
    'Embedded wallet proxy not initialized', // Privy proxy may not be ready during auto-init; retry handles this.
    'Billing is unavailable. This may be a problem with your device, or the Play Store may be down.', // Android emulators without Play Store cannot initialize IAP.
  ]);
};

configureReanimatedLogger({
  strict: false,
});

export { initLogBox };
