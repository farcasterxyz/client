import { AnalyticsEvent } from 'farcaster-analytics';
import { EventType, EventV2Props } from 'farcaster-client-hooks';

import { getStorage } from './FastStorageUtils';

const maxHomeFeedSessionDurationSeconds = 30 * 60;
const softCloseDelayMs = 30 * 1000;
const backgroundCloseDelayMs = 5 * 60 * 1000;
const pendingBackgroundCloseStorageKey =
  'home-feed-pending-background-close-v1';

type TrackEvent = (event: EventType, props?: EventV2Props) => void;

type EmitEvent = (event: AnalyticsEvent, props?: EventV2Props) => void;

type PendingBackgroundClose = {
  homeFeedSessionStartedAt: number;
  homeFeedSessionDurationMs: number;
  homeFeedSessionId: string;
  homeFeedSessionFirstInteractionTracked: boolean;
  closeScheduledAt: number;
};

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
  getStorage().delete(pendingBackgroundCloseStorageKey);
};

const pauseHomeFeedSession = () => {
  if (typeof homeFeedSessionActiveStartedAt !== 'number') {
    return;
  }

  homeFeedSessionDurationMs += Date.now() - homeFeedSessionActiveStartedAt;
  homeFeedSessionActiveStartedAt = undefined;
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
    typeof homeFeedSessionStartedAt !== 'number' ||
    typeof homeFeedSessionId !== 'string' ||
    typeof closeScheduledAt !== 'number'
  ) {
    return;
  }

  const pendingClose: PendingBackgroundClose = {
    homeFeedSessionStartedAt,
    homeFeedSessionDurationMs,
    homeFeedSessionId,
    homeFeedSessionFirstInteractionTracked,
    closeScheduledAt,
  };

  getStorage().set(
    pendingBackgroundCloseStorageKey,
    JSON.stringify(pendingClose),
  );
};

const buildHomeFeedSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const recoverPendingBackgroundHomeFeedSessionClose = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  if (typeof homeFeedSessionStartedAt === 'number') {
    return;
  }

  const pendingClose = readPendingBackgroundClose();

  if (typeof pendingClose === 'undefined') {
    return;
  }

  if (Date.now() >= pendingClose.closeScheduledAt) {
    const duration_seconds = Math.min(
      pendingClose.homeFeedSessionDurationMs / 1000,
      maxHomeFeedSessionDurationSeconds,
    );

    getStorage().delete(pendingBackgroundCloseStorageKey);
    trackEvent(AnalyticsEvent.HomeFeedClose, {
      homeFeedSessionId: pendingClose.homeFeedSessionId,
      duration_seconds,
    });
    return;
  }

  homeFeedSessionStartedAt = pendingClose.homeFeedSessionStartedAt;
  homeFeedSessionActiveStartedAt = undefined;
  homeFeedSessionDurationMs = pendingClose.homeFeedSessionDurationMs;
  homeFeedSessionId = pendingClose.homeFeedSessionId;
  homeFeedSessionFirstInteractionTracked =
    pendingClose.homeFeedSessionFirstInteractionTracked;

  scheduleHomeFeedSessionClose({
    trackEvent,
    delayMs: pendingClose.closeScheduledAt - Date.now(),
  });
  persistPendingBackgroundClose();
};

const openHomeFeedSession = ({ trackEvent }: { trackEvent: TrackEvent }) => {
  recoverPendingBackgroundHomeFeedSessionClose({ trackEvent });

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

  trackEvent(AnalyticsEvent.HomeFeedOpen, { homeFeedSessionId });
};

const resumeHomeFeedSession = ({ trackEvent }: { trackEvent: TrackEvent }) => {
  recoverPendingBackgroundHomeFeedSessionClose({ trackEvent });

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
  const sessionId = homeFeedSessionId;

  homeFeedSessionStartedAt = undefined;
  homeFeedSessionActiveStartedAt = undefined;
  homeFeedSessionDurationMs = 0;
  homeFeedSessionId = undefined;
  homeFeedSessionFirstInteractionTracked = false;

  trackEvent(AnalyticsEvent.HomeFeedClose, {
    homeFeedSessionId: sessionId,
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

  // Soft closes are intentionally memory-only. Persisting transient navigation
  // exits would make UI noise durable and fragment one feed visit into sessions.
  if (pause) {
    pauseHomeFeedSession();
  }

  clearScheduledClose();

  closeTimeout = setTimeout(() => {
    closeHomeFeedSession({ trackEvent });
  }, delayMs);
  closeScheduledAt = Date.now() + delayMs;
};

const scheduleBackgroundHomeFeedSessionClose = ({
  trackEvent,
}: {
  trackEvent: TrackEvent;
}) => {
  scheduleHomeFeedSessionClose({
    trackEvent,
    pause: true,
    delayMs: backgroundCloseDelayMs,
  });
  persistPendingBackgroundClose();
};

const trackHomeFeedFirstInteraction = ({
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
    typeof homeFeedSessionStartedAt !== 'number' ||
    typeof homeFeedSessionId !== 'string' ||
    homeFeedSessionFirstInteractionTracked
  ) {
    return;
  }

  homeFeedSessionFirstInteractionTracked = true;

  emitEvent(AnalyticsEvent.HomeFeedFirstInteraction, {
    ...(eventProps ?? {}),
    homeFeedSessionId,
    interaction,
    time_to_first_interaction_seconds: getDurationSeconds(),
  });
};

export {
  closeHomeFeedSession,
  openHomeFeedSession,
  recoverPendingBackgroundHomeFeedSessionClose,
  resumeHomeFeedSession,
  scheduleBackgroundHomeFeedSessionClose,
  scheduleHomeFeedSessionClose,
  trackHomeFeedFirstInteraction,
};
