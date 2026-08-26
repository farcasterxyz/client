import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildProductCatalogFetcher } from './buildProductCatalogFetcher';
import { buildProductCatalogKey } from './buildProductCatalogKey';
import { productCatalogDefaultQueryOptions } from './productCatalogDefaultQueryOptions';

const useProductCatalog = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    ...productCatalogDefaultQueryOptions,
    queryKey: buildProductCatalogKey(),
    queryFn: buildProductCatalogFetcher({ apiClient }),
  });
};

export { useProductCatalog };
