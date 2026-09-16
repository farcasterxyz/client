import { ApiDirectCastMessageV3 } from 'farcaster-client-data';
import { useMemo } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { getShouldLabelDirectCastAsFromYou } from '~/utils/directCastUtils';

const useShouldLabelDirectCastAsFromYou = ({
  directCast,
}: {
  directCast: ApiDirectCastMessageV3 | undefined;
}) => {
  const currentUser = useCurrentUser();

  return useMemo(() => {
    return getShouldLabelDirectCastAsFromYou({
      currentUserFid: currentUser.fid,
      directCast,
    });
  }, [currentUser.fid, directCast]);
};

export { useShouldLabelDirectCastAsFromYou };
