import React, { FC, memo, ReactNode } from 'react';

import { debugAppLoadEnabled } from '~/utils/FastStorageUtils';

import { useSplash } from './SplashProvider';

type EarlySplashDismissProviderProps = {
  children: ReactNode;
};

// If the app hasn't mounted a real screen within this window, hide the native
// splash anyway so the user sees the in-app loading indicator (a spinner on the
// themed background) instead of a frozen logo. `onAppInitialized` is idempotent
// (guarded by a ref in SplashProvider), so a fast/warm boot that dismisses the
// splash earlier via a mounted Screen is unaffected -- this only kicks in when
// boot is slow (e.g. cold cache + flaky network stalling the client-config
// fetch that gates Navigation).
const SLOW_BOOT_SPLASH_DISMISS_MS = 2_000;

const EarlySplashDismissProvider: FC<EarlySplashDismissProviderProps> = memo(
  ({ children }) => {
    const debugAppLoad = debugAppLoadEnabled();

    const { onAppInitialized } = useSplash();

    React.useEffect(() => {
      if (debugAppLoad) {
        onAppInitialized();
        return;
      }

      const timeoutId = setTimeout(
        () => onAppInitialized(),
        SLOW_BOOT_SPLASH_DISMISS_MS,
      );
      return () => clearTimeout(timeoutId);
    }, [debugAppLoad, onAppInitialized]);

    return <>{children}</>;
  },
);

EarlySplashDismissProvider.displayName = 'EarlySplashDismissProvider';

export { EarlySplashDismissProvider };
