export const AUDIO_SPACE_EVENTS = {
  listViewed: 'audio_space_list_viewed',
  cardOpened: 'audio_space_card_opened',
  openSource: 'audio_space_open_source',
  joinAttempted: 'audio_space_join_attempted',
  joinApiSucceeded: 'audio_space_join_api_succeeded',
  joinApiFailed: 'audio_space_join_api_failed',
  createApiFailed: 'audio_space_create_api_failed',
  scheduleApiFailed: 'audio_space_schedule_api_failed',
  audioSessionConfigureFailed: 'audio_space_audio_session_configure_failed',
  livekitConnectStarted: 'audio_space_livekit_connect_started',
  livekitConnectSucceeded: 'audio_space_livekit_connect_succeeded',
  livekitConnectFailed: 'audio_space_livekit_connect_failed',
  joinCompleted: 'audio_space_join_completed',
  joinCancelled: 'audio_space_join_cancelled',
  connectionStateChanged: 'audio_space_connection_state_changed',
  reconnectStarted: 'audio_space_reconnect_started',
  reconnectSucceeded: 'audio_space_reconnect_succeeded',
  reconnectFailed: 'audio_space_reconnect_failed',
  micToggleAttempted: 'audio_space_mic_toggle_attempted',
  micToggleFailed: 'audio_space_mic_toggle_failed',
  micPermissionDenied: 'audio_space_mic_permission_denied',
  handRaiseToggled: 'audio_space_hand_raise_toggled',
  stageInviteReceived: 'audio_space_stage_invite_received',
  stageInviteAccepted: 'audio_space_stage_invite_accepted',
  stageInviteDeclined: 'audio_space_stage_invite_declined',
  roleChanged: 'audio_space_role_changed',
  leaveStage: 'audio_space_leave_stage',
  leaveAttempted: 'audio_space_leave_attempted',
  leaveCompleted: 'audio_space_leave_completed',
  leaveFailed: 'audio_space_leave_failed',
  endAttempted: 'audio_space_end_attempted',
  endCompleted: 'audio_space_end_completed',
  endFailed: 'audio_space_end_failed',
  roomEndedReceived: 'audio_space_room_ended_received',
  removedByHostReceived: 'audio_space_removed_by_host_received',
  reactionSent: 'audio_space_reaction_sent',
  reactionSendFailed: 'audio_space_reaction_send_failed',
  chatSendFailed: 'audio_space_chat_send_failed',
} as const;

export type AudioSpaceEventName =
  (typeof AUDIO_SPACE_EVENTS)[keyof typeof AUDIO_SPACE_EVENTS];

export const AUDIO_SPACE_ENTRY_SOURCES = [
  'spaces_list',
  'live_strip',
  'mini_player',
  'notification',
  'deep_link',
  'unknown',
] as const;

export type AudioSpaceEntrySource = (typeof AUDIO_SPACE_ENTRY_SOURCES)[number];

export const AUDIO_SPACE_PERMISSION_STATES = [
  'granted',
  'denied',
  'prompt',
  'unavailable',
  'unknown',
] as const;

export type AudioSpacePermissionState =
  (typeof AUDIO_SPACE_PERMISSION_STATES)[number];

export type AudioSpaceCommonContext = {
  spaceSessionId: string;
  joinAttemptId?: string;
  roomId?: string;
  viewerFid?: number;
  role?: string;
  isHost?: boolean;
  platform: 'mobile' | 'web';
  entrySource: AudioSpaceEntrySource;
  connectionState?: string;
  participantCount?: number;
  audioPermissionState?: AudioSpacePermissionState;
  errorCode?: string;
  errorName?: string;
  errorMessageSanitized?: string;
};

const MAX_ERROR_MESSAGE_LENGTH = 180;
const DEDUPE_PRUNE_AGE_MS = 5 * 60 * 1000;
const DEDUPE_MAX_ENTRIES = 1000;

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export function createAudioSpaceTelemetryId(prefix: string) {
  return `${prefix}_${Date.now()}_${randomSuffix()}`;
}

export function sanitizeAudioSpaceErrorMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message
    .replace(/https?:\/\/\S+/gi, '[redacted_url]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted_email]')
    .replace(
      /\b(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+)\b/g,
      '[redacted_token]',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

export function normalizeAudioSpaceError(error: unknown): {
  errorCode?: string;
  errorName?: string;
  errorMessageSanitized?: string;
} {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    const maybeCode =
      'code' in error && typeof (error as { code: unknown }).code === 'string'
        ? (error as { code: string }).code
        : undefined;
    const maybeName =
      'name' in error && typeof (error as { name: unknown }).name === 'string'
        ? (error as { name: string }).name
        : 'Error';

    return {
      errorCode: maybeCode,
      errorName: maybeName,
      errorMessageSanitized: sanitizeAudioSpaceErrorMessage(
        (error as { message: string }).message,
      ),
    };
  }

  if (typeof error === 'string') {
    return {
      errorName: 'Error',
      errorMessageSanitized: sanitizeAudioSpaceErrorMessage(error),
    };
  }

  return {
    errorName: 'UnknownError',
    errorMessageSanitized: sanitizeAudioSpaceErrorMessage(String(error)),
  };
}

export function shouldEmitAudioSpaceEvent(
  dedupeMap: Map<string, number>,
  key: string,
  dedupeWindowMs: number,
) {
  const now = Date.now();

  // Keep long-lived dedupe maps bounded to avoid unbounded growth.
  if (dedupeMap.size >= DEDUPE_MAX_ENTRIES) {
    for (const [eventKey, ts] of dedupeMap.entries()) {
      if (now - ts > DEDUPE_PRUNE_AGE_MS) {
        dedupeMap.delete(eventKey);
      }
    }

    // If still above threshold, drop oldest entries.
    if (dedupeMap.size >= DEDUPE_MAX_ENTRIES) {
      const sortedEntries = Array.from(dedupeMap.entries()).sort(
        (a, b) => a[1] - b[1],
      );
      const entriesToDrop = dedupeMap.size - DEDUPE_MAX_ENTRIES + 1;
      for (let i = 0; i < entriesToDrop; i += 1) {
        dedupeMap.delete(sortedEntries[i][0]);
      }
    }
  }

  const last = dedupeMap.get(key);
  if (typeof last === 'number' && now - last < dedupeWindowMs) {
    return false;
  }
  dedupeMap.set(key, now);
  return true;
}
