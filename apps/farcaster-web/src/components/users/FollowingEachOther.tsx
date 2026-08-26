import { FC, memo } from 'react';

const FollowingEachOther: FC = memo(() => {
  return (
    <div className="rounded border px-2 py-0.5 text-xs text-muted border-default">
      Following each other
    </div>
  );
});

FollowingEachOther.displayName = 'FollowEachOther';

export { FollowingEachOther };
