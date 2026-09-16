import { useUserByFid } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';

type SignupCTAProps = {
  inviterFid: number;
};

const SignupCTA: FC<SignupCTAProps> = memo(({ inviterFid }) => {
  const vitalikFid = 5650;
  const balajiFid = 37;
  const barmstrongFid = 20;

  // FIXME: Making all these requests here is a mess.
  const { data: inviter } = useUserByFid({ fid: inviterFid });
  const { data: vitalik } = useUserByFid({ fid: vitalikFid });
  const { data: balaji } = useUserByFid({ fid: balajiFid });
  const { data: barmstrong } = useUserByFid({ fid: barmstrongFid });

  const selected = React.useMemo(() => {
    const selectedFids = [vitalikFid, balajiFid, barmstrongFid].filter(
      (x) => x !== Number(inviterFid),
    );
    return [inviterFid].concat(selectedFids).slice(0, 3);
  }, [inviterFid]);

  const users = React.useMemo(() => {
    return selected.map((sf) => {
      if (sf === inviterFid) {
        return inviter;
      }
      if (sf === vitalikFid) {
        return vitalik;
      }
      if (sf === balajiFid) {
        return balaji;
      }
      if (sf === barmstrongFid) {
        return barmstrong;
      }
    });
  }, [balaji, barmstrong, inviter, inviterFid, selected, vitalik]);

  const avatars = React.useMemo(() => {
    return (
      <div className="flex flex-row items-center justify-center space-x-4">
        {users[0] && <Avatar size="xl" user={users[0].result.user} />}
        {users[1] && <Avatar size="xl" user={users[1].result.user} />}
        {users[2] && <Avatar size="xl" user={users[2].result.user} />}
      </div>
    );
  }, [users]);

  return (
    <div className="flex flex-col items-center">
      {avatars}
      <div className="flex flex-row pt-4 text-lg text-default">
        Join @{inviter?.result.user.username ?? 'unknown'} and many others
      </div>
      <div className="flex flex-row text-lg text-default">on Farcaster</div>
    </div>
  );
});
export { SignupCTA };
