import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildInviteWithWarpsOfferingKey } from './buildInviteWithWarpsOfferingKey';

const useInvalidateInviteWithWarpsOffering = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildInviteWithWarpsOfferingKey(),
    });
  }, [queryClient]);
};

export { useInvalidateInviteWithWarpsOffering };
