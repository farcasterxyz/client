import { FC, memo } from 'react';

const FollowsYou: FC = memo(() => {
  return (
    <div className="rounded border px-2 py-0.5 text-xs text-muted border-default">
      Follows you
    </div>
  );
});

FollowsYou.displayName = 'FollowsYou';

export { FollowsYou };
