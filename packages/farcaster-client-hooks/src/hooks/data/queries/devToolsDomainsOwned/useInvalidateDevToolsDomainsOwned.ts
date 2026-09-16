import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDevToolsDomainsOwnedKey } from './buildDevToolsDomainsOwnedKey';

const useInvalidateDevToolsDomainsOwned = ({ fid }: { fid?: number } = {}) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildDevToolsDomainsOwnedKey({ fid }),
    });
  }, [fid, queryClient]);
};

export { useInvalidateDevToolsDomainsOwned };
