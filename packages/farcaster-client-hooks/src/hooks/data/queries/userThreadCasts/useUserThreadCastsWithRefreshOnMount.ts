import { CastHashPrefix } from 'farcaster-client-data';
import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildUserThreadCastsKey } from './buildUserThreadCastsKey';
import { useInvalidateUserThreadCasts } from './useInvalidateUserThreadCasts';
import { useNonSuspenseUserThreadCasts } from './useUserThreadCasts';

const useUserThreadCastsWithRefreshOnMount = ({
  castHashPrefix,
  username,
}: {
  castHashPrefix: CastHashPrefix;
  username: string;
}) => {
  const initialValue = useNonSuspenseUserThreadCasts({
    username,
    castHashPrefix,
  });

  const queryKey = useMemo(
    () => buildUserThreadCastsKey({ username, castHashPrefix }),
    [username, castHashPrefix],
  );
  const invalidateThread = useInvalidateUserThreadCasts();
  const invalidate = useCallback(() => {
    invalidateThread({ username, castHashPrefix });
  }, [castHashPrefix, invalidateThread, username]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useUserThreadCastsWithRefreshOnMount };
