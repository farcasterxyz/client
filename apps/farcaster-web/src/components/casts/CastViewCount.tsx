import { GraphIcon } from '@primer/octicons-react';
import { formatViewCount } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

interface CastViewCountProps {
  viewCount?: number;
}

const CastViewCount: FC<CastViewCountProps> = memo(({ viewCount }) => {
  if (viewCount === undefined) {
    return null;
  }

  return (
    <div className="flex w-14 flex-row items-center gap-1 text-sm text-faint">
      <div className="p-[6px]">
        <GraphIcon size="small" />
      </div>
      {formatViewCount(viewCount)}
    </div>
  );
});

CastViewCount.displayName = 'CastViewCount';

export { CastViewCount };
