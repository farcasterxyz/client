import { FC } from 'react';

import { DirectCastGroupInviteHead } from './DirectCastGroupInviteHead';

type DirectCastGroupInviteProps = {
  result: {
    conversationId: string;
    name: string;
    photoUrl?: string;
    participantCount: number;
    expired: boolean;
    inviteCode: string;
    meetsCriteria?: {
      followers?: boolean;
      hasActiveBadge?: boolean;
      hasCollectionIds?: boolean;
    };
    criteria?: {
      followers?: 'everyone' | 'follows';
      hasActiveBadge?: boolean;
      hasCollectionIds?: string[];
    };
  };
};

const DirectCastGroupInvite: FC<DirectCastGroupInviteProps> = ({
  result,
}: DirectCastGroupInviteProps) => {
  return (
    <>
      <DirectCastGroupInviteHead result={result} />
      {!result.expired ? (
        <div>{result.name}</div>
      ) : (
        <div>Invite link expired.</div>
      )}
    </>
  );
};

DirectCastGroupInvite.displayName = 'DirectCastGroupInvite';

export { DirectCastGroupInvite };
