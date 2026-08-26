/* eslint-disable no-console */
import * as Clipboard from 'expo-clipboard';

import { isDev } from '~/constants/Env';

// https://reactnative.dev/docs/ram-bundles-inline-requires
const copyModulePathsJsonToClipboard = (delay = 2000) => {
  if (!isDev) {
    return;
  }

  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modules = (require as any).getModules();
    const moduleIds = Object.keys(modules);
    const loadedModuleNames = moduleIds
      .filter((moduleId) => modules[moduleId].isInitialized)
      .map((moduleId) => modules[moduleId].verboseName);

    const waitingModuleNames = moduleIds
      .filter((moduleId) => !modules[moduleId].isInitialized)
      .map((moduleId) => modules[moduleId].verboseName);

    // make sure that the modules you expect to be waiting are actually waiting
    console.log(
      'loaded:',
      loadedModuleNames.length,
      'waiting:',
      waitingModuleNames.length,
    );

    // grab this text blob, and put it in a file named packager/modulePaths.js
    Clipboard.setStringAsync(
      `module.exports = ${JSON.stringify(loadedModuleNames.sort(), null, 2)};`,
    );
    alert('Copied modulePaths.js contents to clipboard.');
  }, delay);
};

export { copyModulePathsJsonToClipboard };
