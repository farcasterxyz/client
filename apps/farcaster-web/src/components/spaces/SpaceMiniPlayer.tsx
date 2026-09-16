import { Mic, MicOff, X } from 'lucide-react';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { formatElapsed, useSpace } from '~/contexts/SpaceContext';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { cn } from '~/lib/utils';

/**
 * Compact floating tile while a Space is joined — except when the user
 * is already viewing that Space's room. Tapping the tile re-opens the full
 * Space room. Mic and leave remain available as quick actions.
 */
const SpaceMiniPlayer: React.FC<{ compact?: boolean }> = React.memo(
  ({ compact = false }) => {
    const {
      joined,
      elapsedSec,
      participantCount,
      toggleMute,
      leave,
      endRoom,
      removedByHostRoomId,
    } = useSpace();
    const navigate = useNavigate();
    const location = useLocation();
    const isHostProUser = useUserLevel(joined?.room.host) === 'pro';
    const [endConfirmationOpen, setEndConfirmationOpen] = React.useState(false);

    if (!joined || removedByHostRoomId) {
      return null;
    }

    // Hide while the room is in front — the room has its own bottom controls.
    const roomPath = `/~/spaces/${joined.room.id}`;
    // Also handle the old path format
    const oldRoomPath = `/~/audio-room/${joined.room.id}`;
    if (location.pathname === roomPath || location.pathname === oldRoomPath) {
      return null;
    }

    const { room, muted, role } = joined;
    const canSpeak = role === 'host' || role === 'cohost' || role === 'speaker';
    const listenerCount =
      participantCount > 0 ? participantCount : room.listenerCount;

    const handleDismiss = () => {
      if (role === 'host') {
        setEndConfirmationOpen(true);
        return;
      }
      void leave();
    };

    const handleCancelEnd = () => {
      setEndConfirmationOpen(false);
    };

    const handleConfirmEnd = () => {
      setEndConfirmationOpen(false);
      void endRoom();
    };

    return (
      <>
        <div
          className={cn(
            'pointer-events-auto flex min-h-[48px] max-w-[calc(100vw-1rem)] items-center rounded-xl border bg-swap border-default',
            'shadow-[0px_0px_25px_0_rgba(0,0,0,0.12)] dark:shadow-[0px_4px_20px_0_rgba(255,255,255,0.07),_0px_0px_0.5px_0_rgba(255,255,255,0.30),_0px_1px_3px_0_rgba(255,255,255,0.15)]',
            compact
              ? 'h-[48px] w-[48px] justify-center p-0'
              : 'w-[393px] gap-2 p-3',
          )}
        >
          <button
            type="button"
            onClick={() =>
              navigate({ to: 'spaces', params: { roomId: room.id } })
            }
            className={cn(
              'flex items-center rounded-lg text-left hover:bg-overlay-faint',
              compact
                ? 'h-[40px] w-[40px] justify-center p-0'
                : 'min-w-0 flex-1 gap-2.5 px-1 py-1',
            )}
          >
            <div className="relative shrink-0">
              <Avatar user={room.host} size="sm" disabled />
              {isHostProUser && (
                <span
                  className="absolute -right-1 -top-1 flex size-3 items-center justify-center"
                  title="Farcaster Pro"
                >
                  <FarcasterProBadge size={12} showBorder />
                </span>
              )}
              <span
                className="ring-app absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full ring-2"
                style={{ background: 'var(--color-red, #dc3412)' }}
              />
            </div>
            {!compact && (
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-[13px] font-semibold leading-tight text-default">
                  {room.title}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-faint">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--color-red, #dc3412)' }}
                  />
                  Live · {formatElapsed(elapsedSec)} ·{' '}
                  {listenerCount.toLocaleString()}
                </div>
              </div>
            )}
          </button>

          {!compact && (
            <div className="flex shrink-0 items-center gap-2">
              {canSpeak ? (
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    muted
                      ? 'bg-overlay-light text-default hover:bg-overlay-medium'
                      : 'text-white bg-action-primary hover:opacity-90'
                  }`}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors bg-overlay-light text-default hover:bg-overlay-medium active:bg-elevated"
                aria-label={role === 'host' ? 'End Space' : 'Leave Space'}
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {endConfirmationOpen && (
          <ConfirmationModal
            title="End Space?"
            body="This will end the Space for everyone."
            cancelText="Keep Space"
            confirmText="End Space"
            destructive
            hideAreYouSure
            onCancel={handleCancelEnd}
            onConfirm={handleConfirmEnd}
            onBackdropClose={handleCancelEnd}
          />
        )}
      </>
    );
  },
);

SpaceMiniPlayer.displayName = 'SpaceMiniPlayer';

export { SpaceMiniPlayer };
