import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUserAppContext } from '../queries/userAppContext/';

const useRegisterUserAuthAddress = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUserAppContext =
    useOptimisticallyUpdateUserAppContext();

  return useCallback(
    async (...args: Parameters<typeof apiClient.putUserAuthAddress>) => {
      await apiClient.putUserAuthAddress(...args);

      optimisticallyUpdateUserAppContext({
        authAddressState: 'pending',
      });
    },
    [apiClient, optimisticallyUpdateUserAppContext],
  );
};

export { useRegisterUserAuthAddress };
