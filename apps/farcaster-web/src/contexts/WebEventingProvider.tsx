import { AnalyticsEvent } from 'farcaster-analytics';
import {
  AnalyticsEventWithoutTimestamp,
  EventingProvider,
  EventV2Props,
  useInternalEventing,
} from 'farcaster-client-hooks';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { useAnalytics } from '~/contexts/AnalyticsProvider';

interface EventHandlerProps {
  children: React.ReactNode;
}

const WebEventingProvider: React.FC<EventHandlerProps> = ({ children }) => {
  const { trackEvent } = useAnalytics();
  const { _trackInternalEvent, _trackUrgentInternalEvent } =
    useInternalEventing();
  const location = useLocation();

  const handleEvent = React.useCallback(
    (event: AnalyticsEvent, props?: EventV2Props) => {
      props ||= {};
      props['path'] = location.pathname;
      trackEvent(event, props);
    },
    [location.pathname, trackEvent],
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

export { WebEventingProvider };
