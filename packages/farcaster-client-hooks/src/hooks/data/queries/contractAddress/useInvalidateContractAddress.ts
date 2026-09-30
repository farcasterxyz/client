import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildContractAddressKey } from './buildContractAddressKey';

const useInvalidateContractAddress = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ ca }: { ca: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildContractAddressKey({ ca }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateContractAddress };
