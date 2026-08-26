import { ApiInvite } from 'farcaster-client-data';
import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';
import { FC } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

type PaidInviteProps = {
  invite: ApiInvite;
};

const PaidInvite: FC<PaidInviteProps> = ({ invite }: PaidInviteProps) => {
  const { host } = useRequest();

  const description = `Join @${invite.inviter.username} on Farcaster`;

  return (
    <>
      <OGHead
        description={description}
        imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
        title={description}
        type="article"
        url={`${appPathPrefix}/join?code=${invite.code}`}
      />
      <div>{description}</div>
    </>
  );
};

PaidInvite.displayName = 'PaidInvite';

export { PaidInvite };
