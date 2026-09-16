import { ApiGroupInviteEmbed } from 'farcaster-client-data';
import React from 'react';

import { GroupInviteAttachment } from '~/components/attachments/GroupInviteAttachment';

type DirectCastGroupInvitesProps = {
  groupInvites: ApiGroupInviteEmbed[];
};

const DirectCastGroupInvites: React.FC<DirectCastGroupInvitesProps> =
  React.memo(({ groupInvites }) => {
    return (
      <div className="flex flex-col space-y-1">
        {groupInvites.map((groupInvite, index) => (
          <GroupInviteAttachment
            key={`${groupInvite.inviteCode}-${index}`}
            groupInvite={groupInvite}
          />
        ))}
      </div>
    );
  });

export { DirectCastGroupInvites };
