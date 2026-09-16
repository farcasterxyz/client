import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, { FC, memo, ReactNode, useEffect } from 'react';

import { usePrefetchUnauthedResources } from '~/hooks/data/usePrefetchUnauthedResources';
import { logInDevOnly } from '~/utils/LogUtils';

type AppDataPreloaderProps = {
  children: ReactNode;
};

const AppDataPreloader: FC<AppDataPreloaderProps> = memo(({ children }) => {
  const prefetchUnauthedResources = usePrefetchUnauthedResources();

  // Warm the unauthed caches (client config, product catalog) in the
  // background. We intentionally DO NOT block render on this.
  //
  // Previously this provider gated the entire app behind a full-screen loader
  // until the prefetch resolved. On a cold cache (every native app update busts
  // the persisted cache) over a slow/flaky network, `getClientConfig` could
  // burn ~30-55s (20s→6s decaying timeouts × retries) while the user stared at
  // the splash logo. Downstream consumers already handle the not-yet-loaded
  // state themselves: `Navigation` suspends on `useClientConfig` (showing the
  // app's loading indicator) and `EnsureMinAppVersion` uses the non-suspense
  // variant. Firing prefetch without awaiting lets the rest of the provider
  // tree (auth, wallet, etc.) initialize in parallel instead of serially after
  // the network round-trip, and the shared React Query cache de-dupes the
  // fetch so there is no double request.
  //
  // The `load_provider` RUM action lives in this effect (not the render body
  // like blocking providers) so it runs once and brackets the actual
  // background warm. Now that we don't block render, render-body start/stop
  // would emit overlapping ~0ms actions on every re-render.
  useEffect(() => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'AppDataPreloader',
    });
    prefetchUnauthedResources()
      .catch((error) => {
        logInDevOnly('AppDataPreloader:prefetchData:error', error);
      })
      .finally(() => {
        DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
          name: 'AppDataPreloader',
        });
      });
  }, [prefetchUnauthedResources]);

  return <>{children}</>;
});

AppDataPreloader.displayName = 'AppDataPreloader';

export { AppDataPreloader };
