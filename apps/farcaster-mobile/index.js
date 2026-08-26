// Import Profiler here to start testing app start import release mode measurements
// import './src/utils/RNReleaseProfiler';
// We are going to make an API request to validate stored token as soon as possible
import './src/utils/EarlyInitAuthTokenCheck';
import './src/polyfills';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
