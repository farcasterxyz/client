import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { getDirectCastInviteUrl } from '~/utils/directCastUtils';

type DirectCastGroupInviteHeadProps = {
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

const DirectCastGroupInviteHead: FC<DirectCastGroupInviteHeadProps> = ({
  result,
}) => {
  const { host } = useRequest();

  const title = useMemo(() => {
    return result.expired ? 'Expired Link' : `Join ${result.name} on Farcaster`;
  }, [result.expired, result.name]);

  const description = useMemo(() => {
    return result.expired
      ? 'Ask the host to send a new link'
      : `You're invited to join ${result.name} — a group conversation on Farcaster with ${result.participantCount} members.`;
  }, [result.expired, result.name, result.participantCount]);

  const url = useMemo(() => {
    return getDirectCastInviteUrl({ inviteCode: result.inviteCode, host });
  }, [host, result.inviteCode]);

  return (
    <OGHead
      description={description}
      imageUrl={`https://client.farcaster.xyz/v2/og-image?groupInviteCode=${result.inviteCode}`}
      title={title}
      type="website"
      url={url}
    />
  );
};

DirectCastGroupInviteHead.displayName = 'DirectCastGroupInviteHead';

export { DirectCastGroupInviteHead };
