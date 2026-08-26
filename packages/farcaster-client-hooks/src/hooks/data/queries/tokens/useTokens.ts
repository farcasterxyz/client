import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTokensFetcher } from './buildTokensFetcher';
import { buildTokensKey } from './buildTokensKey';

const useTokens = ({ ids }: { ids: string[] }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildTokensKey({ ids }),
    queryFn: buildTokensFetcher({
      apiClient,
      ids,
    }),
  });
};

const useNonSuspenseTokens = ({ ids }: { ids: string[] }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildTokensKey({ ids }),
    queryFn: buildTokensFetcher({
      apiClient,
      ids,
    }),
    enabled: ids.length > 0,
  });
};
export { useNonSuspenseTokens, useTokens };
