import { ApiAudioRoom } from 'farcaster-client-data';
import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  useRsvpAudioRoom,
  useStartScheduledAudioRoom,
} from 'farcaster-client-hooks';
import {
  Bell,
  BellOff,
  Calendar,
  Mic,
  Play,
  Share2,
  Users,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { AdminEndSpaceButton } from '~/components/spaces/AdminEndSpaceButton';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { useSpace } from '~/contexts/SpaceContext';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { trackWebAudioSpaceEvent } from '~/utils/audioSpaceInstrumentation';
import { toast } from '~/utils/toast';

const getLiveListenerCount = ({
  isJoined,
  participantCount,
  listenerCount,
}: {
  isJoined: boolean;
  participantCount: number;
  listenerCount: number;
}) => (isJoined && participantCount > 0 ? participantCount : listenerCount);

/**
 * Row-style card used on the Spaces discovery page. Handles both live and
 * scheduled rooms with appropriate actions.
 */
const SpaceCard: React.FC<{
  room: ApiAudioRoom;
  /** Viewer's fid, to show "Go Live" for host */
  viewerFid?: number;
}> = React.memo(({ room, viewerFid }) => {
  const navigate = useNavigate();
  const { join, joined, participantCount } = useSpace();
  const startScheduledRoom = useStartScheduledAudioRoom();
  const rsvpAudioRoom = useRsvpAudioRoom();
  const [isStarting, setIsStarting] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [localRsvped, setLocalRsvped] = useState<boolean | null>(null);

  const isScheduled = room.state === 'scheduled';
  const isJoined = joined?.room.id === room.id;
  const isViewerHost = viewerFid !== undefined && room.hostFid === viewerFid;
  const liveListenerCount = getLiveListenerCount({
    isJoined,
    participantCount,
    listenerCount: room.listenerCount,
  });

  const onClick = useCallback(() => {
    const spaceSessionId = createAudioSpaceTelemetryId('space_open');
    trackWebAudioSpaceEvent({
      eventName: AUDIO_SPACE_EVENTS.cardOpened,
      context: {
        spaceSessionId,
        roomId: room.id,
        viewerFid,
        platform: 'web',
        entrySource: 'spaces_list',
      },
      properties: {
        roomState: room.state,
      },
    });
    trackWebAudioSpaceEvent({
      eventName: AUDIO_SPACE_EVENTS.openSource,
      context: {
        spaceSessionId,
        roomId: room.id,
        viewerFid,
        platform: 'web',
        entrySource: 'spaces_list',
      },
      properties: {
        source: 'spaces_list',
      },
    });
    navigate({ to: 'spaces', params: { roomId: room.id } });
  }, [navigate, room.id, room.state, viewerFid]);

  const handleGoLive = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsStarting(true);
      try {
        const result = await startScheduledRoom({ roomId: room.id });
        const didJoin = await join(result.room.id, 'spaces_list');
        if (!didJoin) {
          return;
        }
        navigate({ to: 'spaces', params: { roomId: result.room.id } });
      } catch (err) {
        toast({
          message: err instanceof Error ? err.message : 'Failed to start Space',
          type: 'error',
        });
      } finally {
        setIsStarting(false);
      }
    },
    [startScheduledRoom, room.id, join, navigate],
  );

  const handleRsvp = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRsvping(true);
      const wasRsvped = localRsvped ?? room.viewerContext?.rsvped ?? false;
      setLocalRsvped(!wasRsvped);
      try {
        const result = await rsvpAudioRoom({ roomId: room.id });
        setLocalRsvped(result.rsvped);
      } catch {
        setLocalRsvped(wasRsvped);
        toast({ message: 'Failed to update RSVP', type: 'error' });
      } finally {
        setIsRsvping(false);
      }
    },
    [rsvpAudioRoom, room.id, localRsvped, room.viewerContext?.rsvped],
  );
  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Use the canonical farcaster.xyz URL so links work for recipients on any
      // origin (staging/localhost) and match Space URL embed detection.
      const writePromise = navigator.clipboard?.writeText(
        `https://farcaster.xyz/~/spaces/${room.id}`,
      );
      if (!writePromise) {
        toast({ message: 'Unable to copy link', type: 'error' });
        return;
      }
      writePromise
        .then(() => toast({ message: 'Link copied', type: 'success' }))
        .catch(() => toast({ message: 'Unable to copy link', type: 'error' }));
    },
    [room.id],
  );

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

  const rsvped = localRsvped ?? room.viewerContext?.rsvped ?? false;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="group flex w-full cursor-pointer items-start gap-3 border-t px-4 py-4 text-left border-faint hover:bg-overlay-faint"
    >
      <div className="shrink-0">
        <Avatar user={room.host} size="lg" disabled />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          {isScheduled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-600">
              <Calendar size={10} />
              Scheduled
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ background: 'var(--color-red, #dc3412)' }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          )}
          {isScheduled && room.recordingEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-600">
              Recording on
            </span>
          )}
        </div>
        <div className="line-clamp-2 text-[15px] font-semibold leading-snug text-default">
          {room.title}
        </div>
        {room.description && (
          <div className="mt-0.5 line-clamp-1 text-[13px] text-faint">
            {room.description}
          </div>
        )}
        <SpaceUserDisplayNameWithProBadge
          user={room.host}
          badgeSize={12}
          className="mt-0.5 text-[13px] text-faint"
        />
        <div className="mt-2 flex items-center gap-3 text-[12px] text-faint">
          {isScheduled ? (
            <>
              {scheduledLabel && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {scheduledLabel}
                </span>
              )}
              {(room.rsvpCount ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Bell size={11} />
                  {room.rsvpCount} interested
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {liveListenerCount.toLocaleString()} listening
            </span>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="flex shrink-0 items-center gap-2">
        {!isViewerHost && (
          <AdminEndSpaceButton roomId={room.id} roomState={room.state} />
        )}
        {isScheduled ? (
          isViewerHost ? (
            <button
              type="button"
              onClick={handleGoLive}
              disabled={isStarting}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white bg-action-primary hover:opacity-90 disabled:opacity-50"
            >
              <Play size={12} />
              {isStarting ? 'Starting...' : 'Go Live'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-overlay-faint text-faint hover:bg-overlay-light"
                aria-label="Share scheduled space"
              >
                <Share2 size={13} />
              </button>
              <button
                type="button"
                onClick={handleRsvp}
                disabled={isRsvping}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold disabled:opacity-50 ${
                  rsvped
                    ? 'bg-purple-500/10 text-purple-600'
                    : 'bg-overlay-faint text-default hover:bg-overlay-light'
                }`}
              >
                {rsvped ? <BellOff size={12} /> : <Bell size={12} />}
                {rsvped ? 'Reminder set' : 'Notify me'}
              </button>
            </div>
          )
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white bg-action-primary hover:opacity-90"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Mic size={12} />
            Join
          </button>
        )}
      </div>
    </div>
  );
});

SpaceCard.displayName = 'SpaceCard';

/**
 * Gradient-background card injected into the main feed after the 2nd cast.
 * Visually distinct from a regular cast so it catches attention.
 */
const LiveSpaceFeedCard: React.FC<{ room: ApiAudioRoom }> = React.memo(
  ({ room }) => {
    const navigate = useNavigate();
    const { joined, participantCount } = useSpace();
    const isJoined = joined?.room.id === room.id;
    const listenerCount = getLiveListenerCount({
      isJoined,
      participantCount,
      listenerCount: room.listenerCount,
    });
    const onClick = useCallback(() => {
      navigate({ to: 'spaces', params: { roomId: room.id } });
    }, [navigate, room.id]);

    return (
      <div className="border-t px-4 py-3 border-faint">
        <button
          type="button"
          onClick={onClick}
          className="group relative w-full overflow-hidden rounded-xl p-4 text-left"
          style={{
            background:
              'linear-gradient(135deg, rgba(121,89,255,0.12) 0%, rgba(220,52,18,0.08) 100%)',
            border:
              '1px solid var(--color-action-primary-light, rgba(121,89,255,0.2))',
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ background: 'var(--color-red, #dc3412)' }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
            <span className="text-[12px] text-faint">Space</span>
          </div>
          <div className="mb-3 text-[16px] font-semibold leading-snug text-default">
            {room.title}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar user={room.host} size="sm" disabled />
              <div className="min-w-0">
                <SpaceUserDisplayNameWithProBadge
                  user={room.host}
                  badgeSize={13}
                  className="text-[13px] font-medium text-default"
                  suffix={
                    <span className="font-normal text-faint"> · hosting</span>
                  }
                />
                <div className="flex items-center gap-1.5 text-[12px] text-faint">
                  <Users size={11} />
                  {listenerCount.toLocaleString()} listening
                </div>
              </div>
            </div>
            <div
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                isJoined
                  ? 'bg-overlay-faint text-faint'
                  : 'text-white bg-action-primary group-hover:opacity-90'
              }`}
            >
              {!isJoined && <Mic size={12} />}
              {isJoined ? 'Joined' : 'Join'}
            </div>
          </div>
        </button>
      </div>
    );
  },
);

LiveSpaceFeedCard.displayName = 'LiveSpaceFeedCard';

/**
 * Compact 280px card used inside the horizontally scrollable strip when
 * multiple Spaces are live simultaneously.
 */
const LiveSpaceCarouselCard: React.FC<{ room: ApiAudioRoom }> = React.memo(
  ({ room }) => {
    const navigate = useNavigate();
    const { joined, participantCount } = useSpace();
    const isJoined = joined?.room.id === room.id;
    const listenerCount = getLiveListenerCount({
      isJoined,
      participantCount,
      listenerCount: room.listenerCount,
    });
    const onClick = useCallback(() => {
      navigate({ to: 'spaces', params: { roomId: room.id } });
    }, [navigate, room.id]);

    return (
      <button
        type="button"
        onClick={onClick}
        className="group block w-[280px] shrink-0 snap-start overflow-hidden rounded-xl p-3.5 text-left"
        style={{
          background:
            'linear-gradient(135deg, rgba(121,89,255,0.12) 0%, rgba(220,52,18,0.08) 100%)',
          border:
            '1px solid var(--color-action-primary-light, rgba(121,89,255,0.2))',
        }}
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ background: 'var(--color-red, #dc3412)' }}
          >
            <span className="h-1 w-1 rounded-full bg-white" />
            Live
          </span>
        </div>
        <div className="mb-2 line-clamp-2 text-[14px] font-semibold leading-snug text-default">
          {room.title}
        </div>
        <div className="flex items-center gap-2">
          <Avatar user={room.host} size="xs" disabled />
          <div className="min-w-0 flex-1">
            <SpaceUserDisplayNameWithProBadge
              user={room.host}
              badgeSize={12}
              className="text-[12px] font-medium text-default"
            />
            <div className="flex items-center gap-1 text-[11px] text-faint">
              <Users size={10} />
              {listenerCount.toLocaleString()} listening
            </div>
          </div>
          <div
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isJoined
                ? 'bg-overlay-faint text-faint'
                : 'text-white bg-action-primary group-hover:opacity-90'
            }`}
          >
            {!isJoined && <Mic size={10} />}
            {isJoined ? 'Joined' : 'Join'}
          </div>
        </div>
      </button>
    );
  },
);

LiveSpaceCarouselCard.displayName = 'LiveSpaceCarouselCard';

/**
 * Horizontal strip of live-Space cards above the feed. One Space → single
 * full-width card. Multiple → horizontally scrollable carousel with a
 * "N Spaces live now" header.
 */
const LiveSpacesStrip: React.FC<{ rooms: ApiAudioRoom[] }> = React.memo(
  ({ rooms }) => {
    if (rooms.length === 0) {
      return null;
    }
    if (rooms.length === 1) {
      return <LiveSpaceFeedCard room={rooms[0]} />;
    }

    return (
      <div className="border-t px-4 py-3 border-faint">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--color-red, #dc3412)' }}
          />
          {rooms.length} Spaces live now
        </div>
        <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {rooms.map((room) => (
            <LiveSpaceCarouselCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    );
  },
);

LiveSpacesStrip.displayName = 'LiveSpacesStrip';

export { LiveSpaceFeedCard, LiveSpacesStrip, SpaceCard };
