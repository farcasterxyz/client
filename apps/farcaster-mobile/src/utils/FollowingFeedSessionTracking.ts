import { AnalyticsEvent } from 'farcaster-analytics';
import { EventType, EventV2Props } from 'farcaster-client-hooks';

import { getStorage } from './FastStorageUtils';

const maxFollowingFeedSessionDurationSeconds = 30 * 60;
const softCloseDelayMs = 30 * 1000;
const backgroundCloseDelayMs = 5 * 60 * 1000;
const pendingBackgroundCloseStorageKey =
  'following-feed-pending-background-close-v1';

type TrackEvent = (event: EventType, props?: EventV2Props) => void;

type EmitEvent = (event: AnalyticsEvent, props?: EventV2Props) => void;

type PendingBackgroundClose = {
  followingFeedSessionStartedAt: number;
  followingFeedSessionDurationMs: number;
  followingFeedSessionId: string;
  followingFeedSessionFirstInteractionTracked: boolean;
  closeScheduledAt: number;
};

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
  getStorage().delete(pendingBackgroundCloseStorageKey);
};

const pauseFollowingFeedSession = () => {
  if (typeof followingFeedSessionActiveStartedAt !== 'number') {
    return;
  }

  followingFeedSessionDurationMs +=
    Date.now() - followingFeedSessionActiveStartedAt;
  followingFeedSessionActiveStartedAt = undefined;
};

const readPendingBackgroundClose = () => {
  const rawPendingClose = getStorage().getString(
    pendingBackgroundCloseStorageKey,
  );

  if (typeof rawPendingClose === 'undefined') {
    return undefined;
  }

  try {
    return JSON.parse(rawPendingClose) as PendingBackgroundClose;
  } catch {
    getStorage().delete(pendingBackgroundCloseStorageKey);
    return undefined;
  }
};

const persistPendingBackgroundClose = () => {
  if (
    typeof followingFeedSessionStartedAt !== 'number' ||
    typeof followingFeedSessionId !== 'string' ||
    typeof closeScheduledAt !== 'number'
  ) {
    return;
  }

  const pendingClose: PendingBackgroundClose = {
    followingFeedSessionStartedAt,
    followingFeedSessionDurationMs,
    followingFeedSessionId,
    followingFeedSessionFirstInteractionTracked,
    closeScheduledAt,
  };

  getStorage().set(
    pendingBackgroundCloseStorageKey,
    JSON.stringify(pendingClose),
  );
};

const buildFollowingFeedSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const recoverPendingBackgroundFollowingFeedSessionClose = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  if (typeof followingFeedSessionStartedAt === 'number') {
    return;
  }

  const pendingClose = readPendingBackgroundClose();

  if (typeof pendingClose === 'undefined') {
    return;
  }

  if (Date.now() >= pendingClose.closeScheduledAt) {
    const duration_seconds = Math.min(
      pendingClose.followingFeedSessionDurationMs / 1000,
      maxFollowingFeedSessionDurationSeconds,
    );

    getStorage().delete(pendingBackgroundCloseStorageKey);
    trackEvent(AnalyticsEvent.FollowingFeedClose, {
      followingFeedSessionId: pendingClose.followingFeedSessionId,
      duration_seconds,
    });
    return;
  }

  followingFeedSessionStartedAt = pendingClose.followingFeedSessionStartedAt;
  followingFeedSessionActiveStartedAt = undefined;
  followingFeedSessionDurationMs = pendingClose.followingFeedSessionDurationMs;
  followingFeedSessionId = pendingClose.followingFeedSessionId;
  followingFeedSessionFirstInteractionTracked =
    pendingClose.followingFeedSessionFirstInteractionTracked;

  scheduleFollowingFeedSessionClose({
    trackEvent,
    delayMs: pendingClose.closeScheduledAt - Date.now(),
  });
  persistPendingBackgroundClose();
};

const openFollowingFeedSession = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  recoverPendingBackgroundFollowingFeedSessionClose({ trackEvent });

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

  trackEvent(AnalyticsEvent.FollowingFeedOpen, {
    followingFeedSessionId,
  });
};

const resumeFollowingFeedSession = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  recoverPendingBackgroundFollowingFeedSessionClose({ trackEvent });

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
  const sessionId = followingFeedSessionId;

  followingFeedSessionStartedAt = undefined;
  followingFeedSessionActiveStartedAt = undefined;
  followingFeedSessionDurationMs = 0;
  followingFeedSessionId = undefined;
  followingFeedSessionFirstInteractionTracked = false;

  trackEvent(AnalyticsEvent.FollowingFeedClose, {
    followingFeedSessionId: sessionId,
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

const scheduleBackgroundFollowingFeedSessionClose = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  scheduleFollowingFeedSessionClose({
    trackEvent,
    pause: true,
    delayMs: backgroundCloseDelayMs,
  });
  persistPendingBackgroundClose();
};

const trackFollowingFeedFirstInteraction = ({
  emitEvent,
  eventName,
  eventProps,
}: {
  emitEvent: EmitEvent;
  eventName: string;
  eventProps?: EventV2Props;
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
    ...(eventProps ?? {}),
    followingFeedSessionId,
    interaction,
    time_to_first_interaction_seconds: getDurationSeconds(),
  });
};

export {
  closeFollowingFeedSession,
  openFollowingFeedSession,
  recoverPendingBackgroundFollowingFeedSessionClose,
  resumeFollowingFeedSession,
  scheduleBackgroundFollowingFeedSessionClose,
  scheduleFollowingFeedSessionClose,
  trackFollowingFeedFirstInteraction,
};
