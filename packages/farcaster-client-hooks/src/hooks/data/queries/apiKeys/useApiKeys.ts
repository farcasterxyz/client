import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildApiKeysFetcher } from './buildApiKeysFetcher';
import { buildApiKeysKey } from './buildApiKeysKey';

const useApiKeys = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildApiKeysKey(),
    queryFn: buildApiKeysFetcher({ apiClient }),
  });
};

export { useApiKeys };
