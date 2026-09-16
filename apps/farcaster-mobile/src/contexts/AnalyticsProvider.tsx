import { AnalyticsEvent } from 'farcaster-analytics';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { analyticsClient, AnalyticsIdentity } from '~/analyticsClient';
import { resolveAnalyticsEventName } from '~/constants/AnalyticsEventMap';
import { AnalyticsEventData } from '~/constants/AnalyticsEvents';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { isDev } from '~/constants/Env';
import { usePath } from '~/hooks/navigation/usePath';
import { trackFollowingFeedFirstInteraction } from '~/utils/FollowingFeedSessionTracking';
import { trackHomeFeedFirstInteraction } from '~/utils/HomeFeedSessionTracking';

const defaultIsEnabled = true;

export type TrackEventFn = (
  type: AnalyticsEvent | AnalyticsOnlyEvent,
  properties?: AnalyticsEventData,
) => void;

type AnalyticsContextValue = {
  trackEvent: TrackEventFn;
  identify: (
    distinctIdOrIdentity: string | AnalyticsIdentity,
    props?: Record<string, unknown>,
  ) => void;
  alias: (distinctId: string) => void;
  reset: () => void;
  setUserProperties: (props: Record<string, unknown>) => void;
  registerUserProperty: (props: Record<string, unknown>) => void;
  unregisterUserProperty: (key: string) => void;
  captureException: (e: unknown, ctx?: Record<string, unknown>) => void;
  getDeviceId: () => string | undefined;
  getSessionId: () => string | undefined;
};

const AnalyticsContext = createContext<AnalyticsContextValue>({
  // We provide a working default implementation because while AnalyticsProvider
  // is typically injected at the Screen level (so we can get additional contextual
  // information, like the screen's path), there are a couple cases (e.g. handling deeplinks,
  // handling push notifications) where we want to track events above the navigator in the
  // React tree. This default implementation should make sure those instances
  // actually track the event.
  trackEvent: (
    name: AnalyticsEvent | AnalyticsOnlyEvent,
    properties: AnalyticsEventData,
  ) => {
    if (defaultIsEnabled) {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log(`[AMP] event: [${name}]: `, properties);
      }

      const eventProps = {
        ...properties,
        warpcastPlatform: 'mobile',
      };

      analyticsClient.capture(resolveAnalyticsEventName(name), eventProps);

      trackHomeFeedFirstInteraction({
        eventName: name,
        eventProps,
        emitEvent: (event, props) => {
          analyticsClient.capture(resolveAnalyticsEventName(event), {
            ...(props ?? {}),
            warpcastPlatform: 'mobile',
          });
        },
      });
      trackFollowingFeedFirstInteraction({
        eventName: name,
        eventProps,
        emitEvent: (event, props) => {
          analyticsClient.capture(resolveAnalyticsEventName(event), {
            ...(props ?? {}),
            warpcastPlatform: 'mobile',
          });
        },
      });
    }
  },
  identify: (distinctIdOrIdentity, props) => {
    if (typeof distinctIdOrIdentity === 'object') {
      analyticsClient.identify(distinctIdOrIdentity);
    } else {
      analyticsClient.identify(distinctIdOrIdentity, props);
    }
  },
  alias: (distinctId) => {
    analyticsClient.alias(distinctId);
  },
  reset: () => {
    analyticsClient.reset();
  },
  setUserProperties: (props) => {
    analyticsClient.setPersonProperties(props);
  },
  registerUserProperty: (props) => {
    analyticsClient.register(props);
  },
  unregisterUserProperty: (key) => {
    analyticsClient.unregister(key);
  },
  captureException: (e, ctx) => {
    analyticsClient.captureException(e, ctx);
  },
  getDeviceId: () => analyticsClient.getAnonymousId(),
  getSessionId: () => analyticsClient.getSessionId(),
});

type AnalyticsProviderProps = {
  children: ReactNode;
};

const AnalyticsProvider: FC<AnalyticsProviderProps> = memo(({ children }) => {
  const path = usePath();

  const trackEvent = useCallback<TrackEventFn>(
    async (name, properties = {}) => {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log(`[AMP] event: [${name}]: `, properties);
      }

      const eventProps = {
        ...properties,
        location: path,
        warpcastPlatform: 'mobile',
      };

      const resolvedEventName = resolveAnalyticsEventName(name);
      analyticsClient.capture(resolvedEventName, eventProps);

      trackHomeFeedFirstInteraction({
        eventName: name,
        eventProps,
        emitEvent: (event, props) => {
          const resolvedFirstInteractionEventName =
            resolveAnalyticsEventName(event);
          analyticsClient.capture(resolvedFirstInteractionEventName, {
            ...(props ?? {}),
            warpcastPlatform: 'mobile',
          });
        },
      });
      trackFollowingFeedFirstInteraction({
        eventName: name,
        eventProps,
        emitEvent: (event, props) => {
          const resolvedFirstInteractionEventName =
            resolveAnalyticsEventName(event);
          analyticsClient.capture(resolvedFirstInteractionEventName, {
            ...(props ?? {}),
            warpcastPlatform: 'mobile',
          });
        },
      });
    },
    [path],
  );

  const identify = useCallback(
    (
      distinctIdOrIdentity: string | AnalyticsIdentity,
      props?: Record<string, unknown>,
    ) => {
      if (typeof distinctIdOrIdentity === 'object') {
        analyticsClient.identify(distinctIdOrIdentity);
      } else {
        analyticsClient.identify(distinctIdOrIdentity, props);
      }
    },
    [],
  );

  const alias = useCallback((distinctId: string) => {
    analyticsClient.alias(distinctId);
  }, []);

  const reset = useCallback(() => {
    analyticsClient.reset();
  }, []);

  const setUserProperties = useCallback((props: Record<string, unknown>) => {
    analyticsClient.setPersonProperties(props);
  }, []);

  const registerUserProperty = useCallback((props: Record<string, unknown>) => {
    analyticsClient.register(props);
  }, []);

  const unregisterUserProperty = useCallback((key: string) => {
    analyticsClient.unregister(key);
  }, []);

  const captureException = useCallback(
    (e: unknown, ctx?: Record<string, unknown>) => {
      analyticsClient.captureException(e, ctx);
    },
    [],
  );

  const getDeviceId = useCallback(() => analyticsClient.getAnonymousId(), []);

  const getSessionId = useCallback(() => analyticsClient.getSessionId(), []);

  const value = useMemo(
    () => ({
      trackEvent,
      identify,
      alias,
      reset,
      setUserProperties,
      registerUserProperty,
      unregisterUserProperty,
      captureException,
      getDeviceId,
      getSessionId,
    }),
    [
      trackEvent,
      identify,
      alias,
      reset,
      setUserProperties,
      registerUserProperty,
      unregisterUserProperty,
      captureException,
      getDeviceId,
      getSessionId,
    ],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
});

AnalyticsProvider.displayName = 'AnalyticsProvider';

const useAnalytics = () => useContext(AnalyticsContext);

export const useTrackEvent = (sharedProps: AnalyticsEventData) => {
  const { trackEvent } = useAnalytics();

  return useCallback<TrackEventFn>(
    async (
      name: AnalyticsEvent | AnalyticsOnlyEvent,
      properties: AnalyticsEventData = {},
    ) => {
      trackEvent(name, {
        ...sharedProps,
        ...properties,
      });
    },
    [trackEvent, sharedProps],
  );
};

export { AnalyticsProvider, useAnalytics };
