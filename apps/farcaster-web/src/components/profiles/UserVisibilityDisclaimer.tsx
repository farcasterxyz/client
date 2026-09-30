import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React, { FC, useMemo } from 'react';

interface UserVisibilityDisclaimerProps {
  user: ApiUser;
}

const UserVisibilityDisclaimer: FC<UserVisibilityDisclaimerProps> = ({
  user,
}) => {
  const blocked = useMemo(
    () => user.viewerContext?.blocking,
    [user.viewerContext],
  );

  const title = useMemo(() => {
    return `${resolveUsername({
      username: user.username,
      fid: user.fid,
    })} is ${blocked ? 'blocked' : 'muted'}`;
  }, [blocked, user.fid, user.username]);

  if (!user.viewerContext?.invisible) {
    return <></>;
  }

  return (
    <div className="my-2 border-y p-4 border-default">
      <h3 className="mb-2 text-2xl font-bold">{title}</h3>
      <span className="text-sm text-muted">
        To view their casts, {blocked ? 'unblock' : 'unmute'} via the action
        menu above.
      </span>
    </div>
  );
};

UserVisibilityDisclaimer.displayName = 'UserVisibilityDisclaimer';

export { UserVisibilityDisclaimer };
