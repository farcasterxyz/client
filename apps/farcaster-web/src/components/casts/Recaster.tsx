import { ApiRecaster } from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

type RecasterProps = {
  recaster: ApiRecaster;
};

const Recaster: FC<RecasterProps> = memo(({ recaster }) => {
  const trackCastClick = useTrackCastClick();
  const currentUser = useCachedCurrentUser();

  const displayName =
    recaster.fid === currentUser?.fid ? 'You' : recaster.displayName;

  return (
    <LinkToProfileWithSummaryTooltip
      title={displayName}
      user={recaster}
      className="relative text-inherit hover:underline"
      onClick={() => {
        trackCastClick({ type: CastClickType.Mention });
      }}
    >
      {displayName}
    </LinkToProfileWithSummaryTooltip>
  );
});

Recaster.displayName = 'Recaster';

export { Recaster };
