import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCastFeedIncludeReason,
  ApiChannelUserInviteRole,
} from 'farcaster-client-data';
import merge from 'lodash/merge';
import React, { useMemo } from 'react';

import {
  AnalyticsEventWithoutTimestamp,
  CastViewTrackingData,
} from './InternalEventingProvider';

export type EventV2Props =
  | Record<string, string | boolean | number | undefined>
  | undefined;

export type EventDefaultProps = {
  on?: string;
  channel?: string;
  feed?: string;
  castHash?: string;
  castChannel?: string;
  notificationType?: string;
  castViewIncludeReason?: ApiCastFeedIncludeReason['type'];
  castViewIndex?: number;
};

export type TrackCastViewFn = (
  data: Omit<CastViewTrackingData, 'on' | 'channel' | 'feed'> &
    Partial<Pick<CastViewTrackingData, 'on' | 'channel' | 'feed'>>,
  options?: {
    urgent?: boolean;
  },
) => void;

type AcceptDirectCastRequest = {
  name: 'accept direct cast request';
  props: {
    conversationId: string;
  };
};

type RejectDirectCastRequest = {
  name: 'reject direct cast request';
  props: {
    conversationId: string;
    action: 'mute' | 'delete';
    via: 'inbox view' | 'conversation view';
  };
};

type MuteDirectCastsGroup = {
  name: 'mute direct casts group';
  props: {
    participant_count: number;
    via: 'inbox view' | 'conversation view';
  };
};

type ArchiveDirectCastsGroup = {
  name: 'archive direct casts group';
  props: {
    participant_count: number;
    via: 'inbox view' | 'conversation view';
  };
};

type UnarchiveDirectCastsGroup = {
  name: 'unarchive direct casts group';
  props: {
    participant_count: number;
    via: 'inbox view' | 'conversation view';
  };
};

type MarkConversationAsUnread = {
  name: 'mark conversation as unread';
  props: {
    participant_count: number;
    via: 'inbox view' | 'conversation view';
  };
};

type PinConversation = {
  name: 'pin conversation';
  props: {
    participant_count: number;
    via: 'inbox view' | 'conversation view';
  };
};

type UnpinConversation = {
  name: 'unpin conversation';
  props: {
    participant_count: number;
    via: 'inbox view' | 'conversation view';
  };
};

type UpdateDirectCastInboxPreference = {
  name: 'update direct cast inbox preference';
  props: {
    classification: 'recommended' | 'other';
    preference: 'primary' | 'request' | 'block' | 'void';
  };
};

type RespondToChannelInvite = {
  name: 'respond to channel invite';
  props: {
    accept: boolean;
    role: ApiChannelUserInviteRole;
    location: 'channel page' | 'invite notification';
  };
};

type TypedEvent =
  | RejectDirectCastRequest
  | AcceptDirectCastRequest
  | MuteDirectCastsGroup
  | ArchiveDirectCastsGroup
  | UnarchiveDirectCastsGroup
  | MarkConversationAsUnread
  | RespondToChannelInvite
  | PinConversation
  | UnpinConversation
  | UpdateDirectCastInboxPreference;

export type EventType = AnalyticsEvent | TypedEvent;

type EventingContextType = {
  trackEvent: (event: EventType, props?: EventV2Props) => void;
  // For internal events only
  trackInternalEvent: (...events: AnalyticsEventWithoutTimestamp[]) => void;
  trackUrgentInternalEvent: (
    ...events: AnalyticsEventWithoutTimestamp[]
  ) => void;
  trackCastView: TrackCastViewFn;
  // Shared
  defaultEventProps: EventDefaultProps;
  defaultCastViewProps: Partial<CastViewTrackingData>;
};

const EventingContext = React.createContext<EventingContextType>({
  trackEvent: () => {
    // Noop
    // console.log(`Received analytics event at base context ${JSON.stringify(event)}`);
  },
  trackInternalEvent: () => {
    // Noop
    // console.log(`Received internal event at base context ${JSON.stringify(event)}`);
  },
  trackUrgentInternalEvent: () => {
    // Noop
    // console.log(`Received urgent internal event at base context ${JSON.stringify(event)}`);
  },
  trackCastView: () => {
    // Noop
  },
  defaultEventProps: {},
  defaultCastViewProps: {},
});

export const useTrackEvent = () => React.useContext(EventingContext);

type EventingProviderProps = EventDefaultProps & {
  castViewAuthorFid?: CastViewTrackingData['castAuthorFid'];
  handleEvent?: (event: AnalyticsEvent, props?: EventV2Props) => void;
  handleInternalEvents?: (
    urgent: boolean,
    ...events: AnalyticsEventWithoutTimestamp[]
  ) => void;
  discardEvents?: boolean;
  children: React.ReactNode;
};

type EventingPropOverrideProviderProps = EventDefaultProps & {
  children: React.ReactNode;
};

export const EventingProvider: React.FC<EventingProviderProps> = ({
  on,
  channel,
  feed,
  castHash,
  castChannel,
  notificationType,
  castViewIncludeReason,
  castViewIndex,
  castViewAuthorFid,
  handleEvent,
  handleInternalEvents,
  discardEvents,
  children,
}) => {
  const {
    trackEvent: parentTrackEvent,
    trackInternalEvent: parentTrackInternalEvent,
    trackUrgentInternalEvent: parentTrackUrgentInternalEvent,
    defaultEventProps: parentDefaultEventProps,
    defaultCastViewProps: parentDefaultCastViewProps,
  } = useTrackEvent();

  const thisDefaultEventProps = useMemo(
    () => ({
      on,
      channel,
      feed,
      castHash,
      castChannel,
      notificationType,
    }),
    [castChannel, castHash, channel, feed, notificationType, on],
  );

  const thisDefaultCastViewProps = useMemo(
    () =>
      merge(
        { ...parentDefaultCastViewProps },
        {
          castHash,
          castAuthorFid: castViewAuthorFid,
          on,
          channel,
          feed,
          includeReason: castViewIncludeReason,
          index: castViewIndex,
        },
      ),
    [
      castHash,
      castViewAuthorFid,
      on,
      channel,
      feed,
      castViewIncludeReason,
      castViewIndex,
      parentDefaultCastViewProps,
    ],
  );

  // Synthetic value that can be fetched from the context with all the default properties in
  // case a caller wants to use them directly (e.g. pass them to a call outside of the tree).
  // The actual event bubbles up to parents which then decide what to do and whether to add their defaults.
  const defaultEventProps = useMemo(
    () => merge({ ...parentDefaultEventProps }, thisDefaultEventProps),
    [parentDefaultEventProps, thisDefaultEventProps],
  );

  const thisDefaultEventPropsForInternal = useMemo(
    () => ({
      on,
      channel,
      feed,
    }),
    [channel, feed, on],
  );

  const trackEvent = React.useCallback(
    (event: EventType, props?: EventV2Props) => {
      if (discardEvents) {
        return;
      }

      if (typeof event === 'object') {
        props = event.props;
        event = event.name as AnalyticsEvent;
      }

      // Merge in default props
      const mergedProps = merge({ ...thisDefaultEventProps }, props);

      if (handleEvent) {
        // Handle in this provider
        handleEvent(event, mergedProps);
      } else {
        // Bubble up to parent provider
        parentTrackEvent(event, mergedProps);
      }
    },
    [discardEvents, thisDefaultEventProps, handleEvent, parentTrackEvent],
  );

  const trackInternalEvents = React.useCallback(
    (urgent: boolean, ...events: AnalyticsEventWithoutTimestamp[]) => {
      if (discardEvents) {
        return;
      }

      // Merge in default props
      const enrichedEvents = events.map((event) => {
        event.data = merge({ ...thisDefaultEventPropsForInternal }, event.data);
        return event;
      });

      if (handleInternalEvents) {
        // Handle in this provider
        handleInternalEvents(urgent, ...enrichedEvents);
      } else {
        // Bubble up to parent provider
        if (urgent) {
          parentTrackUrgentInternalEvent(...enrichedEvents);
        } else {
          parentTrackInternalEvent(...enrichedEvents);
        }
      }
    },
    [
      discardEvents,
      handleInternalEvents,
      parentTrackInternalEvent,
      parentTrackUrgentInternalEvent,
      thisDefaultEventPropsForInternal,
    ],
  );

  const trackInternalEvent = React.useCallback(
    (...events: AnalyticsEventWithoutTimestamp[]) => {
      trackInternalEvents(false, ...events);
    },
    [trackInternalEvents],
  );

  const trackUrgentInternalEvent = React.useCallback(
    (...events: AnalyticsEventWithoutTimestamp[]) => {
      trackInternalEvents(true, ...events);
    },
    [trackInternalEvents],
  );

  const trackCastView = React.useCallback<TrackCastViewFn>(
    (data, options) => {
      const mergedData = {
        ...thisDefaultCastViewProps,
        ...data,
      };

      if (!mergedData.castHash) {
        return;
      }

      trackInternalEvents(Boolean(options?.urgent), {
        type: 'cast-view',
        data: mergedData,
      });
    },
    [thisDefaultCastViewProps, trackInternalEvents],
  );

  const value = useMemo(
    () => ({
      trackEvent,
      trackInternalEvent,
      trackUrgentInternalEvent,
      trackCastView,
      defaultEventProps,
      defaultCastViewProps: thisDefaultCastViewProps,
    }),
    [
      trackEvent,
      trackInternalEvent,
      trackUrgentInternalEvent,
      trackCastView,
      defaultEventProps,
      thisDefaultCastViewProps,
    ],
  );

  return (
    <EventingContext.Provider value={value}>
      {children}
    </EventingContext.Provider>
  );
};

export const EventingPropOverrideProvider: React.FC<
  EventingPropOverrideProviderProps
> = ({ children, ...overrideProps }) => {
  const parentValue = useTrackEvent();

  const effectiveOverrideProps = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(overrideProps).filter(
          ([, value]) => value !== undefined,
        ),
      ) as EventDefaultProps,
    [overrideProps],
  );

  const defaultEventProps = useMemo(
    () => merge({ ...parentValue.defaultEventProps }, effectiveOverrideProps),
    [parentValue.defaultEventProps, effectiveOverrideProps],
  );

  const trackEvent = React.useCallback(
    (event: EventType, props?: EventV2Props) => {
      if (typeof event === 'object') {
        props = event.props;
        event = event.name as AnalyticsEvent;
      }

      parentValue.trackEvent(
        event,
        merge({ ...effectiveOverrideProps }, props),
      );
    },
    [effectiveOverrideProps, parentValue],
  );

  const value = useMemo(
    () => ({
      ...parentValue,
      trackEvent,
      defaultEventProps,
    }),
    [defaultEventProps, parentValue, trackEvent],
  );

  return (
    <EventingContext.Provider value={value}>
      {children}
    </EventingContext.Provider>
  );
};
