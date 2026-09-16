import { useUserByFid } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';

type ClaimCTAProps = {
  inviterFid: number;
};

const ClaimCTA: FC<ClaimCTAProps> = memo(({ inviterFid }) => {
  const user = useUserByFid({ fid: inviterFid });

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex flex-row items-center justify-center space-x-4">
        {user.data?.result.user && (
          <Avatar user={user.data.result.user} size={'xl'} />
        )}
      </div>
      <div className="flex flex-row pt-4 text-2xl font-medium text-default">
        Join Farcaster for free
      </div>
      {user.data?.result.user.username && (
        <>
          <div className="flex flex-row pt-2 text-md font-light text-muted">
            Accept @{user.data?.result.user.username}'s gift to create a
          </div>
          <div className="flex flex-row text-md font-light text-muted">
            Farcaster account for free.
          </div>
        </>
      )}
    </div>
  );
});
export { ClaimCTA };
