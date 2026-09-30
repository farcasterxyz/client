import { ApiUser } from 'farcaster-client-data';
import { getNotionLinkTarget, resolveUsername } from 'farcaster-client-hooks';
import React, { FC, useMemo } from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

interface UserHarmfulDisclaimerProps {
  user: ApiUser;
}

const UserHarmfulDisclaimer: FC<UserHarmfulDisclaimerProps> = ({ user }) => {
  const currentUserFid = useCurrentUser().fid;

  const resolvedUsername = useMemo(
    () => resolveUsername({ username: user.username, fid: user.fid }),
    [user],
  );

  const [yourAccountLabel, theyLabel] = React.useMemo(() => {
    if (currentUserFid === user.fid) {
      return ['Your account', 'You'];
    }
    return [resolvedUsername, 'They'];
  }, [currentUserFid, resolvedUsername, user.fid]);

  if (!user.viewerContext?.nerfed) {
    return <></>;
  }

  return (
    <div className="my-2 border-y p-4 border-default">
      <h3 className="mb-2 text-2xl font-bold"> {yourAccountLabel} is nerfed</h3>
      <span className="text-sm text-muted">
        {`${yourAccountLabel} is currently nerfed. ${theyLabel} can still post to the Farcaster protocol, but will not appear on the Farcaster client.`}{' '}
        <ExternalLink
          href={getNotionLinkTarget({ to: 'nerfs' })}
          title="Learn more"
          className="inline cursor-pointer text-sm text-link hover:underline"
        >
          Learn more
        </ExternalLink>
      </span>
    </div>
  );
};

UserHarmfulDisclaimer.displayName = 'UserHarmfulDisclaimer';

export { UserHarmfulDisclaimer };
