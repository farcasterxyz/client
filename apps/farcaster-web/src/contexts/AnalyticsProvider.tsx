import { AnalyticsEvent } from 'farcaster-analytics';
import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { isDev, isProd } from '~/constants/env';
import { AnalyticsEventData } from '~/types';
import { Analytics } from '~/utils/analyticsUtils';
import { trackFollowingFeedFirstInteraction } from '~/utils/followingFeedSessionTracking';
import { trackHomeFeedFirstInteraction } from '~/utils/homeFeedSessionTracking';

import { useStandaloneMode } from './StandaloneModeProvider';

type AnalyticsContextValue = {
  trackEvent: (event: AnalyticsEvent, data: AnalyticsEventData) => void;
  dangerouslyTrackPreAuthEvent: (
    event: AnalyticsEvent,
    data: AnalyticsEventData,
  ) => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: () => {
    // eslint-disable-next-line no-console
    console.error(
      'AnalyticsContext.trackEvent() called before its initialized properly.',
    );
  },
  dangerouslyTrackPreAuthEvent: () => {
    // eslint-disable-next-line no-console
    console.error(
      'AnalyticsContext.dangerouslyTrackPreAuthEvent() called before its initialized properly.',
    );
  },
});

interface AnalyticsProviderProps {
  children: ReactNode;
}

const AnalyticsProvider: FC<AnalyticsProviderProps> = ({ children }) => {
  const { inStandaloneMode } = useStandaloneMode();

  const warpcastPlatform = useMemo(() => {
    return inStandaloneMode ? 'pwa' : 'web';
  }, [inStandaloneMode]);

  const trackEvent = useCallback(
    (e: AnalyticsEvent, data: AnalyticsEventData) => {
      const eventProps = {
        ...data,
        warpcastPlatform: warpcastPlatform,
      };

      if (isDev) {
        // eslint-disable-next-line no-console
        console.log(`[AMP] event: [${e}]: `, eventProps);
      }
      if (isProd) {
        Analytics.logEvent(e, eventProps);

        trackHomeFeedFirstInteraction({
          eventName: e,
          eventProps,
          emitEvent: Analytics.logEvent,
        });
        trackFollowingFeedFirstInteraction({
          eventName: e,
          eventProps,
          emitEvent: Analytics.logEvent,
        });
      }
    },
    [warpcastPlatform],
  );

  const dangerouslyTrackPreAuthEvent = useCallback(
    (e: AnalyticsEvent, data: AnalyticsEventData) => {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log(`[AMP] event: [${e}]: `, data);
      }
      if (isProd) {
        Analytics.dangerouslyLogPossiblyPreAuthEvent(e, {
          ...data,
          warpcastPlatform: warpcastPlatform,
        });
      }
    },
    [warpcastPlatform],
  );

  return (
    <AnalyticsContext.Provider
      value={{
        trackEvent,
        dangerouslyTrackPreAuthEvent,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

AnalyticsProvider.displayName = 'AnalyticsProvider';

const useAnalytics = (): AnalyticsContextValue => useContext(AnalyticsContext);

export { AnalyticsProvider, useAnalytics };
