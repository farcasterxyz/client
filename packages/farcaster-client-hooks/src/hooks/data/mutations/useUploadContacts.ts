import { ApiContact } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useUploadContacts = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ contacts }: { contacts: ApiContact[] }) => {
      const result = await apiClient.uploadContacts({ contacts });
      return result.data.result.success;
    },
    [apiClient],
  );
};

export { useUploadContacts };
