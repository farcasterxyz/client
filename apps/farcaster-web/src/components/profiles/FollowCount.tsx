import { formatFollowCount } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

type FollowCountProps = {
  count: number;
  label: string;
};

const FollowCount: FC<FollowCountProps> = memo(({ count, label }) => {
  return (
    <>
      <span className="mr-1 font-semibold text-default">
        {formatFollowCount({ followCount: count })}
      </span>
      <span className="text-muted">{label}</span>
    </>
  );
});

FollowCount.displayName = 'FollowCount';

export { FollowCount };
