import { ApiUser } from 'farcaster-client-data';
import React from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { cn } from '~/lib/utils';

type SpaceUserDisplayNameWithProBadgeProps = {
  user?: ApiUser;
  fallbackName?: string;
  className?: string;
  nameClassName?: string;
  badgeClassName?: string;
  badgeSize?: number;
  suffix?: React.ReactNode;
};

const SpaceUserDisplayNameWithProBadge: React.FC<
  SpaceUserDisplayNameWithProBadgeProps
> = ({
  user,
  fallbackName,
  className,
  nameClassName,
  badgeClassName,
  badgeSize = 14,
  suffix,
}) => {
  const isProUser = useUserLevel(user) === 'pro';
  const displayName = user?.displayName ?? fallbackName;

  if (!displayName) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1',
        className,
      )}
    >
      <span className={cn('truncate', nameClassName)}>{displayName}</span>
      {isProUser && (
        <FarcasterProBadge
          size={badgeSize}
          className={cn('shrink-0', badgeClassName)}
        />
      )}
      {suffix}
    </span>
  );
};

SpaceUserDisplayNameWithProBadge.displayName =
  'SpaceUserDisplayNameWithProBadge';

export { SpaceUserDisplayNameWithProBadge };
