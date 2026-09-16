import { useAudioRoom } from 'farcaster-client-hooks';
import { Mic, Users } from 'lucide-react';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { useNavigate } from '~/hooks/navigation/useNavigate';

// Fits badge row + 1-line title + host footer with p-4 padding.
const SPACE_EMBED_FEED_HEIGHT = 132;

/**
 * Detect a Farcaster Space canonical URL: `https://farcaster.xyz/~/spaces/{roomId}`
 * (also accepts legacy `warpcast.com` and trailing slashes).
 */
const SPACE_URL_PATTERN =
  'https?:\\/\\/(?:www\\.)?(?:warpcast\\.com|farcaster\\.xyz)\\/~\\/spaces\\/([\\w-]+)\\/?(?:\\?[^#\\s]*)?(?:#[^\\s]*)?';
const SPACE_URL_RE = new RegExp(`^${SPACE_URL_PATTERN}$`);
const SPACE_URL_IN_TEXT_RE = new RegExp(SPACE_URL_PATTERN, 'g');

export function matchSpaceUrl(url: string): { roomId: string } | null {
  const m = url.match(SPACE_URL_RE);
  if (!m) {
    return null;
  }
  return { roomId: m[1] };
}

export function extractSpaceUrl(text: string): string | undefined {
  const matches = [...text.matchAll(SPACE_URL_IN_TEXT_RE)];
  return matches.at(-1)?.[0];
}

/**
 * Cast embed renderer for a Space URL. Replaces the generic OG card with a
 * "Join Live Space" widget that pulls live state (host / title / listener
 * count) from `useAudioRoom`.
 */
const SpaceEmbedAttachment: React.FC<{
  height?: number;
  url: string;
  width?: number;
}> = React.memo(({ height, url, width }) => {
  const match = matchSpaceUrl(url);
  const navigate = useNavigate();
  const { data: room } = useAudioRoom({
    roomId: match?.roomId ?? '',
    enabled: !!match,
  });

  if (!match) {
    return null;
  }

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate({ to: 'spaces', params: { roomId: match.roomId } });
  };

  const reservedSizeStyle: React.CSSProperties = {
    ...(typeof height === 'number'
      ? { height }
      : { height: SPACE_EMBED_FEED_HEIGHT }),
    ...(typeof width === 'number' ? { minWidth: width, width } : {}),
  };

  // Skeleton while loading or if the viewer can't fetch (e.g. admin-gated)
  if (!room) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={reservedSizeStyle}
        className="group flex w-full shrink-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left bg-overlay-faint border-faint hover:bg-overlay-light"
      >
        <Mic size={18} className="text-action-primary" />
        <div className="flex-1 text-[14px] font-medium text-default">
          Farcaster Space
        </div>
        <span className="rounded-full px-3 py-1 text-[12px] font-semibold text-white bg-action-primary group-hover:opacity-90">
          Open
        </span>
      </button>
    );
  }

  const isLive = room.state === 'live';
  const isScheduled = room.state === 'scheduled';
  const isEnded = room.state === 'ended';
  const hasPlayback = Boolean(
    isEnded && room.recording?.status === 'ready' && room.recording.playbackUrl,
  );

  const scheduledLabel = (() => {
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
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full shrink-0 overflow-hidden rounded-xl border p-4 text-left bg-app border-faint hover:opacity-95"
      style={{
        ...reservedSizeStyle,
        ...(isLive
          ? {
              background:
                'linear-gradient(135deg, rgba(121,89,255,0.10) 0%, rgba(220,52,18,0.06) 100%)',
              borderColor: 'rgba(121,89,255,0.25)',
            }
          : undefined),
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        {isLive ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
            style={{ background: 'var(--color-red, #dc3412)' }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        ) : isScheduled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-600">
            Scheduled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-overlay-faint text-faint">
            Ended
          </span>
        )}
        <span className="text-[12px] text-faint">Space</span>
      </div>

      <div
        className={`truncate text-[15px] font-semibold leading-snug text-default ${
          isEnded ? 'opacity-60 grayscale' : ''
        }`}
      >
        {room.title}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div
          className={`flex min-w-0 items-center gap-2 ${
            isEnded ? 'opacity-60 grayscale' : ''
          }`}
        >
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
              {isLive ? (
                <>
                  <Users size={11} />
                  {room.listenerCount.toLocaleString()} listening
                </>
              ) : isScheduled && scheduledLabel ? (
                scheduledLabel
              ) : (
                'Audio Space'
              )}
            </div>
          </div>
        </div>

        {(!isEnded || hasPlayback) && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white bg-action-primary group-hover:opacity-90">
            <Mic size={12} />
            {isLive ? 'Join' : hasPlayback ? 'Play' : 'Open'}
          </span>
        )}
      </div>
    </button>
  );
});

SpaceEmbedAttachment.displayName = 'SpaceEmbedAttachment';

export { SpaceEmbedAttachment };
