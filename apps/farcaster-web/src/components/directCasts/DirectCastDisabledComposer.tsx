import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React from 'react';

type DirectCastDisabledComposerProps = {
  conversationCounterParty: ApiUser | undefined;
  conversationIsGroup: boolean;
};

const DirectCastDisabledComposer: React.FC<DirectCastDisabledComposerProps> =
  React.memo(({ conversationIsGroup, conversationCounterParty }) => {
    return (
      <div className="border-t p-[20px] pb-[21px] text-center text-muted bg-overlay-faint border-default">
        {conversationIsGroup
          ? 'Only Admins can send messages'
          : typeof conversationCounterParty !== 'undefined'
            ? `Only ${resolveUsername({ username: conversationCounterParty.username, fid: conversationCounterParty.fid })} can send messages`
            : 'You are not allowed to send messages'}
      </div>
    );
  });

DirectCastDisabledComposer.displayName = 'DirectCastDisabledComposer';

export { DirectCastDisabledComposer };
