import { useQueryClient } from '@tanstack/react-query';
import { ApiVerificationProtocol } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildWalletSendSuggestionsKey } from './buildWalletSendSuggestionsKey';

const useInvalidateWalletSendSuggestions = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ protocol }: { protocol: ApiVerificationProtocol }) => {
      queryClient.invalidateQueries({
        queryKey: buildWalletSendSuggestionsKey({ protocol }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateWalletSendSuggestions };
