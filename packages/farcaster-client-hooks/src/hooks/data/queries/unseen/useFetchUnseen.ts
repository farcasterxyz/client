import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUnseenFetcher } from './buildUnseenFetcher';

const useFetchUnseen = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const data = await buildUnseenFetcher({
      apiClient,
    })();

    return data;
  }, [apiClient]);
};

export { useFetchUnseen };
