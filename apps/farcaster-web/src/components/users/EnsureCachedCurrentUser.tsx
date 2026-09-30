import { FC, memo, ReactNode, useEffect, useRef } from 'react';

import { appVersion } from '~/constants/version';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { Analytics } from '~/utils/analyticsUtils';

type EnsureCachedCurrentUserProps = {
  children: ReactNode;
};

const EnsureCachedCurrentUser: FC<EnsureCachedCurrentUserProps> = memo(
  ({ children }) => {
    const user = useCurrentUser(); // Fetch + cache the current user
    const fid = user?.fid;
    const username = user?.username;
    const neynarScore = user?.neynarScore;

    const lastUserFidAmpRef = useRef<number>(undefined);

    useEffect(() => {
      if (!fid) {
        Analytics.setUserId(null);
        return;
      }

      if (fid !== lastUserFidAmpRef.current) {
        lastUserFidAmpRef.current = fid;
        Analytics.setUserId(fid.toString());
      }
    }, [fid]);

    useEffect(() => {
      if (!fid) {
        return;
      }

      Analytics.setUserProperties({
        username,
        neynarScore,
        version: appVersion,
        appVersion,
      });
    }, [fid, neynarScore, username]);

    return <>{children}</>;
  },
);

EnsureCachedCurrentUser.displayName = 'EnsureCachedCurrentUser';

export { EnsureCachedCurrentUser };
