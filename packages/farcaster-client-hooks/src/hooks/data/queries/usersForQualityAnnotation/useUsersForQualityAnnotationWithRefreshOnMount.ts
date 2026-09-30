import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildUsersForQualityAnnotationKey } from './buildUsersForQualityAnnotationKey';
import { useInvalidateUsersForQualityAnnotation } from './useInvalidateUsersForQualityAnnotation';
import { useUsersForQualityAnnotation } from './useUsersForQualityAnnotation';

const useUsersForQualityAnnotationWithRefreshOnMount = () => {
  const initialValue = useUsersForQualityAnnotation();

  const queryKey = useMemo(() => buildUsersForQualityAnnotationKey(), []);

  const invalidateUsersForQualityAnnotation =
    useInvalidateUsersForQualityAnnotation();
  const invalidate = useCallback(() => {
    invalidateUsersForQualityAnnotation();
  }, [invalidateUsersForQualityAnnotation]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useUsersForQualityAnnotationWithRefreshOnMount };
