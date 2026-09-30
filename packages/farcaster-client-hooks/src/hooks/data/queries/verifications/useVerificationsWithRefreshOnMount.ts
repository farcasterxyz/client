import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildVerificationsKey } from './buildVerificationsKey';
import { useInvalidateVerifications } from './useInvalidateVerifications';
import { useVerifications } from './useVerifications';

const useVerificationsWithRefreshOnMount = ({ fid }: { fid: number }) => {
  const initialValue = useVerifications({ fid });

  const queryKey = useMemo(() => buildVerificationsKey({ fid }), [fid]);

  const invalidateVerifications = useInvalidateVerifications();

  const invalidate = useCallback(() => {
    invalidateVerifications({ fid });
  }, [fid, invalidateVerifications]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useVerificationsWithRefreshOnMount };
