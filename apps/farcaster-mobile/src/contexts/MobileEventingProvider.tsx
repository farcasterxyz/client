import { AnalyticsEvent } from 'farcaster-analytics';
import {
  AnalyticsEventWithoutTimestamp,
  EventingProvider,
  EventV2Props,
  useInternalEventing,
} from 'farcaster-client-hooks';
import React from 'react';

import { analyticsClient } from '~/analyticsClient';
import { resolveAnalyticsEventName } from '~/constants/AnalyticsEventMap';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { trackFollowingFeedFirstInteraction } from '~/utils/FollowingFeedSessionTracking';
import { trackHomeFeedFirstInteraction } from '~/utils/HomeFeedSessionTracking';

interface EventHandlerProps {
  children: React.ReactNode;
}

const postHogFeedSessionEvents = new Set<AnalyticsEvent>([
  AnalyticsEvent.FollowingFeedClose,
  AnalyticsEvent.FollowingFeedOpen,
  AnalyticsEvent.HomeFeedClose,
  AnalyticsEvent.HomeFeedOpen,
]);

const MobileEventingProvider: React.FC<EventHandlerProps> = ({ children }) => {
  const { trackEvent } = useAnalytics();
  const { _trackInternalEvent, _trackUrgentInternalEvent } =
    useInternalEventing();

  const handleEvent = React.useCallback(
    (event: AnalyticsEvent, props?: EventV2Props) => {
      trackHomeFeedFirstInteraction({
        eventName: event,
        eventProps: props,
        emitEvent: (firstInteractionEvent, firstInteractionProps) => {
          trackEvent(firstInteractionEvent, firstInteractionProps);
          analyticsClient.capture(firstInteractionEvent, {
            ...(firstInteractionProps ?? {}),
            warpcastPlatform: 'mobile',
          });
        },
      });
      trackFollowingFeedFirstInteraction({
        eventName: event,
        eventProps: props,
        emitEvent: (firstInteractionEvent, firstInteractionProps) => {
          trackEvent(firstInteractionEvent, firstInteractionProps);
          analyticsClient.capture(firstInteractionEvent, {
            ...(firstInteractionProps ?? {}),
            warpcastPlatform: 'mobile',
          });
        },
      });

      trackEvent(event, props);

      if (postHogFeedSessionEvents.has(event)) {
        analyticsClient.capture(resolveAnalyticsEventName(event), {
          ...(props ?? {}),
          warpcastPlatform: 'mobile',
        });
      }
    },
    [trackEvent],
  );

  const handleInternalEvents = React.useCallback(
    (urgent: boolean, ...events: AnalyticsEventWithoutTimestamp[]) => {
      if (urgent) {
        _trackUrgentInternalEvent(...events);
      } else {
        _trackInternalEvent(...events);
      }
    },
    [_trackInternalEvent, _trackUrgentInternalEvent],
  );

  return (
    <EventingProvider
      handleEvent={handleEvent}
      handleInternalEvents={handleInternalEvents}
    >
      {children}
    </EventingProvider>
  );
};

export { MobileEventingProvider };
