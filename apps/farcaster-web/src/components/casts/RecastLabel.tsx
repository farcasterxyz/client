import { ApiRecaster } from 'farcaster-client-data';
import { FC, memo, useMemo } from 'react';

import { CastHeaderLabel } from '~/components/casts/CastHeaderLabel';
import { Recaster } from '~/components/casts/Recaster';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

type RecastLabelProps = {
  isFocusedCast: boolean;
  recasters: ApiRecaster[];
};

const RecastLabel: FC<RecastLabelProps> = memo(
  ({ isFocusedCast, recasters }) => {
    const currentUser = useCachedCurrentUser();

    const recasterText = useMemo(() => {
      // We want to display 'You' for the user and display that first if they recasted
      // If that's not the case always fallback to current user profile being visited for the first
      // recaster name. If that is not available either, randomly display rest. (goksu)
      const firstRecaster =
        recasters.find((recaster) => recaster.fid === currentUser?.fid) ||
        recasters[0];

      const orderedRecasters = [firstRecaster].concat(
        recasters.filter(({ fid }) => fid !== firstRecaster.fid),
      );

      if (orderedRecasters.length === 1) {
        return <Recaster recaster={orderedRecasters[0]} />;
      }
      if (orderedRecasters.length === 2) {
        return (
          <>
            <Recaster recaster={orderedRecasters[0]} /> and{' '}
            <Recaster recaster={orderedRecasters[1]} />
          </>
        );
      }
      return (
        <>
          <Recaster recaster={orderedRecasters[0]} /> and{' '}
          {orderedRecasters.length - 1} others
        </>
      );
    }, [currentUser, recasters]);

    return (
      <CastHeaderLabel iconType="recast" isFocusedCast={isFocusedCast}>
        {recasterText} recasted
      </CastHeaderLabel>
    );
  },
);

RecastLabel.displayName = 'RecastLabel';

export { RecastLabel };
