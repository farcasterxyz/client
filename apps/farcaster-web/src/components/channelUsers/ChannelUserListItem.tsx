import { KebabHorizontalIcon } from '@primer/octicons-react';
import { ApiChannelUser } from 'farcaster-client-data';
import React, { ReactElement, useMemo } from 'react';

import { ChannelRelationBadge } from '~/components/channelUsers/ChannelBadge';
import { ManageChannelUserDropdown } from '~/components/channelUsers/ManageChannelUserDropdown';
import { BaseUserListItem } from '~/components/users/BaseUserListItem';
import { useChannelModOrOwner } from '~/hooks/useUserChannelRole';

export function ChannelUserListItem({
  channelKey,
  channelUser,
  Action: ActionOverride,
  skipSeperator,
}: {
  channelKey: string;
  channelUser: ApiChannelUser;
  Action?: ReactElement | null;
  skipSeperator?: boolean;
}) {
  const role = useChannelModOrOwner(channelKey);
  const Action = useMemo(() => {
    if (ActionOverride !== undefined) {
      return ActionOverride;
    }

    if (role === 'owner' || role === 'moderator') {
      return (
        <ManageChannelUserDropdown
          channelKey={channelKey}
          channelUser={channelUser}
        >
          <div className="flex-none">
            <KebabHorizontalIcon
              size={24}
              className="text-muted hover:brightness-110"
            />
          </div>
        </ManageChannelUserDropdown>
      );
    }
  }, [ActionOverride, channelKey, channelUser, role]);

  return (
    <BaseUserListItem
      user={channelUser.user}
      withDetailsPopover={true}
      Badge={<ChannelRelationBadge relation={channelUser.relation} />}
      Action={Action}
      skipSeperator={skipSeperator}
    />
  );
}
