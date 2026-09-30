import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedFrame } from '../frameDetails';
import { buildSearchMiniAppsForAutocompleteFetcher } from './buildSearchMiniAppsForAutocompleteFetcher';
import { buildSearchMiniAppsForAutocompleteKey } from './buildSearchMiniAppsForAutocompleteKey';

const useSearchMiniAppsForAutocomplete = ({ query }: { query: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGlobalCache = useBatchMergeIntoGloballyCachedFrame();

  return useQuery({
    queryKey: buildSearchMiniAppsForAutocompleteKey({ query }),
    queryFn: buildSearchMiniAppsForAutocompleteFetcher({
      query,
      apiClient,
      batchMergeIntoGlobalCache,
    }),
    enabled: !!query,
  });
};

export { useSearchMiniAppsForAutocomplete };
