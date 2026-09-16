import { ApiAudioRoom } from 'farcaster-client-data';
import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  useAudioRoomsList,
} from 'farcaster-client-hooks';
import { ChevronRight, Mic, Users } from 'lucide-react';
import React, { FC, memo, useCallback, useMemo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { useOptionalSpace } from '~/contexts/SpaceContext';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { trackWebAudioSpaceEvent } from '~/utils/audioSpaceInstrumentation';
import { prioritizeFollowedHostsAndFilterBlockedHosts } from '~/utils/audioSpaceRoomOrdering';

const LiveNowSpaces: FC = memo(() => {
  const navigate = useNavigate();
  const space = useOptionalSpace();
  const joined = space?.joined;
  const currentUser = useCurrentUser();
  const { data: rooms } = useAudioRoomsList();

  const liveRooms = useMemo(() => {
    return prioritizeFollowedHostsAndFilterBlockedHosts(rooms).slice(0, 3);
  }, [rooms]);

  const onSeeAll = useCallback(() => {
    navigate({ to: 'spacesDiscovery', params: {} });
  }, [navigate]);

  const openRoom = useCallback(
    (room: ApiAudioRoom) => {
      const spaceSessionId = createAudioSpaceTelemetryId('space_open');
      trackWebAudioSpaceEvent({
        eventName: AUDIO_SPACE_EVENTS.cardOpened,
        context: {
          spaceSessionId,
          roomId: room.id,
          viewerFid: currentUser?.fid,
          platform: 'web',
          entrySource: 'unknown',
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
          viewerFid: currentUser?.fid,
          platform: 'web',
          entrySource: 'unknown',
        },
        properties: {
          source: 'home_sidebar',
        },
      });
      navigate({ to: 'spaces', params: { roomId: room.id } });
    },
    [currentUser?.fid, navigate],
  );

  if (liveRooms.length === 0) {
    return null;
  }

  return (
    <div className="hidden rounded-xl px-2 py-3 pt-2 bg-surface-secondary mdlg:block">
      <div className="mb-1 flex items-center justify-between px-2">
        <div className="inline-flex items-center gap-1.5 text-base font-semibold text-default">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--color-red, #dc3412)' }}
          />
          Live now
        </div>
        <button
          type="button"
          onClick={onSeeAll}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-faint hover:text-default"
        >
          See all
          <ChevronRight size={12} />
        </button>
      </div>
      <div className="mt-1 flex max-h-[224px] flex-col overflow-y-auto">
        {liveRooms.map((room) => {
          const isJoined = joined?.room.id === room.id;
          const joinedParticipantCount = space?.participantCount ?? 0;
          const listenerCount =
            isJoined && joinedParticipantCount > 0
              ? joinedParticipantCount
              : room.listenerCount;

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => openRoom(room)}
              className="group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-overlay-faint"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar user={room.host} size="sm" disabled />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-default">
                    {room.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-faint">
                    <SpaceUserDisplayNameWithProBadge
                      user={room.host}
                      badgeSize={11}
                    />
                    <span aria-hidden>·</span>
                    <Users size={10} />
                    {listenerCount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div
                aria-disabled={isJoined}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isJoined
                    ? 'cursor-not-allowed bg-overlay-faint text-faint'
                    : 'bg-action-primary text-light group-hover:opacity-90'
                }`}
              >
                {!isJoined && <Mic size={10} />}
                {isJoined ? 'Joined' : 'Join'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

LiveNowSpaces.displayName = 'LiveNowSpaces';

export { LiveNowSpaces };
