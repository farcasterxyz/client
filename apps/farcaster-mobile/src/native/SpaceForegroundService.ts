import { NativeModules, Platform } from 'react-native';

type SpaceForegroundModule = {
  start: (
    title?: string,
    subtitle?: string,
    enableMicrophone?: boolean,
  ) => void;
  stop: () => void;
};

const nativeModule = NativeModules.SpaceForeground as
  | SpaceForegroundModule
  | undefined;

function isStartArgumentCountMismatch(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  return /TurboModule method "start" called with \d+ arguments? \(expected argument count: \d+\)/.test(
    message,
  );
}

const SpaceForegroundService = {
  start({
    title,
    subtitle,
    enableMicrophone = false,
  }: {
    title?: string;
    subtitle?: string;
    enableMicrophone?: boolean;
  }) {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!nativeModule) {
      return;
    }

    try {
      nativeModule.start(title, subtitle, enableMicrophone);
    } catch (err) {
      if (!isStartArgumentCountMismatch(err)) {
        throw err;
      }

      nativeModule.start(title, subtitle);
    }
  },
  stop() {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!nativeModule) {
      return;
    }

    nativeModule?.stop();
  },
};

export { SpaceForegroundService };
