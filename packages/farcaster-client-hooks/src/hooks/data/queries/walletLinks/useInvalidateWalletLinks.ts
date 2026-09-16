import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildWalletLinksKey } from './buildWalletLinksKey';

const useInvalidateWalletLinks = () => {
  const queryClient = useQueryClient();

  const invalidateWalletLinks = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildWalletLinksKey(),
    });
  }, [queryClient]);

  return { invalidateWalletLinks };
};

export { useInvalidateWalletLinks };
