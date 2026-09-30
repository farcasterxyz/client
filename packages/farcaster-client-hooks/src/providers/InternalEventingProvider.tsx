import {
  ApiCastFeedIncludeReason,
  ApiCastHash,
  ApiCastInteractionEvent,
  ApiCastViewEvent,
  ApiFid,
  ApiFrameLaunchEvent,
  ApiMinimalCastViewEvent,
  ApiUserProfileViewEvent,
  ApiVideoPlayEvent,
} from 'farcaster-client-data';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

import { getCastFeedIncludeReasonType } from '../utils/CastFeedIncludeReasonUtils';
import { useFarcasterApiClient } from './FarcasterApiClientProvider';

const SUBMIT_NORMAL_EVENTS_AFTER_MILLIS = 5000;
const SUBMIT_URGENT_EVENTS_AFTER_MILLIS = 1000;

export type CastViewTrackingData = {
  castHash: ApiCastHash;
  castAuthorFid?: ApiFid;
  on?: string;
  channel?: string;
  feed?: string;
  includeReason?: ApiCastFeedIncludeReason['type'];
  index?: number;
  homeFeedSnapBoostVariant?: string;
};

export type TrackedCastViewEvent = {
  type: 'cast-view';
  ts: number;
  data: CastViewTrackingData;
};

export const castViewTrackingDataToApiData = (
  data: CastViewTrackingData,
): ApiCastViewEvent['data'] => ({
  castHash: data.castHash,
  on: data.on,
  channel: data.channel,
  feed: data.feed,
  reason: data.includeReason,
  position: data.index,
  homeFeedSnapBoostVariant: data.homeFeedSnapBoostVariant,
});

export const trackedCastViewEventToMinimalCastViewEvent = (
  event: TrackedCastViewEvent,
): ApiMinimalCastViewEvent => ({
  ts: event.ts,
  hash: event.data.castHash,
  on: event.data.on,
  channel: event.data.channel,
  feed: event.data.feed,
  reason: event.data.includeReason,
  position: event.data.index,
  homeFeedSnapBoostVariant: event.data.homeFeedSnapBoostVariant,
});

export const minimalCastViewEventToTrackingData = (
  event: ApiMinimalCastViewEvent,
): CastViewTrackingData => ({
  castHash: event.hash,
  on: event.on,
  channel: event.channel,
  feed: event.feed,
  includeReason: getCastFeedIncludeReasonType(event.reason),
  index: event.position,
  homeFeedSnapBoostVariant: event.homeFeedSnapBoostVariant,
});

type TrackedAnalyticsEvent =
  | TrackedCastViewEvent
  | ApiCastInteractionEvent
  | ApiFrameLaunchEvent
  | ApiUserProfileViewEvent
  | ApiVideoPlayEvent;

type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

export type AnalyticsEventWithoutTimestamp = DistributiveOmit<
  TrackedAnalyticsEvent,
  'ts'
>;

export type InternalEventingContextValue = {
  // Do not use these 2 directly - use EventingProvider instead
  _trackInternalEvent: (...events: AnalyticsEventWithoutTimestamp[]) => void;
  _trackUrgentInternalEvent: (
    ...events: AnalyticsEventWithoutTimestamp[]
  ) => void;

  // Used when fetching feed items to synchronously submit cast views
  getAndRemoveCastViewEvents: () => ApiMinimalCastViewEvent[];
  addBackCastViewEvents: (events: ApiMinimalCastViewEvent[]) => void;
};

const InternalEventingContext = createContext<InternalEventingContextValue>({
  _trackInternalEvent: () => {},
  _trackUrgentInternalEvent: () => {},
  getAndRemoveCastViewEvents: () => [],
  addBackCastViewEvents: () => {},
});

export type InternalEventingProviderProps = {
  children: ReactNode;
  onCastViewAccepted?: (event: CastViewTrackingData) => void;
};

const InternalEventingProvider: FC<InternalEventingProviderProps> = memo(
  ({ children, onCastViewAccepted }) => {
    const { apiClient } = useFarcasterApiClient();

    const recentCastHashesViewedRef = useRef<Record<string, number>>({});
    const eventsBufferRef = useRef<TrackedAnalyticsEvent[]>([]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const bufferEvent = useCallback(
      (
        event: TrackedAnalyticsEvent,
        {
          notifyCastViewAccepted = true,
        }: { notifyCastViewAccepted?: boolean } = {},
      ) => {
        if (event.type === 'cast-view') {
          const recentTimestamp =
            recentCastHashesViewedRef.current[event.data.castHash];

          if (recentTimestamp && event.ts >= recentTimestamp) {
            // Do not emit later cast view events for the same cast within the same batch
            // The reason we store/use the date is that we may get an older event from addBackCastViewEvents()
            return;
          }

          if (recentTimestamp) {
            eventsBufferRef.current = eventsBufferRef.current.filter(
              (bufferedEvent) =>
                bufferedEvent.type !== 'cast-view' ||
                bufferedEvent.data.castHash !== event.data.castHash,
            );
          }

          recentCastHashesViewedRef.current[event.data.castHash] = event.ts;

          if (notifyCastViewAccepted) {
            onCastViewAccepted?.(event.data);
          }
        }

        eventsBufferRef.current.push(event);
      },
      [onCastViewAccepted],
    );

    const submitEvents = useCallback(async () => {
      try {
        if (eventsBufferRef.current.length === 0) {
          return;
        }

        const events = eventsBufferRef.current;
        eventsBufferRef.current = [];

        const recentCastHashes = recentCastHashesViewedRef.current;
        recentCastHashesViewedRef.current = {};

        try {
          await apiClient.recordAnalyticsEvents({
            events: events.map((event) => {
              if (event.type !== 'cast-view') {
                return event;
              }

              return {
                type: 'cast-view',
                ts: event.ts,
                data: castViewTrackingDataToApiData(event.data),
              };
            }),
          });
        } catch (e) {
          // Something failed -> add events and viewed cast hashes back to buffers so we can retry later
          for (const [castHash, ts] of Object.entries(recentCastHashes)) {
            // The failed views should always be older than any new ones so should be safe to overwrite
            recentCastHashesViewedRef.current[castHash] = ts;
          }

          eventsBufferRef.current.push(...events);
        }
      } finally {
        timeoutRef.current = undefined;
      }
    }, [apiClient]);

    const _trackInternalEvent = useCallback(
      (...events: AnalyticsEventWithoutTimestamp[]) => {
        events.forEach((event) => bufferEvent({ ...event, ts: Date.now() }));

        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(
            submitEvents,
            SUBMIT_NORMAL_EVENTS_AFTER_MILLIS,
          );
        }
      },
      [bufferEvent, submitEvents],
    );

    const _trackUrgentInternalEvent = useCallback(
      (...events: AnalyticsEventWithoutTimestamp[]) => {
        events.forEach((event) => bufferEvent({ ...event, ts: Date.now() }));

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          submitEvents,
          SUBMIT_URGENT_EVENTS_AFTER_MILLIS,
        );
      },
      [bufferEvent, submitEvents],
    );

    const getAndRemoveCastViewEvents = useCallback(() => {
      const castViewEvents: ApiMinimalCastViewEvent[] = [];
      const nonCastViewEvents: TrackedAnalyticsEvent[] = [];

      for (const event of eventsBufferRef.current) {
        if (event.type === 'cast-view') {
          castViewEvents.push(
            trackedCastViewEventToMinimalCastViewEvent(event),
          );
        } else {
          nonCastViewEvents.push(event);
        }
      }
      eventsBufferRef.current = nonCastViewEvents;

      recentCastHashesViewedRef.current = {};
      return castViewEvents;
    }, []);

    const addBackCastViewEvents = useCallback(
      (events: ApiMinimalCastViewEvent[]) => {
        events.forEach((event) => {
          bufferEvent(
            {
              type: 'cast-view',
              ts: event.ts,
              data: minimalCastViewEventToTrackingData(event),
            },
            { notifyCastViewAccepted: false },
          );
        });
      },
      [bufferEvent],
    );

    const props = useMemo(
      () => ({
        _trackInternalEvent,
        _trackUrgentInternalEvent,
        getAndRemoveCastViewEvents,
        addBackCastViewEvents,
      }),
      [
        _trackInternalEvent,
        _trackUrgentInternalEvent,
        getAndRemoveCastViewEvents,
        addBackCastViewEvents,
      ],
    );

    return (
      <InternalEventingContext.Provider value={props}>
        {children}
      </InternalEventingContext.Provider>
    );
  },
);
InternalEventingProvider.displayName = 'InternalEventingProvider';

const useInternalEventing = () => useContext(InternalEventingContext);

export { InternalEventingProvider, useInternalEventing };
