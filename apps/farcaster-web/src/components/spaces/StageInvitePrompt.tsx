import { ApiAudioRoomPromoteRole, ApiUser } from 'farcaster-client-data';
import { Mic, ShieldCheck, X } from 'lucide-react';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';

const StageInvitePrompt: React.FC<{
  pendingInvite: { role: ApiAudioRoomPromoteRole; inviterFid: number } | null;
  inviterUser?: ApiUser;
  isSubmitting?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ pendingInvite, inviterUser, isSubmitting, onAccept, onDecline }) => {
  if (!pendingInvite) {
    return null;
  }

  const isCohostInvite = pendingInvite.role === 'cohost';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div className="w-full max-w-[440px] rounded-t-2xl shadow-2xl bg-app">
        <div className="flex items-center gap-2 border-b px-4 py-3 border-faint">
          {isCohostInvite ? <ShieldCheck size={16} /> : <Mic size={16} />}
          <div className="text-[15px] font-semibold text-default">
            {isCohostInvite ? 'Invite to co-host' : 'Invite to speak'}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            {inviterUser ? (
              <Avatar user={inviterUser} size="lg" disabled />
            ) : (
              <div className="h-10 w-10 rounded-full bg-overlay-faint" />
            )}
            <div className="min-w-0">
              <SpaceUserDisplayNameWithProBadge
                user={inviterUser}
                fallbackName="Space host"
                badgeSize={13}
                className="text-[14px] font-semibold text-default"
              />
              <div className="truncate text-[12px] text-faint">
                {inviterUser?.username
                  ? `@${inviterUser.username}`
                  : `fid:${pendingInvite.inviterFid}`}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-lg px-3 py-2.5 text-[13px] bg-overlay-faint text-faint">
            {isCohostInvite
              ? 'You were invited to co-host this Space. Accept to join the stage with co-host controls.'
              : 'You were invited to speak in this Space. Accept to join the stage.'}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDecline}
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-[14px] font-medium border-faint text-default hover:bg-overlay-light disabled:opacity-50"
            >
              <X size={13} />
              Decline
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-semibold text-white bg-action-primary hover:opacity-90 disabled:opacity-50"
            >
              {isCohostInvite ? <ShieldCheck size={13} /> : <Mic size={13} />}
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { StageInvitePrompt };
