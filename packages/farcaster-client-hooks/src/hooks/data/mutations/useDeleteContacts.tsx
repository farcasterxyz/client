import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDeleteContacts = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const result = await apiClient.deleteContacts();
    return result.data.result.success;
  }, [apiClient]);
};

export { useDeleteContacts };
