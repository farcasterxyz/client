import { ApiUser } from 'farcaster-client-data';
import { FC } from 'react';

import { InviteHead } from './InviteHead';

type InviteProps = {
  inviteId: string;
  inviter: ApiUser;
};

const Invite: FC<InviteProps> = ({ inviter, inviteId }: InviteProps) => {
  return (
    <>
      <InviteHead inviter={inviter} inviteId={inviteId} />
      <div>{`Join @${inviter.username} on Farcaster`}</div>
    </>
  );
};

Invite.displayName = 'Invite';

export { Invite };
