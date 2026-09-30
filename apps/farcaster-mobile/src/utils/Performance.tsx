import { Alert } from 'react-native';
import performance, { PerformanceObserver } from 'react-native-performance';

/**
 * This tracks how long the app takes to start up and become ready to use.
 *
 * The app automatically creates these timing marks:
 *   • nativeLaunchStart - when native code starts
 *   • nativeLaunchEnd - when native code finishes
 *   • runJsBundleStart - when JS code starts loading
 *   • runJsBundleEnd - when JS code finishes loading
 *
 * You need to call markReady() when your app is fully loaded.
 *
 * Once all marks are ready, we calculate the timing and show a popup.
 */

const flags = {
  hasNativeLaunchEnd: false,
  hasJsBundleEnd: false,
  hasAppReady: false,
};

// Make sure we only show the popup once
let alertShown = false;

// Check if we have all the timing data, then show results
function checkAndShowResults() {
  // Don't show popup twice
  if (alertShown) {
    return;
  }

  // Wait until we have all the timing marks
  const { hasNativeLaunchEnd, hasJsBundleEnd, hasAppReady } = flags;
  if (!hasNativeLaunchEnd || !hasJsBundleEnd || !hasAppReady) {
    return;
  }

  /**
   * Now we can measure the different timing phases
   */
  // Time from start to native code done
  performance.measure('nativeLaunch', 'nativeLaunchStart', 'nativeLaunchEnd');
  // Time from start to JS loading
  performance.measure('beforeBundle', 'nativeLaunchStart', 'runJsBundleStart');
  // Time for JS code to load
  performance.measure('bundleLoad', 'runJsBundleStart', 'runJsBundleEnd');
  // Time from JS loaded to app ready
  performance.measure('appReady', 'runJsBundleStart', 'ready');

  // Get the timing results
  const beforeBundleTime = performance.getEntriesByName('beforeBundle').pop();
  const nativeLaunchTime = performance.getEntriesByName('nativeLaunch').pop();
  const bundleLoadTime = performance.getEntriesByName('bundleLoad').pop();
  const appReadyTime = performance.getEntriesByName('appReady').pop();

  // Format the numbers
  const nativeMs = nativeLaunchTime ? nativeLaunchTime.duration.toFixed(2) : -1;
  const bundleMs = bundleLoadTime ? bundleLoadTime.duration.toFixed(2) : -1;
  const readyMs = appReadyTime ? appReadyTime.duration.toFixed(2) : -1;
  const beforeMs = beforeBundleTime ? beforeBundleTime.duration.toFixed(2) : -1;

  // Show the results
  Alert.alert(
    'App Start Times',
    `• Native start: ${nativeMs} ms\n` +
      `• Code loading: ${bundleMs} ms\n` +
      `• App ready: ${readyMs} ms\n` +
      `• Setup time: ${beforeMs} ms`,
  );

  alertShown = true;
}

// Watch for React Native timing marks
const reactNativeWatcher = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === 'nativeLaunchEnd') {
      flags.hasNativeLaunchEnd = true;
    } else if (entry.name === 'runJsBundleEnd') {
      flags.hasJsBundleEnd = true;
    }
  }
  checkAndShowResults();
});

// Start watching right away, including marks that already happened
reactNativeWatcher.observe({
  type: 'react-native-mark',
  buffered: true,
});

// Watch for our custom "ready" mark
const customWatcher = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === 'ready') {
      flags.hasAppReady = true;
    }
  }
  checkAndShowResults();
});

customWatcher.observe({ type: 'mark', buffered: true });

/**
 * Call this when your app is fully loaded and ready to use.
 */
export function markReady() {
  if (!performance || !performance.mark) {
    return;
  }

  performance.mark('ready');
  flags.hasAppReady = true;
  checkAndShowResults();
}
