import {
  AudioSession,
  getDefaultAppleAudioConfigurationForMode,
  registerGlobals,
} from '@livekit/react-native';
import { StackActions } from '@react-navigation/native';
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
  useRemoveSpeakerAudioRoom,
  useWebSockets,
} from 'farcaster-client-hooks';
import {
  ConnectionState,
  type Participant,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
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
import { Alert, AppState, Platform } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { SpaceEndedModal } from '~/components/spaces/SpaceEndedModal';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { SpaceForegroundService } from '~/native/SpaceForegroundService';
import { navigationRef } from '~/navigation/navigationRef';
import { trackMobileAudioSpaceEvent } from '~/utils/AudioSpaceInstrumentation';
import { disconnectLivekitRoom } from '~/utils/livekitRoomCleanup';

import { rollbackJoinedRoomOnConnectFailure } from './spaceJoinRollback';
import {
  applySpeakerMicrophoneState,
  getInitialMicrophoneEnabledForRoleRefresh,
  resolveEffectiveRole,
} from './spaceMicState';

// Initialize WebRTC globals once at module load. Required by @livekit/react-native.
registerGlobals();

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

type LivekitJoinResult = {
  room: ApiAudioRoom;
  token: string;
  wsUrl: string;
  role: ApiAudioRoomRole;
};

type JoinOptions = {
  joinResultOverride?: LivekitJoinResult;
  skipSwitchConfirmation?: boolean;
  skipJoinRollback?: boolean;
  joinAttemptId?: string;
  spaceSessionId?: string;
  initialMicrophoneEnabled?: boolean;
};

type JoinCallOptions = Pick<JoinOptions, 'skipSwitchConfirmation'>;

type IncomingReaction = {
  id: number;
  fid: number;
  emoji: string;
  offset: number;
};

type SpaceContextValue = {
  joined: JoinedSpace | null;
  connectionState: ConnectionState;
  participantCount: number;
  livekitRoom: Room | null;
  activeSpeakerFids: Set<number>;
  /** Set of participant fids whose microphone is currently unmuted in LiveKit */
  unmutedSpeakerFids: Set<number>;
  /** Set of all participant fids currently connected to LiveKit in this room (includes listeners and local viewer) */
  connectedParticipantFids: Set<number>;
  incomingReactions: IncomingReaction[];
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
  leaveStage: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleHand: () => void;
  acceptStageInvite: () => Promise<void>;
  declineStageInvite: () => Promise<void>;
};

const SpaceContext = createContext<SpaceContextValue | null>(null);
const IsSpaceJoinedContext = createContext<boolean | null>(null);
const INCOMING_REACTION_TTL_MS = 2800;
const MAX_INCOMING_REACTIONS = 120;
const RECORD_SPEAKER_ACTIVITY_MIN_INTERVAL_MS = 1_000;

function fidFromIdentity(identity: string): number | null {
  if (identity.startsWith('fid:')) {
    const n = parseInt(identity.slice(4), 10);
    return isNaN(n) ? null : n;
  }
  const n = parseInt(identity, 10);
  return isNaN(n) ? null : n;
}

function sortedSpeakerFids(fids: Set<number>): number[] {
  return [...fids].sort((a, b) => a - b);
}

function isMicPermissionError(err: unknown): boolean {
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

function handleTrackSubscribed(
  _track: RemoteTrack,
  _publication: RemoteTrackPublication,
  _participant: RemoteParticipant,
) {
  // On RN, audio playback for subscribed remote tracks is handled automatically
  // by @livekit/react-native via the AudioSession. No DOM attach needed.
}

function handleTrackUnsubscribed(
  _track: RemoteTrack,
  _publication: RemoteTrackPublication,
  _participant: RemoteParticipant,
) {
  // No-op on RN.
}

function isAudioSpaceEntrySource(
  value: unknown,
): value is AudioSpaceEntrySource {
  return (
    typeof value === 'string' &&
    (AUDIO_SPACE_ENTRY_SOURCES as readonly string[]).includes(value)
  );
}

function isPublishingRole(role: ApiAudioRoomRole): boolean {
  return role === 'host' || role === 'cohost' || role === 'speaker';
}

async function configureAppleAudioSessionForSpaceRole(role: ApiAudioRoomRole) {
  if (Platform.OS !== 'ios') {
    return;
  }

  await AudioSession.configureAudio({
    ios: { defaultOutput: 'speaker' },
  });
  await AudioSession.setAppleAudioConfiguration(
    getDefaultAppleAudioConfigurationForMode(
      isPublishingRole(role) ? 'localAndRemote' : 'remoteOnly',
      true,
    ),
  );
}

const SpaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const currentUser = useCurrentUser();
  const toast = useToast();
  const [joined, setJoined] = useState<JoinedSpace | null>(null);
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

  const livekitRoomRef = useRef<Room | null>(null);
  const connectingLivekitRoomRef = useRef<Room | null>(null);
  const isVoluntaryLeaveRef = useRef(false);
  const joinGenerationRef = useRef(0);
  const joinedRef = useRef<JoinedSpace | null>(null);
  const joinFnRef = useRef<
    | ((
        roomId: string,
        entrySource?: AudioSpaceEntrySource,
        options?: JoinOptions,
      ) => Promise<boolean>)
    | null
  >(null);
  const audioSessionStartedRef = useRef(false);
  const pendingSwitchConfirmationRef = useRef<Promise<boolean> | null>(null);
  const lastStageHeartbeatAtMsRef = useRef(0);
  const lastSpeakerActivityKeyRef = useRef('');
  const lastSpeakerActivitySentAtMsRef = useRef(0);
  const pendingSpeakerActivityFidsRef = useRef<number[] | null>(null);
  const speakerActivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const activeSpeakerFidsRef = useRef<Set<number>>(new Set());
  const audioSpaceEventDedupeRef = useRef<Map<string, number>>(new Map());
  const incomingReactionTimersRef = useRef<
    Map<number, ReturnType<typeof setTimeout>>
  >(new Map());
  const incomingReactionNextIdRef = useRef(0);
  const acceptingStageInviteRef = useRef<{
    roomId: string;
    role: ApiAudioRoomPromoteRole | null;
    inviterFid: number | null;
    spaceSessionId: string;
  } | null>(null);
  const connectionStateRef = useRef<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const viewerFidRef = useRef<number | undefined>(undefined);
  const participantCountRef = useRef(0);
  const micPermissionDeniedRef = useRef(false);
  const isRefreshingPublishPermsRef = useRef(false);

  const trackAudioSpaceEvent = useCallback(
    (
      eventName: (typeof AUDIO_SPACE_EVENTS)[keyof typeof AUDIO_SPACE_EVENTS],
      properties?: Record<string, string | number | boolean | undefined>,
      {
        dedupeKey,
        dedupeWindowMs,
        addRumAction,
      }: {
        dedupeKey?: string;
        dedupeWindowMs?: number;
        addRumAction?: boolean;
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
        platform: 'mobile',
        entrySource:
          entrySourceFromProperties ?? current?.entrySource ?? 'unknown',
        connectionState: connectionStateRef.current,
        participantCount: participantCountRef.current,
        audioPermissionState: micPermissionDeniedRef.current
          ? 'denied'
          : 'unknown',
      };

      trackMobileAudioSpaceEvent({
        eventName,
        context: baseContext,
        properties,
        dedupeMap: audioSpaceEventDedupeRef.current,
        dedupeKey,
        dedupeWindowMs,
        addRumAction,
      });
    },
    [],
  );

  const configureSpaceAudioSession = useCallback(
    async ({
      role,
      roomId,
      joinAttemptId,
      spaceSessionId,
    }: {
      role: ApiAudioRoomRole;
      roomId: string;
      joinAttemptId?: string;
      spaceSessionId?: string;
    }) => {
      try {
        await configureAppleAudioSessionForSpaceRole(role);
      } catch (err) {
        trackAudioSpaceEvent(
          AUDIO_SPACE_EVENTS.audioSessionConfigureFailed,
          {
            roomId,
            joinAttemptId,
            role,
            spaceSessionId,
            ...normalizeAudioSpaceError(err),
          },
          {
            dedupeKey: `mobile-audio-session-config-failed-${roomId}-${role}`,
            dedupeWindowMs: 3000,
            addRumAction: true,
          },
        );
      }
    },
    [trackAudioSpaceEvent],
  );

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

  const syncSpaceForegroundMicrophone = useCallback(
    (enableMicrophone: boolean) => {
      if (Platform.OS !== 'android') {
        return;
      }

      const current = joinedRef.current;
      if (!current) {
        return;
      }

      SpaceForegroundService.start({
        title: current.room.title || 'Space is playing',
        subtitle: 'Live audio Space',
        enableMicrophone,
      });
    },
    [],
  );

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
  const removeSpeakerAudioRoom = useRemoveSpeakerAudioRoom();
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
    if (!isPublishingRole(currentJoined.role)) {
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

  const resetIncomingReactions = useCallback(() => {
    for (const timer of incomingReactionTimersRef.current.values()) {
      clearTimeout(timer);
    }
    incomingReactionTimersRef.current.clear();
    setIncomingReactions([]);
  }, []);

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
    resetIncomingReactions();
    setMicPermissionDenied(false);
    setPendingStageInvite(null);
    acceptingStageInviteRef.current = null;
    lastStageHeartbeatAtMsRef.current = 0;
  }, [clearPendingSpeakerActivity, resetIncomingReactions]);

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
    SpaceForegroundService.stop();
    if (audioSessionStartedRef.current) {
      await AudioSession.stopAudioSession().catch(() => {});
      audioSessionStartedRef.current = false;
    }
  }, []);

  const enqueueIncomingReaction = useCallback(
    ({ emoji, fid }: { emoji: string; fid: number }) => {
      incomingReactionNextIdRef.current += 1;
      const id = incomingReactionNextIdRef.current;
      const reaction: IncomingReaction = {
        id,
        fid,
        emoji,
        offset: Math.random() * 60 - 30,
      };

      setIncomingReactions((prev) => {
        const next = [...prev, reaction];
        if (next.length <= MAX_INCOMING_REACTIONS) {
          return next;
        }
        const overflowCount = next.length - MAX_INCOMING_REACTIONS;
        const dropped = next.slice(0, overflowCount);
        for (const droppedReaction of dropped) {
          const timer = incomingReactionTimersRef.current.get(
            droppedReaction.id,
          );
          if (timer) {
            clearTimeout(timer);
            incomingReactionTimersRef.current.delete(droppedReaction.id);
          }
        }
        return next.slice(overflowCount);
      });

      const timer = setTimeout(() => {
        incomingReactionTimersRef.current.delete(id);
        setIncomingReactions((prev) => prev.filter((r) => r.id !== id));
      }, INCOMING_REACTION_TTL_MS);
      incomingReactionTimersRef.current.set(id, timer);
    },
    [],
  );

  useEffect(() => {
    if (!joined || !isPublishingRole(joined.role)) {
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

  // Subscribe to audio room WS channel for real-time events (mirrors web)
  useEffect(() => {
    if (!joined) return;
    const roomId = joined.room.id;

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

    registerOnMessageCallback({
      messageType: 'audio-room-reaction',
      cbReferenceId: `space-reaction-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType === 'audio-room-reaction') {
          const { emoji, fid } = message.payload;
          enqueueIncomingReaction({ emoji, fid: fid ?? 0 });
        }
      },
    });

    registerOnMessageCallback({
      messageType: 'audio-room-hand-raised',
      cbReferenceId: `space-hand-${roomId}`,
      cb: ({ message }) => {
        if (message.messageType === 'audio-room-hand-raised') {
          invalidateAudioRoomParticipants({ roomId: message.payload.roomId });
        }
      },
    });

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
                await configureSpaceAudioSession({
                  role: newRole,
                  roomId: changedRoomId,
                  spaceSessionId: current.spaceSessionId,
                });
                updateJoinedState({
                  ...current,
                  role: newRole,
                  muted: true,
                  handRaised: false,
                });
                syncSpaceForegroundMicrophone(false);
                toast.show("You've been moved to listener", {
                  type: 'generic',
                });
              } else {
                const initialMicrophoneEnabled =
                  getInitialMicrophoneEnabledForRoleRefresh({
                    currentRole: current.role,
                    nextRole: newRole,
                    currentMicrophoneEnabled: !!(
                      livekitRoomRef.current ?? connectingLivekitRoomRef.current
                    )?.localParticipant.isMicrophoneEnabled,
                  });
                toast.show(
                  newRole === 'cohost'
                    ? "You've been made co-host!"
                    : "You've been invited to speak!",
                  { type: 'success' },
                );
                await configureSpaceAudioSession({
                  role: newRole,
                  roomId: changedRoomId,
                  spaceSessionId: current.spaceSessionId,
                });
                const lk =
                  livekitRoomRef.current ?? connectingLivekitRoomRef.current;
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
                    syncSpaceForegroundMicrophone(initialMicrophoneEnabled);
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
                    syncSpaceForegroundMicrophone(false);
                    if (!isMicPermissionError(err)) {
                      joinFnRef
                        .current?.(changedRoomId, current.entrySource, {
                          skipSwitchConfirmation: true,
                          skipJoinRollback: true,
                          spaceSessionId: current.spaceSessionId,
                          initialMicrophoneEnabled,
                        })
                        .catch(() => {
                          toast.show(
                            'Failed to reconnect - try leaving and rejoining',
                            { type: 'danger' },
                          );
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
                  syncSpaceForegroundMicrophone(false);
                  joinFnRef
                    .current?.(changedRoomId, current.entrySource, {
                      skipSwitchConfirmation: true,
                      skipJoinRollback: true,
                      spaceSessionId: current.spaceSessionId,
                      initialMicrophoneEnabled,
                    })
                    .catch(() => {
                      toast.show(
                        'Failed to reconnect - try leaving and rejoining',
                        { type: 'danger' },
                      );
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
              dedupeKey: `mobile-stage-invite-${changedRoomId}-${inviterFid}-${role}`,
              dedupeWindowMs: 2000,
            },
          );
          setPendingStageInvite({ role, inviterFid });
          toast.show('You have a pending stage invite', { type: 'generic' });
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
            toast.show('Your stage invite was cancelled', { type: 'generic' });
          }
        }
      },
    });

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
                dedupeKey: `mobile-room-ended-${endedRoomId}`,
                dedupeWindowMs: 3000,
                addRumAction: true,
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
            SpaceForegroundService.stop();
            if (audioSessionStartedRef.current) {
              AudioSession.stopAudioSession().catch(() => {});
              audioSessionStartedRef.current = false;
            }
            setJoined(null);
            setLivekitRoom(null);
            setConnectionState(ConnectionState.Disconnected);
            setParticipantCount(0);
            setActiveSpeakerFids(new Set());
            activeSpeakerFidsRef.current = new Set();
            setConnectedParticipantFids(new Set());
            resetIncomingReactions();
            setMicPermissionDenied(false);
            setPendingStageInvite(null);
            if (wsEndedReason !== 'host_silence') {
              toast.show('This Space has ended', { type: 'generic' });
            }
          }
          invalidateAudioRoomsList();
          invalidateAudioRoom({ roomId: endedRoomId });
        }
      },
    });

    registerOnMessageCallback({
      messageType: 'audio-room-updated',
      cbReferenceId: `space-updated-${roomId}`,
      cb: () => {
        invalidateAudioRoomsList();
        invalidateAudioRoom({ roomId });
        invalidateAudioRoomParticipants({ roomId });
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
            dedupeKey: `mobile-removed-by-host-${eventRoomId}`,
            dedupeWindowMs: 3000,
            addRumAction: true,
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
      try {
        wsSend({
          message: {
            messageType: 'audio_room_unsubscribe',
            data: { roomId },
          },
        });
      } catch {
        // ignore
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
    configureSpaceAudioSession,
    trackAudioSpaceEvent,
    toast,
    enqueueIncomingReaction,
    resetIncomingReactions,
    syncSpaceForegroundMicrophone,
    teardownLivekitSession,
    resetLocalJoinedState,
    updateJoinedState,
  ]);

  const confirmSpaceSwitch = useCallback(async (nextRoomId?: string) => {
    const currentJoined = joinedRef.current;
    if (!currentJoined) {
      return true;
    }
    if (nextRoomId && currentJoined.room.id === nextRoomId) {
      return true;
    }

    if (pendingSwitchConfirmationRef.current) {
      return pendingSwitchConfirmationRef.current;
    }

    const confirmationPromise = new Promise<boolean>((resolve) => {
      Alert.alert(
        'Leave current Space?',
        'Joining another Space will leave your current Space.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Continue',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => resolve(false),
        },
      );
    });

    pendingSwitchConfirmationRef.current = confirmationPromise;
    try {
      return await confirmationPromise;
    } finally {
      pendingSwitchConfirmationRef.current = null;
    }
  }, []);

  const join = useCallback(
    async (
      roomId: string,
      entrySource: AudioSpaceEntrySource = 'unknown',
      options?: JoinOptions,
    ) => {
      if (!currentUser?.fid) {
        throw new Error('Not signed in');
      }

      const joinAttemptId =
        options?.joinAttemptId ?? createAudioSpaceTelemetryId('join_attempt');
      const spaceSessionId =
        options?.spaceSessionId ?? createAudioSpaceTelemetryId('space_session');
      trackAudioSpaceEvent(
        AUDIO_SPACE_EVENTS.joinAttempted,
        { roomId, joinAttemptId, entrySource, spaceSessionId },
        { addRumAction: true },
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

      // If already in a room, leave first. Otherwise we'd orphan the prior
      // LiveKit connection and end up with two simultaneous audio streams.
      const prevRoom = livekitRoomRef.current;
      if (prevRoom) {
        await disconnectLivekitRoom(prevRoom);
        if (livekitRoomRef.current === prevRoom) {
          livekitRoomRef.current = null;
        }
        SpaceForegroundService.stop();
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
      resetIncomingReactions();

      // Start audio session before connecting (idempotent)
      if (!audioSessionStartedRef.current) {
        try {
          await AudioSession.startAudioSession();
          audioSessionStartedRef.current = true;
        } catch {
          // Audio session may already be active; continue.
        }
      }

      let joinResult: LivekitJoinResult;
      let joinedRoomIdForRollback: string | null = null;
      if (options?.joinResultOverride) {
        joinResult = options.joinResultOverride;
        joinedRoomIdForRollback = joinResult.room.id;
      } else {
        try {
          joinResult = await joinAudioRoom({ roomId });
          joinedRoomIdForRollback = joinResult.room.id;
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
      }
      if (!joinResult) throw new Error('Failed to join');
      const { room: apiRoom, token, wsUrl, role } = joinResult;
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

      await configureSpaceAudioSession({
        role,
        roomId: apiRoom.id,
        joinAttemptId,
        spaceSessionId,
      });

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      connectingLivekitRoomRef.current = room;
      const isCurrentLivekitRoom = () =>
        livekitRoomRef.current === room ||
        connectingLivekitRoomRef.current === room;

      const viewerFid = currentUser.fid;
      const syncConnectedParticipantFids = () => {
        const nextConnectedParticipantFids = new Set<number>([viewerFid]);
        for (const remoteParticipant of room.remoteParticipants.values()) {
          const fid = fidFromIdentity(remoteParticipant.identity);
          if (fid !== null) {
            nextConnectedParticipantFids.add(fid);
          }
        }
        setConnectedParticipantFids(nextConnectedParticipantFids);
      };
      const syncUnmutedSpeakerFids = () => {
        const nextUnmutedSpeakerFids = new Set<number>();
        if (room.localParticipant.isMicrophoneEnabled) {
          nextUnmutedSpeakerFids.add(viewerFid);
        }
        for (const remoteParticipant of room.remoteParticipants.values()) {
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

      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        const prevState = connectionStateRef.current;
        connectionStateRef.current = state;
        setConnectionState(state);
        trackAudioSpaceEvent(
          AUDIO_SPACE_EVENTS.connectionStateChanged,
          {
            roomId: apiRoom.id,
            joinAttemptId,
            spaceSessionId,
            fromState: prevState,
            toState: state,
            role,
            entrySource,
          },
          {
            dedupeKey: `mobile-state-${apiRoom.id}-${prevState}-${state}`,
            dedupeWindowMs: 1000,
          },
        );
        if (state === ConnectionState.Reconnecting) {
          trackAudioSpaceEvent(
            AUDIO_SPACE_EVENTS.reconnectStarted,
            {
              roomId: apiRoom.id,
              joinAttemptId,
              role,
              entrySource,
              spaceSessionId,
            },
            {
              dedupeKey: `mobile-reconnect-start-${apiRoom.id}`,
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
              roomId: apiRoom.id,
              joinAttemptId,
              role,
              entrySource,
              spaceSessionId,
            },
            {
              dedupeKey: `mobile-reconnect-success-${apiRoom.id}`,
              dedupeWindowMs: 3000,
            },
          );
        }
      });
      room.on(RoomEvent.Disconnected, () => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (connectionStateRef.current === ConnectionState.Reconnecting) {
          trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.reconnectFailed, {
            roomId: apiRoom.id,
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
        invalidateAudioRoom({ roomId: apiRoom.id });
      });
      room.on(RoomEvent.ParticipantConnected, () => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        setParticipantCount(room.numParticipants);
        syncConnectedParticipantFids();
        syncUnmutedSpeakerFids();
      });
      room.on(RoomEvent.ParticipantDisconnected, () => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        setParticipantCount(room.numParticipants);
        syncConnectedParticipantFids();
        syncUnmutedSpeakerFids();
      });
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        handleTrackSubscribed(track, publication, participant);
      });
      room.on(
        RoomEvent.TrackUnsubscribed,
        (track, publication, participant) => {
          if (!isCurrentLivekitRoom()) {
            return;
          }
          handleTrackUnsubscribed(track, publication, participant);
        },
      );
      room.on(RoomEvent.TrackMuted, (publication, participant) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        setParticipantUnmutedState(participant.identity, false);
      });
      room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        setParticipantUnmutedState(participant.identity, true);
      });
      room.on(RoomEvent.TrackPublished, (publication) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        syncUnmutedSpeakerFids();
      });
      room.on(RoomEvent.TrackUnpublished, (publication) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        syncUnmutedSpeakerFids();
      });
      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        syncUnmutedSpeakerFids();
      });
      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        if (publication.source !== Track.Source.Microphone) {
          return;
        }
        syncUnmutedSpeakerFids();
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        if (!isCurrentLivekitRoom()) {
          return;
        }
        const fids = new Set<number>();
        for (const sp of speakers) {
          const fid = fidFromIdentity(sp.identity);
          if (fid !== null) fids.add(fid);
        }
        activeSpeakerFidsRef.current = fids;
        setActiveSpeakerFids(fids);
        sendStageHeartbeatIfNeeded();
        recordSpeakerActivityIfNeeded(fids);
      });
      room.on(
        RoomEvent.DataReceived,
        (payload: Uint8Array, _p?: unknown, _k?: unknown, topic?: string) => {
          if (!isCurrentLivekitRoom()) {
            return;
          }
          if (topic !== 'reaction') return;
          try {
            const decoded = new TextDecoder().decode(payload);
            const parsed = JSON.parse(decoded) as {
              emoji?: string;
              fid?: number;
            };
            if (!parsed.emoji) return;
            const emoji = parsed.emoji;
            enqueueIncomingReaction({ emoji, fid: parsed.fid ?? 0 });
          } catch {
            // ignore malformed payloads
          }
        },
      );

      trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.livekitConnectStarted, {
        roomId: apiRoom.id,
        joinAttemptId,
        role,
        entrySource,
        spaceSessionId,
      });
      try {
        await room.connect(wsUrl, token);
        if (joinGeneration !== joinGenerationRef.current) {
          await disconnectLivekitRoom(room);
          if (connectingLivekitRoomRef.current === room) {
            connectingLivekitRoomRef.current = null;
          }
          SpaceForegroundService.stop();
          if (audioSessionStartedRef.current) {
            await AudioSession.stopAudioSession().catch(() => {});
            audioSessionStartedRef.current = false;
          }
          resetConnectionStateIfInactive({
            livekitRoomRef,
            connectingLivekitRoomRef,
            connectionStateRef,
            setConnectionState,
          });
          await rollbackJoinIfNeeded();
          return false;
        }
        syncUnmutedSpeakerFids();
        trackAudioSpaceEvent(
          AUDIO_SPACE_EVENTS.livekitConnectSucceeded,
          {
            roomId: apiRoom.id,
            joinAttemptId,
            role,
            entrySource,
            spaceSessionId,
          },
          { addRumAction: true },
        );
      } catch (err) {
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.livekitConnectFailed, {
          roomId: apiRoom.id,
          joinAttemptId,
          role,
          entrySource,
          spaceSessionId,
          ...normalizeAudioSpaceError(err),
        });
        await disconnectLivekitRoom(room);
        if (connectingLivekitRoomRef.current === room) {
          connectingLivekitRoomRef.current = null;
        }
        setLivekitRoom(null);
        SpaceForegroundService.stop();
        if (audioSessionStartedRef.current) {
          await AudioSession.stopAudioSession().catch(() => {});
          audioSessionStartedRef.current = false;
        }
        resetConnectionStateIfInactive({
          livekitRoomRef,
          connectingLivekitRoomRef,
          connectionStateRef,
          setConnectionState,
        });
        await rollbackJoinIfNeeded();
        throw err;
      }

      SpaceForegroundService.start({
        title: apiRoom.title || 'Space is playing',
        subtitle: 'Live audio Space',
      });

      // Speakers/cohosts/hosts publish mic; default muted to avoid surprise live mic.
      const currentJoined = joinedRef.current;
      const effectiveRole = resolveEffectiveRole({
        joinedRole: currentJoined?.role ?? null,
        connectRole: role,
        sameSession:
          !!currentJoined &&
          currentJoined.room.id === apiRoom.id &&
          currentJoined.spaceSessionId === spaceSessionId,
      });
      const canPublish = isPublishingRole(effectiveRole);
      const shouldEnableInitialMicrophone =
        canPublish && options?.initialMicrophoneEnabled === true;
      let initialMicrophoneEnabled = false;
      if (canPublish) {
        try {
          if (shouldEnableInitialMicrophone) {
            await room.localParticipant.setMicrophoneEnabled(true);
            initialMicrophoneEnabled = true;
          } else {
            // Fresh Room has no mic publication yet — enable-then-mute even if
            // joined.role was already promoted before this reconnect.
            await applySpeakerMicrophoneState({
              participant: room.localParticipant,
              enabled: false,
              previousRole: 'listener',
            });
          }
        } catch (err) {
          // Mic permission may have been denied — surface to UI
          setMicPermissionDenied(true);
          trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.micPermissionDenied, {
            roomId: apiRoom.id,
            joinAttemptId,
            role,
            entrySource,
            spaceSessionId,
          });
        }
      }

      if (joinGeneration !== joinGenerationRef.current) {
        await disconnectLivekitRoom(room);
        if (connectingLivekitRoomRef.current === room) {
          connectingLivekitRoomRef.current = null;
        }
        setLivekitRoom(null);
        SpaceForegroundService.stop();
        if (audioSessionStartedRef.current) {
          await AudioSession.stopAudioSession().catch(() => {});
          audioSessionStartedRef.current = false;
        }
        resetConnectionStateIfInactive({
          livekitRoomRef,
          connectingLivekitRoomRef,
          connectionStateRef,
          setConnectionState,
        });
        await rollbackJoinIfNeeded();
        return false;
      }
      if (connectingLivekitRoomRef.current !== room) {
        await disconnectLivekitRoom(room);
        resetConnectionStateIfInactive({
          livekitRoomRef,
          connectingLivekitRoomRef,
          connectionStateRef,
          setConnectionState,
        });
        await rollbackJoinIfNeeded();
        return false;
      }
      livekitRoomRef.current = room;
      if (connectingLivekitRoomRef.current === room) {
        connectingLivekitRoomRef.current = null;
      }
      setLivekitRoom(room);
      setParticipantCount(room.numParticipants);
      syncConnectedParticipantFids();
      syncUnmutedSpeakerFids();
      setEndedReason(null);
      lastStageHeartbeatAtMsRef.current = 0;
      lastSpeakerActivityKeyRef.current = '';
      lastSpeakerActivitySentAtMsRef.current = 0;
      clearPendingSpeakerActivity();
      const nextJoined: JoinedSpace = {
        room: apiRoom,
        role: effectiveRole,
        viewerFid,
        spaceSessionId,
        entrySource,
        muted: !initialMicrophoneEnabled,
        handRaised: false,
        joinedAtMs: Date.now(),
      };
      joinedRef.current = nextJoined;
      setJoined(nextJoined);
      syncSpaceForegroundMicrophone(initialMicrophoneEnabled);
      trackAudioSpaceEvent(
        AUDIO_SPACE_EVENTS.joinCompleted,
        {
          roomId: apiRoom.id,
          joinAttemptId,
          role: effectiveRole,
          entrySource,
          spaceSessionId,
        },
        { addRumAction: true },
      );
      return true;
    },
    [
      clearPendingSpeakerActivity,
      joinAudioRoom,
      leaveAudioRoom,
      currentUser?.fid,
      confirmSpaceSwitch,
      configureSpaceAudioSession,
      invalidateAudioRoom,
      invalidateAudioRoomsList,
      sendStageHeartbeatIfNeeded,
      recordSpeakerActivityIfNeeded,
      enqueueIncomingReaction,
      resetIncomingReactions,
      syncSpaceForegroundMicrophone,
      trackAudioSpaceEvent,
    ],
  );

  useEffect(() => {
    joinFnRef.current = join;
  }, [join]);

  const leave = useCallback(async () => {
    joinGenerationRef.current += 1;
    isVoluntaryLeaveRef.current = true;
    const current = joinedRef.current;
    if (current) {
      trackAudioSpaceEvent(
        AUDIO_SPACE_EVENTS.leaveAttempted,
        {
          roomId: current.room.id,
          role: current.role,
          spaceSessionId: current.spaceSessionId,
        },
        { addRumAction: true },
      );
    }
    joinedRef.current = null;
    const lk = livekitRoomRef.current;
    SpaceForegroundService.stop();
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
    try {
      if (current) {
        try {
          await leaveAudioRoom({ roomId: current.room.id });
          trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.leaveCompleted, {
            roomId: current.room.id,
            role: current.role,
            spaceSessionId: current.spaceSessionId,
          });
        } catch {
          trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.leaveFailed, {
            roomId: current.room.id,
            role: current.role,
            spaceSessionId: current.spaceSessionId,
          });
          // ignore — backend may already have us as left via webhook
        }
      }
    } finally {
      if (audioSessionStartedRef.current) {
        try {
          await AudioSession.stopAudioSession();
        } catch {
          // ignore
        }
        audioSessionStartedRef.current = false;
      }
      setEndedReason(null);
      lastStageHeartbeatAtMsRef.current = 0;
      lastSpeakerActivityKeyRef.current = '';
      lastSpeakerActivitySentAtMsRef.current = 0;
      clearPendingSpeakerActivity();
      setJoined(null);
      setLivekitRoom(null);
      setConnectionState(ConnectionState.Disconnected);
      setParticipantCount(0);
      setActiveSpeakerFids(new Set());
      activeSpeakerFidsRef.current = new Set();
      setUnmutedSpeakerFids(new Set());
      setConnectedParticipantFids(new Set());
      resetIncomingReactions();
      setMicPermissionDenied(false);
      setPendingStageInvite(null);
      isVoluntaryLeaveRef.current = false;
    }
  }, [
    clearPendingSpeakerActivity,
    leaveAudioRoom,
    resetIncomingReactions,
    trackAudioSpaceEvent,
  ]);

  const endRoom = useCallback(
    async (options?: { throwOnEndFailure?: boolean }) => {
      const current = joinedRef.current;
      if (!current) return;
      trackAudioSpaceEvent(
        AUDIO_SPACE_EVENTS.endAttempted,
        {
          roomId: current.room.id,
          role: current.role,
          spaceSessionId: current.spaceSessionId,
        },
        { addRumAction: true },
      );
      let ended = false;
      try {
        await endAudioRoom({ roomId: current.room.id });
        ended = true;
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.endCompleted, {
          roomId: current.room.id,
          role: current.role,
          spaceSessionId: current.spaceSessionId,
        });
      } catch (err) {
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.endFailed, {
          roomId: current.room.id,
          role: current.role,
          spaceSessionId: current.spaceSessionId,
        });
        if (options?.throwOnEndFailure) {
          throw err;
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
      toast.show(
        err instanceof Error
          ? err.message
          : 'Failed to end current Space before creating a new one',
        { type: 'danger' },
      );
      return false;
    }
  }, [confirmSpaceSwitch, endRoom, toast]);

  const leaveStage = useCallback(async () => {
    const current = joinedRef.current;
    if (!current || current.role !== 'speaker') {
      return;
    }

    await removeSpeakerAudioRoom({
      roomId: current.room.id,
      fid: current.viewerFid,
    });

    await muteTrackedLivekitRooms(
      livekitRoomRef.current,
      connectingLivekitRoomRef.current,
    );

    setJoined((prev) =>
      prev && prev.room.id === current.room.id
        ? { ...prev, role: 'listener', muted: true, handRaised: false }
        : prev,
    );
    acceptingStageInviteRef.current = null;
    syncSpaceForegroundMicrophone(false);
    trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.leaveStage, {
      roomId: current.room.id,
      role: current.role,
      spaceSessionId: current.spaceSessionId,
    });
  }, [
    removeSpeakerAudioRoom,
    syncSpaceForegroundMicrophone,
    trackAudioSpaceEvent,
  ]);

  const toggleMute = useCallback(async () => {
    const current = joinedRef.current;
    const lk = livekitRoomRef.current;
    if (!current || !lk) return;

    const canPublish = isPublishingRole(current.role);
    if (!canPublish) {
      if (!isRefreshingPublishPermsRef.current) {
        isRefreshingPublishPermsRef.current = true;
        toast.show('Syncing speaker access...', { type: 'generic' });
        join(current.room.id, current.entrySource, {
          skipSwitchConfirmation: true,
          skipJoinRollback: true,
          spaceSessionId: current.spaceSessionId,
        })
          .catch(() => {
            toast.show('Failed to refresh speaker access', { type: 'danger' });
          })
          .finally(() => {
            isRefreshingPublishPermsRef.current = false;
          });
      }
      return;
    }

    trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.micToggleAttempted, {
      roomId: current.room.id,
      role: current.role,
      muted: current.muted,
      spaceSessionId: current.spaceSessionId,
    });

    try {
      const newEnabled = current.muted; // muted=true means we want to unmute
      await lk.localParticipant.setMicrophoneEnabled(newEnabled);
      const nextMuted = !newEnabled;
      setJoined((prev) => (prev ? { ...prev, muted: nextMuted } : prev));
      setMicPermissionDenied(false);
      syncSpaceForegroundMicrophone(newEnabled);
    } catch (err) {
      if (isMicPermissionError(err)) {
        setMicPermissionDenied(true);
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.micToggleFailed, {
          roomId: current.room.id,
          role: current.role,
          muted: current.muted,
          spaceSessionId: current.spaceSessionId,
        });
        trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.micPermissionDenied, {
          roomId: current.room.id,
          role: current.role,
          spaceSessionId: current.spaceSessionId,
        });
        return;
      }
      if (!isRefreshingPublishPermsRef.current) {
        isRefreshingPublishPermsRef.current = true;
        toast.show('Refreshing speaker permissions...', { type: 'generic' });
        join(current.room.id, current.entrySource, {
          skipSwitchConfirmation: true,
          skipJoinRollback: true,
          spaceSessionId: current.spaceSessionId,
        })
          .catch(() => {
            toast.show('Failed to refresh speaker access', { type: 'danger' });
          })
          .finally(() => {
            isRefreshingPublishPermsRef.current = false;
          });
      }
    }
  }, [join, syncSpaceForegroundMicrophone, toast, trackAudioSpaceEvent]);

  const toggleHand = useCallback(() => {
    const current = joinedRef.current;
    if (!current) return;
    const next = !current.handRaised;
    trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.handRaiseToggled, {
      roomId: current.room.id,
      role: current.role,
      raised: next,
      spaceSessionId: current.spaceSessionId,
    });
    setJoined((prev) => (prev ? { ...prev, handRaised: next } : prev));
    raiseHandAudioRoom({ roomId: current.room.id, raised: next }).catch(() => {
      setJoined((prev) => (prev ? { ...prev, handRaised: !next } : prev));
      toast.show('Failed to raise hand', { type: 'danger' });
    });
  }, [raiseHandAudioRoom, toast, trackAudioSpaceEvent]);

  const acceptStageInvite = useCallback(async () => {
    const current = joinedRef.current;
    const roomId = current?.room.id;
    if (!roomId || !current) return;
    const pendingInvite = pendingStageInvite;
    acceptingStageInviteRef.current = {
      roomId,
      role: pendingInvite?.role ?? null,
      inviterFid: pendingInvite?.inviterFid ?? null,
      spaceSessionId: current.spaceSessionId,
    };
    setPendingStageInvite(null);
    try {
      const currentMicrophoneEnabled = !!(
        livekitRoomRef.current ?? connectingLivekitRoomRef.current
      )?.localParticipant.isMicrophoneEnabled;
      const result = await acceptStageInviteAudioRoom({ roomId });
      const acceptedInviteRole =
        result.role === 'speaker' || result.role === 'cohost'
          ? result.role
          : null;
      const initialMicrophoneEnabled =
        getInitialMicrophoneEnabledForRoleRefresh({
          currentRole: current.role,
          nextRole: result.role,
          currentMicrophoneEnabled,
        });
      acceptingStageInviteRef.current = {
        roomId,
        role: acceptedInviteRole,
        inviterFid: pendingInvite?.inviterFid ?? null,
        spaceSessionId: current.spaceSessionId,
      };
      trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.stageInviteAccepted, {
        roomId,
        role: result.role,
        spaceSessionId: current.spaceSessionId,
      });
      const lk = livekitRoomRef.current ?? connectingLivekitRoomRef.current;
      if (!lk) {
        updateJoinedState({
          ...current,
          role: result.role,
          muted: true,
          handRaised: false,
        });
        const didJoin = await join(roomId, current.entrySource, {
          joinResultOverride: {
            room: current.room,
            role: result.role,
            token: result.token,
            wsUrl: result.wsUrl,
          },
          initialMicrophoneEnabled,
          skipSwitchConfirmation: true,
          skipJoinRollback: true,
          spaceSessionId: current.spaceSessionId,
        });
        if (!didJoin) {
          setJoined((prev) =>
            prev
              ? {
                  ...prev,
                  role: result.role,
                  muted: true,
                  handRaised: false,
                }
              : prev,
          );
          toast.show(
            "You're on stage, but we couldn't reconnect audio. Try leaving and rejoining the Space.",
            { type: 'danger' },
          );
        }
        acceptingStageInviteRef.current = null;
        return;
      }
      await configureSpaceAudioSession({
        role: result.role,
        roomId,
        spaceSessionId: current.spaceSessionId,
      });
      updateJoinedState({
        ...current,
        role: result.role,
        muted: true,
        handRaised: false,
      });
      let microphoneEnabled = initialMicrophoneEnabled;
      try {
        await applySpeakerMicrophoneState({
          participant: lk.localParticipant,
          enabled: initialMicrophoneEnabled,
          previousRole: current.role,
        });
        if (initialMicrophoneEnabled) {
          setMicPermissionDenied(false);
        }
        syncSpaceForegroundMicrophone(initialMicrophoneEnabled);
      } catch (err) {
        if (isMicPermissionError(err)) {
          setMicPermissionDenied(true);
        }
        microphoneEnabled = false;
        syncSpaceForegroundMicrophone(false);
        if (!isMicPermissionError(err)) {
          join(roomId, current.entrySource, {
            skipSwitchConfirmation: true,
            skipJoinRollback: true,
            spaceSessionId: current.spaceSessionId,
            initialMicrophoneEnabled,
          }).catch(() => {
            toast.show('Failed to reconnect - try leaving and rejoining', {
              type: 'danger',
            });
          });
        }
      }
      updateJoinedState({
        ...current,
        role: result.role,
        muted: !microphoneEnabled,
        handRaised: false,
      });
      acceptingStageInviteRef.current = null;
    } catch (err) {
      const acceptingStageInvite = acceptingStageInviteRef.current;
      if (
        acceptingStageInvite?.roomId === roomId &&
        acceptingStageInvite.spaceSessionId === current.spaceSessionId
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
    configureSpaceAudioSession,
    join,
    pendingStageInvite,
    syncSpaceForegroundMicrophone,
    toast,
    trackAudioSpaceEvent,
    updateJoinedState,
  ]);

  const declineStageInvite = useCallback(async () => {
    const roomId = joinedRef.current?.room.id;
    if (!roomId) return;
    await declineStageInviteAudioRoom({ roomId });
    trackAudioSpaceEvent(AUDIO_SPACE_EVENTS.stageInviteDeclined, { roomId });
    setPendingStageInvite(null);
  }, [declineStageInviteAudioRoom, trackAudioSpaceEvent]);

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

    let isOnSpaceRoom = false;
    if (navigationRef.isReady()) {
      const route = navigationRef.getCurrentRoute();
      isOnSpaceRoom =
        route?.name === 'SpaceRoom' &&
        (route.params as { roomId?: string } | undefined)?.roomId === roomId;
    }

    clearRemovedByHost();
    if (isOnSpaceRoom && navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.replace('Spaces', {}));
    }
  }, [
    clearRemovedByHost,
    removedByHostRoomId,
    resetLocalJoinedState,
    teardownLivekitSession,
  ]);

  // On unmount, clean up
  useEffect(() => {
    return () => {
      resetIncomingReactions();
      const lk = livekitRoomRef.current;
      if (lk) {
        void disconnectLivekitRoom(lk);
        if (livekitRoomRef.current === lk) {
          livekitRoomRef.current = null;
        }
        setLivekitRoom(null);
      }
      const connectingLk = connectingLivekitRoomRef.current;
      if (connectingLk && connectingLk !== lk) {
        void disconnectLivekitRoom(connectingLk);
        if (connectingLivekitRoomRef.current === connectingLk) {
          connectingLivekitRoomRef.current = null;
        }
      }
      SpaceForegroundService.stop();
      if (audioSessionStartedRef.current) {
        AudioSession.stopAudioSession().catch(() => {});
        audioSessionStartedRef.current = false;
      }
    };
  }, [resetIncomingReactions]);

  const value = useMemo<SpaceContextValue>(
    () => ({
      joined,
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
      leaveStage,
      toggleMute,
      toggleHand,
      acceptStageInvite,
      declineStageInvite,
    }),
    [
      joined,
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
      leaveStage,
      toggleMute,
      toggleHand,
      acceptStageInvite,
      declineStageInvite,
    ],
  );

  return (
    <IsSpaceJoinedContext.Provider value={joined !== null}>
      <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
      <SpaceEndedModal
        open={removedByHostRoomId !== null}
        title="Removed from Space"
        body="You were removed from this Space by the host."
        buttonText="OK"
        onClose={handleRemovedByHostModalClose}
      />
    </IsSpaceJoinedContext.Provider>
  );
};

export function useSpace(): SpaceContextValue {
  const ctx = useContext(SpaceContext);
  if (!ctx) {
    throw new Error('useSpace must be used inside <SpaceProvider>');
  }
  return ctx;
}

export function useIsSpaceJoined(): boolean {
  const isJoined = useContext(IsSpaceJoinedContext);
  if (isJoined === null) {
    throw new Error('useIsSpaceJoined must be used inside <SpaceProvider>');
  }
  return isJoined;
}

export function useSpaceElapsedSec(): number {
  const { joined } = useSpace();
  const [elapsedSec, setElapsedSec] = useState(0);

  // Keep the 1-second tick local to timer UI (mini player / room header) so
  // SpaceProvider never re-renders on it — wrapping the whole app in a ticking
  // context provider caused unrelated screens (e.g. home Feed FlashList) to
  // reconcile every second and swap the bottom visible cell while scrolled to
  // the end.
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
    const computeElapsed = () =>
      Math.max(0, Math.floor((Date.now() - start) / 1000));

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const startInterval = () => {
      if (intervalId !== undefined) clearInterval(intervalId);
      setElapsedSec(computeElapsed());
      intervalId = setInterval(() => setElapsedSec(computeElapsed()), 1000);
    };

    const stopInterval = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    startInterval();

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        startInterval();
      } else {
        stopInterval();
      }
    });

    return () => {
      stopInterval();
      appStateSub.remove();
    };
  }, [joined]);

  return elapsedSec;
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export { SpaceProvider };
