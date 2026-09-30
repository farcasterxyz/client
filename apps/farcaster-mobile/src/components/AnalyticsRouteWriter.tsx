import { FC, memo, useEffect } from 'react';

import { analyticsClient } from '~/analyticsClient';
import { navigationRef } from '~/navigation/navigationRef';

// Single root-level subscriber that mirrors the active navigation route into
// the analytics envelope. Previously this lived inside AnalyticsProvider,
// which mounts per-screen — multiple instances raced to write the envelope
// from their own navigator-scoped paths, so a backgrounded tab's effect
// could overwrite the active screen's route. This component subscribes once
// to the root navigation state via navigationRef and reads the currently
// focused leaf route so the envelope reflects the screen the user is on.
const AnalyticsRouteWriter: FC = memo(() => {
  useEffect(() => {
    const writeRoute = () => {
      const path = navigationRef.current?.getCurrentRoute()?.name;
      if (path === undefined) {
        return;
      }
      analyticsClient.setEnvelopeContext({
        currentRoute: path,
        $screen_name: path,
      });
    };

    writeRoute();
    const unsubscribe = navigationRef.current?.addListener?.(
      'state',
      writeRoute,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  return null;
});

AnalyticsRouteWriter.displayName = 'AnalyticsRouteWriter';

export { AnalyticsRouteWriter };
