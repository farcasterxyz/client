import { AnalyticsEvent } from 'farcaster-analytics';

import { AnalyticsEventData } from '~/types';

const maxFollowingFeedSessionDurationSeconds = 30 * 60;
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

let followingFeedSessionStartedAt: number | undefined;
let followingFeedSessionActiveStartedAt: number | undefined;
let followingFeedSessionDurationMs = 0;
let followingFeedSessionId: string | undefined;
let followingFeedSessionProps: AnalyticsEventData = {};
let followingFeedSessionFirstInteractionTracked = false;
let closeTimeout: ReturnType<typeof setTimeout> | undefined;
let closeScheduledAt: number | undefined;

const getDurationSeconds = () => {
  const activeDurationMs =
    typeof followingFeedSessionActiveStartedAt === 'number'
      ? Date.now() - followingFeedSessionActiveStartedAt
      : 0;

  return Math.min(
    (followingFeedSessionDurationMs + activeDurationMs) / 1000,
    maxFollowingFeedSessionDurationSeconds,
  );
};

const clearScheduledClose = () => {
  if (typeof closeTimeout !== 'undefined') {
    clearTimeout(closeTimeout);
    closeTimeout = undefined;
  }

  closeScheduledAt = undefined;
};

const pauseFollowingFeedSession = () => {
  if (typeof followingFeedSessionActiveStartedAt !== 'number') {
    return;
  }

  followingFeedSessionDurationMs +=
    Date.now() - followingFeedSessionActiveStartedAt;
  followingFeedSessionActiveStartedAt = undefined;
};

const buildFollowingFeedSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const openFollowingFeedSession = ({
  trackEvent,
  props,
}: {
  trackEvent: TrackEvent;
  props: AnalyticsEventData;
}) => {
  if (typeof closeScheduledAt === 'number' && Date.now() >= closeScheduledAt) {
    closeFollowingFeedSession({ trackEvent });
  }

  clearScheduledClose();

  if (typeof followingFeedSessionStartedAt === 'number') {
    if (typeof followingFeedSessionActiveStartedAt !== 'number') {
      followingFeedSessionActiveStartedAt = Date.now();
    }

    return;
  }

  followingFeedSessionStartedAt = Date.now();
  followingFeedSessionActiveStartedAt = followingFeedSessionStartedAt;
  followingFeedSessionDurationMs = 0;
  followingFeedSessionId = buildFollowingFeedSessionId();
  followingFeedSessionFirstInteractionTracked = false;
  followingFeedSessionProps = {
    ...props,
    followingFeedSessionId,
  };

  trackEvent(AnalyticsEvent.FollowingFeedOpen, followingFeedSessionProps);
};

const resumeFollowingFeedSession = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  if (typeof followingFeedSessionStartedAt !== 'number') {
    return;
  }

  if (typeof closeScheduledAt === 'number' && Date.now() >= closeScheduledAt) {
    closeFollowingFeedSession({ trackEvent });
    return;
  }

  clearScheduledClose();

  if (typeof followingFeedSessionActiveStartedAt !== 'number') {
    followingFeedSessionActiveStartedAt = Date.now();
  }
};

const closeFollowingFeedSession = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  if (typeof followingFeedSessionStartedAt !== 'number') {
    return;
  }

  clearScheduledClose();
  pauseFollowingFeedSession();

  const duration_seconds = getDurationSeconds();
  const props = followingFeedSessionProps;

  followingFeedSessionStartedAt = undefined;
  followingFeedSessionActiveStartedAt = undefined;
  followingFeedSessionDurationMs = 0;
  followingFeedSessionId = undefined;
  followingFeedSessionProps = {};
  followingFeedSessionFirstInteractionTracked = false;

  trackEvent(AnalyticsEvent.FollowingFeedClose, {
    ...props,
    duration_seconds,
  });
};

const scheduleFollowingFeedSessionClose = ({
  trackEvent,
  pause = false,
  delayMs = softCloseDelayMs,
}: {
  trackEvent: TrackEvent;
  pause?: boolean;
  delayMs?: number;
}) => {
  if (typeof followingFeedSessionStartedAt !== 'number') {
    return;
  }

  if (pause) {
    pauseFollowingFeedSession();
  }

  clearScheduledClose();

  closeTimeout = setTimeout(() => {
    closeFollowingFeedSession({ trackEvent });
  }, delayMs);
  closeScheduledAt = Date.now() + delayMs;
};

const scheduleHiddenFollowingFeedSessionClose = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  scheduleFollowingFeedSessionClose({
    trackEvent,
    pause: true,
    delayMs: hiddenCloseDelayMs,
  });
};

const trackFollowingFeedFirstInteraction = ({
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
    typeof followingFeedSessionStartedAt !== 'number' ||
    typeof followingFeedSessionId !== 'string' ||
    followingFeedSessionFirstInteractionTracked
  ) {
    return;
  }

  followingFeedSessionFirstInteractionTracked = true;

  emitEvent(AnalyticsEvent.FollowingFeedFirstInteraction, {
    ...(followingFeedSessionProps ?? {}),
    ...(eventProps ?? {}),
    followingFeedSessionId,
    interaction,
    time_to_first_interaction_seconds: getDurationSeconds(),
  });
};

export {
  closeFollowingFeedSession,
  openFollowingFeedSession,
  resumeFollowingFeedSession,
  scheduleFollowingFeedSessionClose,
  scheduleHiddenFollowingFeedSessionClose,
  trackFollowingFeedFirstInteraction,
};
