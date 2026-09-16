import chokidar from 'chokidar';

import {
  absoluteClientDataRoot,
  absoluteClientHooksRoot,
  absoluteFarcasterCryptographyReactNativeRoot,
  absoluteFarcasterCryptographyRoot,
  absoluteFarcasterExpoRoot,
} from './config';
import {
  publishClientData,
  publishClientHooks,
  publishFarcasterCryptography,
  publishFarcasterCryptographyReactNative,
  publishFarcasterExpo,
} from './helpers';

publishClientData();
publishClientHooks();
publishFarcasterCryptography();
publishFarcasterCryptographyReactNative();
publishFarcasterExpo();

chokidar.watch(`${absoluteClientDataRoot}/src/**/*`).on('change', () => {
  publishClientData();
});

chokidar.watch(`${absoluteClientHooksRoot}/src/**/*`).on('change', () => {
  publishClientHooks();
});

chokidar
  .watch(`${absoluteFarcasterCryptographyRoot}/src/**/*`)
  .on('change', () => {
    publishFarcasterCryptography();
  });

chokidar
  .watch(`${absoluteFarcasterCryptographyReactNativeRoot}/src/**/*`)
  .on('change', () => {
    publishFarcasterCryptographyReactNative();
  });

chokidar.watch(`${absoluteFarcasterExpoRoot}/src/**/*`).on('change', () => {
  publishFarcasterExpo();
});
