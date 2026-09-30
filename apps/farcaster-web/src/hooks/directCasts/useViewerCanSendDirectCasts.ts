import { ApiUser } from 'farcaster-client-data';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

const useViewerCanSendDirectCasts = ({ user }: { user: ApiUser }) => {
  const currentUser = useCurrentUser();
  if (!user.viewerContext?.canSendDirectCasts) {
    return false;
  }

  if (user.fid === currentUser.fid) {
    return false;
  }

  if (user.viewerContext?.invisible) {
    return false;
  }

  return true;
};

export { useViewerCanSendDirectCasts };
