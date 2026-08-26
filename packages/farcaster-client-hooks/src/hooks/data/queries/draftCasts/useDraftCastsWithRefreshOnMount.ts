import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildDraftCastsKey } from './buildDraftCastsKey';
import { useDraftCasts } from './useDraftCasts';
import { useInvalidateDraftCasts } from './useInvalidateDraftCasts';

const useDraftCastsWithRefreshOnMount = ({
  channelKey,
}: {
  channelKey: string | undefined;
}) => {
  const initialValue = useDraftCasts({ channelKey });

  const queryKey = useMemo(
    () => buildDraftCastsKey({ channelKey }),
    [channelKey],
  );

  const invalidateDraftCasts = useInvalidateDraftCasts();
  const invalidate = useCallback(() => {
    invalidateDraftCasts({ channelKey });
  }, [channelKey, invalidateDraftCasts]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useDraftCastsWithRefreshOnMount };
