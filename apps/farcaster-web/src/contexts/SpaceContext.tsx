import {
  ApiAudioRoom,
  ApiAudioRoomEndedReason,
  ApiAudioRoomPromoteRole,
  ApiAudioRoomRole,
} from 'farcaster-client-data';
import {
  AUDIO_SPACE_ENTRY_SOURCES,
  AUDIO_SPACE_EVENTS,
  type AudioSpaceCommonContext,
  type AudioSpaceEntrySource,
  createAudioSpaceTelemetryId,
  normalizeAudioSpaceError,
  useAcceptStageInviteAudioRoom,
  useAudioRoomParticipants,
  useDeclineStageInviteAudioRoom,
  useEndAudioRoom,
  useHeartbeatAudioRoom,
  useInvalidateAudioRoom,
  useInvalidateAudioRoomParticipants,
  useInvalidateAudioRoomsList,
  useJoinAudioRoom,
  useLeaveAudioRoom,
  useRaiseHandAudioRoom,
  useRecordAudioRoomSpeakerActivity,
  useWebSockets,
} from 'farcaster-client-hooks';
import {
  ConnectionState,
  type Participant,
  type RemoteTrack,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { SpaceAlertModal } from '~/components/spaces/SpaceAlertModal';
import { appPathPrefix } from '~/constants/routePrefixes';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { trackWebAudioSpaceEvent } from '~/utils/audioSpaceInstrumentation';
import {
  attachLivekitAudioTrack,
  detachLivekitTrack,
  disconnectLivekitRoom,
} from '~/utils/livekitRoomCleanup';
import { toast as appToast } from '~/utils/toast';

import { rollbackJoinedRoomOnConnectFailure } from './spaceJoinRollback';

type JoinedSpace = {
  room: ApiAudioRoom;
  role: ApiAudioRoomRole;
  viewerFid: number;
  spaceSessionId: string;
  entrySource: AudioSpaceEntrySource;
  muted: boolean;
  handRaised: boolean;
  joinedAtMs: number;
};

/** Reaction event from another participant, surfaced to the room page */
type IncomingReaction = {
  id: number;
  fid: number;
  emoji: string;
  offset: number;
};

type JoinCallOptions = {
  skipSwitchConfirmation?: boolean;
  skipJoinRollback?: boolean;
  spaceSessionId?: string;
  initialMicrophoneEnabled?: boolean;
};

type SpaceContextValue = {
  joined: JoinedSpace | null;
  elapsedSec: number;
  connectionState: ConnectionState;
  participantCount: number;
  livekitRoom: Room | null;
  /** Set of fids currently speaking (based on LiveKit audio levels) */
  activeSpeakerFids: Set<number>;
  /** Set of participant fids whose microphone is currently unmuted in LiveKit */
  unmutedSpeakerFids: Set<number>;
  /** Set of all participant fids currently connected to LiveKit in this room (includes listeners and local viewer) */
  connectedParticipantFids: Set<number>;
  /** Incoming reactions from other participants (for floating emoji UI) */
  incomingReactions: IncomingReaction[];
  /** Whether mic permission was denied */
  micPermissionDenied: boolean;
  pendingStageInvite: {
    role: ApiAudioRoomPromoteRole;
    inviterFid: number;
  } | null;
  endedReason: ApiAudioRoomEndedReason | null;
  removedByHostRoomId: string | null;
  clearRemovedByHost: () => void;
  join: (
    roomId: string,
    entrySource?: AudioSpaceEntrySource,
    options?: JoinCallOptions,
  ) => Promise<boolean>;
  prepareForNewLiveSpace: () => Promise<boolean>;
  leave: () => Promise<void>;
  endRoom: (options?: { throwOnEndFailure?: boolean }) => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleHand: () => void;
  acceptStageInvite: () => Promise<void>;
  declineStageInvite: () => Promise<void>;
  clearReaction: (id: number) => void;
};

const SpaceContext = createContext<SpaceContextValue | null>(null);
const RECORD_SPEAKER_ACTIVITY_MIN_INTERVAL_MS = 1_000;

function handleTrackSubscribed(track: RemoteTrack) {
  attachLivekitAudioTrack(track);
}

function handleTrackUnsubscribed(track: RemoteTrack) {
  detachLivekitTrack(track);
}

/** Parse fid from LiveKit participant identity (format: "fid:<number>") */
function fidFromIdentity(identity: string): number | null {
  if (identity.startsWith('fid:')) {
    const n = parseInt(identity.slice(4), 10);
    return isNaN(n) ? null : n;
  }
  // Fallback: identity might just be a number
  const n = parseInt(identity, 10);
  return isNaN(n) ? null : n;
}

function sortedSpeakerFids(fids: Set<number>): number[] {
  return [...fids].sort((a, b) => a - b);
}

function isMicPermissionError(err: unknown): boolean {
  if (err instanceof DOMException) {
    return (
      err.name === 'NotAllowedError' ||
      err.name === 'PermissionDeniedError' ||
      err.name === 'NotReadableError' ||
      err.name === 'NotFoundError' ||
      err.name === 'SecurityError'
    );
  }
  if (typeof err === 'object' && err !== null) {
    const maybeName = (err as { name?: string }).name;
    return (
      maybeName === 'NotAllowedError' ||
      maybeName === 'PermissionDeniedError' ||
      maybeName === 'NotReadableError' ||
      maybeName === 'NotFoundError' ||
      maybeName === 'SecurityError'
    );
  }
  return false;
}

async function muteTrackedLivekitRooms(
  connected: Room | null,
  connecting: Room | null,
): Promise<void> {
  if (connected) {
    await connected.localParticipant
      .setMicrophoneEnabled(false)
      .catch(() => {});
  }
  if (connecting && connecting !== connected) {
    await connecting.localParticipant
      .setMicrophoneEnabled(false)
      .catch(() => {});
  }
}

function resetConnectionStateIfInactive({
  livekitRoomRef,
  connectingLivekitRoomRef,
  connectionStateRef,
  setConnectionState,
}: {
  livekitRoomRef: { current: Room | null };
  connectingLivekitRoomRef: { current: Room | null };
  connectionStateRef: { current: ConnectionState };
  setConnectionState: (state: ConnectionState) => void;
}): void {
  if (!livekitRoomRef.current && !connectingLivekitRoomRef.current) {
    connectionStateRef.current = ConnectionState.Disconnected;
    setConnectionState(ConnectionState.Disconnected);
  }
}

function isPublishingRole(role: ApiAudioRoomRole): boolean {
  return role === 'host' || role === 'cohost' || role === 'speaker';
}

function resolveEffectiveRole({
  joinedRole,
  connectRole,
  sameSession,
}: {
  joinedRole: ApiAudioRoomRole | null;
  connectRole: ApiAudioRoomRole;
  sameSession: boolean;
}): ApiAudioRoomRole {
  if (!sameSession || !joinedRole) {
    return connectRole;
  }
  // Demotion wins over stale publishing tokens from in-flight joins.
  if (joinedRole === 'listener') {
    return 'listener';
  }
  if (isPublishingRole(joinedRole)) {
    return joinedRole;
  }
  return joinedRole;
}

async function applySpeakerMicrophoneState({
  participant,
  enabled,
  previousRole,
}: {
  participant: Room['localParticipant'];
  enabled: boolean;
  previousRole: ApiAudioRoomRole;
}): Promise<void> {
  if (enabled) {
    await participant.setMicrophoneEnabled(true);
    return;
  }
  const hasMicrophonePublication =
    participant.getTrackPublication(Track.Source.Microphone) !== undefined;
  // Fresh LiveKit rooms (and listener→publisher) have no mic publication yet.
  // Do not trust previousRole alone: in-place promotion can update joined.role
  // before a fallback reconnect creates a new Room.
  if (!hasMicrophonePublication || !isPublishingRole(previousRole)) {
    // Enable first so mute creates a muted publication.
    await participant.setMicrophoneEnabled(true);
    await participant.setMicrophoneEnabled(false);
    return;
  }
  await participant.setMicrophoneEnabled(false);
}

function isAudioSpaceEntrySource(
  value: unknown,
): value is AudioSpaceEntrySource {
  return (
    typeof value === 'string' &&
    (AUDIO_SPACE_ENTRY_SOURCES as readonly string[]).includes(value)
  );
}

const SpaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // SpaceProvider is currently mounted inside `AuthedLayout`, so it only
  // renders for signed-in users and `currentUser` should always be defined
  // here. We still use the cached variant (and `join` below still
  // short-circuits when the viewer isn't signed in) so this stays safe if
  // the provider is ever moved above the auth boundary.
  const currentUser = useCachedCurrentUser();
  const [joined, setJoined] = useState<JoinedSpace | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [participantCount, setParticipantCount] = useState(0);
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [activeSpeakerFids, setActiveSpeakerFids] = useState<Set<number>>(
    new Set(),
  );
  const [unmutedSpeakerFids, setUnmutedSpeakerFids] = useState<Set<number>>(
    new Set(),
  );
  const [connectedParticipantFids, setConnectedParticipantFids] = useState<
    Set<number>
  >(new Set());
  const [incomingReactions, setIncomingReactions] = useState<
    IncomingReaction[]
  >([]);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [pendingStageInvite, setPendingStageInvite] = useState<{
    role: ApiAudioRoomPromoteRole;
    inviterFid: number;
  } | null>(null);
  const [endedReason, setEndedReason] =
    useState<ApiAudioRoomEndedReason | null>(null);
  const [removedByHostRoomId, setRemovedByHostRoomId] = useState<string | null>(
    null,
  );
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const livekitRoomRef = useRef<Room | null>(null);
  const connectingLivekitRoomRef = useRef<Room | null>(null);
  const isVoluntaryLeaveRef = useRef(false);
  const joinGenerationRef = useRef(0);
  const joinedRef = useRef<JoinedSpace | null>(null);
  const joinFnRef = useRef<
    | ((
        roomId: string,
        entrySource?: AudioSpaceEntrySource,
        options?: JoinCallOptions,
      ) => Promise<boolean>)
    | null
  >(null);
  const acceptingStageInviteRef = useRef<{
    roomId: string;
    role: ApiAudioRoomPromoteRole | null;
    inviterFid: number | null;
    spaceSessionId: string;
  } | null>(null);
  const isRefreshingPublishPermsRef = useRef(false);
  const pendingSwitchConfirmationRef = useRef<Promise<boolean> | null>(null);
  const pendingSwitchRoomIdRef = useRef<string | null>(null);
  const lastStageHeartbeatAtMsRef = useRef(0);
  const lastSpeakerActivityKeyRef = useRef('');
  const lastSpeakerActivitySentAtMsRef = useRef(0);
  const pendingSpeakerActivityFidsRef = useRef<number[] | null>(null);
  const speakerActivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const activeSpeakerFidsRef = useRef<Set<number>>(new Set());
  const switchModalResolveRef = useRef<((confirmed: boolean) => void) | null>(
    null,
  );
  const audioSpaceEventDedupeRef = useRef<Map<string, number>>(new Map());
  const connectionStateRef = useRef<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const viewerFidRef = useRef<number | undefined>(undefined);
  const participantCountRef = useRef(0);
  const micPermissionDeniedRef = useRef(false);

  const trackAudioSpaceEvent = useCallback(
    (
      eventName: (typeof AUDIO_SPACE_EVENTS)[keyof typeof AUDIO_SPACE_EVENTS],
      properties?: Record<string, string | number | boolean | undefined>,
      {
        dedupeKey,
        dedupeWindowMs,
      }: {
        dedupeKey?: string;
        dedupeWindowMs?: number;
      } = {},
    ) => {
      const current = joinedRef.current;
      const entrySourceFromProperties = isAudioSpaceEntrySource(
        properties?.entrySource,
      )
        ? properties.entrySource
        : undefined;
      const baseContext: AudioSpaceCommonContext = {
        spaceSessionId:
          (typeof properties?.spaceSessionId === 'string'
            ? properties.spaceSessionId
            : undefined) ??
          current?.spaceSessionId ??
          createAudioSpaceTelemetryId('space_session'),
        joinAttemptId:
          typeof properties?.joinAttemptId === 'string'
            ? properties.joinAttemptId
            : undefined,
        roomId:
          current?.room.id ??
          (typeof properties?.roomId === 'string'
            ? properties.roomId
            : undefined),
        viewerFid: current?.viewerFid ?? viewerFidRef.current,
        role:
          current?.role ??
          (typeof properties?.role === 'string' ? properties.role : undefined),
        isHost:
          (current?.role ?? properties?.role) === 'host' ||
          properties?.isHost === true,
        platform: 'web',
        entrySource:
          entrySourceFromProperties ?? current?.entrySource ?? 'unknown',
        connectionState: connectionStateRef.current,
        participantCount: participantCountRef.current,
        audioPermissionState: micPermissionDeniedRef.current
          ? 'denied'
          : 'unknown',
      };

      trackWebAudioSpaceEvent({
        eventName,
        context: baseContext,
        properties,
        dedupeMap: audioSpaceEventDedupeRef.current,
        dedupeKey,
        dedupeWindowMs,
      });
    },
    [],
  );

  // Keep refs in sync so WS callbacks can read latest state
  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  useEffect(() => {
    viewerFidRef.current =
      typeof currentUser?.fid === 'number' ? currentUser.fid : undefined;
  }, [currentUser?.fid]);

  useEffect(() => {
    participantCountRef.current = participantCount;
  }, [participantCount]);

  useEffect(() => {
    micPermissionDeniedRef.current = micPermissionDenied;
  }, [micPermissionDenied]);

  useEffect(() => {
    activeSpeakerFidsRef.current = activeSpeakerFids;
  }, [activeSpeakerFids]);

  const joinAudioRoom = useJoinAudioRoom();
  const leaveAudioRoom = useLeaveAudioRoom();
  const endAudioRoom = useEndAudioRoom();
  const heartbeatAudioRoom = useHeartbeatAudioRoom();
  const recordAudioRoomSpeakerActivity = useRecordAudioRoomSpeakerActivity();
  const raiseHandAudioRoom = useRaiseHandAudioRoom();
  const acceptStageInviteAudioRoom = useAcceptStageInviteAudioRoom();
  const declineStageInviteAudioRoom = useDeclineStageInviteAudioRoom();
  const { invalidateAudioRoom } = useInvalidateAudioRoom();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();
  const { invalidateAudioRoomParticipants } =
    useInvalidateAudioRoomParticipants();
  const {
    send: wsSend,
    registerOnMessageCallback,
    unregisterOnMessageCallback,
  } = useWebSockets();
  const { data: roomParticipants } = useAudioRoomParticipants({
    roomId: joined?.room.id ?? '',
    enabled: !!joined,
  });

  const sendStageHeartbeatIfNeeded = useCallback(() => {
    const currentJoined = joinedRef.current;
    if (!currentJoined) {
      return;
    }
    const canKeepSpaceAlive =
      currentJoined.role === 'host' ||
      currentJoined.role === 'cohost' ||
      currentJoined.role === 'speaker';
    if (!canKeepSpaceAlive) {
      return;
    }
    if (connectionStateRef.current !== ConnectionState.Connected) {
      return;
    }
    const livekitRoom = livekitRoomRef.current;
    if (!livekitRoom) {
      return;
    }

    const localMicEnabled = !!livekitRoom.localParticipant.isMicrophoneEnabled;
    const heartbeatSpeakerFids = new Set(activeSpeakerFidsRef.current);
    const isReporterActive = heartbeatSpeakerFids.has(currentJoined.viewerFid);
    const canUseMicFallback =
      currentJoined.role === 'host' || currentJoined.role === 'cohost';
    if ((!canUseMicFallback || !localMicEnabled) && !isReporterActive) {
      return;
    }
    if (canUseMicFallback && localMicEnabled) {
      heartbeatSpeakerFids.add(currentJoined.viewerFid);
    }
    const now = Date.now();
    if (now - lastStageHeartbeatAtMsRef.current < 30_000) {
      return;
    }
    lastStageHeartbeatAtMsRef.current = now;
    heartbeatAudioRoom({
      roomId: currentJoined.room.id,
      activeSpeakerFids: [...heartbeatSpeakerFids],
    }).catch(() => {});
  }, [heartbeatAudioRoom]);

  const clearPendingSpeakerActivity = useCallback(() => {
    if (speakerActivityTimerRef.current) {
      clearTimeout(speakerActivityTimerRef.current);
      speakerActivityTimerRef.current = null;
    }
    pendingSpeakerActivityFidsRef.current = null;
  }, []);

  useEffect(() => {
    return clearPendingSpeakerActivity;
  }, [clearPendingSpeakerActivity]);

  const sendSpeakerActivity = useCallback(
    (sortedActiveSpeakerFids: number[]) => {
      const currentJoined = joinedRef.current;
      if (!currentJoined?.room.recordingEnabled) {
        return;
      }
      if (!isPublishingRole(currentJoined.role)) {
        return;
      }
      if (connectionStateRef.current !== ConnectionState.Connected) {
        return;
      }

      const nextKey = sortedActiveSpeakerFids.join(',');
      if (nextKey === lastSpeakerActivityKeyRef.current) {
        return;
      }

      lastSpeakerActivityKeyRef.current = nextKey;
      lastSpeakerActivitySentAtMsRef.current = Date.now();
      recordAudioRoomSpeakerActivity({
        roomId: currentJoined.room.id,
        activeSpeakerFids: sortedActiveSpeakerFids,
      }).catch(() => {
        if (lastSpeakerActivityKeyRef.current === nextKey) {
          lastSpeakerActivityKeyRef.current = '';
        }
      });
    },
    [recordAudioRoomSpeakerActivity],
  );

  const flushPendingSpeakerActivity = useCallback(() => {
    speakerActivityTimerRef.current = null;
    const pendingSpeakerActivityFids = pendingSpeakerActivityFidsRef.current;
    pendingSpeakerActivityFidsRef.current = null;
    if (!pendingSpeakerActivityFids) {
      return;
    }

    sendSpeakerActivity(pendingSpeakerActivityFids);
  }, [sendSpeakerActivity]);

  const recordSpeakerActivityIfNeeded = useCallback(
    (nextActiveSpeakerFids: Set<number>) => {
      const sortedActiveSpeakerFids = sortedSpeakerFids(nextActiveSpeakerFids);
      const nextKey = sortedActiveSpeakerFids.join(',');
      if (nextKey === lastSpeakerActivityKeyRef.current) {
        clearPendingSpeakerActivity();
        return;
      }

      const now = Date.now();
      const elapsedMs = now - lastSpeakerActivitySentAtMsRef.current;
      if (elapsedMs >= RECORD_SPEAKER_ACTIVITY_MIN_INTERVAL_MS) {
        clearPendingSpeakerActivity();
        sendSpeakerActivity(sortedActiveSpeakerFids);
        return;
      }

      pendingSpeakerActivityFidsRef.current = sortedActiveSpeakerFids;
      if (!speakerActivityTimerRef.current) {
        speakerActivityTimerRef.current = setTimeout(
          flushPendingSpeakerActivity,
          RECORD_SPEAKER_ACTIVITY_MIN_INTERVAL_MS - elapsedMs,
        );
      }
    },
    [
      clearPendingSpeakerActivity,
      flushPendingSpeakerActivity,
      sendSpeakerActivity,
    ],
  );

  const resetLocalJoinedState = useCallback(() => {
    joinedRef.current = null;
    setJoined(null);
    setLivekitRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setParticipantCount(0);
    setActiveSpeakerFids(new Set());
    activeSpeakerFidsRef.current = new Set();
    lastSpeakerActivityKeyRef.current = '';
    lastSpeakerActivitySentAtMsRef.current = 0;
    clearPendingSpeakerActivity();
    setUnmutedSpeakerFids(new Set());
    setConnectedParticipantFids(new Set());
    setIncomingReactions([]);
    setMicPermissionDenied(false);
    setPendingStageInvite(null);
    acceptingStageInviteRef.current = null;
    lastStageHeartbeatAtMsRef.current = 0;
  }, [clearPendingSpeakerActivity]);

  const updateJoinedState = useCallback((next: JoinedSpace) => {
    joinedRef.current = next;
    setJoined(next);
  }, []);

  const teardownLivekitSession = useCallback(async () => {
    const lk = livekitRoomRef.current;
    if (lk) {
      await disconnectLivekitRoom(lk);
      if (livekitRoomRef.current === lk) {
        livekitRoomRef.current = null;
      }
    }
    const connectingLk = connectingLivekitRoomRef.current;
    if (connectingLk && connectingLk !== lk) {
      await disconnectLivekitRoom(connectingLk);
      if (connectingLivekitRoomRef.current === connectingLk) {
        connectingLivekitRoomRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (
      !joined ||
      (joined.role !== 'host' &&
        joined.role !== 'cohost' &&
        joined.role !== 'speaker')
    ) {
      return;
    }
    const interval = setInterval(() => {
      sendStageHeartbeatIfNeeded();
    }, 10_000);
    return () => clearInterval(interval);
  }, [joined, sendStageHeartbeatIfNeeded]);

  useEffect(() => {
    if (!joined || !roomParticipants) {
      setPendingStageInvite(null);
      return;
    }
    const selfParticipant = roomParticipants.find(
      (p) => p.user.fid === joined.viewerFid,
    );
    const pending = selfParticipant?.pendingInvite;
    const acceptingStageInvite = acceptingStageInviteRef.current;
    const isAcceptingStageInviteForCurrentSession =
      acceptingStageInvite?.roomId === joined.room.id &&
      acceptingStageInvite.spaceSessionId === joined.spaceSessionId;
    if (acceptingStageInvite && !isAcceptingStageInviteForCurrentSession) {
      acceptingStageInviteRef.current = null;
    }
    if (isAcceptingStageInviteForCurrentSession) {
      const isAcceptedRole =
        acceptingStageInvite.role === 'speaker' ||
        acceptingStageInvite.role === 'cohost';
      const isRoleChangedAwayFromAcceptedInvite =
        isAcceptedRole &&
        joined.role !== 'listener' &&
        joined.role !== acceptingStageInvite.role;
      const isAcceptedPendingInvite =
        !isRoleChangedAwayFromAcceptedInvite &&
        pending &&
        pending.role === acceptingStageInvite.role &&
        pending.inviterFid === acceptingStageInvite.inviterFid;
      const isAwaitingPromotion = joined.role === 'listener' && !pending;
      const isAlreadyPromoted = joined.role === acceptingStageInvite.role;
      if (isAlreadyPromoted && !pending) {
        acceptingStageInviteRef.current = null;
        setPendingStageInvite(null);
        return;
      }
      if (isRoleChangedAwayFromAcceptedInvite) {
        acceptingStageInviteRef.current = null;
      }
      if (
        isAcceptedPendingInvite ||
        (isAwaitingPromotion && !isRoleChangedAwayFromAcceptedInvite)
      ) {
        setPendingStageInvite(null);
        return;
      }
    }
    setPendingStageInvite(
      pending
        ? {
            role: pending.role,
            inviterFid: pending.inviterFid,
          }
        : null,
    );
  }, [joined, roomParticipants]);

  // Elapsed-time counter
  useEffect(() => {
    if (!joined) {
      setElapsedSec(0);
      return;
    }
    const startedAtMs = joined.room.startedAt
      ? Date.parse(joined.room.startedAt)
      : Number.NaN;
    const start = Number.isFinite(startedAtMs)
      ? startedAtMs
      : joined.joinedAtMs;
    // Clamp to 0 to guard against clock skew that would otherwise render "-0:-01".
    const computeElapsed = () =>
      Math.max(0, Math.floor((Date.now() - start) / 1000));
    setElapsedSec(computeElapsed());
    const interval = setInterval(() => {
      setElapsedSec(computeElapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, [joined]);

  // Subscribe to audio room WS channel for real-time events
  useEffect(() => {
    if (!joined) {
      return;
    }
    const roomId = joined.room.id;

    // Subscribe to audio room channel
    try {
      wsSend({
        message: {
          messageType: 'audio_room_subscribe',
          data: { roomId },
        },
      });
    } catch {
      // WS might not be connected yet
    }

    // Handle incoming reaction events
    registerOnMessageCallback({
      messageType: 'audio-room-reaction',
      cbReferenceId: `space-reaction-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType === 'audio-room-reaction') {
          const { emoji, fid } = message.payload;
          // LiveControls already renders an immediate local animation for the
          // sender. Skip our own WS echo so one tap shows exactly one reaction.
          if (fid === joined.viewerFid) {
            return;
          }
          const reaction: IncomingReaction = {
            id: Date.now() + Math.random(),
            fid: fid ?? 0,
            emoji,
            offset: Math.random() * 60 - 30,
          };
          setIncomingReactions((prev) => [...prev, reaction]);
        }
      },
    });

    // Handle hand raised events — invalidate participants
    registerOnMessageCallback({
      messageType: 'audio-room-hand-raised',
      cbReferenceId: `space-hand-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType === 'audio-room-hand-raised') {
          invalidateAudioRoomParticipants({ roomId: message.payload.roomId });
        }
      },
    });

    // Handle speaker changed events — invalidate participants + self-role detection
    registerOnMessageCallback({
      messageType: 'audio-room-speaker-changed',
      cbReferenceId: `space-speaker-${roomId}`,
      cb: async ({ message }) => {
        if (message.messageType === 'audio-room-speaker-changed') {
          const { roomId: changedRoomId, fid, role: newRole } = message.payload;
          try {
            const current = joinedRef.current;
            if (
              current &&
              fid === current.viewerFid &&
              changedRoomId === current.room.id &&
              newRole !== current.role
            ) {
              const acceptingStageInvite = acceptingStageInviteRef.current;
              if (
                acceptingStageInvite?.roomId === changedRoomId &&
                acceptingStageInvite.spaceSessionId ===
                  current.spaceSessionId &&
                acceptingStageInvite.role === newRole
              ) {
                setPendingStageInvite(null);
                return;
              }
              if (
                acceptingStageInvite?.roomId === changedRoomId &&
                acceptingStageInvite.spaceSessionId === current.spaceSessionId
              ) {
                acceptingStageInviteRef.current = null;
              }
              trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.roleChanged, {
                roomId: changedRoomId,
                previousRole: current.role,
                role: newRole,
              });
              updateJoinedState({ ...current, role: newRole });

              if (newRole === 'listener') {
                acceptingStageInviteRef.current = null;
                await muteTrackedLivekitRooms(
                  livekitRoomRef.current,
                  connectingLivekitRoomRef.current,
                );
                updateJoinedState({
                  ...current,
                  role: newRole,
                  muted: true,
                  handRaised: false,
                });
                appToast({ message: "You've been moved to listener" });
              } else {
                const lk =
                  livekitRoomRef.current ?? connectingLivekitRoomRef.current;
                const initialMicrophoneEnabled =
                  !!lk?.localParticipant.isMicrophoneEnabled &&
                  (current.role === 'speaker' || current.role === 'cohost') &&
                  (newRole === 'speaker' || newRole === 'cohost');
                appToast({
                  message:
                    newRole === 'cohost'
                      ? "You've been made co-host!"
                      : "You've been invited to speak!",
                  type: 'success',
                });
                if (lk) {
                  try {
                    await applySpeakerMicrophoneState({
                      participant: lk.localParticipant,
                      enabled: initialMicrophoneEnabled,
                      previousRole: current.role,
                    });
                    const latest = joinedRef.current;
                    if (
                      !latest ||
                      latest.room.id !== changedRoomId ||
                      latest.spaceSessionId !== current.spaceSessionId ||
                      latest.role !== newRole
                    ) {
                      return;
                    }
                    if (initialMicrophoneEnabled) {
                      setMicPermissionDenied(false);
                    }
                    updateJoinedState({
                      ...latest,
                      muted: !initialMicrophoneEnabled,
                      handRaised: false,
                    });
                  } catch (err: unknown) {
                    const latest = joinedRef.current;
                    if (
                      !latest ||
                      latest.room.id !== changedRoomId ||
                      latest.spaceSessionId !== current.spaceSessionId ||
                      latest.role !== newRole
                    ) {
                      return;
                    }
                    if (isMicPermissionError(err)) {
                      setMicPermissionDenied(true);
                    }
                    updateJoinedState({
                      ...latest,
                      muted: true,
                      handRaised: false,
                    });
                    if (!isMicPermissionError(err)) {
                      joinFnRef
                        .current?.(changedRoomId, current.entrySource, {
                          skipSwitchConfirmation: true,
                          skipJoinRollback: true,
                          spaceSessionId: current.spaceSessionId,
                          initialMicrophoneEnabled,
                        })
                        .catch(() => {
                          appToast({
                            message:
                              'Failed to reconnect - try leaving and rejoining',
                            type: 'error',
                          });
                        });
                    }
                  }
                } else {
                  updateJoinedState({
                    ...current,
                    role: newRole,
                    muted: true,
                    handRaised: false,
                  });
                  joinFnRef
                    .current?.(changedRoomId, current.entrySource, {
                      skipSwitchConfirmation: true,
                      skipJoinRollback: true,
                      spaceSessionId: current.spaceSessionId,
                      initialMicrophoneEnabled,
                    })
                    .catch(() => {
                      appToast({
                        message:
                          'Failed to reconnect - try leaving and rejoining',
                        type: 'error',
                      });
                    });
                }
              }
            }
          } finally {
            invalidateAudioRoomParticipants({ roomId: changedRoomId });
          }
        }
      },
    });

    registerOnMessageCallback({
      messageType: 'audio-room-stage-invite-sent',
      cbReferenceId: `space-stage-invite-sent-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType !== 'audio-room-stage-invite-sent') {
          return;
        }
        const {
          roomId: changedRoomId,
          targetFid,
          inviterFid,
          role,
        } = message.payload;
        invalidateAudioRoomParticipants({ roomId: changedRoomId });

        const current = joinedRef.current;
        if (
          current &&
          changedRoomId === current.room.id &&
          targetFid === current.viewerFid
        ) {
          trackAudioSpaceEvent(
            AUDIO_SPACE_EVENTS.stageInviteReceived,
            {
              roomId: changedRoomId,
              inviterFid,
              role,
            },
            {
              dedupeKey: `web-stage-invite-${changedRoomId}-${inviterFid}-${role}`,
              dedupeWindowMs: 2000,
            },
          );
          setPendingStageInvite({ role, inviterFid });
          appToast({ message: 'You have a pending stage invite' });
        }
      },
    });

    registerOnMessageCallback({
      messageType: 'audio-room-stage-invite-cleared',
      cbReferenceId: `space-stage-invite-cleared-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType !== 'audio-room-stage-invite-cleared') {
          return;
        }
        const { roomId: changedRoomId, targetFid, reason } = message.payload;
        invalidateAudioRoomParticipants({ roomId: changedRoomId });

        const current = joinedRef.current;
        if (
          current &&
          changedRoomId === current.room.id &&
          targetFid === current.viewerFid
        ) {
          setPendingStageInvite(null);
          if (reason === 'cancelled') {
            appToast({ message: 'Your stage invite was cancelled' });
          }
        }
      },
    });

    // Handle room ended — auto-leave and notify user (B1)
    registerOnMessageCallback({
      messageType: 'audio-room-ended',
      cbReferenceId: `space-ended-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType === 'audio-room-ended') {
          const endedRoomId = message.payload?.room?.id ?? roomId;
          const wsEndedReason =
            message.payload?.reason ??
            message.payload?.room?.endedReason ??
            null;
          if (endedRoomId !== roomId) {
            return;
          }
          setEndedReason(wsEndedReason);
          const current = joinedRef.current;
          if (current && current.room.id === roomId) {
            trackAudioSpaceEvent(
              AUDIO_SPACE_EVENTS.roomEndedReceived,
              { roomId: endedRoomId },
              {
                dedupeKey: `web-room-ended-${endedRoomId}`,
                dedupeWindowMs: 3000,
              },
            );
            const lk = livekitRoomRef.current;
            if (lk) {
              void disconnectLivekitRoom(lk);
              if (livekitRoomRef.current === lk) {
                livekitRoomRef.current = null;
              }
            }
            const connectingLk = connectingLivekitRoomRef.current;
            if (connectingLk && connectingLk !== lk) {
              void disconnectLivekitRoom(connectingLk);
              if (connectingLivekitRoomRef.current === connectingLk) {
                connectingLivekitRoomRef.current = null;
              }
            }
            setJoined(null);
            setLivekitRoom(null);
            setConnectionState(ConnectionState.Disconnected);
            setParticipantCount(0);
            setActiveSpeakerFids(new Set());
            activeSpeakerFidsRef.current = new Set();
            setConnectedParticipantFids(new Set());
            setIncomingReactions([]);
            setMicPermissionDenied(false);
            setPendingStageInvite(null);
            if (wsEndedReason !== 'host_silence') {
              appToast({
                message: 'This Space has ended',
                type: 'info',
                toastId: `space-ended-${roomId}`,
              });
            }
          }
          invalidateAudioRoomsList();
          invalidateAudioRoom({ roomId: endedRoomId });
        }
      },
    });

    // Handle room updated — refresh room lists for real-time count changes (FF7)
    registerOnMessageCallback({
      messageType: 'audio-room-updated',
      cbReferenceId: `space-updated-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType === 'audio-room-updated') {
          invalidateAudioRoomsList();
          invalidateAudioRoom({ roomId });
          invalidateAudioRoomParticipants({ roomId });
        }
      },
    });

    registerOnMessageCallback({
      messageType: 'audio-room-participant-left',
      cbReferenceId: `space-participant-left-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType !== 'audio-room-participant-left') {
          return;
        }
        const { roomId: eventRoomId, fid } = message.payload;
        invalidateAudioRoomParticipants({ roomId: eventRoomId });

        const current = joinedRef.current;
        const activeLivekitRoom = livekitRoomRef.current;
        if (
          !current ||
          !activeLivekitRoom ||
          current.room.id !== eventRoomId ||
          current.viewerFid !== fid ||
          isVoluntaryLeaveRef.current
        ) {
          return;
        }

        trackAudioSpaceEvent(
          AUDIO_SPACE_EVENTS.removedByHostReceived,
          { roomId: eventRoomId },
          {
            dedupeKey: `web-removed-by-host-${eventRoomId}`,
            dedupeWindowMs: 3000,
          },
        );

        joinGenerationRef.current += 1;
        resetLocalJoinedState();
        setRemovedByHostRoomId(eventRoomId);
        void teardownLivekitSession();
        invalidateAudioRoomsList();
        invalidateAudioRoom({ roomId: eventRoomId });
      },
    });

    return () => {
      // Unsubscribe from audio room channel
      try {
        wsSend({
          message: {
            messageType: 'audio_room_unsubscribe',
            data: { roomId },
          },
        });
      } catch {
        // WS might be disconnected
      }

      unregisterOnMessageCallback({
        messageType: 'audio-room-reaction',
        cbReferenceId: `space-reaction-${roomId}`,
      });
      unregisterOnMessageCallback({
        messageType: 'audio-room-hand-raised',
        cbReferenceId: `space-hand-${roomId}`,
      });
      unregisterOnMessageCallback({
        messageType: 'audio-room-speaker-changed',
        cbReferenceId: `space-speaker-${roomId}`,
      });
      unregisterOnMessageCallback({
        messageType: 'audio-room-stage-invite-sent',
        cbReferenceId: `space-stage-invite-sent-${roomId}`,
      });
      unregisterOnMessageCallback({
        messageType: 'audio-room-stage-invite-cleared',
        cbReferenceId: `space-stage-invite-cleared-${roomId}`,
      });
      unregisterOnMessageCallback({
        messageType: 'audio-room-ended',
        cbReferenceId: `space-ended-${roomId}`,
      });
      unregisterOnMessageCallback({
        messageType: 'audio-room-updated',
        cbReferenceId: `space-updated-${roomId}`,
      });
      unregisterOnMessageCallback({
        messageType: 'audio-room-participant-left',
        cbReferenceId: `space-participant-left-${roomId}`,
      });
    };
  }, [
    joined,
    wsSend,
    registerOnMessageCallback,
    unregisterOnMessageCallback,
    invalidateAudioRoomParticipants,
    invalidateAudioRoomsList,
    invalidateAudioRoom,
    trackAudioSpaceEvent,
    resetLocalJoinedState,
    teardownLivekitSession,
    updateJoinedState,
  ]);

  const closeSwitchModal = useCallback((confirmed: boolean) => {
    switchModalResolveRef.current?.(confirmed);
    switchModalResolveRef.current = null;
    setIsSwitchModalOpen(false);
  }, []);

  const requestSpaceSwitchConfirmation = useCallback(() => {
    setIsSwitchModalOpen(true);
    return new Promise<boolean>((resolve) => {
      switchModalResolveRef.current = resolve;
    });
  }, []);

  const confirmSpaceSwitch = useCallback(
    async (nextRoomId?: string) => {
      const currentJoined = joinedRef.current;
      if (!currentJoined) {
        return true;
      }
      if (nextRoomId && currentJoined.room.id === nextRoomId) {
        return true;
      }

      if (pendingSwitchConfirmationRef.current) {
        if (pendingSwitchRoomIdRef.current !== nextRoomId) {
          return false;
        }
        return pendingSwitchConfirmationRef.current;
      }

      const confirmationPromise = requestSpaceSwitchConfirmation();
      pendingSwitchConfirmationRef.current = confirmationPromise;
      pendingSwitchRoomIdRef.current = nextRoomId ?? null;

      try {
        return await confirmationPromise;
      } finally {
        pendingSwitchConfirmationRef.current = null;
        pendingSwitchRoomIdRef.current = null;
      }
    },
    [requestSpaceSwitchConfirmation],
  );

  const connectLivekitRoom = useCallback(
    async ({
      room,
      role,
      token,
      wsUrl,
      viewerFid,
      joinedAtMs,
      spaceSessionId,
      entrySource,
      joinAttemptId,
      joinGeneration,
      initialMicrophoneEnabled,
    }: {
      room: ApiAudioRoom;
      role: ApiAudioRoomRole;
      token: string;
      wsUrl: string;
      viewerFid: number;
      joinedAtMs: number;
      spaceSessionId: string;
      entrySource: AudioSpaceEntrySource;
      joinAttemptId: string;
      joinGeneration?: number;
      initialMicrophoneEnabled?: boolean;
    }) => {
      const lkRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      const isCurrentLivekitRoom = () =>
        livekitRoomRef.current === lkRoom ||
        connectingLivekitRoomRef.current === lkRoom;
      connectingLivekitRoomRef.current = lkRoom;
      const syncConnectedParticipantFids = () => {
        const nextConnectedParticipantFids = new Set<number>([viewerFid]);
        for (const remoteParticipant of lkRoom.remoteParticipants.values()) {
          const fid = fidFromIdentity(remoteParticipant.identity);
          if (fid !== null) {
            nextConnectedParticipantFids.add(fid);
          }
        }
        setConnectedParticipantFids(nextConnectedParticipantFids);
      };
      const syncUnmutedSpeakerFids = () => {
        const nextUnmutedSpeakerFids = new Set<number>();
        if (lkRoom.localParticipant.isMicrophoneEnabled) {
          nextUnmutedSpeakerFids.add(viewerFid);
        }
        for (const remoteParticipant of lkRoom.remoteParticipants.values()) {
          if (!remoteParticipant.isMicrophoneEnabled) {
            continue;
          }
          const fid = fidFromIdentity(remoteParticipant.identity);
          if (fid !== null) {
            nextUnmutedSpeakerFids.add(fid);
          }
        }
        setUnmutedSpeakerFids(nextUnmutedSpeakerFids);
      };
      const setParticipantUnmutedState = (
        identity: string,
        isUnmuted: boolean,
      ) => {
        const fid = fidFromIdentity(identity);
        if (fid === null) {
          return;
        }
        setUnmutedSpeakerFids((prev) => {
          const next = new Set(prev);
          if (isUnmuted) {
            next.add(fid);
          } else {
            next.delete(fid);
          }
          return next;
        });
      };

      // Connection state
      lkRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        const prevState = connectionStateRef.current;
        connectionStateRef.current = state;
        setConnectionState(state);
        trackAudioSpaceEvent(
          AUDIO_SPACE_EVENTS.connectionStateChanged,
          {
            roomId: room.id,
            joinAttemptId,
            spaceSessionId,
            fromState: prevState,
            toState: state,
            role,
            entrySource,
          },
          {
            dedupeKey: `web-state-${room.id}-${prevState}-${state}`,
            dedupeWindowMs: 1000,
          },
        );
        if (state === ConnectionState.Reconnecting) {
          trackAudioSpaceEvent(
            AUDIO_SPACE_EVENTS.reconnectStarted,
            {
              roomId: room.id,
              joinAttemptId,
              role,
              entrySource,
              spaceSessionId,
            },
            {
              dedupeKey: `web-reconnect-start-${room.id}`,
              dedupeWindowMs: 3000,
            },
          );
        } else if (
          prevState === ConnectionState.Reconnecting &&
          state === ConnectionState.Connected
        ) {
          trackAudioSpaceEvent(
            AUDIO_SPACE_EVENTS.reconnectSucceeded,
            {
              roomId: room.id,
              joinAttemptId,
              role,
              entrySource,
              spaceSessionId,
            },
            {
              dedupeKey: `web-reconnect-success-${room.id}`,
              dedupeWindowMs: 3000,
            },
          );
        }
      });

      // Audio tracks
      lkRoom.on(RoomEvent.TrackSubscribed, (track) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        handleTrackSubscribed(track);
      });
      lkRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        handleTrackUnsubscribed(track);
      });
      lkRoom.on(RoomEvent.TrackMuted, (publication, participant) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        setParticipantUnmutedState(participant.identity, false);
      });
      lkRoom.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        setParticipantUnmutedState(participant.identity, true);
      });
      lkRoom.on(RoomEvent.TrackPublished, (publication) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        syncUnmutedSpeakerFids();
      });
      lkRoom.on(RoomEvent.TrackUnpublished, (publication) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        syncUnmutedSpeakerFids();
      });
      lkRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        syncUnmutedSpeakerFids();
      });
      lkRoom.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        syncUnmutedSpeakerFids();
      });

      // Participant count
      lkRoom.on(RoomEvent.ParticipantConnected, () => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        setParticipantCount(lkRoom.numParticipants);
        syncConnectedParticipantFids();
        syncUnmutedSpeakerFids();
      });
      lkRoom.on(RoomEvent.ParticipantDisconnected, () => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        setParticipantCount(lkRoom.numParticipants);
        syncConnectedParticipantFids();
        syncUnmutedSpeakerFids();
      });

      // Active speakers — real audio level indicators
      lkRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        const fids = new Set<number>();
        for (const s of speakers) {
          const fid = fidFromIdentity(s.identity);
          if (fid !== null) {
            fids.add(fid);
          }
        }
        activeSpeakerFidsRef.current = fids;
        setActiveSpeakerFids(fids);
        sendStageHeartbeatIfNeeded();
        recordSpeakerActivityIfNeeded(fids);
      });

      // Disconnected (cleanup / refresh room state)
      lkRoom.on(RoomEvent.Disconnected, () => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (connectionStateRef.current === ConnectionState.Reconnecting) {
          trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.reconnectFailed, {
            roomId: room.id,
            joinAttemptId,
            role,
            entrySource,
            spaceSessionId,
          });
        }
        setConnectionState(ConnectionState.Disconnected);
        setActiveSpeakerFids(new Set());
        activeSpeakerFidsRef.current = new Set();
        setConnectedParticipantFids(new Set());
        setUnmutedSpeakerFids(new Set());
        invalidateAudioRoomsList();
        invalidateAudioRoom({ roomId: room.id });
      });

      trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.livekitConnectStarted, {
        roomId: room.id,
        joinAttemptId,
        role,
        entrySource,
        spaceSessionId,
      });
      try {
        await lkRoom.connect(wsUrl, token, {
          autoSubscribe: true,
        });
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.livekitConnectSucceeded, {
          roomId: room.id,
          joinAttemptId,
          role,
          entrySource,
          spaceSessionId,
        });
      } catch (err) {
        await disconnectLivekitRoom(lkRoom);
        if (connectingLivekitRoomRef.current === lkRoom) {
          connectingLivekitRoomRef.current = null;
        }
        resetConnectionStateIfInactive({
          livekitRoomRef,
          connectingLivekitRoomRef,
          connectionStateRef,
          setConnectionState,
        });
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.livekitConnectFailed, {
          roomId: room.id,
          joinAttemptId,
          role,
          entrySource,
          spaceSessionId,
          ...normalizeAudioSpaceError(err),
        });
        throw err;
      }
      if (
        joinGeneration !== undefined &&
        joinGeneration !== joinGenerationRef.current
      ) {
        await disconnectLivekitRoom(lkRoom);
        if (connectingLivekitRoomRef.current === lkRoom) {
          connectingLivekitRoomRef.current = null;
        }
        resetConnectionStateIfInactive({
          livekitRoomRef,
          connectingLivekitRoomRef,
          connectionStateRef,
          setConnectionState,
        });
        return false;
      }
      syncConnectedParticipantFids();
      syncUnmutedSpeakerFids();

      const currentJoined = joinedRef.current;
      const effectiveRole = resolveEffectiveRole({
        joinedRole: currentJoined?.role ?? null,
        connectRole: role,
        sameSession:
          !!currentJoined &&
          currentJoined.room.id === room.id &&
          currentJoined.spaceSessionId === spaceSessionId,
      });

      // Host/cohost/speaker auto-publish mic (start muted unless preserved)
      const shouldEnableInitialMicrophone =
        (effectiveRole === 'host' ||
          effectiveRole === 'cohost' ||
          effectiveRole === 'speaker') &&
        initialMicrophoneEnabled === true;
      let microphoneEnabled = false;
      if (
        effectiveRole === 'host' ||
        effectiveRole === 'cohost' ||
        effectiveRole === 'speaker'
      ) {
        try {
          if (shouldEnableInitialMicrophone) {
            await lkRoom.localParticipant.setMicrophoneEnabled(true);
            microphoneEnabled = true;
          } else {
            await applySpeakerMicrophoneState({
              participant: lkRoom.localParticipant,
              enabled: false,
              // New Room instance: no mic publication yet, even if joined.role
              // was already promoted before this reconnect.
              previousRole: 'listener',
            });
          }
        } catch (err) {
          if (!isMicPermissionError(err)) {
            // Token/permission sync can briefly lag after stage promotion.
            // Avoid showing a browser permission banner for non-browser errors.
          } else {
            setMicPermissionDenied(true);
            trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.micPermissionDenied, {
              roomId: room.id,
              joinAttemptId,
              role,
              spaceSessionId,
            });
          }
        }
      }

      if (
        joinGeneration !== undefined &&
        joinGeneration !== joinGenerationRef.current
      ) {
        await disconnectLivekitRoom(lkRoom);
        if (connectingLivekitRoomRef.current === lkRoom) {
          connectingLivekitRoomRef.current = null;
        }
        resetConnectionStateIfInactive({
          livekitRoomRef,
          connectingLivekitRoomRef,
          connectionStateRef,
          setConnectionState,
        });
        return false;
      }
      if (connectingLivekitRoomRef.current !== lkRoom) {
        await disconnectLivekitRoom(lkRoom);
        resetConnectionStateIfInactive({
          livekitRoomRef,
          connectingLivekitRoomRef,
          connectionStateRef,
          setConnectionState,
        });
        return false;
      }
      livekitRoomRef.current = lkRoom;
      if (connectingLivekitRoomRef.current === lkRoom) {
        connectingLivekitRoomRef.current = null;
      }
      connectionStateRef.current = ConnectionState.Connected;
      setConnectionState(ConnectionState.Connected);
      setParticipantCount(lkRoom.numParticipants);
      syncUnmutedSpeakerFids();
      setLivekitRoom(lkRoom);
      setEndedReason(null);
      lastStageHeartbeatAtMsRef.current = 0;
      lastSpeakerActivityKeyRef.current = '';
      lastSpeakerActivitySentAtMsRef.current = 0;
      clearPendingSpeakerActivity();

      setJoined({
        room,
        role: effectiveRole,
        viewerFid,
        spaceSessionId,
        entrySource,
        muted: !microphoneEnabled,
        handRaised: false,
        joinedAtMs,
      });
      return true;
    },
    [
      clearPendingSpeakerActivity,
      sendStageHeartbeatIfNeeded,
      recordSpeakerActivityIfNeeded,
      invalidateAudioRoom,
      invalidateAudioRoomsList,
      trackAudioSpaceEvent,
    ],
  );

  const join = useCallback(
    async (
      roomId: string,
      entrySource: AudioSpaceEntrySource = 'unknown',
      options?: JoinCallOptions,
    ) => {
      // Joining requires an authed viewer; the page-level UI gates this
      // behind sign-in, but guard here too so SpaceProvider never crashes
      // when mounted in unauthed contexts.
      if (!currentUser) {
        return false;
      }

      const joinAttemptId = createAudioSpaceTelemetryId('join_attempt');
      const spaceSessionId =
        options?.spaceSessionId ?? createAudioSpaceTelemetryId('space_session');
      trackAudioSpaceEvent(
        AUDIO_SPACE_EVENTS.joinAttempted,
        { roomId, joinAttemptId, entrySource, spaceSessionId },
        { dedupeKey: `web-join-attempt-${joinAttemptId}` },
      );
      const joinGeneration = joinGenerationRef.current;

      if (!options?.skipSwitchConfirmation) {
        const shouldSwitch = await confirmSpaceSwitch(roomId);
        if (!shouldSwitch) {
          trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.joinCancelled, {
            roomId,
            joinAttemptId,
            entrySource,
            spaceSessionId,
          });
          return false;
        }
      }

      // If already in a room, leave first
      const prevRoom = livekitRoomRef.current;
      if (prevRoom) {
        await disconnectLivekitRoom(prevRoom);
        if (livekitRoomRef.current === prevRoom) {
          livekitRoomRef.current = null;
        }
      }
      const connectingRoom = connectingLivekitRoomRef.current;
      if (connectingRoom && connectingRoom !== prevRoom) {
        await disconnectLivekitRoom(connectingRoom);
        if (connectingLivekitRoomRef.current === connectingRoom) {
          connectingLivekitRoomRef.current = null;
        }
      }
      setActiveSpeakerFids(new Set());
      activeSpeakerFidsRef.current = new Set();

      setMicPermissionDenied(false);

      let result: Awaited<ReturnType<typeof joinAudioRoom>>;
      let joinedRoomIdForRollback: string | null = null;
      const rollbackJoinIfNeeded = async () => {
        if (options?.skipJoinRollback) {
          return;
        }
        await rollbackJoinedRoomOnConnectFailure({
          roomId: joinedRoomIdForRollback,
          leaveAudioRoom,
          invalidateAudioRoomsList,
        });
      };
      try {
        result = await joinAudioRoom({ roomId });
        joinedRoomIdForRollback = result.room.id;
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.joinApiSucceeded, {
          roomId,
          joinAttemptId,
          entrySource,
          spaceSessionId,
        });
      } catch (err) {
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.joinApiFailed, {
          roomId,
          joinAttemptId,
          entrySource,
          spaceSessionId,
          ...normalizeAudioSpaceError(err),
        });
        throw err;
      }
      try {
        const didConnect = await connectLivekitRoom({
          room: result.room,
          role: result.role,
          token: result.token,
          wsUrl: result.wsUrl,
          viewerFid: currentUser.fid,
          joinedAtMs: Date.now(),
          spaceSessionId,
          entrySource,
          joinAttemptId,
          joinGeneration,
          initialMicrophoneEnabled: options?.initialMicrophoneEnabled,
        });
        if (!didConnect) {
          await rollbackJoinIfNeeded();
          return false;
        }
      } catch (err) {
        await rollbackJoinIfNeeded();
        throw err;
      }
      trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.joinCompleted, {
        roomId: result.room.id,
        joinAttemptId,
        role: result.role,
        entrySource,
        spaceSessionId,
      });
      return true;
    },
    [
      joinAudioRoom,
      leaveAudioRoom,
      currentUser,
      confirmSpaceSwitch,
      connectLivekitRoom,
      invalidateAudioRoomsList,
      trackAudioSpaceEvent,
    ],
  );

  // Keep joinFnRef in sync for WS callbacks
  useEffect(() => {
    joinFnRef.current = join;
  }, [join]);

  // Clean up on browser tab close / navigation away.
  // sendBeacon can't carry auth headers so we only disconnect LiveKit here.
  // The backend detects participant disconnect when LiveKit fires its timeout.
  useEffect(() => {
    if (!joined) {
      return;
    }
    const handler = () => {
      const lk = livekitRoomRef.current;
      if (lk) {
        void disconnectLivekitRoom(lk);
        if (livekitRoomRef.current === lk) {
          livekitRoomRef.current = null;
        }
      }
      const connectingLk = connectingLivekitRoomRef.current;
      if (connectingLk && connectingLk !== lk) {
        void disconnectLivekitRoom(connectingLk);
        if (connectingLivekitRoomRef.current === connectingLk) {
          connectingLivekitRoomRef.current = null;
        }
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [joined]);

  const leave = useCallback(async () => {
    joinGenerationRef.current += 1;
    isVoluntaryLeaveRef.current = true;
    const lk = livekitRoomRef.current;
    const current = joinedRef.current;
    const roomId = current?.room.id;
    if (current) {
      trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.leaveAttempted, {
        roomId: current.room.id,
        role: current.role,
        spaceSessionId: current.spaceSessionId,
      });
    }
    joinedRef.current = null;

    if (lk) {
      await disconnectLivekitRoom(lk);
      if (livekitRoomRef.current === lk) {
        livekitRoomRef.current = null;
      }
    }
    const connectingLk = connectingLivekitRoomRef.current;
    if (connectingLk && connectingLk !== lk) {
      await disconnectLivekitRoom(connectingLk);
      if (connectingLivekitRoomRef.current === connectingLk) {
        connectingLivekitRoomRef.current = null;
      }
    }

    setJoined(null);
    setLivekitRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setParticipantCount(0);
    setActiveSpeakerFids(new Set());
    activeSpeakerFidsRef.current = new Set();
    setUnmutedSpeakerFids(new Set());
    setConnectedParticipantFids(new Set());
    setIncomingReactions([]);
    setMicPermissionDenied(false);
    setPendingStageInvite(null);
    setEndedReason(null);
    lastStageHeartbeatAtMsRef.current = 0;
    lastSpeakerActivityKeyRef.current = '';
    lastSpeakerActivitySentAtMsRef.current = 0;
    clearPendingSpeakerActivity();

    try {
      if (roomId) {
        await leaveAudioRoom({ roomId })
          .then(() => {
            trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.leaveCompleted, {
              roomId,
              role: current?.role,
              spaceSessionId: current?.spaceSessionId,
            });
          })
          .catch(() => {
            trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.leaveFailed, {
              roomId,
              role: current?.role,
              spaceSessionId: current?.spaceSessionId,
            });
          });
        invalidateAudioRoomsList();
      }
    } finally {
      isVoluntaryLeaveRef.current = false;
    }
  }, [
    clearPendingSpeakerActivity,
    leaveAudioRoom,
    invalidateAudioRoomsList,
    trackAudioSpaceEvent,
  ]);

  const endRoom = useCallback(
    async (options?: { throwOnEndFailure?: boolean }) => {
      const current = joinedRef.current;
      const roomId = current?.room.id;
      let ended = false;
      if (roomId) {
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.endAttempted, {
          roomId,
          role: current?.role,
          spaceSessionId: current?.spaceSessionId,
        });
        try {
          await endAudioRoom({ roomId });
          ended = true;
          trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.endCompleted, {
            roomId,
            role: current?.role,
            spaceSessionId: current?.spaceSessionId,
          });
        } catch (err) {
          trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.endFailed, {
            roomId,
            role: current?.role,
            spaceSessionId: current?.spaceSessionId,
          });
          if (options?.throwOnEndFailure) {
            throw err;
          }
        }
      }
      if (ended || !options?.throwOnEndFailure) {
        await leave();
      }
    },
    [endAudioRoom, leave, trackAudioSpaceEvent],
  );

  const prepareForNewLiveSpace = useCallback(async () => {
    const current = joinedRef.current;
    if (!current) {
      return true;
    }

    const shouldSwitch = await confirmSpaceSwitch();
    if (!shouldSwitch) {
      return false;
    }

    if (current.role !== 'host') {
      return true;
    }

    try {
      await endRoom({ throwOnEndFailure: true });
      return true;
    } catch (err) {
      appToast({
        message:
          err instanceof Error
            ? err.message
            : 'Failed to end current Space before creating a new one',
        type: 'error',
      });
      return false;
    }
  }, [confirmSpaceSwitch, endRoom]);

  const toggleMute = useCallback(async () => {
    const lk = livekitRoomRef.current;
    if (!lk || !joined) {
      return;
    }
    const canPublishByRole =
      joined.role === 'host' ||
      joined.role === 'cohost' ||
      joined.role === 'speaker';
    if (!canPublishByRole) {
      // UI role can race ahead via participants; refresh token/role once.
      if (!isRefreshingPublishPermsRef.current) {
        isRefreshingPublishPermsRef.current = true;
        appToast({ message: 'Syncing speaker access...' });
        joinFnRef
          .current?.(joined.room.id, joined.entrySource, {
            skipJoinRollback: true,
            spaceSessionId: joined.spaceSessionId,
          })
          .catch(() => {
            appToast({
              message: 'Failed to refresh speaker access',
              type: 'error',
            });
          })
          .finally(() => {
            isRefreshingPublishPermsRef.current = false;
          });
      }
      return;
    }
    trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.micToggleAttempted, {
      roomId: joined.room.id,
      role: joined.role,
      muted: joined.muted,
      spaceSessionId: joined.spaceSessionId,
    });
    const nextMuted = !joined.muted;
    try {
      await lk.localParticipant.setMicrophoneEnabled(!nextMuted);
      setJoined((prev) => (prev ? { ...prev, muted: nextMuted } : prev));
      setMicPermissionDenied(false);
    } catch (err) {
      if (isMicPermissionError(err)) {
        setMicPermissionDenied(true);
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.micPermissionDenied, {
          roomId: joined.room.id,
          role: joined.role,
          spaceSessionId: joined.spaceSessionId,
        });
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.micToggleFailed, {
          roomId: joined.room.id,
          role: joined.role,
          muted: joined.muted,
          ...normalizeAudioSpaceError(err),
          spaceSessionId: joined.spaceSessionId,
        });
        return;
      }
      // Non-browser permission failure (usually stale publish token/permissions).
      if (!isRefreshingPublishPermsRef.current) {
        isRefreshingPublishPermsRef.current = true;
        appToast({ message: 'Refreshing speaker permissions...' });
        joinFnRef
          .current?.(joined.room.id, joined.entrySource, {
            skipJoinRollback: true,
            spaceSessionId: joined.spaceSessionId,
          })
          .catch(() => {
            appToast({
              message: 'Failed to refresh speaker access',
              type: 'error',
            });
          })
          .finally(() => {
            isRefreshingPublishPermsRef.current = false;
          });
      }
    }
  }, [joined, trackAudioSpaceEvent]);

  const toggleHand = useCallback(() => {
    if (!joined) {
      return;
    }
    const nextRaised = !joined.handRaised;
    trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.handRaiseToggled, {
      roomId: joined.room.id,
      role: joined.role,
      raised: nextRaised,
      spaceSessionId: joined.spaceSessionId,
    });
    setJoined((prev) => (prev ? { ...prev, handRaised: nextRaised } : prev));
    raiseHandAudioRoom({
      roomId: joined.room.id,
      raised: nextRaised,
    }).catch(() => {
      // Revert on failure
      setJoined((prev) => (prev ? { ...prev, handRaised: !nextRaised } : prev));
    });
  }, [joined, raiseHandAudioRoom, trackAudioSpaceEvent]);

  const acceptStageInvite = useCallback(async () => {
    const currentJoined = joinedRef.current;
    const roomId = currentJoined?.room.id;
    if (!roomId || !currentJoined) {
      return;
    }
    const pendingInvite = pendingStageInvite;
    acceptingStageInviteRef.current = {
      roomId,
      role: pendingInvite?.role ?? null,
      inviterFid: pendingInvite?.inviterFid ?? null,
      spaceSessionId: currentJoined.spaceSessionId,
    };
    setPendingStageInvite(null);
    try {
      const result = await acceptStageInviteAudioRoom({ roomId });
      const acceptedInviteRole =
        result.role === 'speaker' || result.role === 'cohost'
          ? result.role
          : null;
      acceptingStageInviteRef.current = {
        roomId,
        role: acceptedInviteRole,
        inviterFid: pendingInvite?.inviterFid ?? null,
        spaceSessionId: currentJoined.spaceSessionId,
      };
      trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.stageInviteAccepted, {
        roomId,
        role: result.role,
      });

      const existingRoom =
        livekitRoomRef.current ?? connectingLivekitRoomRef.current;
      if (!existingRoom) {
        updateJoinedState({
          ...currentJoined,
          role: result.role,
          muted: true,
          handRaised: false,
        });
        try {
          const didConnect = await connectLivekitRoom({
            room: currentJoined.room,
            role: result.role,
            token: result.token,
            wsUrl: result.wsUrl,
            viewerFid: currentJoined.viewerFid,
            joinedAtMs: currentJoined.joinedAtMs,
            spaceSessionId: currentJoined.spaceSessionId,
            entrySource: currentJoined.entrySource,
            joinAttemptId: createAudioSpaceTelemetryId('join_attempt'),
          });
          if (!didConnect) {
            setJoined((prev) =>
              prev
                ? { ...prev, role: result.role, muted: true, handRaised: false }
                : prev,
            );
            appToast({
              message:
                "You're on stage, but we couldn't reconnect audio. Try leaving and rejoining the Space.",
              type: 'error',
            });
          }
        } catch {
          setJoined((prev) =>
            prev
              ? { ...prev, role: result.role, muted: true, handRaised: false }
              : prev,
          );
          appToast({
            message:
              "You're on stage, but we couldn't reconnect audio. Try leaving and rejoining the Space.",
            type: 'error',
          });
        }
        acceptingStageInviteRef.current = null;
        return;
      }

      const initialMicrophoneEnabled =
        !!existingRoom.localParticipant.isMicrophoneEnabled &&
        (currentJoined.role === 'speaker' || currentJoined.role === 'cohost') &&
        (result.role === 'speaker' || result.role === 'cohost');
      updateJoinedState({
        ...currentJoined,
        role: result.role,
        muted: true,
        handRaised: false,
      });
      let microphoneEnabled = initialMicrophoneEnabled;
      try {
        await applySpeakerMicrophoneState({
          participant: existingRoom.localParticipant,
          enabled: initialMicrophoneEnabled,
          previousRole: currentJoined.role,
        });
        if (initialMicrophoneEnabled) {
          setMicPermissionDenied(false);
        }
      } catch (err) {
        if (isMicPermissionError(err)) {
          setMicPermissionDenied(true);
        }
        microphoneEnabled = false;
        if (!isMicPermissionError(err)) {
          joinFnRef
            .current?.(roomId, currentJoined.entrySource, {
              skipSwitchConfirmation: true,
              skipJoinRollback: true,
              spaceSessionId: currentJoined.spaceSessionId,
              initialMicrophoneEnabled,
            })
            .catch(() => {
              appToast({
                message: 'Failed to reconnect - try leaving and rejoining',
                type: 'error',
              });
            });
        }
      }
      updateJoinedState({
        ...currentJoined,
        role: result.role,
        muted: !microphoneEnabled,
        handRaised: false,
      });
      acceptingStageInviteRef.current = null;
    } catch (err) {
      const acceptingStageInvite = acceptingStageInviteRef.current;
      if (
        acceptingStageInvite?.roomId === roomId &&
        acceptingStageInvite.spaceSessionId === currentJoined.spaceSessionId
      ) {
        acceptingStageInviteRef.current = null;
      }
      if (pendingInvite) {
        setPendingStageInvite(pendingInvite);
      }
      throw err;
    }
  }, [
    acceptStageInviteAudioRoom,
    connectLivekitRoom,
    pendingStageInvite,
    trackAudioSpaceEvent,
    updateJoinedState,
  ]);

  const declineStageInvite = useCallback(async () => {
    const roomId = joinedRef.current?.room.id;
    if (!roomId) {
      return;
    }
    await declineStageInviteAudioRoom({ roomId });
    trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.stageInviteDeclined, { roomId });
    setPendingStageInvite(null);
  }, [declineStageInviteAudioRoom, trackAudioSpaceEvent]);

  const clearReaction = useCallback((id: number) => {
    setIncomingReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearRemovedByHost = useCallback(() => {
    setRemovedByHostRoomId(null);
  }, []);

  const handleRemovedByHostModalClose = useCallback(() => {
    const roomId = removedByHostRoomId;
    if (!roomId) {
      clearRemovedByHost();
      return;
    }

    if (joinedRef.current?.room.id === roomId) {
      joinGenerationRef.current += 1;
      resetLocalJoinedState();
      void teardownLivekitSession();
    }

    const isOnSpaceRoom =
      location.pathname === `${appPathPrefix}/spaces/${roomId}` ||
      location.pathname === `${appPathPrefix}/audio-room/${roomId}`;

    clearRemovedByHost();
    if (isOnSpaceRoom) {
      navigate({ to: 'spacesDiscovery', params: {} });
    }
  }, [
    clearRemovedByHost,
    location.pathname,
    navigate,
    removedByHostRoomId,
    resetLocalJoinedState,
    teardownLivekitSession,
  ]);

  const value = useMemo<SpaceContextValue>(
    () => ({
      joined,
      elapsedSec,
      connectionState,
      participantCount,
      livekitRoom,
      activeSpeakerFids,
      unmutedSpeakerFids,
      connectedParticipantFids,
      incomingReactions,
      micPermissionDenied,
      pendingStageInvite,
      endedReason,
      removedByHostRoomId,
      clearRemovedByHost,
      join,
      prepareForNewLiveSpace,
      leave,
      endRoom,
      toggleMute,
      toggleHand,
      acceptStageInvite,
      declineStageInvite,
      clearReaction,
    }),
    [
      joined,
      elapsedSec,
      connectionState,
      participantCount,
      livekitRoom,
      activeSpeakerFids,
      unmutedSpeakerFids,
      connectedParticipantFids,
      incomingReactions,
      micPermissionDenied,
      pendingStageInvite,
      endedReason,
      removedByHostRoomId,
      clearRemovedByHost,
      join,
      prepareForNewLiveSpace,
      leave,
      endRoom,
      toggleMute,
      toggleHand,
      acceptStageInvite,
      declineStageInvite,
      clearReaction,
    ],
  );

  return (
    <>
      <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
      {isSwitchModalOpen && (
        <ConfirmationModal
          title="Leave current Space?"
          body="Joining another Space will leave your current Space."
          cancelText="Cancel"
          confirmText="Continue"
          destructive={true}
          hideAreYouSure={true}
          onCancel={() => closeSwitchModal(false)}
          onConfirm={() => closeSwitchModal(true)}
          onBackdropClose={() => closeSwitchModal(false)}
        />
      )}
      <SpaceAlertModal
        open={removedByHostRoomId !== null}
        title="Removed from Space"
        body="You were removed from this Space by the host."
        buttonText="OK"
        onClose={handleRemovedByHostModalClose}
      />
    </>
  );
};

function useSpace() {
  const ctx = useContext(SpaceContext);
  if (!ctx) {
    throw new Error('useSpace must be used inside <SpaceProvider>');
  }
  return ctx;
}

function useOptionalSpace() {
  return useContext(SpaceContext);
}

function formatElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export { formatElapsed, SpaceProvider, useOptionalSpace, useSpace };
