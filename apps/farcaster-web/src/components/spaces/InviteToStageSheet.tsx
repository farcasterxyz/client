import { ApiUser } from 'farcaster-client-data';
import { useAcceptSpeakerAudioRoom } from 'farcaster-client-hooks';
import { Hand, Mic, ShieldCheck, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { toast } from '~/utils/toast';

/**
 * Bottom sheet that host/co-hosts use to invite a listener to the stage
 * or accept a raised hand. Different copy depending on whether the user
 * already raised their hand.
 *
 * When `isHost` is true, an additional "Make Co-host" option appears so
 * the host can directly promote a listener/speaker to co-host.
 *
 * Pass `user` as null to close the sheet.
 */
const InviteToStageSheet: React.FC<{
  user: ApiUser | null;
  roomId: string;
  /** Whether this user has a raised hand */
  handRaised: boolean;
  /** Show co-host promotion button (host only) */
  isHost?: boolean;
  /** Optional remove action for host or fallback co-host controls */
  onRemove?: () => Promise<void> | void;
  onClose: () => void;
}> = React.memo(({ user, roomId, handRaised, isHost, onRemove, onClose }) => {
  const acceptSpeaker = useAcceptSpeakerAudioRoom();
  const [isSending, setIsSending] = useState(false);

  // Escape to close
  useEffect(() => {
    if (!user) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user, onClose]);

  const sendInvite = useCallback(async () => {
    if (!user) {
      return;
    }
    setIsSending(true);
    try {
      await acceptSpeaker({ roomId, fid: user.fid });
      toast({
        message: handRaised
          ? `${user.displayName} brought up to speak`
          : `Invite sent to ${user.displayName}`,
        type: 'success',
      });
      onClose();
    } catch {
      toast({ message: 'Failed to invite speaker', type: 'error' });
    } finally {
      setIsSending(false);
    }
  }, [user, roomId, handRaised, acceptSpeaker, onClose]);

  const promoteCohost = useCallback(async () => {
    if (!user) {
      return;
    }
    setIsSending(true);
    try {
      await acceptSpeaker({ roomId, fid: user.fid, role: 'cohost' });
      toast({
        message: `${user.displayName} is now a co-host`,
        type: 'success',
      });
      onClose();
    } catch {
      toast({ message: 'Failed to promote to co-host', type: 'error' });
    } finally {
      setIsSending(false);
    }
  }, [user, roomId, acceptSpeaker, onClose]);

  if (!user) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-t-2xl shadow-2xl bg-app"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 border-faint">
          <div className="flex items-center gap-2">
            {handRaised ? <Hand size={15} /> : <Mic size={15} />}
            <div className="text-[15px] font-semibold text-default">
              {handRaised ? 'Bring up to speak' : 'Invite to the stage'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-overlay-light"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4">
          {/* User card */}
          <div className="mb-3 flex items-center gap-3">
            <Avatar user={user} size="lg" disabled />
            <div className="min-w-0">
              <SpaceUserDisplayNameWithProBadge
                user={user}
                badgeSize={14}
                className="text-[15px] font-semibold text-default"
              />
              <div className="truncate text-[12px] text-faint">
                @{user.username}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mb-4 rounded-lg px-3 py-2.5 text-[13px] bg-overlay-faint text-faint">
            {handRaised
              ? 'They raised a hand to speak. Bringing them up unmutes their mic and adds them to the speaker grid.'
              : "They'll be asked to accept before joining the stage. You can cancel the invite at any time."}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border px-4 py-2.5 text-[14px] font-medium border-faint text-default hover:bg-overlay-light"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendInvite}
                disabled={isSending}
                className="inline-flex flex-[2] items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-semibold text-white bg-action-primary hover:opacity-90 disabled:opacity-50"
              >
                <Mic size={13} />
                {handRaised ? 'Bring up' : 'Send invite'}
              </button>
            </div>
            {isHost && (
              <button
                type="button"
                onClick={promoteCohost}
                disabled={isSending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-[14px] font-medium border-faint text-default hover:bg-overlay-light disabled:opacity-50"
              >
                <ShieldCheck size={14} />
                Make Co-host instead
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Remove ${user.displayName} from this Space?`,
                    )
                  ) {
                    return;
                  }
                  setIsSending(true);
                  try {
                    await onRemove();
                    toast({
                      message: `${user.displayName} removed from Space`,
                      type: 'success',
                    });
                    onClose();
                  } catch {
                    toast({
                      message: 'Failed to remove participant',
                      type: 'error',
                    });
                  } finally {
                    setIsSending(false);
                  }
                }}
                disabled={isSending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-[14px] font-medium text-red-500 border-faint hover:bg-overlay-light disabled:opacity-50"
              >
                <Trash2 size={14} />
                Remove from Space
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

InviteToStageSheet.displayName = 'InviteToStageSheet';

export { InviteToStageSheet };
