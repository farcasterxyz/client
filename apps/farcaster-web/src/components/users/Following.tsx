import { FC, memo } from 'react';

const Following: FC = memo(() => {
  return (
    <div className="rounded-full border px-2 py-0.5 text-xs text-muted border-default">
      Following
    </div>
  );
});

Following.displayName = 'Following';

export { Following };
