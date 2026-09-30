import { useCallback } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildInviteWithWarpsOfferingKey } from './buildInviteWithWarpsOfferingKey';
import { useInvalidateInviteWithWarpsOffering } from './useInvalidateInviteWIthWarpsOffering';
import { useInviteWithWarpsOffering } from './useInviteWithWarpsOffering';

const useInviteWithWarpsOfferingWithRefreshOnMount = () => {
  const initialValue = useInviteWithWarpsOffering();

  const queryKey = buildInviteWithWarpsOfferingKey();

  const invalidateOffering = useInvalidateInviteWithWarpsOffering();
  const invalidate = useCallback(() => {
    invalidateOffering();
  }, [invalidateOffering]);

  return useQueryWithRefreshOnMount({
    initialValue,
    queryKey,
    invalidate,
  });
};

export { useInviteWithWarpsOfferingWithRefreshOnMount };
