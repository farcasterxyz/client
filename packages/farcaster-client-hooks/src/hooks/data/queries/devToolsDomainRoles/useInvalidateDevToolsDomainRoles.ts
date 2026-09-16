import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDevToolsDomainRolesKey } from './buildDevToolsDomainRolesKey';

const useInvalidateDevToolsDomainRoles = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ domain }: { domain: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildDevToolsDomainRolesKey({ domain }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateDevToolsDomainRoles };
