import { AnalyticsEvent } from 'farcaster-analytics';

import { AnalyticsEventData } from '~/types';

const maxHomeFeedSessionDurationSeconds = 30 * 60;
const softCloseDelayMs = 30 * 1000;
const hiddenCloseDelayMs = 5 * 60 * 1000;

type TrackEvent = (event: AnalyticsEvent, data: AnalyticsEventData) => void;

type EmitEvent = (event: AnalyticsEvent, data: AnalyticsEventData) => void;

const firstInteractionEvents: Record<string, string | undefined> = {
  'account.follow': 'account.follow',
  'cast.open': 'cast.open',
  'cast.react': 'cast.react',
  'profile.open': 'profile.view',
  'profile.view': 'profile.view',
};

let homeFeedSessionStartedAt: number | undefined;
let homeFeedSessionActiveStartedAt: number | undefined;
let homeFeedSessionDurationMs = 0;
let homeFeedSessionId: string | undefined;
let homeFeedSessionProps: AnalyticsEventData = {};
let homeFeedSessionFirstInteractionTracked = false;
let closeTimeout: ReturnType<typeof setTimeout> | undefined;
let closeScheduledAt: number | undefined;

const getDurationSeconds = () => {
  const activeDurationMs =
    typeof homeFeedSessionActiveStartedAt === 'number'
      ? Date.now() - homeFeedSessionActiveStartedAt
      : 0;

  return Math.min(
    (homeFeedSessionDurationMs + activeDurationMs) / 1000,
    maxHomeFeedSessionDurationSeconds,
  );
};

const clearScheduledClose = () => {
  if (typeof closeTimeout !== 'undefined') {
    clearTimeout(closeTimeout);
    closeTimeout = undefined;
  }

  closeScheduledAt = undefined;
};

const pauseHomeFeedSession = () => {
  if (typeof homeFeedSessionActiveStartedAt !== 'number') {
    return;
  }

  homeFeedSessionDurationMs += Date.now() - homeFeedSessionActiveStartedAt;
  homeFeedSessionActiveStartedAt = undefined;
};

const buildHomeFeedSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const openHomeFeedSession = ({
  trackEvent,
  props,
}: {
  trackEvent: TrackEvent;
  props: AnalyticsEventData;
}) => {
  if (typeof closeScheduledAt === 'number' && Date.now() >= closeScheduledAt) {
    closeHomeFeedSession({ trackEvent });
  }

  clearScheduledClose();

  if (typeof homeFeedSessionStartedAt === 'number') {
    if (typeof homeFeedSessionActiveStartedAt !== 'number') {
      homeFeedSessionActiveStartedAt = Date.now();
    }

    return;
  }

  homeFeedSessionStartedAt = Date.now();
  homeFeedSessionActiveStartedAt = homeFeedSessionStartedAt;
  homeFeedSessionDurationMs = 0;
  homeFeedSessionId = buildHomeFeedSessionId();
  homeFeedSessionFirstInteractionTracked = false;
  homeFeedSessionProps = {
    ...props,
    homeFeedSessionId,
  };

  trackEvent(AnalyticsEvent.HomeFeedOpen, homeFeedSessionProps);
};

const resumeHomeFeedSession = ({ trackEvent }: { trackEvent: TrackEvent }) => {
  if (typeof homeFeedSessionStartedAt !== 'number') {
    return;
  }

  if (typeof closeScheduledAt === 'number' && Date.now() >= closeScheduledAt) {
    closeHomeFeedSession({ trackEvent });
    return;
  }

  clearScheduledClose();

  if (typeof homeFeedSessionActiveStartedAt !== 'number') {
    homeFeedSessionActiveStartedAt = Date.now();
  }
};

const closeHomeFeedSession = ({ trackEvent }: { trackEvent: TrackEvent }) => {
  if (typeof homeFeedSessionStartedAt !== 'number') {
    return;
  }

  clearScheduledClose();
  pauseHomeFeedSession();

  const duration_seconds = getDurationSeconds();
  const props = homeFeedSessionProps;

  homeFeedSessionStartedAt = undefined;
  homeFeedSessionActiveStartedAt = undefined;
  homeFeedSessionDurationMs = 0;
  homeFeedSessionId = undefined;
  homeFeedSessionProps = {};
  homeFeedSessionFirstInteractionTracked = false;

  trackEvent(AnalyticsEvent.HomeFeedClose, {
    ...props,
    duration_seconds,
  });
};

const scheduleHomeFeedSessionClose = ({
  trackEvent,
  pause = false,
  delayMs = softCloseDelayMs,
}: {
  trackEvent: TrackEvent;
  pause?: boolean;
  delayMs?: number;
}) => {
  if (typeof homeFeedSessionStartedAt !== 'number') {
    return;
  }

  if (pause) {
    pauseHomeFeedSession();
  }

  clearScheduledClose();

  closeTimeout = setTimeout(() => {
    closeHomeFeedSession({ trackEvent });
  }, delayMs);
  closeScheduledAt = Date.now() + delayMs;
};

const scheduleHiddenHomeFeedSessionClose = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  scheduleHomeFeedSessionClose({
    trackEvent,
    pause: true,
    delayMs: hiddenCloseDelayMs,
  });
};

const trackHomeFeedFirstInteraction = ({
  emitEvent,
  eventName,
  eventProps,
}: {
  emitEvent: EmitEvent;
  eventName: string;
  eventProps: AnalyticsEventData;
}) => {
  const interaction = firstInteractionEvents[eventName];

  if (
    typeof interaction === 'undefined' ||
    typeof homeFeedSessionStartedAt !== 'number' ||
    typeof homeFeedSessionId !== 'string' ||
    homeFeedSessionFirstInteractionTracked
  ) {
    return;
  }

  homeFeedSessionFirstInteractionTracked = true;

  emitEvent(AnalyticsEvent.HomeFeedFirstInteraction, {
    ...(homeFeedSessionProps ?? {}),
    ...(eventProps ?? {}),
    homeFeedSessionId,
    interaction,
    time_to_first_interaction_seconds: getDurationSeconds(),
  });
};

export {
  closeHomeFeedSession,
  openHomeFeedSession,
  resumeHomeFeedSession,
  scheduleHiddenHomeFeedSessionClose,
  scheduleHomeFeedSessionClose,
  trackHomeFeedFirstInteraction,
};
