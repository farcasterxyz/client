import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildGetSiweNonceFetcher } from './buildGetSiweNonceFetcher';

const useGetSiweNonce = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    () => buildGetSiweNonceFetcher({ apiClient })(),
    [apiClient],
  );
};

export { useGetSiweNonce };
