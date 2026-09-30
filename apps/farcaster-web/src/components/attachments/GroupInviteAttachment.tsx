import { CommentIcon, PeopleIcon } from '@primer/octicons-react';
import cn from 'classnames';
import type { ApiGroupInviteEmbed } from 'farcaster-client-data';
import { formatShorthandNumber } from 'farcaster-client-hooks';
import React from 'react';

import { GroupConversationImage } from '~/components/directCasts/GroupConversationImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

const GroupInviteAttachment: React.FC<{
  groupInvite: ApiGroupInviteEmbed;
  slim?: boolean;
  disabled?: boolean;
}> = React.memo(({ groupInvite, slim, disabled }) => {
  const externalNavigate = useExternalNavigate();

  return (
    <div className="flex flex-row justify-between rounded-md border bg-app border-default">
      <div className="flex items-center justify-center">
        <GroupConversationImage
          imageURL={groupInvite.imageUrl}
          size={slim ? 'lg' : 'xl'}
          className="rounded-l-md rounded-r-none border-0"
        />
      </div>
      <div className="flex grow flex-row items-center">
        <div className={cn('mx-3 flex w-72 grow flex-col')}>
          <div className="flex flex-row items-center gap-1">
            <span className="line-clamp-1 font-semibold break-gracefully text-default">
              {groupInvite.name}
            </span>
            {typeof groupInvite.numParticipants === 'number' &&
              groupInvite.numParticipants > 0 && (
                <>
                  <span className="text-xs">·</span>
                  <PeopleIcon size={10} className="text-muted" />
                  <span className="text-xs text-muted">
                    {formatShorthandNumber(groupInvite.numParticipants)}
                  </span>
                </>
              )}
          </div>
          {!slim && groupInvite.description && (
            <span className="line-clamp-2 text-sm break-gracefully text-default">
              {groupInvite.description}
            </span>
          )}
        </div>
        <div className="mr-5">
          <DefaultButton
            className="flex flex-row items-center gap-1"
            variant="normal"
            disabled={disabled}
            onClick={() => {
              externalNavigate({ to: groupInvite.url, openInNewTab: true });
            }}
          >
            <CommentIcon size={14} />
            <span>Join</span>
          </DefaultButton>
        </div>
      </div>
    </div>
  );
});

GroupInviteAttachment.displayName = 'GroupInviteAttachment';

export { GroupInviteAttachment };
