import { ApiUser } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { getInviteUrl } from '~/utils/inviteUtils';

type InviteHeadProps = {
  inviter: ApiUser;
  inviteId: string;
};

const InviteHead: FC<InviteHeadProps> = ({ inviter, inviteId }) => {
  const { host } = useRequest();
  const title = useMemo(() => {
    return `Join @${inviter.username} on Farcaster`;
  }, [inviter.username]);

  const description = useMemo(() => {
    return `${inviter.displayName} invited you to Farcaster — the decentralized social network. Create your account and start casting.`;
  }, [inviter.displayName]);

  return (
    <OGHead
      description={description}
      imageUrl={`https://client.farcaster.xyz/v2/invite-image?inviterFid=${inviter.fid}&id=${inviteId}`}
      imageWidth={1200}
      imageHeight={630}
      title={title}
      type="article"
      twitterCard="summary_large_image"
      url={getInviteUrl({ inviteId, fid: inviter.fid, host })}
    />
  );
};

InviteHead.displayName = 'InviteHead';

export { InviteHead };
