import { ShareIcon } from '@primer/octicons-react';
import {
  ApiAudioRoom,
  ApiAudioRoomParticipant,
  ApiUser,
} from 'farcaster-client-data';
import {
  AUDIO_SPACE_EVENTS,
  buildSpeakerSegmentIndex,
  canUseAudioRoomFallbackHostControls,
  createAudioSpaceTelemetryId,
  hasActiveSpeakerSegmentAt,
  useAcceptSpeakerAudioRoom,
  useAudioRoom,
  useAudioRoomParticipants,
  useCancelStageInviteAudioRoom,
  useEndAudioRoom,
  useModerateParticipantRoleAudioRoom,
  useRemoveParticipantAudioRoom,
  useRemoveSpeakerAudioRoom,
  useRsvpAudioRoom,
  useStartScheduledAudioRoom,
} from 'farcaster-client-hooks';
import { ConnectionState } from 'livekit-client';
import {
  ArrowDown,
  Bell,
  ChevronLeft,
  Hand,
  Mic,
  MicOff,
  Pencil,
  Play,
  ShieldCheck,
  Trash2,
  User,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { HoverCardTooltip } from '~/components/HoverCardTooltip';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Page } from '~/components/page/Page';
import { ProfileTooltipSummary } from '~/components/profiles/ProfileTooltipSummary';
import { AdminEndSpaceButton } from '~/components/spaces/AdminEndSpaceButton';
import { EditSpaceModal } from '~/components/spaces/EditSpaceModal';
import { InviteToSpaceModal } from '~/components/spaces/InviteToSpaceModal';
import { InviteToStageSheet } from '~/components/spaces/InviteToStageSheet';
import { LiveControls } from '~/components/spaces/LiveControls';
import { ListenerTile, SpeakerTile } from '~/components/spaces/SpaceAvatar';
import { SpaceChatPanel } from '~/components/spaces/SpaceChatPanel';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { StageInvitePrompt } from '~/components/spaces/StageInvitePrompt';
import { TipSpeakersSheet } from '~/components/spaces/TipSpeakersSheet';
import { formatElapsed, useSpace } from '~/contexts/SpaceContext';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';
import { useParams } from '~/hooks/navigation/useParams';
import { trackWebAudioSpaceEvent } from '~/utils/audioSpaceInstrumentation';
import { toast as appToast } from '~/utils/toast';

const INITIAL_LISTENER_LIMIT = 24;
const SPACE_ROOM_REFETCH_INTERVAL_MS = 5000;
const RECORDING_PLAYBACK_UPDATE_INTERVAL_MS = 200;

function formatEndedAtLabel(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const SpaceRoomPage: React.FC = React.memo(() => {
  const { roomId } = useParams('spaces');
  const [roomRefetchIntervalMs, setRoomRefetchIntervalMs] = useState<
    number | false
  >(SPACE_ROOM_REFETCH_INTERVAL_MS);
  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
    refetch: refetchRoom,
  } = useAudioRoom({
    roomId,
    refetchIntervalMs: roomRefetchIntervalMs,
  });

  useEffect(() => {
    setRoomRefetchIntervalMs(SPACE_ROOM_REFETCH_INTERVAL_MS);
  }, [roomId]);

  const roomRecordingPending =
    room?.recording?.status === 'pending' ||
    room?.recording?.status === 'recording' ||
    room?.recording?.status === 'processing';

  useEffect(() => {
    if (!room || room.state !== 'ended') {
      setRoomRefetchIntervalMs(SPACE_ROOM_REFETCH_INTERVAL_MS);
      return;
    }

    if (!roomRecordingPending) {
      setRoomRefetchIntervalMs(false);
      return;
    }

    setRoomRefetchIntervalMs(SPACE_ROOM_REFETCH_INTERVAL_MS);
  }, [room, roomRecordingPending]);

  if (isLoadingRoom && !room) {
    return (
      <Page meta={{ title: 'Space' }}>
        <BorderedMainContent>
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoadingIndicator />
          </div>
        </BorderedMainContent>
      </Page>
    );
  }

  if (roomError || !room) {
    return (
      <Page meta={{ title: 'Space' }}>
        <BorderedMainContent>
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="text-lg font-semibold">Space unavailable</div>
            <div className="text-sm text-faint">
              {roomError instanceof Error
                ? roomError.message
                : 'This Space could not be loaded.'}
            </div>
            <button
              className="mt-2 rounded-full px-5 py-2 text-sm font-semibold text-white bg-action-primary"
              onClick={() => refetchRoom()}
            >
              Try again
            </button>
          </div>
        </BorderedMainContent>
      </Page>
    );
  }

  // Route to the right sub-view based on room state
  if (room.state === 'scheduled') {
    return <ScheduledSpaceRoom room={room} roomId={roomId} />;
  }
  if (room.state === 'ended') {
    return <EndedSpaceRoom room={room} roomId={roomId} />;
  }

  // Live room
  return <LiveSpaceRoom room={room} roomId={roomId} />;
});

SpaceRoomPage.displayName = 'SpaceRoomPage';

// ---------------------------------------------------------------------------
// Live room
// ---------------------------------------------------------------------------

const LiveSpaceRoom: React.FC<{
  room: ApiAudioRoom;
  roomId: string;
}> = ({ room, roomId }) => {
  const goBack = useGoBack();
  const navigate = useNavigate();
  const {
    joined,
    elapsedSec,
    participantCount,
    connectionState,
    activeSpeakerFids,
    unmutedSpeakerFids,
    connectedParticipantFids,
    incomingReactions,
    micPermissionDenied,
    pendingStageInvite,
    removedByHostRoomId,
    join,
    leave,
    endRoom,
    toggleMute,
    toggleHand,
    acceptStageInvite,
    declineStageInvite,
    clearReaction,
  } = useSpace();

  const hasJoinedRef = useRef(false);
  const telemetrySessionIdRef = useRef(
    createAudioSpaceTelemetryId('space_room_page'),
  );
  const telemetryDedupeRef = useRef<Map<string, number>>(new Map());
  const [joinFailed, setJoinFailed] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [tipSheetOpen, setTipSheetOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<ApiUser | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTargetHandRaised, setInviteTargetHandRaised] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showAllListeners, setShowAllListeners] = useState(false);
  // Reset the "Show all" choice when navigating between Spaces without unmount.
  useEffect(() => {
    setShowAllListeners(false);
  }, [roomId]);
  const borderedMainRef = useRef<HTMLDivElement | null>(null);
  const [controlsBarLayout, setControlsBarLayout] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const isInThisSpace = joined?.room.id === roomId;
  const joinEntrySource = joined?.entrySource ?? 'spaces_list';
  const isHost = joined?.role === 'host';
  const isHostOrCohost = isHost || joined?.role === 'cohost';
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!isInThisSpace) {
      setTipSheetOpen(false);
    }
  }, [isInThisSpace, roomId]);

  const trackSpaceUiEvent = useCallback(
    (
      eventName: (typeof AUDIO_SPACE_EVENTS)[keyof typeof AUDIO_SPACE_EVENTS],
      properties?: Record<string, string | number | boolean | undefined>,
      dedupeKey?: string,
    ) => {
      trackWebAudioSpaceEvent({
        eventName,
        context: {
          spaceSessionId:
            joined?.spaceSessionId ?? telemetrySessionIdRef.current,
          roomId,
          viewerFid: joined?.viewerFid,
          role: joined?.role,
          isHost: joined?.role === 'host',
          platform: 'web',
          entrySource: joined?.entrySource ?? 'unknown',
          connectionState,
          participantCount,
          audioPermissionState: micPermissionDenied ? 'denied' : 'unknown',
        },
        properties,
        dedupeMap: telemetryDedupeRef.current,
        dedupeKey,
      });
    },
    [
      connectionState,
      joined?.entrySource,
      joined?.role,
      joined?.spaceSessionId,
      joined?.viewerFid,
      micPermissionDenied,
      participantCount,
      roomId,
    ],
  );

  const acceptSpeaker = useAcceptSpeakerAudioRoom();
  const moderateParticipantRole = useModerateParticipantRoleAudioRoom();
  const removeParticipant = useRemoveParticipantAudioRoom();
  const removeSpeaker = useRemoveSpeakerAudioRoom();
  const cancelStageInvite = useCancelStageInviteAudioRoom();
  const [isStageInviteSubmitting, setIsStageInviteSubmitting] = useState(false);

  const { data: participants } = useAudioRoomParticipants({
    roomId,
    enabled: isInThisSpace,
  });
  const canUseFallbackHostControls = canUseAudioRoomFallbackHostControls({
    hostFid: room.hostFid,
    viewerFid: joined?.viewerFid,
    participants,
    connectedParticipantFids,
  });

  const { speakers, listeners } = useMemo(() => {
    if (!participants) {
      return {
        speakers: room
          ? [
              {
                user: room.host,
                role: 'host' as const,
                handRaised: false,
                joinedAt: room.createdAt,
              },
            ]
          : [],
        listeners: [],
      };
    }
    const s = participants.filter(
      (p) => p.role === 'host' || p.role === 'cohost' || p.role === 'speaker',
    );
    const l = participants.filter((p) => p.role === 'listener');
    return { speakers: s, listeners: l };
  }, [participants, room]);

  const raisedHands = useMemo(
    () => (participants ?? []).filter((p) => p.handRaised),
    [participants],
  );
  const raisedHandFids = useMemo(
    () => new Set(raisedHands.map((participant) => participant.user.fid)),
    [raisedHands],
  );
  const visibleListeners = useMemo(
    () =>
      listeners.filter(
        (participant) =>
          !raisedHandFids.has(participant.user.fid) &&
          (!isInThisSpace ||
            connectedParticipantFids.has(participant.user.fid)),
      ),
    [listeners, raisedHandFids, isInThisSpace, connectedParticipantFids],
  );
  const displayedListeners = useMemo(
    () =>
      showAllListeners
        ? visibleListeners
        : visibleListeners.slice(0, INITIAL_LISTENER_LIMIT),
    [showAllListeners, visibleListeners],
  );
  const hasHiddenListeners = visibleListeners.length > INITIAL_LISTENER_LIMIT;
  const reactionsByFid = useMemo(() => {
    const grouped = new Map<number, { id: number; emoji: string }[]>();
    for (const reaction of incomingReactions) {
      if (!grouped.has(reaction.fid)) {
        grouped.set(reaction.fid, []);
      }
      grouped
        .get(reaction.fid)
        ?.push({ id: reaction.id, emoji: reaction.emoji });
    }
    return grouped;
  }, [incomingReactions]);
  const viewerRole = useMemo(() => {
    if (!joined) {
      return null;
    }
    return (
      participants?.find((p) => p.user.fid === joined.viewerFid)?.role ?? null
    );
  }, [participants, joined]);
  const effectiveIsHost =
    isHost || viewerRole === 'host' || joined?.viewerFid === room.hostFid;
  const effectiveIsHostOrCohost =
    isHostOrCohost || viewerRole === 'cohost' || effectiveIsHost;
  const pendingInviteInviterUser = useMemo(
    () =>
      pendingStageInvite
        ? participants?.find(
            (p) => p.user.fid === pendingStageInvite.inviterFid,
          )?.user
        : undefined,
    [participants, pendingStageInvite],
  );

  const tipSpeakers = useMemo(
    () =>
      speakers.map((p) => ({
        user: p.user,
        role: (p.role === 'host'
          ? 'host'
          : p.role === 'cohost'
            ? 'cohost'
            : 'speaker') as 'host' | 'cohost' | 'speaker',
      })),
    [speakers],
  );

  // Auto-join when hitting this page
  useEffect(() => {
    hasJoinedRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    if (removedByHostRoomId === roomId) {
      return;
    }

    if (isInThisSpace) {
      hasJoinedRef.current = true;
      return;
    }

    if (hasJoinedRef.current) {
      return;
    }

    hasJoinedRef.current = true;
    setIsJoining(true);
    setJoinFailed(false);
    join(roomId, joinEntrySource)
      .catch(() => {
        appToast({
          message: 'Failed to join Space',
          type: 'error',
          toastId: `space-join-failed-${roomId}`,
        });
        setJoinFailed(true);
      })
      .finally(() => setIsJoining(false));
  }, [roomId, removedByHostRoomId, isInThisSpace, join, joinEntrySource]);

  const handleManualJoin = useCallback(async () => {
    setIsJoining(true);
    setJoinFailed(false);
    try {
      const didJoin = await join(roomId, joinEntrySource);
      if (!didJoin) {
        return;
      }
    } catch {
      appToast({
        message: 'Failed to join Space',
        type: 'error',
        toastId: `space-join-failed-${roomId}`,
      });
      setJoinFailed(true);
    } finally {
      setIsJoining(false);
    }
  }, [join, joinEntrySource, roomId]);

  // Auto-clear floating reactions. We schedule one timer per reaction id and
  // remember the timer in a ref so unmount can cancel any pending clears
  // (otherwise `clearReaction` could fire after the view is gone). Re-renders
  // don't re-schedule timers for ids we've already seen.
  const reactionTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  useEffect(() => {
    const activeIds = new Set(incomingReactions.map((r) => r.id));
    for (const r of incomingReactions) {
      if (reactionTimersRef.current.has(r.id)) {
        continue;
      }
      const timer = setTimeout(() => {
        reactionTimersRef.current.delete(r.id);
        clearReaction(r.id);
      }, 2800);
      reactionTimersRef.current.set(r.id, timer);
    }
    // Drop any timers whose reaction was already removed by another path.
    for (const [id, timer] of reactionTimersRef.current) {
      if (!activeIds.has(id)) {
        clearTimeout(timer);
        reactionTimersRef.current.delete(id);
      }
    }
  }, [incomingReactions, clearReaction]);
  useEffect(
    () => () => {
      for (const timer of reactionTimersRef.current.values()) {
        clearTimeout(timer);
      }
      reactionTimersRef.current.clear();
    },
    [],
  );

  const handleLeave = useCallback(async () => {
    await leave();
    goBack();
  }, [leave, goBack]);

  const handleLeaveStage = useCallback(async () => {
    if (!joined?.viewerFid) {
      return;
    }

    try {
      await removeSpeaker({ roomId, fid: joined.viewerFid });
    } catch {
      appToast({ message: 'Failed to leave stage', type: 'error' });
    }
  }, [joined?.viewerFid, removeSpeaker, roomId]);

  const handleEnd = useCallback(async () => {
    await endRoom();
    navigate({ to: 'spacesDiscovery', params: {} });
  }, [endRoom, navigate]);

  const handleAdminEnded = useCallback(async () => {
    if (isInThisSpace) {
      await leave().catch(() => {});
    }
    navigate({ to: 'spacesDiscovery', params: {} });
  }, [isInThisSpace, leave, navigate]);

  const handleOpenInvite = useCallback(() => {
    trackSpaceUiEvent(
      AUDIO_SPACE_EVENTS.openSource,
      { source: 'space_invite_composer_opened' },
      `web-space-invite-open-${roomId}`,
    );
    setInviteModalOpen(true);
  }, [roomId, trackSpaceUiEvent]);

  const handleInviteSent = useCallback(
    (recipientCount: number) => {
      trackSpaceUiEvent(AUDIO_SPACE_EVENTS.openSource, {
        source: 'space_invite_sent',
        recipientCount,
      });
    },
    [trackSpaceUiEvent],
  );

  const handleCopySpaceLink = useCallback(() => {
    trackSpaceUiEvent(AUDIO_SPACE_EVENTS.openSource, {
      source: 'space_share_copy_link',
    });
  }, [trackSpaceUiEvent]);

  const handlePromoteCohost = useCallback(
    async (targetFid: number) => {
      try {
        await acceptSpeaker({ roomId, fid: targetFid, role: 'cohost' });
        appToast({ message: 'Promoted to co-host', type: 'success' });
      } catch {
        appToast({ message: 'Failed to promote', type: 'error' });
      }
    },
    [roomId, acceptSpeaker],
  );

  const handleMoveToSpeaker = useCallback(
    async (targetFid: number) => {
      try {
        await moderateParticipantRole({
          roomId,
          fid: targetFid,
          role: 'speaker',
        });
        appToast({ message: 'Moved to speaker', type: 'success' });
      } catch {
        appToast({ message: 'Failed to move participant', type: 'error' });
      }
    },
    [moderateParticipantRole, roomId],
  );

  const handleMoveToListener = useCallback(
    async (targetFid: number) => {
      try {
        await moderateParticipantRole({
          roomId,
          fid: targetFid,
          role: 'listener',
        });
        appToast({ message: 'Moved to listener', type: 'success' });
      } catch {
        appToast({ message: 'Failed to demote', type: 'error' });
      }
    },
    [moderateParticipantRole, roomId],
  );

  const handleRemoveParticipant = useCallback(
    async (targetFid: number) => {
      try {
        await removeParticipant({ roomId, fid: targetFid });
        appToast({ message: 'Removed from Space', type: 'success' });
      } catch {
        appToast({ message: 'Failed to remove participant', type: 'error' });
      }
    },
    [removeParticipant, roomId],
  );

  const handleCancelPendingInvite = useCallback(
    async (targetFid: number) => {
      try {
        await cancelStageInvite({ roomId, fid: targetFid });
        appToast({ message: 'Invite cancelled', type: 'success' });
      } catch {
        appToast({ message: 'Failed to cancel invite', type: 'error' });
      }
    },
    [cancelStageInvite, roomId],
  );

  const handleAcceptPendingInvite = useCallback(async () => {
    setIsStageInviteSubmitting(true);
    try {
      await acceptStageInvite();
      appToast({ message: 'Invite accepted', type: 'success' });
    } catch {
      appToast({ message: 'Failed to accept invite', type: 'error' });
    } finally {
      setIsStageInviteSubmitting(false);
    }
  }, [acceptStageInvite]);

  const handleDeclinePendingInvite = useCallback(async () => {
    setIsStageInviteSubmitting(true);
    try {
      await declineStageInvite();
      appToast({ message: 'Invite declined' });
    } catch {
      appToast({ message: 'Failed to decline invite', type: 'error' });
    } finally {
      setIsStageInviteSubmitting(false);
    }
  }, [declineStageInvite]);

  const openInviteSheet = useCallback((user: ApiUser, handRaised: boolean) => {
    setInviteTarget(user);
    setInviteTargetHandRaised(handRaised);
  }, []);

  // If the server says the room ended, disconnect from room state.
  // Preserve host-silence UX by staying on the ended route.
  useEffect(() => {
    if (room?.state === 'ended') {
      leave().catch(() => {});
      if (room.endedReason !== 'host_silence') {
        goBack();
      }
    }
  }, [room?.state, room?.endedReason, leave, goBack]);

  const listenerCount =
    participantCount > 0 ? participantCount : room.listenerCount;

  useEffect(() => {
    trackSpaceUiEvent(
      AUDIO_SPACE_EVENTS.cardOpened,
      { roomId, openPath: 'space_room_page' },
      `web-room-open-${roomId}`,
    );
    trackSpaceUiEvent(
      AUDIO_SPACE_EVENTS.openSource,
      { roomId, source: joined?.entrySource ?? 'unknown' },
      `web-open-source-${roomId}`,
    );
  }, [joined?.entrySource, roomId, trackSpaceUiEvent]);

  // Anchor the fixed controls to the actual bordered main column instead of
  // viewport-center math, which drifts in the 3-column desktop layout.
  useLayoutEffect(() => {
    if (!isInThisSpace) {
      setControlsBarLayout(null);
      return;
    }

    const borderedMain = borderedMainRef.current;
    if (!borderedMain) {
      return;
    }

    const updateLayout = () => {
      const rect = borderedMain.getBoundingClientRect();
      setControlsBarLayout({ left: rect.left, width: rect.width });
    };

    updateLayout();

    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(borderedMain);
    window.addEventListener('resize', updateLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, [isInThisSpace]);

  return (
    <Page meta={{ title: room.title || 'Space' }}>
      <BorderedMainContent ref={borderedMainRef}>
        {/* Header */}
        <div className="bg-app/95 sticky top-0 z-20 border-b backdrop-blur border-faint">
          <div className="flex items-center justify-between px-3 py-3">
            <button
              type="button"
              onClick={goBack}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-overlay-light"
              aria-label="Back"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 text-[13px]">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
                style={{ background: 'var(--color-red, #dc3412)' }}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Live
              </span>
              {room.recordingEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                  Recording
                </span>
              )}
              {isInThisSpace && (
                <span className="text-faint">{formatElapsed(elapsedSec)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && !effectiveIsHost && (
                <AdminEndSpaceButton
                  roomId={roomId}
                  roomState={room.state}
                  onEnded={handleAdminEnded}
                  className="px-3 py-2 text-[12px]"
                />
              )}
              <button
                type="button"
                onClick={handleOpenInvite}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-overlay-light"
                aria-label="Share Space"
              >
                <ShareIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Reconnecting banner */}
        {connectionState === ConnectionState.Reconnecting && (
          <div className="flex items-center justify-center gap-2 bg-yellow-500/10 px-4 py-2 text-[13px] text-yellow-600">
            <WifiOff size={14} />
            Reconnecting...
          </div>
        )}

        {/* Join button (fallback if auto-join failed or user is not yet joined) */}
        {!isInThisSpace && !isJoining && room && (
          <div className="flex items-center justify-center border-b px-4 py-4 border-faint">
            <button
              type="button"
              onClick={handleManualJoin}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-semibold text-white bg-action-primary hover:opacity-90"
            >
              <Mic size={14} />
              {joinFailed ? 'Try joining again' : 'Join this Space'}
            </button>
          </div>
        )}

        {/* Joining indicator */}
        {isJoining && !isInThisSpace && (
          <div className="flex items-center justify-center border-b px-4 py-3 border-faint">
            <LoadingIndicator />
          </div>
        )}

        {/* Mic permission warning */}
        {micPermissionDenied && isInThisSpace && (
          <div className="flex items-center justify-center gap-2 bg-red-500/10 px-4 py-2 text-[13px] text-red-600">
            <MicOff size={14} />
            Microphone access denied. Enable it in browser settings to speak.
          </div>
        )}

        {/* Room content */}
        <div className="px-4 pb-40 pt-4">
          {/* Title + meta */}
          <div className="mt-2 flex items-start gap-2">
            <h1 className="flex-1 text-[22px] font-semibold leading-tight text-default">
              {room.title}
            </h1>
            {effectiveIsHost && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-overlay-light"
                aria-label="Edit Space"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
          {room.description && (
            <div className="mt-1 text-[14px] text-faint">
              {room.description}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-[13px] text-faint">
            <Users size={13} />
            {listenerCount.toLocaleString()} listening
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <SectionHeader inline>Speakers · {speakers.length}</SectionHeader>
            {isInThisSpace && (
              <button
                type="button"
                onClick={() => setTipSheetOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold text-white bg-action-primary hover:opacity-90"
              >
                <Zap size={11} />
                Tip
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-4">
            {speakers.map((p) => {
              const isOffline =
                isInThisSpace && !connectedParticipantFids.has(p.user.fid);
              return (
                <HoverCardTooltip
                  key={p.user.fid}
                  className="w-full"
                  triggerWrapper="div"
                  content={<ProfileTooltipSummary user={p.user} />}
                  trigger={
                    <SpeakerTileWithActions
                      user={p.user}
                      role={p.role as 'host' | 'cohost' | 'speaker'}
                      speaking={!isOffline && activeSpeakerFids.has(p.user.fid)}
                      muted={
                        isInThisSpace && !isOffline
                          ? !unmutedSpeakerFids.has(p.user.fid)
                          : undefined
                      }
                      isOffline={isOffline}
                      isHostOrCohost={effectiveIsHostOrCohost}
                      showMoveToListener={
                        canUseFallbackHostControls &&
                        p.role !== 'host' &&
                        p.user.fid !== room.hostFid &&
                        p.user.fid !== joined?.viewerFid
                      }
                      showMoveToSpeaker={
                        canUseFallbackHostControls && p.role === 'cohost'
                      }
                      showRemoveFromSpace={
                        canUseFallbackHostControls &&
                        p.role !== 'host' &&
                        p.user.fid !== room.hostFid &&
                        p.user.fid !== joined?.viewerFid
                      }
                      onMoveToListener={() => handleMoveToListener(p.user.fid)}
                      onMoveToSpeaker={() => handleMoveToSpeaker(p.user.fid)}
                      onRemoveFromSpace={() =>
                        handleRemoveParticipant(p.user.fid)
                      }
                      onMakeCohost={
                        effectiveIsHost && p.role === 'speaker'
                          ? () => handlePromoteCohost(p.user.fid)
                          : undefined
                      }
                      canLeaveStage={
                        p.role === 'speaker' && p.user.fid === joined?.viewerFid
                      }
                      onLeaveStage={
                        p.role === 'speaker' && p.user.fid === joined?.viewerFid
                          ? handleLeaveStage
                          : undefined
                      }
                      reactions={reactionsByFid.get(p.user.fid)}
                    />
                  }
                />
              );
            })}
          </div>

          {/* Raised hands */}
          {raisedHands.length > 0 && (
            <>
              <SectionHeader>
                Requested to speak · {raisedHands.length}
              </SectionHeader>
              <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-3">
                {raisedHands.map((p) => (
                  <HoverCardTooltip
                    key={p.user.fid}
                    className="w-full"
                    triggerWrapper="div"
                    content={<ProfileTooltipSummary user={p.user} />}
                    trigger={
                      <button
                        type="button"
                        onClick={() =>
                          effectiveIsHostOrCohost &&
                          openInviteSheet(p.user, true)
                        }
                        className={`group relative ${effectiveIsHostOrCohost ? 'cursor-pointer' : 'cursor-default'}`}
                        title={
                          effectiveIsHostOrCohost
                            ? 'Bring up to speak'
                            : undefined
                        }
                      >
                        <div className="relative">
                          <ListenerTile
                            user={p.user}
                            reactions={reactionsByFid.get(p.user.fid)}
                          />
                          <div className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white bg-action-primary">
                            <Hand size={10} />
                          </div>
                        </div>
                        {effectiveIsHostOrCohost && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity bg-action-primary group-hover:opacity-100">
                            <Mic size={9} />
                            Bring up
                          </div>
                        )}
                      </button>
                    }
                  />
                ))}
              </div>
            </>
          )}

          {/* Listeners */}
          <SectionHeader>
            Listening ·{' '}
            {visibleListeners.length > 0
              ? visibleListeners.length
              : listenerCount}
            {effectiveIsHostOrCohost && (
              <span className="ml-2 text-[11px] font-normal normal-case text-faint">
                (tap a listener to invite to speak)
              </span>
            )}
          </SectionHeader>
          <div className="mt-3">
            {visibleListeners.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
                {displayedListeners.map((p) => (
                  <div key={p.user.fid} className="flex flex-col items-center">
                    <HoverCardTooltip
                      className="flex w-full justify-center"
                      triggerWrapper="div"
                      content={<ProfileTooltipSummary user={p.user} />}
                      trigger={
                        <button
                          type="button"
                          onClick={() =>
                            effectiveIsHostOrCohost &&
                            openInviteSheet(p.user, false)
                          }
                          className={
                            effectiveIsHostOrCohost
                              ? 'cursor-pointer hover:opacity-80'
                              : 'cursor-default'
                          }
                        >
                          <ListenerTile
                            user={p.user}
                            reactions={reactionsByFid.get(p.user.fid)}
                          />
                        </button>
                      }
                    />
                    {p.pendingInvite ? (
                      <div className="mt-1 flex min-h-[36px] flex-col items-center gap-1 text-center">
                        <span className="bg-action-primary/10 text-action-primary whitespace-nowrap rounded-full px-2 py-0.5 text-center text-[10px] font-semibold leading-none">
                          Invite pending
                        </span>
                        {effectiveIsHostOrCohost && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCancelPendingInvite(p.user.fid)
                            }
                            className="whitespace-nowrap rounded-full px-2 py-0.5 text-center text-[10px] font-medium leading-none text-faint hover:bg-overlay-light"
                          >
                            Cancel invite
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-faint">
                {isInThisSpace
                  ? 'No listeners yet.'
                  : "Join to see who's listening."}
              </div>
            )}
            {hasHiddenListeners && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllListeners((prev) => !prev)}
                  className="rounded-full px-3 py-1 text-[12px] font-semibold text-faint hover:bg-overlay-light"
                >
                  {showAllListeners
                    ? 'Show less'
                    : `Show all (${visibleListeners.length})`}
                </button>
              </div>
            )}
          </div>

          {/* FIP-2 Chat */}
          {isInThisSpace && (
            <>
              <SectionHeader>Chat</SectionHeader>
              <SpaceChatPanel room={room} />
            </>
          )}
        </div>

        {/* Bottom control bar */}
        {isInThisSpace && controlsBarLayout && (
          <div
            className="fixed bottom-0 z-30 border-x border-t bg-app border-faint"
            style={{
              left: controlsBarLayout.left,
              width: controlsBarLayout.width,
            }}
          >
            <LiveControls
              muted={joined?.muted ?? true}
              handRaised={joined?.handRaised ?? false}
              role={viewerRole ?? joined?.role ?? 'listener'}
              onMute={toggleMute}
              onHand={toggleHand}
              onLeave={handleLeave}
              onEnd={canUseFallbackHostControls ? handleEnd : undefined}
              roomId={roomId}
            />
          </div>
        )}
      </BorderedMainContent>

      {/* Sheets */}
      <TipSpeakersSheet
        open={tipSheetOpen}
        speakers={tipSpeakers}
        onClose={() => setTipSheetOpen(false)}
      />
      <InviteToStageSheet
        user={inviteTarget}
        roomId={roomId}
        handRaised={inviteTargetHandRaised}
        isHost={effectiveIsHost}
        onRemove={
          canUseFallbackHostControls && inviteTarget
            ? async () => {
                await removeParticipant({ roomId, fid: inviteTarget.fid });
              }
            : undefined
        }
        onClose={() => setInviteTarget(null)}
      />
      <StageInvitePrompt
        pendingInvite={pendingStageInvite}
        inviterUser={pendingInviteInviterUser}
        isSubmitting={isStageInviteSubmitting}
        onAccept={handleAcceptPendingInvite}
        onDecline={handleDeclinePendingInvite}
      />
      {inviteModalOpen && (
        <InviteToSpaceModal
          roomId={roomId}
          roomTitle={room.title}
          onInviteSent={handleInviteSent}
          onCopyLink={handleCopySpaceLink}
          onClose={() => setInviteModalOpen(false)}
        />
      )}
      <EditSpaceModal
        open={editOpen}
        liveEdit
        room={room}
        onClose={() => setEditOpen(false)}
      />
    </Page>
  );
};

// ---------------------------------------------------------------------------
// Scheduled room
// ---------------------------------------------------------------------------

const ScheduledSpaceRoom: React.FC<{
  room: ApiAudioRoom;
  roomId: string;
}> = ({ room, roomId }) => {
  const goBack = useGoBack();
  const currentUser = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { join } = useSpace();
  const rsvpAudioRoom = useRsvpAudioRoom();
  const startScheduledRoom = useStartScheduledAudioRoom();
  const endAudioRoom = useEndAudioRoom();
  const [rsvped, setRsvped] = useState(room.viewerContext?.rsvped ?? false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const telemetrySessionIdRef = useRef(
    createAudioSpaceTelemetryId('space_room_page_scheduled'),
  );

  useEffect(() => {
    telemetrySessionIdRef.current = createAudioSpaceTelemetryId(
      'space_room_page_scheduled',
    );
  }, [roomId]);

  const isViewerHost =
    currentUser?.fid !== undefined && room.hostFid === currentUser.fid;
  const showAdminCancel = isAdmin && !isViewerHost;

  useEffect(() => {
    setRsvped(room.viewerContext?.rsvped ?? false);
  }, [room.id, room.viewerContext?.rsvped]);

  const trackScheduledInviteEvent = useCallback(
    (
      source:
        | 'space_invite_composer_opened'
        | 'space_invite_sent'
        | 'space_share_copy_link',
      properties?: Record<string, string | number | boolean | undefined>,
    ) => {
      trackWebAudioSpaceEvent({
        eventName: AUDIO_SPACE_EVENTS.openSource,
        context: {
          spaceSessionId: telemetrySessionIdRef.current,
          roomId,
          viewerFid: currentUser?.fid,
          role: isViewerHost ? 'host' : undefined,
          isHost: isViewerHost,
          platform: 'web',
          entrySource: 'spaces_list',
        },
        properties: { source, ...(properties ?? {}) },
      });
    },
    [currentUser?.fid, isViewerHost, roomId],
  );

  const handleRsvp = useCallback(async () => {
    setIsRsvping(true);
    try {
      const result = await rsvpAudioRoom({ roomId });
      setRsvped(result.rsvped);
    } catch {
      appToast({ message: 'Failed to update reminder', type: 'error' });
    } finally {
      setIsRsvping(false);
    }
  }, [rsvpAudioRoom, roomId]);

  const handleGoLive = useCallback(async () => {
    setIsStarting(true);
    try {
      const result = await startScheduledRoom({ roomId });
      const didJoin = await join(result.room.id, 'spaces_list');
      if (!didJoin) {
        return;
      }
    } catch (err) {
      appToast({
        message: err instanceof Error ? err.message : 'Failed to start Space',
        type: 'error',
      });
    } finally {
      setIsStarting(false);
    }
  }, [startScheduledRoom, roomId, join]);

  const handleCancel = useCallback(async () => {
    if (
      !window.confirm(
        'Cancel this scheduled Space? Everyone who set a reminder will not be notified that it went live.',
      )
    ) {
      return;
    }
    setIsCancelling(true);
    try {
      await endAudioRoom({ roomId });
      appToast({ message: 'Space cancelled', type: 'success' });
      goBack();
    } catch (err) {
      appToast({
        message: err instanceof Error ? err.message : 'Failed to cancel Space',
        type: 'error',
      });
    } finally {
      setIsCancelling(false);
    }
  }, [endAudioRoom, roomId, goBack]);

  const scheduledLabel = useMemo(() => {
    if (!room.scheduledAt) {
      return null;
    }
    const date = new Date(room.scheduledAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    if (isToday) {
      return `Today at ${time}`;
    }
    if (isTomorrow) {
      return `Tomorrow at ${time}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
  }, [room.scheduledAt]);

  return (
    <Page meta={{ title: room.title || 'Scheduled Space' }}>
      <BorderedMainContent>
        {/* Header */}
        <div className="bg-app/95 sticky top-0 z-10 border-b backdrop-blur border-faint">
          <div className="flex items-center justify-between px-3 py-3">
            <button
              type="button"
              onClick={goBack}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-overlay-light"
              aria-label="Back"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-[13px] font-medium text-faint">
              Scheduled Space
            </div>
            <button
              type="button"
              onClick={() => {
                trackScheduledInviteEvent('space_invite_composer_opened');
                setInviteModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-overlay-light"
              aria-label="Share Space"
            >
              <ShareIcon size={16} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-10 pt-4">
          {/* Title */}
          <h1 className="mt-2 text-[22px] font-semibold leading-tight text-default">
            {room.title}
          </h1>
          {room.description && (
            <div className="mt-1 text-[14px] text-faint">
              {room.description}
            </div>
          )}

          {/* Scheduled time */}
          {scheduledLabel && (
            <div className="text-action-primary mt-2 text-[14px] font-medium">
              {scheduledLabel}
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-faint">
            <Bell size={12} />
            {(room.rsvpCount ?? 0).toLocaleString()} reminders set
          </div>

          {/* Host card */}
          <div className="mt-4 rounded-xl border p-4 border-faint">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-faint">
              Hosted by
            </div>
            <HoverCardTooltip
              className="w-full"
              triggerWrapper="div"
              content={<ProfileTooltipSummary user={room.host} />}
              trigger={
                <div className="flex items-center gap-3">
                  <Avatar user={room.host} size="lg" disabled />
                  <div className="min-w-0">
                    <SpaceUserDisplayNameWithProBadge
                      user={room.host}
                      badgeSize={14}
                      className="text-[15px] font-semibold text-default"
                    />
                    <div className="text-[13px] text-faint">
                      @{room.host.username}
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          {/* Host actions (Go live + Edit + Cancel) or non-host RSVP */}
          {isViewerHost ? (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoLive}
                disabled={isStarting || isCancelling}
                className="inline-flex flex-[2] items-center justify-center gap-2 rounded-full px-4 py-3 text-[14px] font-semibold text-white bg-action-primary hover:opacity-90 disabled:opacity-50"
              >
                <Play size={14} />
                {isStarting ? 'Starting...' : 'Go live now'}
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                disabled={isStarting || isCancelling}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-[14px] font-semibold border-faint text-default hover:bg-overlay-light disabled:opacity-50"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isStarting || isCancelling}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-[14px] font-semibold text-red-600 border-faint hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRsvp}
                disabled={isRsvping}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-[14px] font-semibold disabled:opacity-50 ${
                  rsvped
                    ? 'bg-overlay-faint text-default'
                    : 'text-white bg-action-primary hover:opacity-90'
                }`}
              >
                <Bell size={14} />
                {rsvped ? 'Reminder set' : 'Remind me'}
              </button>
              {showAdminCancel && (
                <AdminEndSpaceButton
                  roomId={roomId}
                  roomState={room.state}
                  onEnded={goBack}
                  disabled={isRsvping}
                  className="px-4 py-3 text-[14px]"
                />
              )}
            </div>
          )}
        </div>
      </BorderedMainContent>
      <EditSpaceModal
        open={editOpen}
        room={room}
        onClose={() => setEditOpen(false)}
      />
      {inviteModalOpen && (
        <InviteToSpaceModal
          roomId={roomId}
          roomTitle={room.title}
          onInviteSent={(recipientCount) =>
            trackScheduledInviteEvent('space_invite_sent', { recipientCount })
          }
          onCopyLink={() => trackScheduledInviteEvent('space_share_copy_link')}
          onClose={() => setInviteModalOpen(false)}
        />
      )}
    </Page>
  );
};

const EndedSpaceRoom: React.FC<{
  room: ApiAudioRoom;
  roomId: string;
}> = ({ room, roomId }) => {
  const { leave, endedReason } = useSpace();
  const navigate = useNavigate();
  const navigateToProfile = useNavigateToProfile();
  const effectiveEndedReason = room.endedReason ?? endedReason;
  const { data: participants, isLoading: isLoadingParticipants } =
    useAudioRoomParticipants({
      roomId,
      includePast: true,
    });
  const recording = room.recording;
  const recordingReady = recording?.status === 'ready' && recording.playbackUrl;
  const recordingPending =
    recording?.status === 'pending' ||
    recording?.status === 'recording' ||
    recording?.status === 'processing';
  const [recordingPlaybackMs, setRecordingPlaybackMs] = useState(0);
  const recordingPlaybackMsRef = useRef(0);
  const endedAtLabel = formatEndedAtLabel(room.endedAt);
  const joinedParticipants = useMemo<ApiAudioRoomParticipant[]>(() => {
    if (participants && participants.length > 0) {
      return participants;
    }

    if (isLoadingParticipants) {
      return [];
    }

    return [
      {
        user: room.host,
        role: 'host',
        handRaised: false,
        joinedAt: room.createdAt,
      },
    ];
  }, [isLoadingParticipants, participants, room.createdAt, room.host]);

  useEffect(() => {
    if (effectiveEndedReason !== 'host_silence') {
      appToast({
        message: 'This Space has ended',
        type: 'info',
        toastId: `space-ended-${roomId}`,
      });
    }
    leave().catch(() => {});
  }, [effectiveEndedReason, leave, roomId]);

  const speakerSegmentsByFid = useMemo(
    () => buildSpeakerSegmentIndex(recording?.speakerSegments),
    [recording?.speakerSegments],
  );
  const activeRecordingSpeakerFids = useMemo(() => {
    const fids = new Set<number>();
    for (const [fid, segments] of speakerSegmentsByFid) {
      if (hasActiveSpeakerSegmentAt(segments, recordingPlaybackMs)) {
        fids.add(fid);
      }
    }
    return fids;
  }, [recordingPlaybackMs, speakerSegmentsByFid]);
  const updateRecordingPlaybackMs = useCallback(
    (currentTimeSec: number, { force = false } = {}) => {
      const playbackMs = Math.floor(currentTimeSec * 1000);
      if (
        !force &&
        Math.abs(playbackMs - recordingPlaybackMsRef.current) <
          RECORDING_PLAYBACK_UPDATE_INTERVAL_MS
      ) {
        return;
      }

      recordingPlaybackMsRef.current = playbackMs;
      setRecordingPlaybackMs(playbackMs);
    },
    [],
  );

  return (
    <Page meta={{ title: room.title }}>
      <BorderedMainContent>
        <div className="flex min-h-[60vh] flex-col px-6 py-8">
          <button
            className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-faint hover:text-default"
            onClick={() => navigate({ to: 'spacesDiscovery', params: {} })}
          >
            <ChevronLeft size={16} />
            Spaces
          </button>

          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wide bg-overlay-faint text-faint">
                <Play size={13} />
                Ended Space
              </div>
              <h1 className="text-2xl font-semibold leading-tight text-default">
                {room.title}
              </h1>
              {!!room.description && (
                <div className="mt-2 text-sm text-faint">
                  {room.description}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-sm text-faint">
                <button
                  className="flex items-center gap-2 hover:text-default"
                  onClick={() => navigateToProfile({ user: room.host })}
                >
                  <Avatar user={room.host} size="sm" />
                  <SpaceUserDisplayNameWithProBadge
                    user={room.host}
                    badgeSize={13}
                    className="font-medium"
                  />
                </button>
                {endedAtLabel && <span>ended {endedAtLabel}</span>}
              </div>
            </div>

            <div className="rounded-xl border p-4 bg-overlay-faint border-faint">
              {recordingReady ? (
                <audio
                  className="w-full"
                  controls
                  preload="metadata"
                  src={recording.playbackUrl}
                  onTimeUpdate={(event) =>
                    updateRecordingPlaybackMs(event.currentTarget.currentTime)
                  }
                  onSeeked={(event) =>
                    updateRecordingPlaybackMs(event.currentTarget.currentTime, {
                      force: true,
                    })
                  }
                />
              ) : recordingPending ? (
                <div className="flex items-center gap-3 text-sm text-faint">
                  <LoadingIndicator />
                  Recording is processing
                </div>
              ) : effectiveEndedReason === 'host_silence' ? (
                <div className="text-sm text-faint">
                  This Space ended automatically because no host spoke for 10
                  minutes. A recording is not available.
                </div>
              ) : (
                <div className="text-sm text-faint">
                  Recording is not available for this Space.
                </div>
              )}
            </div>

            <div>
              <SectionHeader>
                Participants
                {!isLoadingParticipants && ` · ${joinedParticipants.length}`}
              </SectionHeader>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {joinedParticipants.map((participant) => (
                  <button
                    key={participant.user.fid}
                    className="flex min-w-0 items-center gap-2 rounded-lg border bg-background p-2 text-left border-faint hover:bg-overlay-faint"
                    onClick={() =>
                      navigateToProfile({ user: participant.user })
                    }
                  >
                    <div
                      className={`relative flex shrink-0 ${
                        activeRecordingSpeakerFids.has(participant.user.fid)
                          ? 'text-brand'
                          : ''
                      }`}
                    >
                      <div
                        aria-hidden
                        className={`pointer-events-none absolute -inset-1 rounded-full border-[3px] ${
                          activeRecordingSpeakerFids.has(participant.user.fid)
                            ? 'animate-speakerPulseRing border-current'
                            : 'border-transparent opacity-0'
                        }`}
                      />
                      <div
                        className={`flex aspect-square items-center justify-center rounded-full border-[3px] p-0.5 ${
                          activeRecordingSpeakerFids.has(participant.user.fid)
                            ? 'border-current'
                            : 'border-transparent'
                        }`}
                      >
                        <Avatar user={participant.user} size="sm" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <SpaceUserDisplayNameWithProBadge
                        user={participant.user}
                        badgeSize={12}
                        className="truncate text-sm font-medium text-default"
                      />
                      <div className="text-[12px] capitalize text-faint">
                        {participant.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BorderedMainContent>
    </Page>
  );
};

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  children,
  inline,
}: {
  children: React.ReactNode;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="text-[12px] font-semibold uppercase tracking-wide text-faint">
        {children}
      </div>
    );
  }
  return (
    <div className="mt-6 text-[12px] font-semibold uppercase tracking-wide text-faint">
      {children}
    </div>
  );
}

/** Speaker tile with host/cohost action menu */
function SpeakerTileWithActions({
  user,
  role,
  speaking,
  muted,
  isOffline,
  isHostOrCohost,
  showMoveToSpeaker,
  showMoveToListener,
  showRemoveFromSpace,
  onMoveToSpeaker,
  onMoveToListener,
  onRemoveFromSpace,
  onMakeCohost,
  canLeaveStage,
  onLeaveStage,
  reactions,
}: {
  user: ApiUser;
  role: 'host' | 'cohost' | 'speaker';
  speaking: boolean;
  muted?: boolean;
  isOffline?: boolean;
  isHostOrCohost: boolean;
  showMoveToSpeaker?: boolean;
  showMoveToListener?: boolean;
  showRemoveFromSpace?: boolean;
  onMoveToSpeaker?: () => void;
  onMoveToListener?: () => void;
  onRemoveFromSpace?: () => void;
  onMakeCohost?: () => void;
  canLeaveStage?: boolean;
  onLeaveStage?: () => void;
  reactions?: { id: number; emoji: string }[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigateToProfile = useNavigateToProfile();
  const canOpenMenu =
    (isHostOrCohost &&
      (showMoveToSpeaker ||
        showMoveToListener ||
        showRemoveFromSpace ||
        onMakeCohost)) ||
    canLeaveStage;

  return (
    <div className="relative">
      <div
        onClick={canOpenMenu ? () => setMenuOpen(!menuOpen) : undefined}
        className={canOpenMenu ? 'cursor-pointer' : ''}
        title={canLeaveStage ? 'Tap for stage actions' : undefined}
      >
        <SpeakerTile
          user={user}
          role={role}
          speaking={speaking}
          muted={muted}
          isOffline={isOffline}
          reactions={reactions}
        />
        {canLeaveStage ? (
          <div className="mt-1 text-center text-[10px] text-faint">
            Tap for stage actions
          </div>
        ) : null}
      </div>
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 rounded-lg border shadow-lg bg-app border-faint">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigateToProfile({ user });
              }}
              className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px] hover:bg-overlay-faint"
            >
              <User size={14} />
              View profile
            </button>
            {canLeaveStage && onLeaveStage && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLeaveStage();
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px] text-red-500 hover:bg-overlay-faint"
              >
                <ArrowDown size={14} />
                Leave stage
              </button>
            )}
            {onMakeCohost && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onMakeCohost();
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px] hover:bg-overlay-faint"
              >
                <ShieldCheck size={14} />
                Make Co-host
              </button>
            )}
            {showMoveToSpeaker && onMoveToSpeaker && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onMoveToSpeaker();
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px] hover:bg-overlay-faint"
              >
                <Mic size={14} />
                Move to Speaker
              </button>
            )}
            {showMoveToListener && onMoveToListener && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onMoveToListener();
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px] text-red-500 hover:bg-overlay-faint"
              >
                <MicOff size={14} />
                Move to Listener
              </button>
            )}
            {showRemoveFromSpace && onRemoveFromSpace && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRemoveFromSpace();
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px] text-red-500 hover:bg-overlay-faint"
              >
                <Trash2 size={14} />
                Remove from Space
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { SpaceRoomPage };
