import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useInvalidateSearchUsers } from '../searchUsers';
import { buildUsersForQualityAnnotationKey } from './buildUsersForQualityAnnotationKey';

const useInvalidateUsersForQualityAnnotation = () => {
  const queryClient = useQueryClient();
  const invalidateSearchUsers = useInvalidateSearchUsers();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildUsersForQualityAnnotationKey(),
    });
    invalidateSearchUsers({ q: undefined });
  }, [invalidateSearchUsers, queryClient]);
};

export { useInvalidateUsersForQualityAnnotation };
