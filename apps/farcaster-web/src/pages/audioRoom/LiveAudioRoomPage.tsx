import { ApiAudioRoomRole, ApiUser } from 'farcaster-client-data';
import {
  useAudioRoom,
  useEndAudioRoom,
  useInvalidateAudioRoomsList,
  useJoinAudioRoom,
  useLeaveAudioRoom,
} from 'farcaster-client-hooks';
import {
  ConnectionState,
  type RemoteTrack,
  Room,
  RoomEvent,
} from 'livekit-client';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Page } from '~/components/page/Page';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useParams } from '~/hooks/navigation/useParams';
import {
  attachLivekitAudioTrack,
  detachLivekitTrack,
  disconnectLivekitRoom,
} from '~/utils/livekitRoomCleanup';

const LiveAudioRoomPage: React.FC = React.memo(() => {
  const { roomId } = useParams('audioRoom');
  const goBack = useGoBack();

  const currentUser = useCachedCurrentUser();

  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
    refetch: refetchRoom,
  } = useAudioRoom({ roomId });

  const joinAudioRoom = useJoinAudioRoom();
  const leaveAudioRoom = useLeaveAudioRoom();
  const endAudioRoom = useEndAudioRoom();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();

  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [role, setRole] = useState<ApiAudioRoomRole | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [joinError, setJoinError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [isEnding, setIsEnding] = useState(false);

  const hasJoinedRef = useRef(false);
  const livekitRoomRef = useRef<Room | null>(null);

  const isHost = useMemo(() => {
    if (role) {
      return role === 'host';
    }
    if (room && currentUser?.fid !== undefined) {
      return room.hostFid === currentUser.fid;
    }
    return false;
  }, [role, room, currentUser?.fid]);

  // Join the room (get LiveKit token) then connect
  useEffect(() => {
    if (!roomId || hasJoinedRef.current) {
      return;
    }
    hasJoinedRef.current = true;

    let cancelled = false;
    let lkRoom: Room | null = null;

    (async () => {
      try {
        const result = await joinAudioRoom({ roomId });
        if (cancelled) {
          return;
        }
        setRole(result.role);

        lkRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        lkRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state);
        });

        lkRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        lkRoom.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        lkRoom.on(RoomEvent.ParticipantConnected, () => {
          setParticipantCount(lkRoom?.numParticipants ?? 0);
        });
        lkRoom.on(RoomEvent.ParticipantDisconnected, () => {
          setParticipantCount(lkRoom?.numParticipants ?? 0);
        });
        lkRoom.on(RoomEvent.Disconnected, () => {
          setConnectionState(ConnectionState.Disconnected);
        });

        await lkRoom.connect(result.wsUrl, result.token, {
          autoSubscribe: true,
        });

        // Host auto-publishes microphone
        if (result.role === 'host' || result.role === 'speaker') {
          try {
            await lkRoom.localParticipant.setMicrophoneEnabled(true);
            setIsMuted(false);
          } catch (err) {
            // Mic permission denied or hardware failure — still allow hosting
            // eslint-disable-next-line no-console
            console.error('[LiveAudioRoomPage] mic enable failed', err);
          }
        }

        setParticipantCount(lkRoom.numParticipants);
        setLivekitRoom(lkRoom);
        livekitRoomRef.current = lkRoom;
      } catch (err) {
        await disconnectLivekitRoom(lkRoom);
        // eslint-disable-next-line no-console
        console.error('[LiveAudioRoomPage] join failed', err);
        setJoinError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
      const r = livekitRoomRef.current;
      if (r) {
        void disconnectLivekitRoom(r);
        livekitRoomRef.current = null;
      }
      // Best-effort leave on unmount (listeners only — host uses End button)
      if (
        room &&
        currentUser?.fid !== undefined &&
        room.hostFid !== currentUser.fid
      ) {
        leaveAudioRoom({ roomId }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleToggleMute = useCallback(async () => {
    if (!livekitRoom) {
      return;
    }
    const nextMuted = !isMuted;
    try {
      await livekitRoom.localParticipant.setMicrophoneEnabled(!nextMuted);
      setIsMuted(nextMuted);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[LiveAudioRoomPage] toggle mute failed', err);
    }
  }, [livekitRoom, isMuted]);

  const handleLeave = useCallback(async () => {
    const r = livekitRoomRef.current;
    if (r) {
      await disconnectLivekitRoom(r);
      livekitRoomRef.current = null;
    }
    try {
      await leaveAudioRoom({ roomId });
    } catch {
      // ignore
    }
    goBack();
  }, [goBack, leaveAudioRoom, roomId]);

  const handleEndRoom = useCallback(async () => {
    setIsEnding(true);
    const r = livekitRoomRef.current;
    if (r) {
      await disconnectLivekitRoom(r);
      livekitRoomRef.current = null;
    }
    try {
      await endAudioRoom({ roomId });
      invalidateAudioRoomsList();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[LiveAudioRoomPage] end room failed', err);
    } finally {
      setIsEnding(false);
      goBack();
    }
  }, [endAudioRoom, goBack, invalidateAudioRoomsList, roomId]);

  // If the server says the room ended, bounce back
  useEffect(() => {
    if (room?.state === 'ended') {
      const r = livekitRoomRef.current;
      if (r) {
        void disconnectLivekitRoom(r);
        livekitRoomRef.current = null;
      }
      goBack();
    }
  }, [room?.state, goBack]);

  if (isLoadingRoom && !room) {
    return (
      <Page meta={{ title: 'Audio room' }}>
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
      <Page meta={{ title: 'Audio room' }}>
        <BorderedMainContent>
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="text-lg font-semibold">Room unavailable</div>
            <div className="text-sm text-faint">
              {roomError instanceof Error
                ? roomError.message
                : 'This room could not be loaded.'}
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

  return (
    <Page meta={{ title: room.title || 'Audio room' }}>
      <BorderedMainContent>
        <div className="flex min-h-[60vh] flex-col items-center justify-between gap-8 p-6">
          <div className="flex w-full flex-col items-center gap-4 pt-12">
            <LiveBadge />
            <HostBlock host={room.host} />
            <div className="text-center text-2xl font-bold">{room.title}</div>
            <div className="text-sm text-faint">
              {participantCount > 0
                ? `${participantCount} in room`
                : `${room.listenerCount} listening`}
            </div>
            <div className="text-xs text-faint">
              {connectionState === ConnectionState.Connected
                ? 'Connected'
                : connectionState === ConnectionState.Connecting
                  ? 'Connecting…'
                  : connectionState === ConnectionState.Reconnecting
                    ? 'Reconnecting…'
                    : joinError
                      ? `Connection failed: ${joinError}`
                      : 'Disconnected'}
            </div>
          </div>

          <div className="flex w-full max-w-md flex-col items-stretch gap-3 pb-8">
            {(isHost || role === 'speaker') && (
              <button
                className="rounded-full bg-gray-100 px-5 py-3 text-base font-semibold text-default dark:bg-gray-800"
                onClick={handleToggleMute}
                disabled={!livekitRoom}
              >
                {isMuted ? 'Unmute mic' : 'Mute mic'}
              </button>
            )}

            {isHost ? (
              <button
                className="rounded-full bg-red-500 px-5 py-3 text-base font-semibold text-white disabled:opacity-50"
                onClick={handleEndRoom}
                disabled={isEnding}
              >
                {isEnding ? 'Ending…' : 'End room'}
              </button>
            ) : (
              <button
                className="rounded-full bg-gray-100 px-5 py-3 text-base font-semibold text-default dark:bg-gray-800"
                onClick={handleLeave}
              >
                Leave
              </button>
            )}
          </div>
        </div>
      </BorderedMainContent>
    </Page>
  );
});

LiveAudioRoomPage.displayName = 'LiveAudioRoomPage';

const handleTrackSubscribed = (track: RemoteTrack) => {
  attachLivekitAudioTrack(track);
};

const handleTrackUnsubscribed = (track: RemoteTrack) => {
  detachLivekitTrack(track);
};

const LiveBadge: React.FC = () => (
  <div className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
    Live
  </div>
);

const HostBlock: React.FC<{ host: ApiUser }> = ({ host }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="relative">
      <Avatar user={host} size="xl2" disabled />
      <div className="absolute bottom-0 right-0">
        <FarcasterProBadge size={28} showBorder />
      </div>
    </div>
    <div className="flex flex-col items-center">
      <div className="text-base font-semibold">{host.displayName}</div>
      <div className="text-sm text-faint">@{host.username}</div>
    </div>
  </div>
);

LiveAudioRoomPage.displayName = 'LiveAudioRoomPage';

export { LiveAudioRoomPage };
