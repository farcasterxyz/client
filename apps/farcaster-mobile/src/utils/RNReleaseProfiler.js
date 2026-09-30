/**
 * Add this file at the top of index.js to track app startup times.
 * For more detailed performance tools, check ~/utils/Performance
 *
 * For Android profiling:
 * Use release builds only -> run: npx react-native-release-profiler
 * This creates systrace.json -> upload to https://speedscope.app
 */
import * as Sharing from 'expo-sharing';
import { startProfiling, stopProfiling } from 'react-native-release-profiler';

startProfiling();

// eslint-disable-next-line no-undef
setTimeout(async () => {
  const path = await stopProfiling(true);
  const actualPath = `file://${path}`;

  await Sharing.shareAsync(actualPath);
}, 60_000);
