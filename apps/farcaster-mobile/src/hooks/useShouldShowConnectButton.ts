import { useMemo } from 'react';

import { useCurrentUser_UNSAFE } from './data/useCurrentUser';
import { useCurrentUserVerifications } from './data/useCurrentUserVerifications';

const useShouldShowConnectButton = ({ fid }: { fid: number }) => {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();
  const data = useCurrentUserVerifications().data!;

  const verifications = useMemo(
    () => data.pages.flatMap((page) => page.result.verifications),
    [data],
  );

  return fid === currentUserFid && verifications.length === 0;
};

export { useShouldShowConnectButton };
