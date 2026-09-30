import classNames from 'classnames';
import { ApiUser, ApiUserMinimal } from 'farcaster-client-data';
import React from 'react';

import { UserDisplayNameStyle } from '~/components/badges/ActiveBadge';

type UserDisplayNameWithBadgesProps = {
  user: ApiUser | ApiUserMinimal;
  style: UserDisplayNameStyle;
  disableUnderline?: boolean;
  Badge?: React.ReactNode;
};

const UserDisplayNameWithBadges: React.FC<UserDisplayNameWithBadgesProps> = ({
  user,
  style,
  disableUnderline = false,
  Badge,
}) => {
  return (
    <div className="flex min-w-0 flex-row items-center space-x-1">
      {user.displayName && (
        <span
          className={classNames(
            '!block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap break-words text-default',
            style === 'header' && 'text-lg font-bold leading-5',
            style === 'base' && 'text-base font-semibold',
            !disableUnderline && 'hover:underline',
          )}
        >
          {user.displayName}
        </span>
      )}
      {typeof Badge !== 'undefined' && Badge}
    </div>
  );
};

export { UserDisplayNameWithBadges };
