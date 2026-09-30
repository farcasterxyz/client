import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildProductCatalogFetcher } from './buildProductCatalogFetcher';
import { buildProductCatalogKey } from './buildProductCatalogKey';
import { productCatalogDefaultQueryOptions } from './productCatalogDefaultQueryOptions';

const usePrefetchProductCatalog = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return queryClient.prefetchQuery({
      ...productCatalogDefaultQueryOptions,
      queryKey: buildProductCatalogKey(),
      queryFn: buildProductCatalogFetcher({ apiClient }),
    });
  }, [apiClient, queryClient]);
};

export { usePrefetchProductCatalog };
