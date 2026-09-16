import { ApiUser } from 'farcaster-client-data';
import { Mic, MicOff, Star } from 'lucide-react';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';

type AvatarReaction = {
  id: number;
  emoji: string;
};

const SpeakerTile: React.FC<{
  user: ApiUser;
  role: 'host' | 'cohost' | 'speaker';
  speaking?: boolean;
  muted?: boolean;
  isOffline?: boolean;
  reactions?: AvatarReaction[];
}> = ({ user, role, speaking, muted, isOffline, reactions }) => {
  const roleLabel =
    role === 'host' ? 'Host' : role === 'cohost' ? 'Co-host' : undefined;
  const isMuted = muted === true;
  const hasKnownMuteState = muted !== undefined;

  return (
    <div className="flex w-[88px] flex-col items-center gap-1.5">
      <div className={`relative flex ${speaking ? 'text-brand' : ''}`}>
        <div
          aria-hidden
          className={`pointer-events-none absolute -inset-1 rounded-full border-[3px] ${
            speaking
              ? 'animate-speakerPulseRing border-current'
              : 'border-transparent opacity-0'
          }`}
        />
        <div
          className={`flex aspect-square items-center justify-center rounded-full border-[3px] p-0.5 ${
            speaking ? 'border-current' : 'border-transparent'
          }`}
        >
          <div className={isOffline ? 'opacity-60 grayscale' : ''}>
            <Avatar user={user} size="lg2" disabled />
          </div>
        </div>
        {!isOffline && hasKnownMuteState && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${
              isMuted
                ? 'border bg-app border-faint text-faint'
                : 'text-white bg-action-primary'
            }`}
          >
            {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
          </div>
        )}
        {role === 'host' && (
          <div className="absolute -right-0.5 -top-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full text-white bg-action-primary">
            <Star size={12} fill="currentColor" />
          </div>
        )}
        {reactions?.map((reaction, index) => (
          <div
            key={reaction.id}
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) translateX(${(index % 3) * 12 - 12}px)`,
            }}
          >
            <span
              className="block text-[24px]"
              style={{ animation: 'floatUp 2.6s ease-out forwards' }}
            >
              {reaction.emoji}
            </span>
          </div>
        ))}
      </div>
      <div className="w-full text-center">
        <SpaceUserDisplayNameWithProBadge
          user={user}
          badgeSize={12}
          className="w-full justify-center text-[12px] font-medium leading-tight text-default"
        />
        {roleLabel && (
          <div className="text-[10px] leading-tight text-faint">
            {roleLabel}
          </div>
        )}
      </div>
    </div>
  );
};

SpeakerTile.displayName = 'SpeakerTile';

/** Listener avatar — smaller, no labels beyond name. */
const ListenerTile: React.FC<{
  user: ApiUser;
  reactions?: AvatarReaction[];
}> = ({ user, reactions }) => {
  return (
    <div className="flex w-[64px] flex-col items-center gap-1">
      <div className="relative">
        <Avatar user={user} size="lg" disabled />
        {reactions?.map((reaction, index) => (
          <div
            key={reaction.id}
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) translateX(${(index % 3) * 10 - 10}px)`,
            }}
          >
            <span
              className="block text-[20px]"
              style={{ animation: 'floatUp 2.6s ease-out forwards' }}
            >
              {reaction.emoji}
            </span>
          </div>
        ))}
      </div>
      <SpaceUserDisplayNameWithProBadge
        user={user}
        badgeSize={11}
        className="w-full justify-center text-[11px] leading-tight text-faint"
      />
    </div>
  );
};

ListenerTile.displayName = 'ListenerTile';

/** Clustered overlapping avatars for compact listener counts. */
const AvatarCluster: React.FC<{
  users: ApiUser[];
  max?: number;
}> = ({ users, max = 3 }) => {
  const shown = users.slice(0, max);
  return (
    <div className="flex -space-x-1.5">
      {shown.map((user) => (
        <div key={user.fid} className="ring-app rounded-full ring-2">
          <Avatar user={user} size="xs2" disabled />
        </div>
      ))}
    </div>
  );
};

AvatarCluster.displayName = 'AvatarCluster';

export { AvatarCluster, ListenerTile, SpeakerTile };
