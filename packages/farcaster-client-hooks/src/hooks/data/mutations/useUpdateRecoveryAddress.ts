import { useCallback } from 'react';
import type { Hex } from 'viem';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';
import { useInvalidateRecoveryAddress } from '../queries/recoveryAddress/useInvalidateRecoveryAddress';
import { useFetchRecoveryAddressChangeHash } from '../queries/recoveryAddressChangeHash/useFetchRecoveryAddressChangeHash';

const useUpdateRecoveryAddress = () => {
  const { apiClient } = useFarcasterApiClient();
  const fetchRecoveryAddressChangeHash = useFetchRecoveryAddressChangeHash();
  const invalidateRecoveryAddress = useInvalidateRecoveryAddress();

  return useCallback(
    async ({ to, account }: { to: string; account: LocalAccountWithSign }) => {
      const deadline = Math.floor(Date.now() / 1000 + 3600); // an hour from now
      const hashResult = await fetchRecoveryAddressChangeHash({
        to,
        deadline,
      });

      const signature = await account.sign({
        hash: hashResult.result.approveMessageHash as Hex,
      });

      const result = await apiClient.updateRecoveryAddress({
        to,
        deadline,
        signature,
      });

      invalidateRecoveryAddress();

      return result;
    },
    [apiClient, invalidateRecoveryAddress, fetchRecoveryAddressChangeHash],
  );
};

export { useUpdateRecoveryAddress };
