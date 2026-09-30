import { useCallback } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildDraftCaststormsKey } from './buildDraftCaststormsKey';
import { useDraftCaststorms } from './useDraftCaststorms';
import { useInvalidateDraftCaststorms } from './useInvalidateDraftCaststorms';

const queryKey = buildDraftCaststormsKey();

const useDraftCaststormsWithRefreshOnMount = () => {
  const initialValue = useDraftCaststorms();

  const invalidateDraftCaststorms = useInvalidateDraftCaststorms();
  const invalidate = useCallback(() => {
    invalidateDraftCaststorms();
  }, [invalidateDraftCaststorms]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useDraftCaststormsWithRefreshOnMount };
